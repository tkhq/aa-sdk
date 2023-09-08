import type { FallbackTransport, PublicClient, Transport } from "viem";
import type { BigNumberish } from "../../types";

export const getFeeData =
  <
    Client extends PublicClient<T>,
    T extends Transport | FallbackTransport = Transport
  >(
    client: Client
  ) =>
  async (): Promise<{
    maxFeePerGas?: BigNumberish;
    maxPriorityFeePerGas?: BigNumberish;
  }> => {
    // viem doesn't support getFeeData, so looking at ethers: https://github.com/ethers-io/ethers.js/blob/main/lib.esm/providers/abstract-provider.js#L472
    // also keeping this implementation the same as ethers so that the middlewares work consistently
    const block = await client.getBlock({
      blockTag: "latest",
    });

    if (block && block.baseFeePerGas) {
      const maxPriorityFeePerGas = 1500000000n;
      return {
        maxPriorityFeePerGas,
        maxFeePerGas: block.baseFeePerGas * 2n + maxPriorityFeePerGas,
      };
    }

    return {
      maxFeePerGas: 0n,
      maxPriorityFeePerGas: 0n,
    };
  };
