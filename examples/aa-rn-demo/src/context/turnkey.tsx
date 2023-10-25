import { LocalAccountSigner, type SmartAccountSigner } from "@alchemy/aa-core";
import { useAsyncEffect } from "@hooks/useAsyncEffect";
import { useCredentialProvider } from "@hooks/useCredentialProvider";
import { alchemyRpcUrl } from "@shared-config/env";
import { ApiKeyStamper } from "@turnkey/api-key-stamper";
import { TurnkeyClient } from "@turnkey/http";
import { createAccount } from "@turnkey/viem";
import _ from "lodash";
import React, {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import Config from "react-native-config";
import FingerprintScanner, {
  type Biometrics,
} from "react-native-fingerprint-scanner";
import {
  createWalletClient,
  http,
  type Address,
  type LocalAccount,
  type WalletClient,
} from "viem";
import { sepolia } from "viem/chains";

type TurnkeyContextProps = {
  biometricType: Biometrics | null;
  walletClient: WalletClient | undefined;
  signer: SmartAccountSigner | undefined;
  account: LocalAccount | undefined;
  login: () => Promise<Address>;
  logout: () => Promise<void>;
};

export const turnkeyClient = new TurnkeyClient(
  {
    baseUrl: Config.TURNKEY_BASE_URL,
  },
  new ApiKeyStamper({
    apiPublicKey: Config.TURNKEY_API_PUBLIC_KEY,
    apiPrivateKey: Config.TURNKEY_API_PRIVATE_KEY,
  }),
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const defaultUnset: any = null;
const TurnkeyContext = createContext<TurnkeyContextProps>({
  login: defaultUnset,
  logout: defaultUnset,
  biometricType: null,
  walletClient: undefined,
  signer: undefined,
  account: undefined,
});

export const useTurnkeyContext = () => useContext(TurnkeyContext);

export const TurnkeyProvider = ({ children }: { children: ReactNode }) => {
  const [account, setAccount] = useState<LocalAccount>();
  const [signer, setSigner] = useState<SmartAccountSigner>();
  const [walletClient, setWalletClient] = useState<WalletClient>();

  const [biometricType, setBiometricType] = useState<Biometrics | null>(null);

  const { savePkey, removeKeys } = useCredentialProvider();

  useAsyncEffect(async () => {
    try {
      const _biometricType = await FingerprintScanner.isSensorAvailable();
      console.log("biometric supported", _biometricType);
      setBiometricType(_biometricType);
    } catch (error) {
      console.log("biometric not supported");
      setBiometricType(null);
    }
  }, []);

  const newTurnkeySigner = async () => {
    const turnkeyAccount = await createAccount({
      client: turnkeyClient,
      organizationId: Config.TURNKEY_ORGANIZATION_ID,
      privateKeyId: Config.TURNKEY_PRIVATE_KEY_ID,
    });

    const walletClient = createWalletClient({
      account: turnkeyAccount,
      chain: sepolia,
      transport: http(alchemyRpcUrl),
    });

    const turnkeySigner: SmartAccountSigner = new LocalAccountSigner(
      turnkeyAccount,
    );

    return {
      turnkeyAccount,
      turnkeySigner,
      walletClient,
    };
  };

  useAsyncEffect(async () => {
    if (!walletClient) return;
    const [addresses, chainId] = await Promise.all([
      walletClient.getAddresses(),
      walletClient.getChainId(),
    ]);
    console.log(
      `[useTurnkeyContext] Connected to ${_.first(
        addresses,
      )} on chain ${chainId}`,
    );
  }, [walletClient?.account, walletClient?.chain]);

  const login = useCallback(async () => {
    if (!biometricType) {
      throw new Error("Passkey is not supported on this device");
    }

    const { turnkeyAccount, turnkeySigner, walletClient } =
      await newTurnkeySigner();
    setAccount(turnkeyAccount);
    setSigner(turnkeySigner);
    setWalletClient(walletClient);

    await savePkey(turnkeyAccount.publicKey);
    return turnkeyAccount.address;
  }, [biometricType, savePkey]);

  const logout = useCallback(async () => {
    setAccount(undefined);
    setSigner(undefined);
    setWalletClient(undefined);

    await removeKeys();
  }, [removeKeys]);

  return (
    <TurnkeyContext.Provider
      value={{
        account,
        walletClient,
        signer,
        login,
        logout,
        biometricType,
      }}
    >
      {children}
    </TurnkeyContext.Provider>
  );
};
