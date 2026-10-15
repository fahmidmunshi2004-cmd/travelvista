import {
  createUserWithEmailAndPassword, sendPasswordResetEmail, signInWithEmailAndPassword,
  signInWithPopup, signOut, updateProfile, type UserCredential,
} from 'firebase/auth'
import { getAuth, GoogleAuthProvider, FacebookAuthProvider } from 'firebase/auth'
import { requireFirebaseApp } from './firebaseApp'

function configuredAuth() {
  return getAuth(requireFirebaseApp())
}

const googleProvider = new GoogleAuthProvider()
const facebookProvider = new FacebookAuthProvider()

export async function registerWithEmail(name: string, email: string, password: string): Promise<UserCredential> {
  const result = await createUserWithEmailAndPassword(configuredAuth(), email.trim(), password)
  await updateProfile(result.user, { displayName: name.trim() })
  return result
}

export function loginWithEmail(email: string, password: string) {
  return signInWithEmailAndPassword(configuredAuth(), email.trim(), password)
}

export function loginWithGoogle() {
  return signInWithPopup(configuredAuth(), googleProvider)
}

export function loginWithFacebook() {
  return signInWithPopup(configuredAuth(), facebookProvider)
}

export function requestPasswordReset(email: string) {
  return sendPasswordResetEmail(configuredAuth(), email.trim())
}

export async function logout() {
  await signOut(configuredAuth())
}
