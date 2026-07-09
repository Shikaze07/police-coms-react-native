import { getApp } from '@react-native-firebase/app';
import { getAuth } from '@react-native-firebase/auth';
import { getFirestore } from '@react-native-firebase/firestore';
import { getStorage } from '@react-native-firebase/storage';

// With React Native Firebase v22+, it matches the Firebase Web Modular SDK v9 API
export const auth = getAuth();
export const db = getFirestore();
export const storage = getStorage();

export default getApp;
