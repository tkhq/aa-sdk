import type {
  AccountMiddlewareFn,
  AccountMiddlewareOverrideFn,
} from "../../provider/types";

export const applyOverride = (
  override: AccountMiddlewareOverrideFn
): AccountMiddlewareFn => {
  return async (struct) => {
    return {
      ...struct,
      ...(await override(struct)),
    };
  };
};
