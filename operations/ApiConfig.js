import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

export const Environments = {
  ANDROID_EMULATOR: "ANDROID_EMULATOR",
  LOCAL_DEVICE: "LOCAL_DEVICE",
  PRODUCTION: "PRODUCTION",
};

const BASE_URLS = {
  [Environments.ANDROID_EMULATOR]: "http://10.0.2.2:5093",
  [Environments.LOCAL_DEVICE]: "http://10.10.10.80:5093",
  [Environments.PRODUCTION]: "https://api.example.com", // placeholder URL
};

// Choose default environment here (change to ANDROID_EMULATOR, LOCAL_DEVICE or PRODUCTION)
let currentEnv = Environments.LOCAL_DEVICE;
export const API_ENV_KEY = "apiEnv";

/**
 * Return current environment (string)
 */
export const getApiEnvironment = () => currentEnv;

/**
 * Return base url for the active environment
 */
export const getApiBaseUrl = () => BASE_URLS[currentEnv];

/**
 * Persist and set the environment. Accept one of Environments.*
 */
export const setApiEnvironment = async (env) => {
  if (!BASE_URLS[env]) throw new Error("Unknown API environment: " + env);
  currentEnv = env;
  try {
    await AsyncStorage.setItem(API_ENV_KEY, env);
  } catch (e) {
    console.warn("Failed to persist api env", e);
  }
  return currentEnv;
};

/**
 * Load previously-saved environment from AsyncStorage (call at app startup).
 * If none stored, uses the default above.
 */
export const loadApiEnvironment = async () => {
  try {
    const stored = await AsyncStorage.getItem(API_ENV_KEY);
    if (stored && BASE_URLS[stored]) currentEnv = stored;
  } catch (e) {
    // ignore
  }
  return currentEnv;
};

/**
 * Build a full URL from either a relative path or a full URL.
 * If you pass a full URL it is returned unchanged.
 * Example:
 *   apiUrl('/api/UsersAPI') -> 'http://10.0.2.2:5093/api/UsersAPI'
 *   apiUrl('http://other.host/foo') -> 'http://other.host/foo'
 */
export const apiUrl = (pathOrUrl) => {
  if (!pathOrUrl) return getApiBaseUrl();
  if (typeof pathOrUrl !== "string") return pathOrUrl;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `${getApiBaseUrl().replace(/\/$/, "")}/${pathOrUrl.replace(/^\//, "")}`;
};