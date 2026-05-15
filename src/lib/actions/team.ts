"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { DEFAULT_DEMO_PASSWORD } from "@/lib/constants";
import { requireAdmin } from "@/lib/auth";
import { demoModeEnabled, env, firebaseAdminConfigured } from "@/lib/env";
import { getAdminAuth } from "@/lib/firebase/admin";
import { setUser, toNullable } from "@/lib/firebase/crm";
import type { ActionState, AppRole, AppUser, ProductType } from "@/lib/types";

const teamMemberSchema = z.object({
  name: z.string().min(2, "Ad soyad zorunludur."),
  email: z.string().email("Geçerli e-posta girin."),
  phone: z.string().optional(),
  monthly_target: z.string().optional(),
  target_product_type: z.string().optional(),
  commission_rate: z.string().optional(),
  active: z.string().optional(),
  password: z.string().optional(),
});

const updateTeamMemberSchema = teamMemberSchema.extend({ user_id: z.string().min(1, "Çalışan bulunamadı.") });
const rolesSchema = z.object({ user_id: z.string().min(1) });
const statusSchema = z.object({ user_id: z.string().min(1), active: z.string().optional() });
const emailSchema = z.object({ user_id: z.string().min(1), email: z.string().email("Geçerli e-posta girin.") });

function parseNumber(value: string | undefined, fallback = 0) {
  const parsed = Number(value ?? fallback);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function validateRoles(formData: FormData) {
  return formData.getAll("roles").filter(Boolean) as AppRole[];
}


async function createFirebaseAuthUserWithRest(input: {
  email: string;
  password: string;
  displayName: string;
  disabled: boolean;
}) {
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${env.firebaseApiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: input.email,
        password: input.password,
        displayName: input.displayName,
        disabled: input.disabled,
        returnSecureToken: true,
      }),
      cache: "no-store",
    },
  );

  const data = (await response.json()) as {
    localId?: string;
    error?: { message?: string };
  };

  if (!response.ok || !data.localId) {
    const message = data.error?.message ?? "Firebase Auth kullanıcısı oluşturulamadı.";
    if (message === "EMAIL_EXISTS") {
      throw new Error("Bu e-posta Firebase Authentication içinde zaten var. Aynı kişinin Firestore kaydını düzenleyin veya farklı e-posta kullanın.");
    }
    throw new Error(message);
  }

  return { uid: data.localId };
}

function invalidateTeamPaths(userId?: string) {
  revalidatePath("/team");
  revalidatePath("/dashboard");
  revalidatePath("/reports");
  revalidatePath("/commissions");
  if (userId) revalidatePath(`/team/${userId}`);
}

export async function createTeamMemberAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  if (demoModeEnabled) return { error: "Demo modunda çalışan oluşturma kapalıdır." };

  const parsed = teamMemberSchema.safeParse(Object.fromEntries(formData.entries()));
  const roles = validateRoles(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Çalışan formu doğrulanamadı." };
  if (roles.length === 0) return { error: "En az bir rol seçilmelidir." };

  try {
    let userId: string = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    let authCreated = false;

    const email = parsed.data.email.trim();
    const password = toNullable(parsed.data.password) ?? DEFAULT_DEMO_PASSWORD;
    const displayName = parsed.data.name.trim();

    if (firebaseAdminConfigured) {
      const authUser = await getAdminAuth().createUser({
        email,
        password,
        displayName,
        emailVerified: true,
        disabled: parsed.data.active !== "on",
      });
      userId = authUser.uid;
      authCreated = true;
    } else {
      const authUser = await createFirebaseAuthUserWithRest({
        email,
        password,
        displayName,
        disabled: parsed.data.active !== "on",
      });
      userId = authUser.uid;
      authCreated = true;
    }

    await setUser(userId, {
      id: userId,
      uid: userId,
      name: displayName,
      email,
      role: roles,
      roles,
      phone: toNullable(parsed.data.phone),
      monthly_target: parseNumber(parsed.data.monthly_target),
      monthlyTarget: parseNumber(parsed.data.monthly_target),
      target_product_type: toNullable(parsed.data.target_product_type) as ProductType | null,
      commission_rate: parseNumber(parsed.data.commission_rate),
      active: parsed.data.active === "on",
      created_at: new Date().toISOString(),
    } as Partial<AppUser> & Record<string, unknown>);

    invalidateTeamPaths(userId);
    return {
      success: authCreated
        ? "Çalışan, seçilen rolleriyle giriş hesabı oluşturularak kaydedildi."
        : "Çalışan profili oluşturuldu.",
    };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Çalışan oluşturulamadı." };
  }
}

export async function updateTeamMemberAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  if (demoModeEnabled) return { error: "Demo modunda çalışan güncelleme kapalıdır." };

  const parsed = updateTeamMemberSchema.safeParse(Object.fromEntries(formData.entries()));
  const roles = validateRoles(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Çalışan formu doğrulanamadı." };
  if (roles.length === 0) return { error: "En az bir rol seçilmelidir." };

  if (firebaseAdminConfigured) {
    try {
      await getAdminAuth().updateUser(parsed.data.user_id, {
        email: parsed.data.email.trim(),
        displayName: parsed.data.name.trim(),
        disabled: parsed.data.active !== "on",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (!message.toLowerCase().includes("no user record")) return { error: message };
    }
  }

  await setUser(parsed.data.user_id, {
    id: parsed.data.user_id,
    name: parsed.data.name.trim(),
    email: parsed.data.email.trim(),
    phone: toNullable(parsed.data.phone),
    role: roles,
    roles,
    monthly_target: parseNumber(parsed.data.monthly_target),
    monthlyTarget: parseNumber(parsed.data.monthly_target),
    target_product_type: toNullable(parsed.data.target_product_type) as ProductType | null,
    commission_rate: parseNumber(parsed.data.commission_rate),
    active: parsed.data.active === "on",
  });

  invalidateTeamPaths(parsed.data.user_id);
  return { success: "Çalışan profili güncellendi." };
}

export async function updateTeamMemberRolesAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  if (demoModeEnabled) return { error: "Demo modunda rol güncelleme kapalıdır." };

  const parsed = rolesSchema.safeParse(Object.fromEntries(formData.entries()));
  const roles = validateRoles(formData);
  if (!parsed.success || roles.length === 0) return { error: "En az bir rol seçilmelidir." };

  await setUser(parsed.data.user_id, { role: roles, roles });
  invalidateTeamPaths(parsed.data.user_id);
  return { success: "Roller güncellendi." };
}

export async function updateTeamMemberStatusAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  if (demoModeEnabled) return { error: "Demo modunda durum güncelleme kapalıdır." };

  const parsed = statusSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: "Çalışan durumu doğrulanamadı." };

  const active = parsed.data.active === "on";
  if (firebaseAdminConfigured) {
    try {
      await getAdminAuth().updateUser(parsed.data.user_id, { disabled: !active });
    } catch {
      // Auth kaydi yoksa Firestore profilini yine guncelle.
    }
  }
  await setUser(parsed.data.user_id, { active });

  invalidateTeamPaths(parsed.data.user_id);
  return { success: "Çalışan durumu güncellendi." };
}

export async function updateTeamMemberEmailAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  if (demoModeEnabled) return { error: "Demo modunda e-posta güncelleme kapalıdır." };

  const parsed = emailSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "E-posta doğrulanamadı." };

  let authUpdated = false;
  if (firebaseAdminConfigured) {
    try {
      await getAdminAuth().updateUser(parsed.data.user_id, { email: parsed.data.email.trim() });
      authUpdated = true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (!message.toLowerCase().includes("no user record")) return { error: message };
    }
  }

  await setUser(parsed.data.user_id, { email: parsed.data.email.trim() });
  invalidateTeamPaths(parsed.data.user_id);
  return {
    success: authUpdated
      ? "E-posta güncellendi."
      : "Profil e-postası güncellendi. Firebase Auth e-postası için Service Account ekle veya Authentication ekranından manuel güncelle.",
  };
}
