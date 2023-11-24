---
outline: deep
head:
  - - meta
    - property: og:title
      content: UserOperationOverrides
  - - meta
    - name: description
      content: Overview of the UserOperationOverrides type in aa-core types
  - - meta
    - property: og:description
      content: Overview of the UserOperationOverrides type in aa-core types
---

# UserOperationOverrides

Contains override values to be applied on the user operation reqeust to be constructed or sent. Available fields include `maxFeePerGas`, `maxPriorityFeePerGas`, `callGasLimit`, `preVerificationGas`, `verificationGasLimit` or `paymasterAndData`. By setting these override values, you can bypass certain middleware fee or `paymasterAndData` calculations.

For example, refer to our guide [How to Handle User Operations that are Not Eligible for Gas Sponsorship](/guides/sponsoring-gas/gas-sponsorship-eligibility.md) on the example of using the `paymasterAndData` override here to bypass the paymaster middleware to fallback to the user paying the gas fee instead of the gas being subsidized by the paymaster.

```ts
type BytesLike = Uint8Array | Hex;

type UserOperationOverrides = {
  callGasLimit: BigNumberish;
  maxFeePerGas: BigNumberish;
  maxPriorityFeePerGas: BigNumberish;
  preVerificationGas: BigNumberish;
  verificationGasLimi: BigNumberish;
  paymasterAndData: BytesLike | "0x";
};
```

## Usage

::: code-group

```ts [user-operation-override.ts]
import type { UserOperationOverrides } from "@alchemy/aa-core";
import { provider } from "./provider.ts";

// Find your Gas Manager policy id at:
//dashboard.alchemy.com/gas-manager/policy/create
const GAS_MANAGER_POLICY_ID = "YourGasManagerPolicyId";

// Link the provider with the Gas Manager. This ensures user operations
// sent with this provider get sponsorship from the Gas Manager.
provider.withAlchemyGasManager({
  policyId: GAS_MANAGER_POLICY_ID,
});

// [!code focus:16]
// Use maxFeePerGas, maxPriorityFeePerGas, and paymasterAndData override
// to manually set the tx gas fees and the paymasterAndData field
const overrides: UserOperationOverrides = {
  maxFeePerGas: 100000000n,
  maxPriorityFeePerGas: 100000000n,
  paymasterAndData: "0x",
};

const userOperationResult = await provider.sendUserOperation(
  {
    target: "0xTargetAddress",
    data: "0xCallData",
  },
  overrides
);

// Fallback to user paying the gas fee isntead of the paymaster
const txHash = await provider.waitForUserOperationTransaction({
  hash: userOperationResult.hash,
});
```

<<< @/snippets/provider.ts

:::
