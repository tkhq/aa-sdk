import { z } from "zod";
import type {
  AlchemyProviderConfigSchema,
  ConnectionConfigSchema,
  FeeOptsSchema,
  LightAccountAlchemyProviderConfigSchema,
} from "./schema.js";

export type ConnectionConfig = z.infer<typeof ConnectionConfigSchema>;

export type FeeOpts = z.infer<typeof FeeOptsSchema>;

export type AlchemyProviderConfig = z.infer<typeof AlchemyProviderConfigSchema>;

export type LightAccountAlchemyProviderConfig = z.infer<
  typeof LightAccountAlchemyProviderConfigSchema
>;
