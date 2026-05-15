"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { hasRole, requireUser } from "@/lib/auth";
import { demoModeEnabled } from "@/lib/env";
import { createActivity, newId, setDocument } from "@/lib/firebase/crm";
import type { ActionState, MessageStatus } from "@/lib/types";

const createMessageSchema = z.object({
  subject: z.string().min(2, "Konu zorunludur."),
  message: z.string().min(3, "Mesaj alanı boş bırakılamaz."),
});

const replyMessageSchema = z.object({
  message_id: z.string().min(1),
  reply: z.string().optional(),
  status: z.enum(["open", "answered", "closed"]),
});

function invalidateMessagePaths() {
  revalidatePath("/messages");
  revalidatePath("/dashboard");
}

export async function createMessageAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const currentUser = await requireUser();
  if (demoModeEnabled) return { error: "Demo modunda mesaj gönderme kapalıdır." };

  const parsed = createMessageSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Mesaj doğrulanamadı." };

  const now = new Date().toISOString();
  const id = newId("messages");
  await setDocument("messages", id, {
    id,
    user_id: currentUser.id,
    user_name: currentUser.name,
    user_email: currentUser.email,
    subject: parsed.data.subject.trim(),
    message: parsed.data.message.trim(),
    reply: null,
    status: "open" satisfies MessageStatus,
    created_at: now,
    updated_at: now,
  });

  await createActivity({
    firm_id: "system",
    user_id: currentUser.id,
    type: "message",
    note: `Admin mesajı gönderildi: ${parsed.data.subject.trim()}`,
  }).catch(() => null);

  invalidateMessagePaths();
  return { success: "Mesaj admine gönderildi." };
}

export async function replyMessageAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const currentUser = await requireUser();
  if (!hasRole(currentUser, "admin")) return { error: "Mesaj yanıtlamak için admin yetkisi gerekir." };
  if (demoModeEnabled) return { error: "Demo modunda mesaj yanıtlama kapalıdır." };

  const parsed = replyMessageSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Mesaj güncellenemedi." };

  await setDocument("messages", parsed.data.message_id, {
    reply: parsed.data.reply?.trim() || null,
    status: parsed.data.status,
    updated_at: new Date().toISOString(),
  }, { merge: true });

  invalidateMessagePaths();
  return { success: "Mesaj güncellendi." };
}
