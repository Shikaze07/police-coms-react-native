import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const SOCKET_SERVER_PORT = 3000;
const INTERNET_CHECK_URL = 'https://clients3.google.com/generate_204';
const SOCKET_SERVER_URL_KEY = 'policecoms.socketServerUrl';

const normalizeSocketUrl = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return '';

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed.replace(/\/$/, '');
  }

  return `http://${trimmed.replace(/\/$/, '')}`;
};

export const getStoredSocketUrl = async () => {
  const value = await AsyncStorage.getItem(SOCKET_SERVER_URL_KEY);
  return value ? normalizeSocketUrl(value) : null;
};

export const setStoredSocketUrl = async (value: string) => {
  const normalized = normalizeSocketUrl(value);
  if (!normalized) {
    await AsyncStorage.removeItem(SOCKET_SERVER_URL_KEY);
    return null;
  }

  await AsyncStorage.setItem(SOCKET_SERVER_URL_KEY, normalized);
  return normalized;
};

export const clearStoredSocketUrl = async () => {
  await AsyncStorage.removeItem(SOCKET_SERVER_URL_KEY);
};

export const getSocketUrl = async () => {
  const storedUrl = await getStoredSocketUrl();
  if (storedUrl) {
    return storedUrl;
  }

  const explicitUrl = process.env.EXPO_PUBLIC_SOCKET_SERVER_URL?.trim();
  if (explicitUrl) {
    return normalizeSocketUrl(explicitUrl);
  }

  let host = 'localhost';

  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.location?.hostname) {
      host = window.location.hostname;
    }
  } else {
    const debuggerHost = Constants.expoConfig?.hostUri;
    if (debuggerHost) {
      host = debuggerHost.split(':')[0];
    }
  }

  return `http://${host}:${SOCKET_SERVER_PORT}`;
};

export const checkInternetConnection = async () => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    try {
      const response = await fetch(INTERNET_CHECK_URL, {
        method: 'GET',
        cache: 'no-store',
        signal: controller.signal,
      });

      return response.ok || response.status === 204;
    } finally {
      clearTimeout(timeoutId);
    }
  } catch {
    return false;
  }
};