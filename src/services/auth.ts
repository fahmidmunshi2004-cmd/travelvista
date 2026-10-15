import {
  browserLocalPersistence, browserSessionPersistence, createUserWithEmailAndPassword,
  sendPasswordResetEmail, setPersistence, signInWithEmailAndPassword,
  signInWithPopup, signOut, updateProfile, type UserCredential,
} from 'firebase/auth'
import { getAuth, GoogleAuthProvider, FacebookAuthProvider } from 'firebase/auth'
import { requireFirebaseApp } from './firebaseApp'

function configuredAuth() {
  return getAuth(requireFirebaseApp())
}

const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })
const facebookProvider = new FacebookAuthProvider()

export async function registerWithEmail(name: string, email: string, password: string): Promise<UserCredential> {
  const result = await createUserWithEmailAndPassword(configuredAuth(), email.trim(), password)
  await updateProfile(result.user, { displayName: name.trim() })
  return result
}

export async function loginWithEmail(email: string, password: string, remember = true) {
  const auth = configuredAuth()
  await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence)
  return signInWithEmailAndPassword(auth, email.trim(), password)
}

export async function loginWithGoogle(remember = true) {
  const auth = configuredAuth()
  await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence)
  return signInWithPopup(auth, googleProvider)
}

export async function loginWithFacebook(remember = true) {
  const auth = configuredAuth()
  await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence)
  return signInWithPopup(auth, facebookProvider)
}

export function requestPasswordReset(email: string) {
  return sendPasswordResetEmail(configuredAuth(), email.trim())
}

export async function logout() {
  await signOut(configuredAuth())
}
