import {
  getContract,
  type Address,
  type Hash,
  type Hex,
  type PublicClient,
  type Transport,
} from "viem";
import type { Prettify } from "viem/_types/types/utils.js";
import { EntryPointAbi } from "../../abis/EntryPointAbi.js";
import { DeploymentState } from "../../account/base.js";
import type {
  ISmartContractAccount,
  SignTypedDataParams,
} from "../../account/types";
import type { PublicErc4337Client } from "../../client/types.js";
import type { SmartAccountSigner } from "../../signer/types";
import { wrapSignatureWith6492 } from "../../signer/utils.js";
import type { BatchUserOperationCallData } from "../../types.js";

export type CustomSmartAccount = {
  getDummySignature: () => Hex;
  encodeExecute: (target: Address, value: bigint, data: Hex) => Promise<Hex>;
  encodeBatchExecute?: (txs: BatchUserOperationCallData) => Promise<Hex>;
  signMessage: (msg: string | Uint8Array | Hex) => Promise<Hex>;
  signTypedData?: (params: SignTypedDataParams) => Promise<Hash>;
  getAccountInitCode: () => Promise<Hash>;
};

export type CreateAccountParams = {
  factoryAddress: Address;
  owner?: SmartAccountSigner;
  accountAddress?: Address;
};

export type AccountConnectionParams = {
  rpcClient: PublicErc4337Client<Transport>;
  entryPointAddress: Address;
};

export type ExtendedAccount = Prettify<
  // disallow redefining base properties
  { [K in keyof ISmartContractAccount]?: undefined } & {
    [key: string]: unknown;
  }
>;

export type SmartAccount<
  TExtended extends ExtendedAccount | undefined = ExtendedAccount | undefined
> = ISmartContractAccount &
  (TExtended extends ExtendedAccount ? TExtended : unknown) & {
    extend: <const account extends ExtendedAccount>(
      fn: (account: SmartAccount<TExtended>) => account
    ) => SmartAccount<
      Prettify<account> &
        (TExtended extends ExtendedAccount ? TExtended : unknown)
    >;
  };

export const toAccount =
  ({
    getDummySignature,
    encodeExecute,
    encodeBatchExecute,
    signMessage,
    signTypedData,
    getAccountInitCode,
    factoryAddress,
    owner,
    accountAddress,
  }: CreateAccountParams & CustomSmartAccount) =>
  ({ rpcClient, entryPointAddress }: AccountConnectionParams): SmartAccount => {
    let deploymentState = DeploymentState.UNDEFINED;
    const entryPoint = getContract({
      address: entryPointAddress,
      abi: EntryPointAbi,
      // Need to cast this as PublicClient or else it breaks ABI typing.
      // This is valid because our PublicClient is a subclass of PublicClient
      publicClient: rpcClient as PublicClient,
    });

    async function signMessageWith6492(
      msg: string | Uint8Array
    ): Promise<`0x${string}`> {
      const [isDeployed, signature] = await Promise.all([
        isAccountDeployed(),
        signMessage(msg),
      ]);

      return create6492Signature(isDeployed, signature);
    }

    async function signTypedDataWith6492(
      params: SignTypedDataParams
    ): Promise<`0x${string}`> {
      if (!signTypedData) {
        throw new Error("signTypedData not implemented");
      }

      const [isDeployed, signature] = await Promise.all([
        isAccountDeployed(),
        signTypedData(params),
      ]);

      return create6492Signature(isDeployed, signature);
    }

    async function create6492Signature(
      isDeployed: boolean,
      signature: Hash
    ): Promise<Hash> {
      if (isDeployed) {
        return signature;
      }

      const [factoryAddress, factoryCalldata] =
        await parseFactoryAddressFromAccountInitCode();

      return wrapSignatureWith6492({
        factoryAddress,
        factoryCalldata,
        signature,
      });
    }

    async function getNonce(): Promise<bigint> {
      if (!(await isAccountDeployed())) {
        return 0n;
      }
      const address = await getAddress();
      return entryPoint.read.getNonce([address, BigInt(0)]);
    }

    async function getInitCode(): Promise<Hex> {
      if (deploymentState === DeploymentState.DEPLOYED) {
        return "0x";
      }
      const contractCode = await rpcClient.getBytecode({
        address: await getAddress(),
      });

      if ((contractCode?.length ?? 0) > 2) {
        deploymentState = DeploymentState.DEPLOYED;
        return "0x";
      } else {
        deploymentState = DeploymentState.NOT_DEPLOYED;
      }

      return getAccountInitCode();
    }

    async function getAddress(): Promise<Address> {
      if (!accountAddress) {
        const initCode = await getAccountInitCode();
        try {
          await entryPoint.simulate.getSenderAddress([initCode]);
        } catch (err: any) {
          if (err.cause?.data?.errorName === "SenderAddressResult") {
            accountAddress = err.cause.data.args[0] as Address;
            return accountAddress;
          }
        }

        throw new Error("getCounterFactualAddress failed");
      }

      return accountAddress;
    }

    function getOwner(): SmartAccountSigner | undefined {
      return owner;
    }

    function getFactoryAddress(): Address {
      return factoryAddress;
    }

    // Extra implementations
    async function isAccountDeployed(): Promise<boolean> {
      return (await getDeploymentState()) === DeploymentState.DEPLOYED;
    }

    async function getDeploymentState(): Promise<DeploymentState> {
      if (deploymentState === DeploymentState.UNDEFINED) {
        const initCode = await getInitCode();
        return initCode === "0x"
          ? DeploymentState.DEPLOYED
          : DeploymentState.NOT_DEPLOYED;
      } else {
        return deploymentState;
      }
    }

    /**
     * https://eips.ethereum.org/EIPS/eip-4337#first-time-account-creation
     * The initCode field (if non-zero length) is parsed as a 20-byte address,
     * followed by calldata to pass to this address.
     * The factory address is the first 40 char after the 0x, and the callData is the rest.
     */
    async function parseFactoryAddressFromAccountInitCode(): Promise<
      [Address, Hex]
    > {
      const initCode = await getAccountInitCode();
      const factoryAddress = `0x${initCode.substring(2, 42)}` as Address;
      const factoryCalldata = `0x${initCode.substring(42)}` as Hex;
      return [factoryAddress, factoryCalldata];
    }

    const baseAccount = {
      getAddress,
      getOwner,
      getFactoryAddress,
      getNonce,
      getInitCode,
      signMessageWith6492,
      signTypedDataWith6492,
      encodeBatchExecute:
        encodeBatchExecute ??
        (() => Promise.reject("encodeBatchExecute not implemented")),
      encodeExecute,
      getDummySignature,
      signMessage,
      signTypedData:
        signTypedData ??
        (() => Promise.reject("signTypedData not implemented")),
    };

    function extend(base: typeof baseAccount) {
      type ExtendFn = (base: typeof baseAccount) => unknown;
      return (extendFn: ExtendFn) => {
        const extended = extendFn(base) as ExtendedAccount;
        for (const key in baseAccount) delete extended[key];
        const combined = { ...base, ...extended };
        return Object.assign(combined, { extend: extend(combined) });
      };
    }

    return Object.assign(baseAccount, { extend: extend(baseAccount) as any });
  };
