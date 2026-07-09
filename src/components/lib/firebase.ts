import app from '@react-native-firebase/app';
import authModule from '@react-native-firebase/auth';
import firestoreModule from '@react-native-firebase/firestore';
import storageModule from '@react-native-firebase/storage';

// With React Native Firebase, initialization is handled automatically 
// via google-services.json (Android) and GoogleService-Info.plist (iOS)
// that are processed during the native build.

export const auth = authModule();
export const db = firestoreModule();
export const storage = storageModule();

export default app;
