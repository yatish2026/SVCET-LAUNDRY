import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Login session token: kept in memory for requests, persisted in the
// Keychain (iOS) / Keystore (Android). SecureStore has no web support.
const TOKEN_KEY = 'vastra_session_token';

let currentToken = null;
let unauthorizedHandler = null;

export const getAuthToken = () => currentToken;

export const loadAuthToken = async () => {
  try {
    currentToken =
      Platform.OS === 'web'
        ? await AsyncStorage.getItem(TOKEN_KEY)
        : await SecureStore.getItemAsync(TOKEN_KEY);
  } catch (e) {
    currentToken = null;
  }
  return currentToken;
};

export const saveAuthToken = async (token) => {
  currentToken = token || null;
  try {
    if (!token) {
      await clearAuthToken();
    } else if (Platform.OS === 'web') {
      await AsyncStorage.setItem(TOKEN_KEY, token);
    } else {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    }
  } catch (e) {
    console.log('Could not persist session token:', e);
  }
};

export const clearAuthToken = async () => {
  currentToken = null;
  try {
    if (Platform.OS === 'web') {
      await AsyncStorage.removeItem(TOKEN_KEY);
    } else {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    }
  } catch (e) {}
};

// AuthContext registers a handler that signs the user out when the server
// reports the session is missing or expired.
export const setUnauthorizedHandler = (handler) => {
  unauthorizedHandler = handler;
};

export const notifyUnauthorized = () => {
  if (unauthorizedHandler) unauthorizedHandler();
};
