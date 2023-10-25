declare module "react-native-config" {
  export interface NativeConfig {
    NODE_ENV: string;
    ALCHEMY_KEY: string;
    ALCHEMY_RPC_URL: string;
    ALCHEMY_GAS_MANAGER_POLICY_ID: string;
    MAGIC_API_KEY: string;
    TURNKEY_ORGANIZATION_ID: string;
    TURNKEY_API_PUBLIC_KEY: string;
    TURNKEY_API_PRIVATE_KEY: string;
    TURNKEY_BASE_URL: string;
    TURNKEY_PRIVATE_KEY_ID: string;
  }

  export const Config: NativeConfig;
  export default Config;
}
