import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { DEMO_AUTH_COOKIE, FIREBASE_SESSION_COOKIE } from "@/lib/constants";
import { demoUsers } from "@/lib/demo-data";
import { demoModeEnabled, firebaseAdminConfigured, firebaseConfigured } from "@/lib/env";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { getRestCollection, getRestDocument, lookupFirebaseAccount, setRestDocument } from "@/lib/firebase/rest";
import { decodeEasyFirebaseSession, getIdTokenFromCookieValue } from "@/lib/firebase/session";
import type { AppRole, AppUser } from "@/lib/types";

const VALID_ROLES: AppRole[] = [
  "admin",
  "sales",
  "developer",
  "video_editor",
  "videographer",
  "graphic_designer",
  "seo_specialist",
  "content",
];

export function normalizeRoleValue(value: unknown): AppRole[] {
  const normalize = (role: unknown): AppRole | null => {
    if (role === "video") return "video_editor";
    if (typeof role !== "string") return null;

    const cleaned = role.trim() as AppRole;
    return VALID_ROLES.includes(cleaned) ? cleaned : null;
  };

  const normalized = (Array.isArray(value) ? value : [value])
    .map(normalize)
    .filter(Boolean) as AppRole[];

  return Array.from(new Set(normalized));
}

export function normalizeUserRecord(record: Record<string, unknown>, fallbackId?: string): AppUser {
  return {
    id: String(fallbackId ?? record.uid ?? record.id ?? ""),
    name: String(record.name ?? ""),
    email: String(record.email ?? ""),
    role: normalizeRoleValue(record.roles ?? record.role),
    phone: typeof record.phone === "string" ? record.phone : null,
    monthly_target: Number(record.monthly_target ?? record.monthlyTarget ?? 0),
    target_product_type:
      typeof record.target_product_type === "string"
        ? (record.target_product_type as AppUser["target_product_type"])
        : null,
    commission_rate: Number(record.commission_rate ?? record.commissionRate ?? 0),
    active: Boolean(record.active ?? true),
    created_at: String(record.created_at ?? record.createdAt ?? new Date().toISOString()),
  };
}

export const getCurrentUser = cache(async () => {
  const cookieStore = await cookies();

  if (demoModeEnabled) {
    const demoUserId = cookieStore.get(DEMO_AUTH_COOKIE)?.value;
    if (!demoUserId) return null;
    return demoUsers.find((user) => user.id === demoUserId) ?? null;
  }

  if (!firebaseConfigured) return null;

  const authCookie = cookieStore.get(FIREBASE_SESSION_COOKIE)?.value;
  if (!authCookie) return null;

  try {
    // Full/live mode: Firebase Admin SDK session cookie.
    if (firebaseAdminConfigured && !authCookie.startsWith("idtoken:")) {
      const decoded = await getAdminAuth().verifySessionCookie(authCookie, true);
      const doc = await getAdminDb().collection("users").doc(decoded.uid).get();

      if (!doc.exists) return null;

      const user = normalizeUserRecord({ id: doc.id, ...doc.data() }, doc.id);
      if (!user.active) return null;

      return user;
    }

    // Easy setup mode: only Firebase Web config is needed. The cookie carries
    // uid/email/idToken so a Firestore rules/config problem cannot create a
    // login <-> dashboard redirect loop. We still try to read the real user
    // profile first; if it fails, we return a safe fallback user so the panel opens.
    const easySession = decodeEasyFirebaseSession(authCookie);
    const idToken = getIdTokenFromCookieValue(authCookie);
    if (!idToken) return null;

    const uid = easySession?.uid ?? (await lookupFirebaseAccount(idToken)).localId;
    const email = easySession?.email ?? "";

    try {
      const userDoc = await getRestDocument("users", uid, idToken);
      const user = normalizeUserRecord(userDoc, uid);
      if (["altay@demo.crm", "altay52gt@gmail.com"].includes(user.email.toLowerCase()) && !user.role.includes("admin")) {
        user.role = ["admin"];
      }
      if (!user.active) return null;
      return user;
    } catch {
      // Some team members were created before Firebase Auth was linked, so
      // their Firestore document id is an app-generated uuid instead of the
      // Firebase Auth uid. In easy-login mode, find the profile by e-mail,
      // then mirror it to users/{auth.uid}. After this first login, rules and
      // menus can resolve the real role from the canonical uid document.
      try {
        const docs = (await getRestCollection("users", idToken)) as Array<Record<string, unknown>>;
        const matched = docs.find((doc) => String(doc.email ?? "").toLowerCase() === email.toLowerCase());
        if (matched) {
          const roles = normalizeRoleValue(matched.roles ?? matched.role);
          const mirrored = {
            ...matched,
            id: uid,
            uid,
            email,
            roles: roles.length ? roles : ["sales"],
            role: roles.length ? roles : ["sales"],
            active: Boolean(matched.active ?? true),
            updated_at: new Date().toISOString(),
          };
          await setRestDocument("users", uid, mirrored, idToken, { merge: true }).catch(() => null);
          const user = normalizeUserRecord(mirrored, uid);
          if (["altay@demo.crm", "altay52gt@gmail.com"].includes(user.email.toLowerCase()) && !user.role.includes("admin")) {
            user.role = ["admin"];
          }
          if (!user.active) return null;
          return user;
        }
      } catch {
        // If profile lookup is blocked by rules, keep the safe fallback below.
      }

      return normalizeUserRecord(
        {
          id: uid,
          uid,
          name: email.includes("altay") ? "Altay Admin" : email || "Kullanıcı",
          email,
          roles: email === "altay@demo.crm" || email === "altay52gt@gmail.com" ? ["admin"] : ["sales"],
          active: true,
          monthlyTarget: 0,
        },
        uid,
      );
    }
  } catch {
    return null;
  }
});

export async function requireUser(): Promise<AppUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export function hasRole(user: AppUser, role: AppRole) {
  return user.role.includes(role);
}

export function hasAnyRole(user: AppUser, roles: AppRole[]) {
  return roles.some((role) => user.role.includes(role));
}

export async function requireAdmin(): Promise<AppUser> {
  const user = await requireUser();
  if (!hasRole(user, "admin")) redirect("/dashboard");
  return user;
}
