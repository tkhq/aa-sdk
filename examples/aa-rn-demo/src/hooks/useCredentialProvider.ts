import { useCallback } from "react";
import {
  getInternetCredentials,
  resetInternetCredentials,
  setInternetCredentials,
} from "react-native-keychain";
import { KeyChainEnum } from "types/storage";

export const useCredentialProvider = () => {
  const savePin = useCallback(async (pin: string) => {
    await setInternetCredentials(KeyChainEnum.PIN, KeyChainEnum.PIN, pin);
  }, []);

  const savePkey = useCallback(async (privateKey: string) => {
    await setInternetCredentials(KeyChainEnum.PK, KeyChainEnum.PK, privateKey);
  }, []);

  const getPkey = useCallback(async () => {
    const res = await getInternetCredentials(KeyChainEnum.PK);
    if (res) {
      return res.password;
    }
    return "";
  }, []);

  const removeKeys = useCallback(async () => {
    await Promise.all([resetInternetCredentials(KeyChainEnum.PK)]);
  }, []);

  const saveAddress = useCallback(async (address: string) => {
    await setInternetCredentials(
      KeyChainEnum.ADDRESS,
      KeyChainEnum.ADDRESS,
      address,
    );
  }, []);

  const getAddress = useCallback(async () => {
    const res = await getInternetCredentials(KeyChainEnum.ADDRESS);
    if (res) {
      return res.password;
    }
    return "";
  }, []);

  const removeAddress = useCallback(async () => {
    await Promise.all([resetInternetCredentials(KeyChainEnum.ADDRESS)]);
  }, []);

  const saveNewPin = useCallback(async (pin: string) => {
    await setInternetCredentials(
      KeyChainEnum.NEW_PIN,
      KeyChainEnum.NEW_PIN,
      pin,
    );
  }, []);

  const getPin = useCallback(async () => {
    const res = await getInternetCredentials(KeyChainEnum.PIN);
    return res ? res.password : "";
  }, []);

  const getNewPin = useCallback(async () => {
    const res = await getInternetCredentials(KeyChainEnum.NEW_PIN);
    return res ? res.password : "";
  }, []);

  const resetPin = useCallback(async () => {
    await resetInternetCredentials(KeyChainEnum.PIN);
  }, []);

  const resetNewPin = useCallback(async () => {
    await resetInternetCredentials(KeyChainEnum.NEW_PIN);
  }, []);

  return {
    saveAddress,
    getAddress,
    removeAddress,
    savePkey,
    getPkey,
    removeKeys,
    savePin,
    saveNewPin,
    getPin,
    getNewPin,
    resetPin,
    resetNewPin,
  };
};
