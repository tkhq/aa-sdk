import type { Chain, Client, FallbackTransport, Hash, Transport } from "viem";
import type { UserOperationResponse } from "../../types";
import type { Erc337RpcSchema } from "../types";

export const getUserOperationByHash =
  <T extends Transport | FallbackTransport = Transport>(
    client: Client<T, Chain, undefined, Erc337RpcSchema>
  ) =>
  (hash: Hash): Promise<UserOperationResponse | null> => {
    return client.request({
      method: "eth_getUserOperationByHash",
      params: [hash],
    });
  };
