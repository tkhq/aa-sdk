import { type OAuthRedirectResult } from "@magic-ext/react-native-bare-oauth";
import { type MagicUserMetadata } from "@magic-sdk/react-native-bare";

export type Auth = {
  address: string | null;
  type: AuthType | null;
  metaData?: MagicUserMetadata | null;
  did?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  oAuthRedirectResult?: OAuthRedirectResult | null;
};

export type AuthType =
  | "google"
  | "apple"
  | "magic"
  | "email"
  | "sms"
  | "passkey";
