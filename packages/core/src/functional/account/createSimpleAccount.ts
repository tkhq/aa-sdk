import {
  concatHex,
  encodeFunctionData,
  hexToBytes,
  type Address,
  type Hex,
  type Transport,
} from "viem";
import { SimpleAccountAbi } from "../../abis/SimpleAccountAbi.js";
import { SimpleAccountFactoryAbi } from "../../abis/SimpleAccountFactoryAbi.js";
import {
  SimpleSmartContractAccount,
  type SimpleSmartAccountParams,
} from "../../account/simple.js";
import type { SmartAccountSigner } from "../../signer/types.js";
import type { BatchUserOperationCallData } from "../../types.js";
import {
  toAccount,
  type AccountConnectionParams,
  type CreateAccountParams,
} from "./createAccount.js";
import type { CreateAccountFn } from "./types.js";

export const createSimpleAccount: CreateAccountFn<
  Transport,
  Pick<
    SimpleSmartAccountParams,
    "accountAddress" | "factoryAddress" | "index" | "owner"
  >
> = (accountParams) => (connectionParams) =>
  new SimpleSmartContractAccount({
    ...accountParams,
    ...connectionParams,
  });

export type SimpleAccountParams = CreateAccountParams & {
  owner: SmartAccountSigner;
  index?: bigint;
};

export const toSimpleAccount =
  (params: SimpleAccountParams) =>
  (connectionParams: AccountConnectionParams) =>
    toAccount({
      ...params,
      getDummySignature(): `0x${string}` {
        return "0xfffffffffffffffffffffffffffffff0000000000000000000000000000000007aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1c";
      },
      async encodeExecute(
        target: Hex,
        value: bigint,
        data: Hex
      ): Promise<`0x${string}`> {
        return encodeFunctionData({
          abi: SimpleAccountAbi,
          functionName: "execute",
          args: [target, value, data],
        });
      },
      async encodeBatchExecute(
        txs: BatchUserOperationCallData
      ): Promise<`0x${string}`> {
        const [targets, datas] = txs.reduce(
          (accum, curr) => {
            accum[0].push(curr.target);
            accum[1].push(curr.data);

            return accum;
          },
          [[], []] as [Address[], Hex[]]
        );

        return encodeFunctionData({
          abi: SimpleAccountAbi,
          functionName: "executeBatch",
          args: [targets, datas],
        });
      },
      signMessage(msg: Uint8Array | string): Promise<`0x${string}`> {
        if (typeof msg === "string" && msg.startsWith("0x")) {
          msg = hexToBytes(msg as Hex);
        } else if (typeof msg === "string") {
          msg = new TextEncoder().encode(msg);
        }

        return params.owner.signMessage(msg);
      },
      async getAccountInitCode(): Promise<`0x${string}`> {
        return concatHex([
          params.factoryAddress,
          encodeFunctionData({
            abi: SimpleAccountFactoryAbi,
            functionName: "createAccount",
            args: [await params.owner.getAddress(), params.index ?? 0n],
          }),
        ]);
      },
    })(connectionParams);
