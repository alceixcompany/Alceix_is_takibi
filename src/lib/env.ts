export const env = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  firebaseApiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "AIzaSyALeKUtBXAJHRQrlCgCDhbsh-OSiI3itEY",
  firebaseAuthDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "ekiplist.firebaseapp.com",
  firebaseProjectId:
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? process.env.FIREBASE_PROJECT_ID ?? "ekiplist",
  firebaseStorageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "ekiplist.firebasestorage.app",
  firebaseMessagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "45408157762",
  firebaseAppId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "1:45408157762:web:1cf895d4852fcc3706eddb",
  firebaseClientEmail: process.env.FIREBASE_CLIENT_EMAIL ?? "",
  firebasePrivateKey: (process.env.FIREBASE_PRIVATE_KEY ?? "").replace(/\\n/g, "\n"),
  enableDemoMode: process.env.NEXT_PUBLIC_ENABLE_DEMO_MODE === "true",
};

export const firebaseClientConfigured = Boolean(
  env.firebaseApiKey && env.firebaseAuthDomain && env.firebaseProjectId && env.firebaseAppId,
);

export const firebaseAdminConfigured = Boolean(
  env.firebaseProjectId && env.firebaseClientEmail && env.firebasePrivateKey,
);

// Normal login only needs the Firebase Web config. Admin SDK is optional and is used for
// server-side admin tasks such as creating team members, changing auth emails, and seed.
export const firebaseConfigured = firebaseClientConfigured;
export const demoModeEnabled = env.enableDemoMode && !firebaseClientConfigured;

export const firebaseSetupMessage = firebaseClientConfigured
  ? firebaseAdminConfigured
    ? "Firebase tam kurulu."
    : "Firebase web config hazır. Giriş yapabilirsin. Ekip oluşturma/mail değiştirme için Service Account sonra eklenebilir."
  : "Firebase web config eksik.";

export function assertFirebaseConfigured() {
  if (!firebaseClientConfigured) {
    throw new Error(firebaseSetupMessage);
  }
}

export function assertFirebaseAdminConfigured() {
  if (!firebaseAdminConfigured) {
    throw new Error("Bu işlem için Firebase Admin SDK Service Account gerekiyor. Giriş için gerekli değil; ekip oluşturma, mail değiştirme ve seed için gerekir.");
  }
}
