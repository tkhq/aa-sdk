import {
  custom,
  type Address,
  type Chain,
  type EIP1193RequestFn,
  type PublicRpcSchema,
  type RpcTransactionRequest,
  type Transport,
} from "viem";
import type { Prettify } from "viem/_types/types/utils";
import type { ISmartContractAccount } from "../account/types";
import {
  createPublicErc4337Client,
  createPublicErc4337FromClient,
} from "../client/create-client.js";
import type { Erc4337RpcSchema, PublicErc4337Client } from "../client/types";
import { noOpMiddleware } from "../provider/base.js";
import {
  type AccountMiddlewareFn,
  type FeeDataMiddleware,
  type GasEstimatorMiddleware,
  type PaymasterAndDataMiddleware,
} from "../provider/types.js";
import {
  baseSmartAccountActions,
  type BaseSmartAccountActions,
} from "./defaultDecorator.js";
import { applyOverride } from "./middleware/applyOverride.js";
import { defaultFeeDataGetter } from "./middleware/feeDataGetter.js";
import { addAlchemyHeaders } from "./utils/addAlchemyHeaders.js";
import type { IsUndefined } from "./utils/types";

export type CreateProviderConfig<
  TAccount extends ISmartContractAccount | undefined = undefined,
  TProvider extends string | PublicErc4337Client<Transport> = string
> = {
  // account: TAccount;
  rpcProvider: TProvider;
  entryPointAddress: Address;
  chain: Chain;
  paymasterMiddleware?: {
    dummyPaymasterDataMiddleware?: PaymasterAndDataMiddleware;
    paymasterDataMiddleware?: PaymasterAndDataMiddleware;
  };
  gasEstimator?: GasEstimatorMiddleware;
  feeDataGetter?: FeeDataMiddleware;
  customMiddleware?: AccountMiddlewareFn;
} & (IsUndefined<TAccount> extends true
  ? { account?: never }
  : { account: TAccount });

type SmartAccountClient_Base<
  TAccount extends ISmartContractAccount | undefined =
    | ISmartContractAccount
    | undefined,
  TTransport extends Transport = Transport
> = {
  chain: Chain;
  account: TAccount;
  rpcClient: PublicErc4337Client<TTransport>;
  entryPointAddress: Address;

  readonly dummyPaymasterDataMiddleware: AccountMiddlewareFn;
  readonly paymasterDataMiddleware: AccountMiddlewareFn;
  readonly gasEstimator: AccountMiddlewareFn;
  readonly feeDataGetter: AccountMiddlewareFn;
  readonly customMiddleware?: AccountMiddlewareFn;
};

export type Extended = Prettify<
  // disallow redefining base properties
  { [K in keyof SmartAccountClient_Base]?: undefined } & {
    [key: string]: unknown;
  }
>;

export type SmartAccountClient<
  TAccount extends ISmartContractAccount | undefined = undefined,
  TExtended extends Extended | undefined = Extended | undefined
> = SmartAccountClient_Base<TAccount> &
  (TExtended extends Extended ? TExtended : unknown) & {
    request: EIP1193RequestFn<[...PublicRpcSchema, ...Erc4337RpcSchema]>;
    extend: <const client extends Extended>(
      fn: (client: SmartAccountClient<TAccount, TExtended>) => client
    ) => SmartAccountClient<
      TAccount,
      Prettify<client> & (TExtended extends Extended ? TExtended : unknown)
    >;
  };

export const createSmartAccountClient = <
  TAccount extends ISmartContractAccount | undefined = undefined,
  TProvider extends string | PublicErc4337Client<Transport> = string
>(
  config: CreateProviderConfig<TAccount, TProvider>
): SmartAccountClient<TAccount, BaseSmartAccountActions> => {
  const { chain, rpcProvider, account, entryPointAddress } = config;

  const rpcClient =
    typeof rpcProvider === "string"
      ? createPublicErc4337Client({
          chain,
          rpcUrl: rpcProvider,
        })
      : createPublicErc4337FromClient(rpcProvider);

  const baseClient = {
    // @ts-ignore fix this later
    account,
    chain,
    rpcClient,
    entryPointAddress,
    // TODO(moldy): replace all of the noOpMiddleware with actual impls
    gasEstimator:
      config.gasEstimator != null
        ? applyOverride(config.gasEstimator)
        : noOpMiddleware,
    feeDataGetter:
      config.feeDataGetter != null
        ? applyOverride(config.feeDataGetter)
        : defaultFeeDataGetter(rpcClient),
    dummyPaymasterDataMiddleware:
      config.paymasterMiddleware?.dummyPaymasterDataMiddleware != null
        ? applyOverride(
            config.paymasterMiddleware?.dummyPaymasterDataMiddleware
          )
        : noOpMiddleware,
    paymasterDataMiddleware:
      config.paymasterMiddleware?.paymasterDataMiddleware != null
        ? applyOverride(config.paymasterMiddleware?.paymasterDataMiddleware)
        : noOpMiddleware,
  } satisfies Omit<SmartAccountClient_Base<TAccount>, "request">;

  function extend(base: typeof baseClient) {
    type ExtendFn = (base: typeof baseClient) => unknown;
    return (extendFn: ExtendFn) => {
      const extended = extendFn(base) as Extended;
      for (const key in baseClient) delete extended[key];
      const combined = { ...base, ...extended };
      return Object.assign(combined, { extend: extend(combined) });
    };
  }

  // @ts-ignore fix later
  const extendibleClient: Omit<
    SmartAccountClient<TAccount>,
    "request"
  > = Object.assign(baseClient, {
    extend: extend(baseClient) as any,
  });

  const client = extendibleClient.extend(baseSmartAccountActions);

  // we do this so we can get the typing on the request method
  // and also have a client that supports the extension methods
  const { request } = custom({
    async request({ method, params }) {
      addAlchemyHeaders(client);

      switch (method) {
        case "eth_sendTransaction":
          const [tx] = params as [RpcTransactionRequest];
          return client.sendTransaction(tx);
        case "eth_sign":
          const [address, data] = params!;
          if (!client.account) {
            throw new Error("cannot sign without an account");
          }
          if (address !== (await client.account.getAddress())) {
            throw new Error(
              "cannot sign for address that is not the current account"
            );
          }
          return client.account.signMessage(data);
        case "personal_sign": {
          const [data, address] = params!;
          if (!client.account) {
            throw new Error("cannot sign without an account");
          }
          if (address !== (await client.account?.getAddress())) {
            throw new Error(
              "cannot sign for address that is not the current account"
            );
          }
          return client.account.signMessage(data);
        }
        case "eth_signTypedData_v4": {
          const [address, dataParams] = params!;
          if (!client.account) {
            throw new Error("cannot sign without an account");
          }
          if (address !== (await client.account?.getAddress())) {
            throw new Error(
              "cannot sign for address that is not the current account"
            );
          }
          return client.account.signTypedData(dataParams);
        }
        case "eth_chainId":
          return client.chain.id;
        default:
          // TODO: there's probably a number of methods we just don't support, will need to test most of them out
          // first let's get something working though
          // @ts-expect-error the typing with viem clashes here, we'll need to fix the typing on this method
          return provider.rpcClient.request(args);
      }
    },
  })({ chain });

  return {
    ...client,
    request,
  };
};

// Example usage
// const client = createSmartAccountClient({
//   chain: sepolia,
//   entryPointAddress: "0x0",
//   rpcProvider: "http://alchemy.com",
// });
