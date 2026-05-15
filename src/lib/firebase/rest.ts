import { env } from "@/lib/env";

type FirestoreValue =
  | { stringValue: string }
  | { integerValue: string }
  | { doubleValue: number }
  | { booleanValue: boolean }
  | { timestampValue: string }
  | { nullValue: null }
  | { arrayValue?: { values?: FirestoreValue[] } }
  | { mapValue?: { fields?: Record<string, FirestoreValue> } };

type FirestoreDocument = {
  name: string;
  fields?: Record<string, FirestoreValue>;
  createTime?: string;
  updateTime?: string;
};

function restBaseUrl() {
  return `https://firestore.googleapis.com/v1/projects/${env.firebaseProjectId}/databases/(default)/documents`;
}

export function fromFirestoreValue(value: FirestoreValue | undefined): unknown {
  if (!value) return null;
  if ("stringValue" in value) return value.stringValue;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return value.doubleValue;
  if ("booleanValue" in value) return value.booleanValue;
  if ("timestampValue" in value) return value.timestampValue;
  if ("nullValue" in value) return null;
  if ("arrayValue" in value) return (value.arrayValue?.values ?? []).map(fromFirestoreValue);
  if ("mapValue" in value) return fromFirestoreFields(value.mapValue?.fields ?? {});
  return null;
}

export function fromFirestoreFields(fields: Record<string, FirestoreValue>) {
  return Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, fromFirestoreValue(value)]));
}

export function mapFirestoreDocument(doc: FirestoreDocument) {
  const id = doc.name.split("/").pop() ?? "";
  return { id, ...fromFirestoreFields(doc.fields ?? {}) };
}

async function firestoreFetch(path: string, idToken: string) {
  const response = await fetch(`${restBaseUrl()}/${path}`, {
    headers: { Authorization: `Bearer ${idToken}` },
    cache: "no-store",
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null) as { error?: { message?: string } } | null;
    throw new Error(data?.error?.message ?? `Firestore isteği başarısız: ${response.status}`);
  }

  return response.json();
}

export async function getRestDocument(collection: string, id: string, idToken: string) {
  const data = await firestoreFetch(`${collection}/${id}`, idToken) as FirestoreDocument;
  return mapFirestoreDocument(data);
}

export async function getRestCollection(collection: string, idToken: string) {
  const data = await firestoreFetch(collection, idToken) as { documents?: FirestoreDocument[] };
  return (data.documents ?? []).map(mapFirestoreDocument);
}

export function toFirestoreValue(value: unknown): FirestoreValue {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === "string") {
    // ISO timestamps are still safe as strings for the current app model.
    return { stringValue: value };
  }
  if (typeof value === "number") {
    return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  }
  if (typeof value === "boolean") return { booleanValue: value };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(toFirestoreValue) } };
  if (typeof value === "object") return { mapValue: { fields: toFirestoreFields(value as Record<string, unknown>) } };
  return { stringValue: String(value) };
}

export function toFirestoreFields(record: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(record).map(([key, value]) => [key, toFirestoreValue(value)]));
}

export async function setRestDocument(
  collection: string,
  id: string,
  payload: Record<string, unknown>,
  idToken: string,
  options: { merge?: boolean } = {},
) {
  const updateMask = options.merge
    ? Object.keys(payload)
        .map((key) => `updateMask.fieldPaths=${encodeURIComponent(key)}`)
        .join("&")
    : "";
  const url = `${restBaseUrl()}/${collection}/${id}${updateMask ? `?${updateMask}` : ""}`;
  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${idToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fields: toFirestoreFields(payload) }),
    cache: "no-store",
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null) as { error?: { message?: string } } | null;
    throw new Error(data?.error?.message ?? `Firestore yazma isteği başarısız: ${response.status}`);
  }

  return response.json();
}

export async function deleteRestDocument(collection: string, id: string, idToken: string) {
  const response = await fetch(`${restBaseUrl()}/${collection}/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${idToken}` },
    cache: "no-store",
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null) as { error?: { message?: string } } | null;
    throw new Error(data?.error?.message ?? `Firestore silme isteği başarısız: ${response.status}`);
  }
}

export async function lookupFirebaseAccount(idToken: string) {
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${env.firebaseApiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
      cache: "no-store",
    },
  );

  const data = await response.json() as { users?: Array<{ localId: string; email?: string }>; error?: { message?: string } };
  if (!response.ok || !data.users?.[0]?.localId) {
    throw new Error(data.error?.message ?? "Firebase token doğrulanamadı.");
  }
  return data.users[0];
}
