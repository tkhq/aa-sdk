import { AlchemyProvider } from "@alchemy/aa-alchemy";
import { type Address, type Hex } from "@alchemy/aa-core";
import { magic, useMagicContext } from "@context/magic";
import { useAlchemyProvider } from "@hooks/useAlchemyProvider";
import { useAsyncEffect } from "@hooks/useAsyncEffect";
import { useCredentialProvider } from "@hooks/useCredentialProvider";
import type { OAuthRedirectResult } from "@magic-ext/react-native-bare-oauth";
import { entryPointAddress } from "@shared-config/env";
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import RNRestart from "react-native-restart";
import type { Auth, AuthType } from "types/auth";
import { useAlertContext } from "./alert";
import { useTurnkeyContext } from "./turnkey";

type WalletContextProps = {
  loading: boolean;
  biometricSupported: boolean;

  // Functions
  login: (type: AuthType, ...params: any[]) => Promise<void>;
  logout: () => Promise<void>;

  // Properties
  provider: AlchemyProvider;
  scaAddress?: Address;
  auth?: Auth;
};

const defaultUnset: any = null;
const WalletContext = createContext<WalletContextProps>({
  biometricSupported: false,
  // Default Values
  provider: defaultUnset,
  login: () => Promise.resolve(),
  logout: () => Promise.resolve(),
  loading: false,
});

export const useWalletContext = () => useContext(WalletContext);

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const { dispatchAlert } = useAlertContext();
  const { getPkey } = useCredentialProvider();

  const [scaAddress, setScaAddress] = useState<Address>();
  const [loading, setLoading] = useState<boolean>(true);

  const [auth, setAuth] = useState<Auth>();
  const {
    signer: magicSigner,
    login: magicLogin,
    logout: magicLogout,
  } = useMagicContext();
  const {
    biometricType,
    signer: turnkeySigner,
    login: turnkeyLogin,
    logout: turnkeyLogout,
  } = useTurnkeyContext();
  const { provider, connectProviderToAccount, disconnectProviderFromAccount } =
    useAlchemyProvider({
      entryPointAddress,
    });

  const login = useCallback(
    async (type: AuthType, ...params: any[]) => {
      try {
        if (type === "passkey") {
          const address = await turnkeyLogin();
          setAuth({
            address,
            type,
          });
        } else {
          const res = await magicLogin(type, ...params);
          const metaData = await magic.user.getInfo();

          setAuth({
            address: metaData.publicAddress,
            type,
            metaData,
            did: type === "email" || type === "sms" ? String(res) : undefined,
            email: metaData.email,
            phoneNumber: metaData.phoneNumber,
            oAuthRedirectResult:
              type === "google" || type === "apple"
                ? (res as OAuthRedirectResult)
                : undefined,
          });
        }

        dispatchAlert({
          type: "open",
          alertType: "success",
          message: `Logged in using ${type}`,
        });
      } catch (error) {
        console.error(error);
        setAuth({
          address: null,
          type: null,
          metaData: null,
        });
        if (error instanceof Error && error.message.includes("cancel")) {
          dispatchAlert({
            type: "open",
            alertType: "info",
            message: `Log in using ${type} cancelled`,
          });
        } else {
          dispatchAlert({
            type: "open",
            alertType: "error",
            message: `Error logging in using ${type}`,
          });
        }
      }
    },
    [magicLogin, dispatchAlert, turnkeyLogin],
  );

  const signer = useMemo(
    () => magicSigner || turnkeySigner,
    [magicSigner, turnkeySigner],
  );

  useAsyncEffect(async () => {
    if (auth === undefined || auth.type === null || !signer) {
      return;
    }
    if (!provider.isConnected()) {
      await connectProviderToAccount(signer);
      const _scaAddress = await provider.getAddress();
      console.log("new login, connecting provider to account", _scaAddress);
      setScaAddress(_scaAddress);
      return;
    }
  }, [auth, signer]);

  const logout = useCallback(async () => {
    try {
      await Promise.all([magicLogout(), turnkeyLogout()]);
    } catch (error) {
      console.error(error);
    } finally {
      setAuth({
        address: null,
        type: null,
        metaData: null,
      });
      disconnectProviderFromAccount();
      setScaAddress(undefined);
      dispatchAlert({
        type: "open",
        alertType: "info",
        message: "Logged out",
      });
      RNRestart.restart();
    }
  }, [
    magicLogout,
    turnkeyLogout,
    disconnectProviderFromAccount,
    dispatchAlert,
  ]);

  useAsyncEffect(async () => {
    if (auth || !signer) {
      return;
    }

    const address = await getPkey();
    if (address) {
      setAuth({
        address,
        type: "passkey",
      });
    } else {
      const isLoggedIn = await magic.user.isLoggedIn();
      if (!isLoggedIn) {
        setLoading(false);
        setAuth({
          address: null,
          type: null,
          metaData: null,
        });
        return;
      }

      const metaData = await magic.user.getInfo();
      setAuth({
        address: metaData.publicAddress,
        type: "magic",
        metaData,
        email: metaData.email,
        phoneNumber: metaData.phoneNumber,
      });
    }

    const _scaAddress: Hex = await provider.getAddress();
    console.log("User already logged in", provider.isConnected(), _scaAddress);
    if (provider.isConnected()) {
      setScaAddress(_scaAddress);
    } else {
      console.log("already logged in, connecting provider to account");
      await connectProviderToAccount(signer);
      setScaAddress(_scaAddress);
    }
    setLoading(false);
  }, []);

  return (
    <WalletContext.Provider
      value={{
        biometricSupported: biometricType !== null,
        loading,
        login,
        logout,
        auth,
        provider,
        scaAddress,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};
