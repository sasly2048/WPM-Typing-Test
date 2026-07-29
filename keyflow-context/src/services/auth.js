import {
  GoogleAuthProvider,
  OAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { auth } from './firebase.js';

const googleProvider = new GoogleAuthProvider();

/** Apple Sign-In needs an Apple Developer Services ID configured in the
 * Firebase console before this provider will actually work — the button
 * that uses this is shown but reports "not configured" until then. */
const appleProvider = new OAuthProvider('apple.com');

/** @returns {import('firebase/auth').User|null} */
export const getCurrentUser = () => auth.currentUser;

/**
 * Subscribes to auth state changes.
 * @param {(user: import('firebase/auth').User|null) => void} callback
 * @returns {() => void} unsubscribe
 */
export const onAuthChange = (callback) => onAuthStateChanged(auth, callback);

export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);

export const signInWithApple = () => signInWithPopup(auth, appleProvider);

export const signInWithEmail = (email, password) =>
  signInWithEmailAndPassword(auth, email, password);

export const signUpWithEmail = (email, password) =>
  createUserWithEmailAndPassword(auth, email, password);

export const signOut = () => firebaseSignOut(auth);

/**
 * Maps a Firebase Auth error code to a short, user-facing message.
 * @param {{code?: string, message?: string}} error
 * @returns {string}
 */
export const describeAuthError = (error) => {
  const messages = {
    'auth/invalid-email': 'That email address looks invalid.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/user-not-found': 'No account found with that email.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/invalid-credential': 'Incorrect email or password.',
    'auth/email-already-in-use': 'An account already exists with that email.',
    'auth/weak-password': 'Password must be at least 6 characters.',
    'auth/popup-closed-by-user': 'Sign-in was cancelled.',
    'auth/operation-not-allowed': 'This sign-in method is not enabled yet.',
    'auth/configuration-not-found': 'This sign-in method is not configured yet.',
  };
  return messages[error?.code] || error?.message || 'Something went wrong. Please try again.';
};
