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
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";

const turnkeyEnabled = false;

type TurnkeyContextProps = {
  biometricType: Biometrics | null;
  walletClient: WalletClient | undefined;
  turnkeyClient: TurnkeyClient | undefined;
  signer: SmartAccountSigner | undefined;
  account: LocalAccount | undefined;
  login: () => Promise<Address>;
  logout: () => Promise<void>;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const defaultUnset: any = null;
const TurnkeyContext = createContext<TurnkeyContextProps>({
  login: defaultUnset,
  logout: defaultUnset,
  biometricType: null,
  turnkeyClient: undefined,
  walletClient: undefined,
  signer: undefined,
  account: undefined,
});

export const useTurnkeyContext = () => useContext(TurnkeyContext);

export const TurnkeyProvider = ({ children }: { children: ReactNode }) => {
  const [account, setAccount] = useState<LocalAccount<any>>();
  const [signer, setSigner] = useState<SmartAccountSigner>();
  const [walletClient, setWalletClient] = useState<WalletClient>();
  const [turnkeyClient, setTurnkeyClient] = useState<TurnkeyClient>();

  const [biometricType, setBiometricType] = useState<Biometrics | null>(null);

  const { savePkey, saveAddress, removeAddress } = useCredentialProvider();

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

  const newTurnkeySigner = useCallback(async () => {
    let _turnkeyClient: TurnkeyClient | undefined;
    let _turnkeyAccount: LocalAccount<any> | undefined;

    if (turnkeyEnabled) {
      console.log("[useTurnkeyContext] Creating new turnkey client");

      _turnkeyClient = new TurnkeyClient(
        {
          baseUrl: Config.TURNKEY_BASE_URL,
        },
        new ApiKeyStamper({
          apiPublicKey: Config.TURNKEY_API_PUBLIC_KEY,
          apiPrivateKey: Config.TURNKEY_API_PRIVATE_KEY,
        }),
      );

      _turnkeyAccount = await createAccount({
        client: _turnkeyClient,
        organizationId: Config.TURNKEY_ORGANIZATION_ID,
        privateKeyId: Config.TURNKEY_PRIVATE_KEY_ID,
      });
    } else {
      console.log("[useTurnkeyContext] Creating a new local wallet");
      const privateKey = generatePrivateKey();
      _turnkeyAccount = privateKeyToAccount(privateKey);
      await savePkey(privateKey);
    }

    const _walletClient = createWalletClient({
      account: _turnkeyAccount,
      chain: sepolia,
      transport: http(alchemyRpcUrl),
    });

    const [addresses, chainId] = await Promise.all([
      _walletClient.getAddresses(),
      _walletClient.getChainId(),
    ]);
    console.log(
      `[useTurnkeyContext] Connected to ${_.first(
        addresses,
      )} on chain ${chainId}`,
    );

    const turnkeySigner: SmartAccountSigner = new LocalAccountSigner(
      _turnkeyAccount,
    );

    return {
      turnkeyAccount: _turnkeyAccount,
      turnkeySigner,
      walletClient: _walletClient,
      turnkeyClient: _turnkeyClient,
    };
  }, [savePkey]);

  const login = useCallback(async () => {
    if (!biometricType) {
      throw new Error("Passkey is not supported on this device");
    }

    await FingerprintScanner.authenticate({
      description: `Sign in with ${biometricType}`,
      fallbackEnabled: true,
    });

    const {
      turnkeyAccount,
      turnkeySigner,
      walletClient: _walletClient,
      turnkeyClient: _turnkeyClient,
    } = await newTurnkeySigner();
    setAccount(turnkeyAccount);
    setSigner(turnkeySigner);
    setWalletClient(_walletClient);
    setTurnkeyClient(_turnkeyClient);
    await saveAddress(turnkeyAccount.address);
    return turnkeyAccount.address;
  }, [biometricType, newTurnkeySigner, saveAddress]);

  const logout = useCallback(async () => {
    setAccount(undefined);
    setSigner(undefined);
    setWalletClient(undefined);
    await removeAddress();
  }, [removeAddress]);

  return (
    <TurnkeyContext.Provider
      value={{
        account,
        turnkeyClient,
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
