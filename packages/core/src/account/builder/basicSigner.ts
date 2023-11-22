import type { SmartAccountSigner } from "../../signer/types";
import type { AccountSigner } from "./index.js";

export const BasicAccountSigner =
  <Inner>(owner: SmartAccountSigner<Inner>): AccountSigner =>
  () => ({
    getDummySignature: () =>
      "0xfffffffffffffffffffffffffffffff0000000000000000000000000000000007aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1c",
    signMessage: (msg) => {
      return owner.signMessage(msg);
    },
    signTypedData: (params) => owner.signTypedData(params),
    signUserOperationHash: (uoHash) => owner.signMessage(uoHash),
    getOwner: () => owner,
  });
