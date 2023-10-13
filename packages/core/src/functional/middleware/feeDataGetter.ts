import type { Chain, PublicClient, Transport } from "viem";
import { minPriorityFeePerBidDefaults } from "../../provider/base.js";
import type { AccountMiddlewareFn } from "../../provider/types";

export const defaultFeeDataGetter: (
  rpcClient: PublicClient<Transport, Chain>,
  minPriorityFeePerBid?: bigint
) => AccountMiddlewareFn =
  (
    rpcClient,
    minPriorityFeePerBid = minPriorityFeePerBidDefaults.get(
      rpcClient.chain.id
    ) ?? 100_000_000n
  ) =>
  async (struct) => {
    const maxPriorityFeePerGas = await rpcClient.estimateMaxPriorityFeePerGas();
    const feeData = await rpcClient.estimateFeesPerGas();
    if (!feeData.maxFeePerGas || !feeData.maxPriorityFeePerGas) {
      throw new Error(
        "feeData is missing maxFeePerGas or maxPriorityFeePerGas"
      );
    }

    // add 33% to the priorty fee to ensure the transaction is mined
    let maxPriorityFeePerGasBid = (BigInt(maxPriorityFeePerGas) * 4n) / 3n;
    if (maxPriorityFeePerGasBid < minPriorityFeePerBid) {
      maxPriorityFeePerGasBid = minPriorityFeePerBid;
    }

    const maxFeePerGasBid =
      BigInt(feeData.maxFeePerGas) -
      BigInt(feeData.maxPriorityFeePerGas) +
      maxPriorityFeePerGasBid;

    struct.maxFeePerGas = maxFeePerGasBid;
    struct.maxPriorityFeePerGas = maxPriorityFeePerGasBid;

    return struct;
  };
