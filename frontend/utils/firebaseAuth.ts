import { signInWithCustomToken, signOut } from "firebase/auth"
import { firebaseAuth } from "./firebase"
import { authApi } from "./api"

export async function ensureFirebaseSignedIn(): Promise<void> {
  if (!localStorage.getItem("token")) {
    console.warn('No backend token found, skipping Firebase sign-in')
    return
  }

  const backendUserId = localStorage.getItem("userId")
  
  // If already signed in and UID matches, skip
  if (firebaseAuth.currentUser) {
    if (!backendUserId || firebaseAuth.currentUser.uid === backendUserId) {
      console.log('Firebase already signed in:', firebaseAuth.currentUser.uid)
      return
    }
    // UID mismatch - sign out and re-authenticate
    console.warn('Firebase UID mismatch, signing out and re-authenticating')
    await signOut(firebaseAuth)
  }

  const resp = await authApi.getFirebaseToken()
  if (!resp.success || !resp.data?.token) {
    const errorMsg = resp.message || "Failed to get Firebase token"
    console.error('Failed to get Firebase token:', errorMsg)
    throw new Error(errorMsg)
  }

  console.log('Signing in to Firebase with custom token...')
  await signInWithCustomToken(firebaseAuth, resp.data.token)
  
  if (!firebaseAuth.currentUser) {
    throw new Error('Firebase sign-in completed but no current user')
  }
  
  console.log('Firebase signed in successfully:', firebaseAuth.currentUser.uid)
  
  if (backendUserId && firebaseAuth.currentUser.uid !== backendUserId) {
    console.warn("Firebase UID mismatch with backend userId:", {
      firebase: firebaseAuth.currentUser.uid,
      backend: backendUserId
    })
  }
}

export async function firebaseLogout(): Promise<void> {
  try {
    await signOut(firebaseAuth)
  } catch {
    // ignore
  }
}

