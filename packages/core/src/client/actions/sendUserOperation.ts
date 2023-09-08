import type {
  Address,
  Chain,
  Client,
  FallbackTransport,
  Hex,
  Transport,
} from "viem";
import type { UserOperationRequest } from "../../types";
import type { Erc337RpcSchema } from "../types";

export const sendUserOperation =
  <T extends Transport | FallbackTransport = Transport>(
    client: Client<T, Chain, undefined, Erc337RpcSchema>
  ) =>
  (request: UserOperationRequest, entryPoint: string): Promise<Hex> => {
    return client.request({
      method: "eth_sendUserOperation",
      params: [request, entryPoint as Address],
    });
  };
