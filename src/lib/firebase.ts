import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const isBrowser = typeof window !== 'undefined';
const hasConfig = !!firebaseConfig.apiKey && !!firebaseConfig.authDomain && !!firebaseConfig.projectId;

// Avoid initializing Firebase during build-time prerender when env missing.
// If config missing in browser runtime, features will fail loudly where used.
const app = getApps().length > 0 ? getApps()[0] : (hasConfig ? initializeApp(firebaseConfig) : null);
const auth = app && isBrowser ? getAuth(app) : (null as unknown as ReturnType<typeof getAuth>);
const db = app && isBrowser ? getFirestore(app) : (null as unknown as ReturnType<typeof getFirestore>);

export { app, auth, db };
