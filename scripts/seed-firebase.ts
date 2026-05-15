import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

import { DEFAULT_DEMO_PASSWORD } from "../src/lib/constants";
import { demoActivities, demoFirms, demoProductionTasks, demoSales, demoUsers } from "../src/lib/demo-data";

const projectId = process.env.FIREBASE_PROJECT_ID ?? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = (process.env.FIREBASE_PRIVATE_KEY ?? "").replace(/\\n/g, "\n");

if (!projectId || !clientEmail || !privateKey) {
  throw new Error("FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL ve FIREBASE_PRIVATE_KEY env degerleri zorunludur.");
}

const app =
  getApps()[0] ??
  initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });

const auth = getAuth(app);
const db = getFirestore(app);

async function upsertAuthUser(user: (typeof demoUsers)[number]) {
  try {
    await auth.updateUser(user.id, {
      email: user.email,
      displayName: user.name,
      password: process.env.DEMO_LOGIN_PASSWORD ?? DEFAULT_DEMO_PASSWORD,
      emailVerified: true,
      disabled: !user.active,
    });
  } catch {
    await auth.createUser({
      uid: user.id,
      email: user.email,
      displayName: user.name,
      password: process.env.DEMO_LOGIN_PASSWORD ?? DEFAULT_DEMO_PASSWORD,
      emailVerified: true,
      disabled: !user.active,
    });
  }
}

async function setCollection<T extends { id: string }>(name: string, rows: T[]) {
  const batch = db.batch();
  rows.forEach((row) => batch.set(db.collection(name).doc(row.id), row, { merge: true }));
  await batch.commit();
}

async function main() {
  for (const user of demoUsers) {
    await upsertAuthUser(user);
  }

  await setCollection("users", demoUsers);
  await setCollection("firms", demoFirms);
  await setCollection("activities", demoActivities);
  await setCollection("sales", demoSales);
  await setCollection("production_tasks", demoProductionTasks);

  console.log(`Seed tamamlandi. Varsayilan sifre: ${process.env.DEMO_LOGIN_PASSWORD ?? DEFAULT_DEMO_PASSWORD}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
