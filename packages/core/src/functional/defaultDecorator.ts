import type { Hash, RpcTransactionRequest } from "viem";
import type { ISmartContractAccount } from "../account/types";
import type { UserOperationStruct } from "../types";
import {
  buildUserOperation,
  type BuildUoParams,
} from "./actions/buildUserOperation.js";
import type { SmartAccountClient } from "./createProvider";

export type BaseSmartAccountActions = {
  buildUserOperation: (params: BuildUoParams) => Promise<UserOperationStruct>;
  sendTransaction: (request: RpcTransactionRequest) => Promise<Hash>;
};

export const baseSmartAccountActions = <
  TAccount extends ISmartContractAccount | undefined
>(
  client: SmartAccountClient<TAccount>
): BaseSmartAccountActions => ({
  buildUserOperation: (...args) => buildUserOperation(client, ...args),
  sendTransaction: async () => "0x0",
});
