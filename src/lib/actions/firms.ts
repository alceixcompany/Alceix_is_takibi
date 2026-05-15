"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { hasRole, requireAdmin, requireUser } from "@/lib/auth";
import { demoModeEnabled } from "@/lib/env";
import { createActivity, deleteDocument, getFirmById, newId, setDocument, toNullable, updateFirm } from "@/lib/firebase/crm";
import type { ActionState, FirmStatus } from "@/lib/types";

const createFirmSchema = z.object({
  company_name: z.string().min(2, "Firma adı zorunludur."),
  sector: z.string().optional(),
  city: z.string().optional(),
  district: z.string().optional(),
  phone: z.string().optional(),
  instagram: z.string().optional(),
  website: z.string().optional(),
  has_website: z.string().optional(),
  source: z.string().optional(),
  assigned_to: z.string().optional(),
  status: z.string().optional(),
  note: z.string().optional(),
  next_follow_up_at: z.string().optional(),
});


const editFirmSchema = z.object({
  firm_id: z.string().min(1),
  company_name: z.string().min(2, "Firma adı zorunludur."),
  sector: z.string().optional(),
  city: z.string().optional(),
  district: z.string().optional(),
  phone: z.string().optional(),
  instagram: z.string().optional(),
  website: z.string().optional(),
  has_website: z.string().optional(),
  source: z.string().optional(),
  assigned_to: z.string().optional(),
  status: z.string().optional(),
  note: z.string().optional(),
  next_follow_up_at: z.string().optional(),
});

const deleteFirmSchema = z.object({
  firm_id: z.string().min(1),
});

const updateFirmSchema = z.object({
  firm_id: z.string().min(1),
  status: z.string().min(1),
  note: z.string().optional(),
  next_follow_up_at: z.string().optional(),
});

const quickStatusSchema = z.object({
  firm_id: z.string().min(1),
  status: z.enum([
    "yeni",
    "atanmis",
    "aranacak",
    "arandi",
    "ulasilamadi",
    "ilgilenmedi",
    "ilgilendi",
    "whatsapp_atildi",
    "teklif_verildi",
    "odeme_bekleniyor",
    "odeme_alindi",
    "uretime_aktarildi",
    "teslim_edildi",
    "kara_liste",
  ]),
  note: z.string().optional(),
  next_follow_up_at: z.string().optional(),
});

const noteSchema = z.object({
  firm_id: z.string().min(1),
  note: z.string().min(2, "Not alanı boş bırakılamaz."),
});

const assignmentSchema = z.object({
  firm_id: z.string().min(1),
  assigned_to: z.string().optional(),
});

const sharedCallQueueStatuses: FirmStatus[] = [
  "yeni",
  "atanmis",
  "aranacak",
  "whatsapp_atildi",
  "odeme_bekleniyor",
];

function invalidateFirmPaths(firmId?: string) {
  revalidatePath("/dashboard");
  revalidatePath("/firms");
  revalidatePath("/assigned");
  revalidatePath("/calls");
  revalidatePath("/production");
  revalidatePath("/commissions");
  revalidatePath("/reports");
  revalidatePath("/team");
  if (firmId) revalidatePath(`/firms/${firmId}`);
}

function getActivityTypeForStatus(status: FirmStatus) {
  if (["arandi", "ulasilamadi", "ilgilenmedi", "ilgilendi"].includes(status)) return "call";
  if (status === "whatsapp_atildi") return "whatsapp";
  if (status === "odeme_alindi") return "payment";
  if (status === "odeme_bekleniyor" || status === "teklif_verildi") return "sale";
  return "status_change";
}

function shouldTouchLastCalledAt(status: FirmStatus) {
  return ["arandi", "ulasilamadi", "ilgilenmedi", "ilgilendi"].includes(status);
}

export async function createFirmAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireAdmin();
  if (demoModeEnabled) return { error: "Demo modunda veri yazma kapalıdır." };

  const parsed = createFirmSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Firma formu doğrulanamadı." };

  const id = newId("firms");
  const now = new Date().toISOString();
  const status = (parsed.data.status || (parsed.data.assigned_to ? "atanmis" : "yeni")) as FirmStatus;
  await setDocument("firms", id, {
    id,
    company_name: parsed.data.company_name.trim(),
    sector: toNullable(parsed.data.sector),
    city: toNullable(parsed.data.city),
    district: toNullable(parsed.data.district),
    phone: toNullable(parsed.data.phone),
    instagram: toNullable(parsed.data.instagram),
    website: toNullable(parsed.data.website),
    has_website: parsed.data.has_website === "on",
    source: toNullable(parsed.data.source),
    assigned_to: toNullable(parsed.data.assigned_to),
    status,
    note: toNullable(parsed.data.note),
    next_follow_up_at: toNullable(parsed.data.next_follow_up_at),
    last_called_at: null,
    created_at: now,
    updated_at: now,
  });

  if (parsed.data.assigned_to) {
    await createActivity({ firm_id: id, user_id: admin.id, type: "assignment", note: "Firma satışçıya atandı." });
  }

  invalidateFirmPaths(id);
  return { success: "Firma başarıyla eklendi." };
}


export async function editFirmAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireAdmin();
  if (demoModeEnabled) return { error: "Demo modunda firma düzenleme kapalıdır." };

  const parsed = editFirmSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Firma düzenleme formu doğrulanamadı." };

  const firm = await getFirmById(parsed.data.firm_id);
  if (!firm) return { error: "Firma bulunamadı." };

  await updateFirm(parsed.data.firm_id, {
    company_name: parsed.data.company_name.trim(),
    sector: toNullable(parsed.data.sector),
    city: toNullable(parsed.data.city),
    district: toNullable(parsed.data.district),
    phone: toNullable(parsed.data.phone),
    instagram: toNullable(parsed.data.instagram),
    website: toNullable(parsed.data.website),
    has_website: parsed.data.has_website === "on",
    source: toNullable(parsed.data.source),
    assigned_to: toNullable(parsed.data.assigned_to),
    status: (parsed.data.status || firm.status) as FirmStatus,
    note: toNullable(parsed.data.note),
    next_follow_up_at: toNullable(parsed.data.next_follow_up_at),
  });

  await createActivity({
    firm_id: parsed.data.firm_id,
    user_id: admin.id,
    type: "status_change",
    note: "Firma bilgileri admin tarafından düzenlendi.",
  });

  invalidateFirmPaths(parsed.data.firm_id);
  return { success: "Firma bilgileri güncellendi." };
}

export async function deleteFirmAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireAdmin();
  if (demoModeEnabled) return { error: "Demo modunda firma silme kapalıdır." };

  const parsed = deleteFirmSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: "Firma silme isteği doğrulanamadı." };

  const firm = await getFirmById(parsed.data.firm_id);
  if (!firm) return { error: "Firma bulunamadı." };

  await createActivity({
    firm_id: parsed.data.firm_id,
    user_id: admin.id,
    type: "note",
    note: `${firm.company_name} firma kaydı silindi.`,
  });
  await deleteDocument("firms", parsed.data.firm_id);

  invalidateFirmPaths(parsed.data.firm_id);
  redirect("/firms");
}

export async function updateFirmStatusAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const currentUser = await requireUser();
  if (demoModeEnabled) return { error: "Demo modunda firma güncelleme kapalıdır." };

  const parsed = updateFirmSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Durum formu doğrulanamadı." };

  const firm = await getFirmById(parsed.data.firm_id);
  if (!firm) return { error: "Firma bulunamadı." };

  const canManage = hasRole(currentUser, "admin") || firm.assigned_to === currentUser.id;
  if (!canManage) return { error: "Bu firmayı güncelleme yetkiniz yok." };

  await updateFirm(parsed.data.firm_id, {
    status: parsed.data.status as FirmStatus,
    note: toNullable(parsed.data.note),
    next_follow_up_at: toNullable(parsed.data.next_follow_up_at),
    last_called_at: new Date().toISOString(),
  });

  await createActivity({
    firm_id: parsed.data.firm_id,
    user_id: currentUser.id,
    type: "status_change",
    note: parsed.data.note || `Durum ${firm.status} -> ${parsed.data.status} olarak güncellendi.`,
  });

  invalidateFirmPaths(parsed.data.firm_id);
  return { success: "Firma durumu güncellendi." };
}

export async function quickUpdateFirmStatusAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const currentUser = await requireUser();
  if (demoModeEnabled) return { error: "Demo modunda hızlı durum güncelleme kapalıdır." };

  const parsed = quickStatusSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Hızlı işlem doğrulanamadı." };

  const firm = await getFirmById(parsed.data.firm_id);
  if (!firm) return { error: "Firma bulunamadı." };

  const isAdmin = hasRole(currentUser, "admin");
  const isSales = hasRole(currentUser, "sales");
  const canManage =
    isAdmin ||
    firm.assigned_to === currentUser.id ||
    (isSales && (!firm.assigned_to || sharedCallQueueStatuses.includes(firm.status)));

  if (!canManage) return { error: "Bu firmada hızlı işlem yapma yetkiniz yok." };

  const nextStatus = parsed.data.status as FirmStatus;
  const payload: Record<string, unknown> = { status: nextStatus };
  const nextFollowUpAt = toNullable(parsed.data.next_follow_up_at);

  if (parsed.data.note !== undefined) payload.note = toNullable(parsed.data.note);
  if (nextFollowUpAt) payload.next_follow_up_at = nextFollowUpAt;
  if (!isAdmin && isSales) payload.assigned_to = currentUser.id;
  if (shouldTouchLastCalledAt(nextStatus)) payload.last_called_at = new Date().toISOString();

  await updateFirm(parsed.data.firm_id, payload);
  await createActivity({
    firm_id: parsed.data.firm_id,
    user_id: currentUser.id,
    type: getActivityTypeForStatus(nextStatus),
    note:
      toNullable(parsed.data.note) ??
      `${firm.company_name} durumu ${firm.status} -> ${nextStatus} olarak güncellendi.${!isAdmin && isSales ? " Arayan satışçıya otomatik atandı." : ""}`,
  });

  invalidateFirmPaths(parsed.data.firm_id);
  return { success: "Hızlı işlem kaydedildi." };
}

export async function addFirmNoteAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const currentUser = await requireUser();
  if (demoModeEnabled) return { error: "Demo modunda not ekleme kapalıdır." };

  const parsed = noteSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Not doğrulanamadı." };

  const firm = await getFirmById(parsed.data.firm_id);
  if (!firm) return { error: "Firma bulunamadı." };

  const canManage = hasRole(currentUser, "admin") || firm.assigned_to === currentUser.id;
  if (!canManage) return { error: "Bu firmaya not ekleme yetkiniz yok." };

  await updateFirm(parsed.data.firm_id, { note: parsed.data.note.trim() });
  await createActivity({
    firm_id: parsed.data.firm_id,
    user_id: currentUser.id,
    type: "note",
    note: parsed.data.note.trim(),
  });

  invalidateFirmPaths(parsed.data.firm_id);
  return { success: "Not kaydedildi." };
}

export async function assignFirmAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireAdmin();
  if (demoModeEnabled) return { error: "Demo modunda atama kapalıdır." };

  const parsed = assignmentSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: "Atama formu doğrulanamadı." };

  const assignedTo = toNullable(parsed.data.assigned_to);
  await updateFirm(parsed.data.firm_id, {
    assigned_to: assignedTo,
    status: assignedTo ? "atanmis" : "yeni",
  });

  await createActivity({
    firm_id: parsed.data.firm_id,
    user_id: admin.id,
    type: "assignment",
    note: assignedTo ? "Firma satışçıya atandı." : "Firma ataması kaldırıldı.",
  });

  invalidateFirmPaths(parsed.data.firm_id);
  return { success: "Firma ataması güncellendi." };
}

const importRowsSchema = z.object({
  rows: z.string().min(2, "CSV satırları bulunamadı."),
});

export async function updateFirmAssignmentAction(
  prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return assignFirmAction(prevState, formData);
}

export async function importFirmsAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireAdmin();
  if (demoModeEnabled) return { error: "Demo modunda CSV içe aktarma kapalıdır." };

  const parsed = importRowsSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "CSV doğrulanamadı." };

  let rows: Array<Record<string, unknown>> = [];
  try {
    rows = JSON.parse(parsed.data.rows) as Array<Record<string, unknown>>;
  } catch {
    return { error: "CSV JSON verisi okunamadı." };
  }

  const validRows = rows.filter((row) => typeof row.company_name === "string" && row.company_name.trim().length > 1);
  if (!validRows.length) return { error: "İçe aktarılacak geçerli firma yok." };

  const now = new Date().toISOString();

  for (const row of validRows) {
    const id = newId("firms");
    const assignedTo = typeof row.assigned_to === "string" ? toNullable(row.assigned_to) : null;
    await setDocument("firms", id, {
      id,
      company_name: String(row.company_name).trim(),
      sector: typeof row.sector === "string" ? toNullable(row.sector) : null,
      city: typeof row.city === "string" ? toNullable(row.city) : null,
      district: typeof row.district === "string" ? toNullable(row.district) : null,
      phone: typeof row.phone === "string" ? toNullable(row.phone) : null,
      instagram: typeof row.instagram === "string" ? toNullable(row.instagram) : null,
      website: typeof row.website === "string" ? toNullable(row.website) : null,
      has_website: Boolean(row.has_website),
      source: typeof row.source === "string" ? toNullable(row.source) : "csv-import",
      assigned_to: assignedTo,
      status: typeof row.status === "string" && row.status ? row.status : assignedTo ? "atanmis" : "yeni",
      note: typeof row.note === "string" ? toNullable(row.note) : null,
      next_follow_up_at: typeof row.next_follow_up_at === "string" ? toNullable(row.next_follow_up_at) : null,
      last_called_at: null,
      created_at: now,
      updated_at: now,
    });
  }
  await createActivity({
    firm_id: validRows[0]?.company_name ? "csv-import" : "system",
    user_id: admin.id,
    type: "note",
    note: `${validRows.length} firma CSV ile içe aktarıldı.`,
  });

  invalidateFirmPaths();
  return { success: `${validRows.length} firma içe aktarıldı.` };
}
