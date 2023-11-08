import {
  WalletClientSigner,
  type AuthSmartAccountSigner,
  type SignTypedDataParams,
} from "@alchemy/aa-core";
import { Magic, type MagicUserMetadata } from "magic-sdk";
import { createWalletClient, custom, type Hash } from "viem";
import type { MagicAuthParams } from "./types.js";

export class MagicSigner
  implements AuthSmartAccountSigner<Magic, MagicAuthParams, MagicUserMetadata>
{
  inner: Magic;
  private signer: WalletClientSigner | undefined;

  constructor({ inner }: { inner: Magic }) {
    this.inner = inner;
  }

  get signerType() {
    return "magic";
  }

  getAddress = async () => {
    if (!this.signer) throw new Error("No User authenticated");

    const address = (await this.inner.user.getInfo()).publicAddress;
    if (address == null) throw new Error("No address found");

    return address as Hash;
  };

  signMessage = async (msg: Uint8Array | string) => {
    if (!this.signer) throw new Error("No signer found");

    return this.signer.signMessage(msg);
  };

  signTypedData = (params: SignTypedDataParams) => {
    if (!this.signer) throw new Error("No signer found");

    return this.signer.signTypedData(params);
  };

  authenticate = async (params: MagicAuthParams) => {
    await params.authenticate();

    this.signer = new WalletClientSigner(
      createWalletClient({
        transport: custom(await this.inner.wallet.getProvider()),
      }),
      this.signerType
    );

    return this.inner.user.getInfo();
  };

  getAuthDetails = async () => {
    if (!this.signer) throw new Error("Not authenticated");

    return this.inner.user.getInfo();
  };
}