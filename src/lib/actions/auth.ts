"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { DEMO_AUTH_COOKIE, FIREBASE_SESSION_COOKIE } from "@/lib/constants";
import { demoUsers } from "@/lib/demo-data";
import { demoModeEnabled, env, firebaseAdminConfigured, firebaseClientConfigured, firebaseConfigured, firebaseSetupMessage } from "@/lib/env";
import { getAdminAuth } from "@/lib/firebase/admin";
import { encodeEasyFirebaseSession } from "@/lib/firebase/session";
import type { ActionState } from "@/lib/types";

const loginSchema = z.object({
  email: z.string().email("Geçerli bir e-posta girin."),
  password: z.string().optional(),
});

async function signInWithFirebase(email: string, password: string) {
  if (!firebaseClientConfigured) {
    throw new Error("Firebase client env değerleri eksik.");
  }

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${env.firebaseApiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
      cache: "no-store",
    },
  );

  const data = (await response.json()) as { idToken?: string; localId?: string; email?: string; error?: { message?: string } };

  if (!response.ok || !data.idToken || !data.localId) {
    throw new Error(data.error?.message ?? "Firebase giriş başarısız.");
  }

  return { idToken: data.idToken, uid: data.localId, email: data.email ?? email };
}

export async function loginAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Form doğrulanamadı." };
  }

  if (demoModeEnabled) {
    const user = demoUsers.find((item) => item.email === parsed.data.email);

    if (!user) return { error: "Demo kullanıcı bulunamadı. Listeden bir kullanıcı seçin." };

    const cookieStore = await cookies();
    cookieStore.set(DEMO_AUTH_COOKIE, user.id, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
    });

    redirect("/dashboard");
  }

  if (!firebaseConfigured) {
    return {
      error: firebaseSetupMessage,
    };
  }

  if (!parsed.data.password) return { error: "Firebase girişinde parola zorunludur." };

  try {
    const firebaseSession = await signInWithFirebase(parsed.data.email, parsed.data.password);
    const { idToken } = firebaseSession;
    const expiresIn = 1000 * 60 * 60 * 24 * 5;
    const cookieStore = await cookies();

    if (firebaseAdminConfigured) {
      const sessionCookie = await getAdminAuth().createSessionCookie(idToken, { expiresIn });
      cookieStore.set(FIREBASE_SESSION_COOKIE, sessionCookie, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: expiresIn / 1000,
        secure: process.env.NODE_ENV === "production",
      });
    } else {
      // Easy setup mode: no Service Account needed. Store the Firebase ID token
      // directly and read Firestore through REST with the user's permissions.
      cookieStore.set(FIREBASE_SESSION_COOKIE, encodeEasyFirebaseSession(firebaseSession), {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60,
        secure: process.env.NODE_ENV === "production",
      });
    }
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Giriş yapılamadı." };
  }

  redirect("/dashboard");
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(DEMO_AUTH_COOKIE);
  cookieStore.delete(FIREBASE_SESSION_COOKIE);
  redirect("/login");
}
