import { getApp, getApps, initializeApp } from 'firebase/app'

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  // Analytics is intentionally optional; it is not needed for Auth or Firestore.
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
}

const requiredConfig = [config.apiKey, config.authDomain, config.projectId, config.messagingSenderId, config.appId]

export const firebaseConfigured = requiredConfig.every(Boolean)

export function requireFirebaseApp() {
  if (!firebaseConfigured) {
    throw new Error('Firebase is not configured. Copy .env.example to .env.local and add the Firebase web app settings.')
  }
  return getApps().length ? getApp() : initializeApp(config)
}
