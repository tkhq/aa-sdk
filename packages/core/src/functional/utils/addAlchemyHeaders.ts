import type { HttpTransport } from "viem";
import type { ISmartContractAccount } from "../../account/types";
import { createPublicErc4337Client } from "../../client/create-client.js";
import type { Extended, SmartAccountClient } from "../createProvider";

export const addAlchemyHeaders = <
  TAccount extends ISmartContractAccount | undefined,
  TExtended extends Extended | undefined = Extended | undefined
>(
  client: SmartAccountClient<TAccount, TExtended>
): typeof client => {
  const account = client.account;
  if (!account) {
    return client;
  }

  if (client.rpcClient.transport.type === "http") {
    const { url = client.chain.rpcUrls.default.http[0], fetchOptions } = client
      .rpcClient.transport as ReturnType<HttpTransport>["config"] &
      ReturnType<HttpTransport>["value"];

    const signer = account.getOwner();
    const factoryAddress = account.getFactoryAddress();

    client.rpcClient = createPublicErc4337Client({
      chain: client.chain,
      rpcUrl: url,
      fetchOptions: {
        ...fetchOptions,
        headers: {
          ...fetchOptions?.headers,
          "Alchemy-Aa-Sdk-Signer": signer?.signerType,
          "Alchemy-Aa-Sdk-Factory-Address": factoryAddress,
        },
      },
    });
  }

  return client;
};
