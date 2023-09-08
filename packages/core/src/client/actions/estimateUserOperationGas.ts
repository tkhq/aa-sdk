import type { Address } from "abitype";
import type { Chain, Client, FallbackTransport, Transport } from "viem";
import type {
  UserOperationEstimateGasResponse,
  UserOperationRequest,
} from "../../types";
import type { Erc337RpcSchema } from "../types";

export const estimateUserOperationGas =
  <T extends Transport | FallbackTransport = Transport>(
    client: Client<T, Chain, undefined, Erc337RpcSchema>
  ) =>
  (
    request: UserOperationRequest,
    entryPoint: string
  ): Promise<UserOperationEstimateGasResponse> => {
    return client.request({
      method: "eth_estimateUserOperationGas",
      params: [request, entryPoint as Address],
    });
  };
