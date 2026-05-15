import { cookies } from "next/headers";
import { FieldValue } from "firebase-admin/firestore";

import { FIREBASE_SESSION_COOKIE } from "@/lib/constants";
import { firebaseAdminConfigured } from "@/lib/env";
import { getAdminDb } from "@/lib/firebase/admin";
import { deleteRestDocument, getRestCollection, getRestDocument, setRestDocument } from "@/lib/firebase/rest";
import { getIdTokenFromCookieValue } from "@/lib/firebase/session";
import { clearCrmDatasetCache, mapActivity, mapFirm, mapSale, mapTask, mapUser } from "@/lib/repository";
import type { Activity, AppUser, Firm, ProductionTask, Sale } from "@/lib/types";

export function toNullable(value?: string | null) {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

async function getRestTokenFromCookie() {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get(FIREBASE_SESSION_COOKIE)?.value;
  const token = getIdTokenFromCookieValue(authCookie);
  if (!token) throw new Error("Oturum bulunamadı. Lütfen tekrar giriş yapın.");
  return token;
}

async function getDocument<T>(collection: string, id: string, mapper: (record: Record<string, unknown>, id: string) => T) {
  if (firebaseAdminConfigured) {
    const doc = await getAdminDb().collection(collection).doc(id).get();
    return doc.exists ? mapper(doc.data() ?? {}, doc.id) : null;
  }

  try {
    const token = await getRestTokenFromCookie();
    const doc = await getRestDocument(collection, id, token);
    return mapper(doc, String(doc.id ?? id));
  } catch {
    return null;
  }
}

async function getCollection<T>(collection: string, mapper: (record: Record<string, unknown>, id: string) => T) {
  if (firebaseAdminConfigured) {
    const snapshot = await getAdminDb().collection(collection).get();
    return snapshot.docs.map((doc) => mapper(doc.data(), doc.id));
  }

  const token = await getRestTokenFromCookie();
  const docs = await getRestCollection(collection, token);
  return docs.map((doc) => mapper(doc, String(doc.id ?? "")));
}

export function newId(_collection: string) {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export async function setDocument(collection: string, id: string, payload: Record<string, unknown>, options: { merge?: boolean } = {}) {
  if (firebaseAdminConfigured) {
    await getAdminDb().collection(collection).doc(id).set(payload, options);
    clearCrmDatasetCache();
    return;
  }

  const token = await getRestTokenFromCookie();
  await setRestDocument(collection, id, payload, token, options);
  clearCrmDatasetCache();
}

export async function deleteDocument(collection: string, id: string) {
  if (firebaseAdminConfigured) {
    await getAdminDb().collection(collection).doc(id).delete();
    clearCrmDatasetCache();
    return;
  }

  const token = await getRestTokenFromCookie();
  await deleteRestDocument(collection, id, token);
  clearCrmDatasetCache();
}

export async function getUserById(id: string) {
  return getDocument("users", id, mapUser);
}

export async function getFirmById(id: string) {
  return getDocument("firms", id, mapFirm);
}

export async function getTaskById(id: string) {
  return getDocument("production_tasks", id, mapTask);
}

export async function getLatestSaleForFirm(firmId: string) {
  const sales = (await getCollection("sales", mapSale))
    .filter((sale) => sale.firm_id === firmId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  return sales[0] ?? null;
}

export async function getMonthlyPaidSalesForUser(userId: string) {
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  return (await getCollection("sales", mapSale))
    .filter((sale) => sale.user_id === userId && sale.payment_status === "paid")
    .filter((sale) => sale.created_at >= monthStart.toISOString());
}

export async function createActivity(input: Omit<Activity, "id" | "created_at"> & { created_at?: string }) {
  const id = newId("activities");
  const createdAt = input.created_at ?? new Date().toISOString();
  await setDocument("activities", id, { id, ...input, created_at: createdAt });
  return id;
}

export async function setFirm(id: string, payload: Partial<Firm>) {
  await setDocument("firms", id, payload as Record<string, unknown>, { merge: true });
}

export async function updateFirm(id: string, payload: Record<string, unknown>) {
  await setDocument(
    "firms",
    id,
    {
      ...payload,
      updated_at: new Date().toISOString(),
    },
    { merge: true },
  );
}

export async function updateTask(id: string, payload: Record<string, unknown>) {
  await setDocument(
    "production_tasks",
    id,
    {
      ...payload,
      updated_at: new Date().toISOString(),
    },
    { merge: true },
  );
}

export async function setUser(id: string, payload: Partial<AppUser> & Record<string, unknown>) {
  await setDocument("users", id, payload as Record<string, unknown>, { merge: true });
}

export async function serverTimestampField() {
  return FieldValue.serverTimestamp();
}

export type { Sale, ProductionTask };
