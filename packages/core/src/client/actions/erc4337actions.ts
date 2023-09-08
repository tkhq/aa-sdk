import type { Chain, Client, FallbackTransport, Transport } from "viem";
import type { Erc337RpcSchema, Erc4337Actions } from "../types";
import { estimateUserOperationGas } from "./estimateUserOperationGas.js";
import { getSupportedEntryPoints } from "./getSupportedEntryPoints.js";
import { getUserOperationByHash } from "./getUserOperationByHash.js";
import { getUserOperationReceipt } from "./getUserOperationReceipt.js";
import { sendUserOperation } from "./sendUserOperation.js";

export const erc4337Actions = <
  T extends Transport | FallbackTransport = Transport
>(
  client: Client<T, Chain, undefined, Erc337RpcSchema>
): Erc4337Actions => ({
  estimateUserOperationGas: estimateUserOperationGas(client),
  sendUserOperation: sendUserOperation(client),
  getUserOperationByHash: getUserOperationByHash(client),
  getUserOperationReceipt: getUserOperationReceipt(client),
  getSupportedEntryPoints: getSupportedEntryPoints(client),
});
