import type { Address, Chain, Transport } from "viem";
import type { ISmartContractAccount } from "../../account/types";
import type { PublicErc4337Client } from "../../client/types";
import type { SmartAccountSigner } from "../../signer/types";

type AccountParams_Base = {
  factoryAddress: Address;
  owner?: SmartAccountSigner | undefined;
  accountAddress?: Address;
};

export type SmartAccount<
  TTransport extends Transport = Transport,
  TAccount extends ISmartContractAccount = ISmartContractAccount
> = (params: {
  rpcClient: PublicErc4337Client<TTransport>;
  entryPointAddress: Address;
  chain: Chain;
}) => TAccount;

export type CreateAccountFn<
  TTransport extends Transport = Transport,
  TParams extends AccountParams_Base = AccountParams_Base
> = (accountParams: TParams) => SmartAccount<TTransport>;
