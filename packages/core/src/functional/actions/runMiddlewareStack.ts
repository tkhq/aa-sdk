import type { ISmartContractAccount } from "../../account/types";
import { noOpMiddleware } from "../../provider/base.js";
import type { UserOperationOverrides, UserOperationStruct } from "../../types";
import {
  asyncPipe,
  resolveProperties,
  type Deferrable,
} from "../../utils/index.js";
import type { SmartAccountClient } from "../createProvider";

export const runMiddlewareStack = async (
  client: SmartAccountClient<ISmartContractAccount | undefined>,
  {
    uo,
    overrides,
  }: {
    uo: Deferrable<UserOperationStruct>;
    overrides?: UserOperationOverrides;
  }
) => {
  const result = await asyncPipe(
    client.dummyPaymasterDataMiddleware,
    client.feeDataGetter,
    client.gasEstimator,
    async (struct) => ({ ...struct, ...overrides }),
    client.customMiddleware ?? noOpMiddleware,
    client.paymasterDataMiddleware
  )(uo);

  return resolveProperties<UserOperationStruct>(result);
};
