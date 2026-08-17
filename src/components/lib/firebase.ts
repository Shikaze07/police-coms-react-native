// Global polyfills for Web / React Native Web environment
if (typeof globalThis.setImmediate === 'undefined') {
  (globalThis as any).setImmediate = (fn: (...args: any[]) => void, ...args: any[]) =>
    setTimeout(fn, 0, ...args);
}
if (typeof globalThis.clearImmediate === 'undefined') {
  (globalThis as any).clearImmediate = (id: any) => clearTimeout(id);
}

import { getApp, getApps, initializeApp } from '@react-native-firebase/app';
import { getAuth } from '@react-native-firebase/auth';
import { getFirestore } from '@react-native-firebase/firestore';
import { getStorage } from '@react-native-firebase/storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyFakeKey-PlaceholderForOperationalSecurity",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "police-coms.firebaseapp.com",
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL || "https://police-coms-default-rtdb.firebaseio.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "police-coms",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "police-coms.appspot.com",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1234567890",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:1234567890:android:abcdef123456",
};

function getOrCreateApp() {
  try {
    const apps = getApps();
    if (apps && apps.length > 0) {
      return getApp();
    }
    return initializeApp(firebaseConfig);
  } catch (e) {
    console.warn('[Firebase] App initialization notice:', (e as any)?.message || e);
    return null;
  }
}

const app = getOrCreateApp();

function safeService(getter: (a: any) => any) {
  try {
    if (app) {
      return getter(app);
    }
    return null;
  } catch (e) {
    console.warn('[Firebase] Service initialization notice:', (e as any)?.message || e);
    return null;
  }
}

export const auth = safeService((a) => getAuth(a));
export const db = safeService((a) => getFirestore(a));
export const storage = safeService((a) => getStorage(a));

export default app;
