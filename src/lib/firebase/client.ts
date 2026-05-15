import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

import { env } from "@/lib/env";

const firebaseConfig = {
  apiKey: env.firebaseApiKey,
  authDomain: env.firebaseAuthDomain,
  projectId: env.firebaseProjectId,
  storageBucket: env.firebaseStorageBucket,
  messagingSenderId: env.firebaseMessagingSenderId,
  appId: env.firebaseAppId,
};

export function getFirebaseClientApp(): FirebaseApp {
  return getApps()[0] ?? initializeApp(firebaseConfig);
}

export const firebaseAuth = getAuth(getFirebaseClientApp());
export const firebaseDb = getFirestore(getFirebaseClientApp());
