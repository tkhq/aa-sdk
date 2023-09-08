import type { Chain, Client, FallbackTransport, Hash, Transport } from "viem";
import type { UserOperationReceipt } from "../../types";
import type { Erc337RpcSchema } from "../types";

export const getUserOperationReceipt =
  <T extends Transport | FallbackTransport = Transport>(
    client: Client<T, Chain, undefined, Erc337RpcSchema>
  ) =>
  (hash: Hash): Promise<UserOperationReceipt | null> => {
    return client.request({
      method: "eth_getUserOperationReceipt",
      params: [hash],
    });
  };
