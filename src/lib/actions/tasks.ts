"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { hasRole, requireUser } from "@/lib/auth";
import { demoModeEnabled } from "@/lib/env";
import { createActivity, getTaskById, newId, setDocument, toNullable, updateFirm, updateTask } from "@/lib/firebase/crm";
import type {
  ActionState,
  ProductType,
  ProductionTaskPriority,
  ProductionTaskStatus,
} from "@/lib/types";

const taskSchema = z.object({
  title: z.string().min(2, "Görev başlığı zorunludur."),
  description: z.string().optional(),
  firm_id: z.string().min(1, "Müşteri seçimi zorunludur."),
  service_type: z.string().min(1, "Hizmet tipi zorunludur."),
  assigned_to: z.string().optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]),
  status: z.enum(["todo", "in_progress", "waiting_client", "revision", "ready_to_deliver", "done", "cancelled"]),
  due_date: z.string().optional(),
  note: z.string().optional(),
});

const updateTaskSchema = taskSchema.partial().extend({ task_id: z.string().min(1) });
const noteSchema = z.object({ task_id: z.string().min(1), note: z.string().min(2, "Not alanı boş bırakılamaz.") });

function invalidateTaskPaths(taskId?: string, firmId?: string) {
  revalidatePath("/dashboard");
  revalidatePath("/production");
  revalidatePath("/tasks");
  revalidatePath("/team");
  revalidatePath("/reports");
  revalidatePath("/commissions");
  revalidatePath("/firms");
  if (taskId) revalidatePath(`/tasks/${taskId}`);
  if (firmId) revalidatePath(`/firms/${firmId}`);
}

export async function createTaskAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const currentUser = await requireUser();
  if (!hasRole(currentUser, "admin")) return { error: "Görev oluşturma yetkisi sadece adminde." };
  if (demoModeEnabled) return { error: "Demo modunda görev oluşturma kapalıdır." };

  const parsed = taskSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Görev formu doğrulanamadı." };

  const now = new Date().toISOString();
  const id = newId("production_tasks");
  const status = parsed.data.status as ProductionTaskStatus;
  await setDocument("production_tasks", id, {
    id,
    title: parsed.data.title.trim(),
    description: toNullable(parsed.data.description),
    firm_id: parsed.data.firm_id,
    service_type: parsed.data.service_type as ProductType,
    assigned_to: toNullable(parsed.data.assigned_to),
    created_by: currentUser.id,
    priority: parsed.data.priority as ProductionTaskPriority,
    status,
    due_date: toNullable(parsed.data.due_date),
    started_at: status === "in_progress" ? now : null,
    completed_at: status === "done" ? now : null,
    note: toNullable(parsed.data.note),
    created_at: now,
    updated_at: now,
  });

  await createActivity({
    firm_id: parsed.data.firm_id,
    user_id: currentUser.id,
    type: "note",
    note: `Üretim görevi oluşturuldu: ${parsed.data.title.trim()}`,
  });

  invalidateTaskPaths(id, parsed.data.firm_id);
  return { success: "Görev oluşturuldu." };
}


export async function claimProductionTaskAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const currentUser = await requireUser();
  if (demoModeEnabled) return { error: "Demo modunda görev alma kapalıdır." };

  const parsed = z.object({ task_id: z.string().min(1) }).safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: "Görev bulunamadı." };

  const task = await getTaskById(parsed.data.task_id);
  if (!task) return { error: "Görev bulunamadı." };
  if (task.assigned_to && task.assigned_to !== currentUser.id) return { error: "Bu görev başka bir çalışana atanmış." };

  const canClaim = hasRole(currentUser, "admin") || currentUser.role.some((role) => ["developer", "video_editor", "videographer", "graphic_designer", "seo_specialist", "content"].includes(role));
  if (!canClaim) return { error: "Bu görevi alma yetkiniz yok." };

  const now = new Date().toISOString();
  await updateTask(task.id, {
    assigned_to: currentUser.id,
    status: "in_progress",
    started_at: task.started_at ?? now,
    note: task.note ?? "Havuzdan alındı, üretime başlandı.",
  });

  await createActivity({
    firm_id: task.firm_id,
    user_id: currentUser.id,
    type: "assignment",
    note: `${currentUser.name} üretim havuzundan görevi aldı ve projeye başladı.`,
  });

  await updateFirm(task.firm_id, { status: "uretime_aktarildi" });

  invalidateTaskPaths(task.id, task.firm_id);
  return { success: "Görev üzerine alındı, proje başladı." };
}

export async function updateTaskAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const currentUser = await requireUser();
  if (demoModeEnabled) return { error: "Demo modunda görev güncelleme kapalıdır." };

  const parsed = updateTaskSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Görev güncellemesi doğrulanamadı." };

  const task = await getTaskById(parsed.data.task_id);
  if (!task) return { error: "Görev bulunamadı." };

  const isAdmin = hasRole(currentUser, "admin");
  const canUpdate = isAdmin || task.assigned_to === currentUser.id;
  if (!canUpdate) return { error: "Bu görevi güncelleme yetkiniz yok." };

  const now = new Date().toISOString();
  const nextStatus = parsed.data.status as ProductionTaskStatus | undefined;
  const payload: Record<string, unknown> = {};

  if (parsed.data.title && isAdmin) payload.title = parsed.data.title.trim();
  if (parsed.data.description !== undefined && isAdmin) payload.description = toNullable(parsed.data.description);
  if (parsed.data.firm_id && isAdmin) payload.firm_id = parsed.data.firm_id;
  if (parsed.data.service_type && isAdmin) payload.service_type = parsed.data.service_type;
  if (parsed.data.assigned_to !== undefined && isAdmin) payload.assigned_to = toNullable(parsed.data.assigned_to);
  if (parsed.data.priority && isAdmin) payload.priority = parsed.data.priority;
  if (parsed.data.due_date !== undefined && isAdmin) payload.due_date = toNullable(parsed.data.due_date);
  if (parsed.data.note !== undefined) payload.note = toNullable(parsed.data.note);
  if (nextStatus) {
    payload.status = nextStatus;
    if (nextStatus === "in_progress" && task.status !== "in_progress") payload.started_at = now;
    if (nextStatus === "ready_to_deliver") payload.completed_at = null;
    if (nextStatus === "done" && task.status !== "done") payload.completed_at = now;
    if (!["done"].includes(nextStatus)) payload.completed_at = null;
  }

  await updateTask(parsed.data.task_id, payload);
  if (nextStatus === "ready_to_deliver") await updateFirm(task.firm_id, { status: "uretime_aktarildi" });
  if (nextStatus === "done") await updateFirm(task.firm_id, { status: "teslim_edildi" });
  await createActivity({
    firm_id: task.firm_id,
    user_id: currentUser.id,
    type: "status_change",
    note: nextStatus ? `Görev durumu ${nextStatus} olarak güncellendi.` : "Görev bilgileri güncellendi.",
  });

  invalidateTaskPaths(parsed.data.task_id, task.firm_id);
  return { success: "Görev güncellendi." };
}

export async function addTaskNoteAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const currentUser = await requireUser();
  if (demoModeEnabled) return { error: "Demo modunda görev notu ekleme kapalıdır." };

  const parsed = noteSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Görev notu doğrulanamadı." };

  const task = await getTaskById(parsed.data.task_id);
  if (!task) return { error: "Görev bulunamadı." };

  const canUpdate = hasRole(currentUser, "admin") || task.assigned_to === currentUser.id;
  if (!canUpdate) return { error: "Bu göreve not ekleme yetkiniz yok." };

  const note = parsed.data.note.trim();
  await updateTask(parsed.data.task_id, { note });
  await createActivity({ firm_id: task.firm_id, user_id: currentUser.id, type: "note", note: `Görev notu: ${note}` });

  invalidateTaskPaths(parsed.data.task_id, task.firm_id);
  return { success: "Görev notu eklendi." };
}
