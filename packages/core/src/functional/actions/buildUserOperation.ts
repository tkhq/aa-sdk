import type { ISmartContractAccount } from "../../account/types";
import type {
  BatchUserOperationCallData,
  UserOperationCallData,
  UserOperationOverrides,
  UserOperationStruct,
} from "../../types";
import type { Deferrable } from "../../utils";
import type { SmartAccountClient } from "../createProvider";
import type { GetAccountParam } from "../utils/types";
import { runMiddlewareStack } from "./runMiddlewareStack.js";

export type BuildUoParams<
  TAccount extends ISmartContractAccount | undefined =
    | ISmartContractAccount
    | undefined
> = {
  data: UserOperationCallData | BatchUserOperationCallData;
  overrides?: UserOperationOverrides;
} & GetAccountParam<TAccount>;

export const buildUserOperation = async <
  TAccount extends ISmartContractAccount | undefined
>(
  client: SmartAccountClient<TAccount>,
  { data, overrides }: BuildUoParams<TAccount>
) => {
  const account_ = client.account;
  if (!account_) {
    throw new Error("account not supplied");
  }

  const initCode = await account_.getInitCode();
  return runMiddlewareStack(client, {
    uo: {
      initCode,
      sender: account_.getAddress(),
      nonce: account_.getNonce(),
      callData: Array.isArray(data)
        ? account_.encodeBatchExecute(data)
        : account_.encodeExecute(data.target, data.value ?? 0n, data.data),
      signature: account_.getDummySignature(),
    } as Deferrable<UserOperationStruct>,
    overrides,
  });
};
