import type { BigNumberish, FeeDataFeeOptions } from "@alchemy/aa-core";
import type { AlchemyProvider } from "../provider.js";
import type { ClientWithAlchemyMethods } from "./client.js";

export const withAlchemyGasFeeEstimator = (
  provider: AlchemyProvider,
  feeOptions?: FeeDataFeeOptions
): AlchemyProvider => {
  provider.withFeeDataGetter(async (struct, overrides) => {
    const maxPriorityFeePerGas =
      overrides?.maxPriorityFeePerGas ??
      // it's a fair assumption that if someone is using this Alchemy Middleware, then they are using Alchemy RPC
      (await (provider.rpcClient as ClientWithAlchemyMethods).request({
        method: "rundler_maxPriorityFeePerGas",
        params: [],
      }));

    const estimateMaxFeePerGas = async (priorityFeePerGas: BigNumberish) => {
      const block = await provider.rpcClient.getBlock({ blockTag: "latest" });
      const baseFeePerGas = block.baseFeePerGas;
      if (baseFeePerGas == null) {
        throw new Error("baseFeePerGas is null");
      }
      return baseFeePerGas + BigInt(priorityFeePerGas);
    };

    const maxFeePerGas =
      overrides?.maxFeePerGas ??
      (await estimateMaxFeePerGas(maxPriorityFeePerGas));

    return {
      ...struct,
      maxPriorityFeePerGas,
      maxFeePerGas,
    };
  }, feeOptions ?? provider.feeOptions);
  return provider;
};
