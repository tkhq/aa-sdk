import {
  createClient,
  http,
  publicActions,
  type Chain,
  type Client,
  type FallbackTransport,
  type HttpTransport,
  type HttpTransportConfig,
  type PublicActions,
  type PublicClient,
  type Transport,
} from "viem";
import type { PublicRpcSchema } from "viem/dist/types/types/eip1193";
import { VERSION } from "../version.js";
import { erc4337Actions } from "./actions/erc4337actions.js";
import { getFeeData } from "./actions/getFeeData.js";
import type { Erc337RpcSchema, PublicErc4337Client } from "./types.js";

const requiredActions = <T extends Transport | FallbackTransport = Transport>(
  client: Client<
    T,
    Chain,
    undefined,
    [...PublicRpcSchema, ...Erc337RpcSchema],
    PublicActions
  >
) => ({
  ...erc4337Actions(client),
  getFeeData: getFeeData(client),
});

export const createPublicErc4337FromClient: <
  T extends Transport | FallbackTransport = Transport
>(
  client: PublicClient<T, Chain>
) => PublicErc4337Client<T> = <
  T extends Transport | FallbackTransport = Transport
>(
  client: PublicClient<T, Chain>
): PublicErc4337Client<T> => {
  const clientAdapter = client as Client<
    T,
    Chain,
    undefined,
    [...PublicRpcSchema, ...Erc337RpcSchema],
    PublicActions
  >;

  return clientAdapter.extend(requiredActions);
};

export const createPublicErc4337Client = ({
  chain,
  rpcUrl,
  fetchOptions,
}: {
  chain: Chain;
  rpcUrl: string;
  fetchOptions?: HttpTransportConfig["fetchOptions"];
}): PublicErc4337Client<HttpTransport> => {
  const client: Client<
    HttpTransport,
    Chain,
    undefined,
    [...PublicRpcSchema, ...Erc337RpcSchema]
  > = createClient({
    chain,
    transport: http(rpcUrl, {
      fetchOptions: {
        ...fetchOptions,
        headers: {
          ...fetchOptions?.headers,
          "Alchemy-AA-Sdk-Version": VERSION,
        },
      },
    }),
    key: "erc4337-client",
    name: "ERC 4337 RPC Client",
    type: "publicErc4337Client",
  });

  return client.extend(publicActions).extend(requiredActions);
};
