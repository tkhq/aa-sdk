import type { ISmartContractAccount } from "../../account/types";
import type { SmartAccount } from "../account/types";

export type IsUndefined<T> = [undefined] extends [T] ? true : false;
export type GetAccountParam<
  TAccount extends ISmartContractAccount | undefined
> = IsUndefined<TAccount> extends true
  ? { account: SmartAccount }
  : { account?: SmartAccount };
