---
outline: deep
head:
  - - meta
    - property: og:title
      content: SmartAccountProvider • constructor
  - - meta
    - name: description
      content: Overview of the constructor method on SmartAccountProvider in aa-core
  - - meta
    - property: og:description
      content: Overview of the constructor method on SmartAccountProvider in aa-core
---

# constructor

To initialize a `SmartAccountProvider`, you must provide a set of parameters detailed below.

## Usage

::: code-group

```ts [example.ts]
import { SmartAccountProvider } from "@alchemy/aa-core";
import { getDefaultEntryPointAddress } from "@alchemy/aa-core";
import { sepolia } from "viem/chains";

// instantiates using every possible parameter, as a reference
export const provider = new SmartAccountProvider({
  rpcProvider: "ALCHEMY_RPC_URL",
  chain: sepolia,
  entryPointAddress: getDefaultEntryPointAddress(sepolia),
  opts: {
    txMaxRetries: 10,
    txRetryIntervalMs: 2_000,
    txRetryMulitplier: 1.5,
    minPriorityFeePerBid: 100_000_000n,
  },
});
```

:::

## Returns

### `SmartAccountProvider`

A new instance of a `SmartAccountProvider`.

## Parameters

### `config: SmartAccountProviderConfig`

- `rpcProvider: string | PublicErc4337Client<TTransport extends SupportedTransports = Transport>` -- a JSON-RPC URL, or a viem Client that supports ERC-4337 methods and Viem public actions. See [createPublicErc4337Client](/packages/aa-core/client/createPublicErc4337Client.md).

- `chain: Chain` -- the chain on which to create the provider.

- `entryPointAddress: Address | undefined` -- [optional] the entry point contract address. If not provided, the entry point contract address for the provider is the connected account's entry point contract, or if not connected, falls back to the default entry point contract for the chain. See [getDefaultEntryPointAddress](/packages/aa-core/utils/getDefaultEntryPointAddress.html#getdefaultentrypointaddress).

- `opts: SmartAccountProviderOpts | undefined` -- [optional] overrides on provider config variables having to do with fetching transaction receipts and fee computation.

  - `txMaxRetries: string | undefined` -- [optional] the maximum number of times to try fetching a transaction receipt before giving up (default: 5).

  - `txRetryIntervalMs: string | undefined` -- [optional] the interval in milliseconds to wait between retries while waiting for transaction receipts (default: 2_000).

  - `txRetryMulitplier: string | undefined` -- [optional] the mulitplier on interval length to wait between retries while waiting for transaction receipts (default: 1.5).

  - `feeOptions: UserOperationFeeOptions | undefined` --[optional] user operation fee options to be used for gas estimation, set at the global level on the provider.
    If not set, default fee options for the chain are used. Available fields in `feeOptions` include `maxFeePerGas`, `maxPriorityFeePerGas`, `callGasLimit`, `preVerificationGas`, `verificationGasLimit` where each field is of type `UserOperationFeeOptionsField`. `UserOperationFeeOptionsField` can be of type `Percentage` or `BigNumberishRange` ({ })
    - `maxFeePerGas`: `UserOperationFeeOptionsField`
    - `maxPriorityFeePerGas`: `UserOperationFeeOptionsField`
    - `callGasLimit`: `UserOperationFeeOptionsField`
    - `verificationGasLimit`: `UserOperationFeeOptionsField`
    - `preVerificationGas`: `UserOperationFeeOptionsField`

:::tip Note
Note that `feeOptions` set as an optional parameter to provider upon initialization are only used when using the default [FeeDataGetter](/packages/aa-core/provider/withFeeDataGetter.md) or [GasEstimator](/packages/aa-core/provider/withGasEstimator.md) middlewares. when using your custom `feeDataGetter` or `gasEstimator` with override methods, not only the default middlewares, but also the fee options for each middleware are overriden respectively. When using your custom `feeDataGetter` or `gasEstimator`, you need to set the fee options through each midleware override methods.
:::
