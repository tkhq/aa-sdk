import type {
  Address,
  Chain,
  Client,
  FallbackTransport,
  Transport,
} from "viem";
import type { Erc337RpcSchema } from "../types";

export const getSupportedEntryPoints =
  <T extends Transport | FallbackTransport = Transport>(
    client: Client<T, Chain, undefined, Erc337RpcSchema>
  ) =>
  (): Promise<Address[]> => {
    return client.request({
      method: "eth_supportedEntryPoints",
    });
  };
