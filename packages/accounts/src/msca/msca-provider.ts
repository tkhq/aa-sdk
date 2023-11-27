import {
  createSmartAccountProviderConfigSchema,
  type ISmartAccountProvider,
  type SupportedTransports,
} from "@alchemy/aa-core";
import type { Transport } from "viem";
import { z } from "zod";
import type { MSCA } from "./builder";
import {
  installPlugin,
  pluginManagerDecorator,
  uninstallPlugin,
  type InstallPluginParams,
  type UninstallPluginParams,
} from "./plugins/manager/index.js";

export interface IMSCAProvider extends ISmartAccountProvider {
  readonly account?: MSCA;

  installPlugin: (
    params: InstallPluginParams
  ) => ReturnType<typeof installPlugin>;

  uninstallPlugin: (
    params: UninstallPluginParams
  ) => ReturnType<typeof uninstallPlugin>;
}

export const createMSCAProviderConfigSchema = <
  TTransport extends SupportedTransports = Transport
>() => createSmartAccountProviderConfigSchema<TTransport>();

export type MSCAProviderConfig = z.input<
  ReturnType<typeof createMSCAProviderConfigSchema>
>;

export const createMSCAProvider = <
  P extends ISmartAccountProvider & { account: MSCA }
>(
  provider: P
) => {
  return Object.assign(provider, pluginManagerDecorator(provider));
};

// export class MSCAProvider<TTransport extends SupportedTransports = Transport>
//   extends SmartAccountProvider<TTransport>
//   implements IMSCAProvider
// {
//   declare readonly account?: MSCA;

//   installPlugin = (
//     params: InstallPluginParams
//   ): Promise<SendUserOperationResult> => {
//     if (!this.account) {
//       throw new Error("account not connected!");
//     }
//     return installPlugin(this, params);
//   };

//   uninstallPlugin = (
//     params: UninstallPluginParams
//   ): Promise<SendUserOperationResult> => {
//     if (!this.account) {
//       throw new Error("account not connected!");
//     }
//     return uninstallPlugin(this, params);
//   };
// }
