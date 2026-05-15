import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

import { assertFirebaseAdminConfigured, env } from "@/lib/env";

let app: App | null = null;

export function getFirebaseAdminApp() {
  assertFirebaseAdminConfigured();

  if (app) {
    return app;
  }

  app =
    getApps()[0] ??
    initializeApp({
      credential: cert({
        projectId: env.firebaseProjectId,
        clientEmail: env.firebaseClientEmail,
        privateKey: env.firebasePrivateKey,
      }),
    });

  return app;
}

export function getAdminAuth() {
  return getAuth(getFirebaseAdminApp());
}

export function getAdminDb() {
  return getFirestore(getFirebaseAdminApp());
}
