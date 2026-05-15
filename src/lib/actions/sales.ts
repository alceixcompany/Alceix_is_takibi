"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { countsTowardTarget } from "@/lib/analytics";
import { hasRole, requireUser } from "@/lib/auth";
import { demoModeEnabled } from "@/lib/env";
import {
  createActivity,
  getFirmById,
  getLatestSaleForFirm,
  getMonthlyPaidSalesForUser,
  getTaskById,
  getUserById,
  newId,
  toNullable,
  updateFirm,
  updateTask,
  setDocument,
} from "@/lib/firebase/crm";
import type { ActionState, AppUser, ProductType, Sale } from "@/lib/types";

const BASE_COMMISSION = 500;
const EXTRA_COMMISSION = 500;

const closeSaleSchema = z.object({
  firm_id: z.string().min(1, "Firma seçimi zorunludur."),
  user_id: z.string().optional(),
  product_type: z.string().min(1, "Ürün seçimi zorunludur."),
  amount: z.string().min(1, "Tutar zorunludur."),
  payment_status: z.enum(["pending", "paid"]),
});

const updateTaskSchema = z.object({
  task_id: z.string().min(1),
  status: z.enum(["todo", "in_progress", "waiting_client", "revision", "ready_to_deliver", "done", "cancelled"]),
  note: z.string().optional(),
});

function invalidateSalesPaths(firmId?: string) {
  revalidatePath("/dashboard");
  revalidatePath("/commissions");
  revalidatePath("/sales/close");
  revalidatePath("/production");
  revalidatePath("/firms");
  revalidatePath("/reports");
  if (firmId) revalidatePath(`/firms/${firmId}`);
}


function buildProductionTaskTitle(productType: ProductType) {
  const labels: Record<ProductType, string> = {
    website: "Web sitesi üretimi",
    ecommerce: "E-ticaret üretimi",
    custom_software: "Özel yazılım geliştirme",
    mobile_app: "Mobil app geliştirme",
    video_edit: "Video edit işi",
    video_shoot: "Video çekimi",
    graphic_design: "Grafik tasarım işi",
    logo: "Logo tasarım işi",
    banner: "Banner tasarım işi",
    social_post: "Sosyal medya post tasarımı",
    story: "Story tasarımı",
    reels: "Reels üretimi",
    seo: "SEO çalışması",
  };

  return labels[productType] ?? "Üretim görevi";
}

function buildCommissionValues(currentUser: AppUser, existingPaidSales: Sale[], saleDraft: Sale) {
  const qualifiesForExtra =
    currentUser.monthly_target > 0 &&
    countsTowardTarget(currentUser, saleDraft) &&
    existingPaidSales.filter((sale) => countsTowardTarget(currentUser, sale)).length + 1 >
      currentUser.monthly_target;

  return { commission: BASE_COMMISSION, extra_commission: qualifiesForExtra ? EXTRA_COMMISSION : 0 };
}

export async function closeSaleAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const currentUser = await requireUser();
  if (demoModeEnabled) return { error: "Demo modunda satış kapatma kapalıdır." };

  const parsed = closeSaleSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Satış formu doğrulanamadı." };

  const firm = await getFirmById(parsed.data.firm_id);
  if (!firm) return { error: "Firma bulunamadı." };

  const salesOwnerId = hasRole(currentUser, "admin") && parsed.data.user_id ? parsed.data.user_id : currentUser.id;
  const salesOwner = await getUserById(salesOwnerId);
  if (!salesOwner) return { error: "Satış sahibi bulunamadı." };

  const canManage = hasRole(currentUser, "admin") || firm.assigned_to === currentUser.id || !firm.assigned_to;
  if (!canManage) return { error: "Bu firmada satış kapatma yetkiniz yok." };

  const amount = Number(parsed.data.amount.replace(",", "."));
  if (!Number.isFinite(amount) || amount <= 0) return { error: "Tutar geçerli değil." };

  const now = new Date().toISOString();
  const paymentDate = parsed.data.payment_status === "paid" ? now : null;
  const saleDraft: Sale = {
    id: "draft",
    firm_id: parsed.data.firm_id,
    user_id: salesOwnerId,
    product_type: parsed.data.product_type as ProductType,
    amount,
    commission: BASE_COMMISSION,
    extra_commission: 0,
    payment_status: parsed.data.payment_status,
    payment_date: paymentDate,
    created_at: now,
  };
  const commissionValues = buildCommissionValues(
    salesOwner,
    await getMonthlyPaidSalesForUser(salesOwnerId),
    saleDraft,
  );

  const existingSale = await getLatestSaleForFirm(parsed.data.firm_id);
  const saleId = existingSale?.id ?? newId("sales");
  await setDocument(
    "sales",
    saleId,
    {
      id: saleId,
      firm_id: parsed.data.firm_id,
      user_id: salesOwnerId,
      product_type: parsed.data.product_type as ProductType,
      amount,
      commission: commissionValues.commission,
      extra_commission: commissionValues.extra_commission,
      payment_status: parsed.data.payment_status,
      payment_date: paymentDate,
      created_at: existingSale?.created_at ?? now,
    },
    { merge: true },
  );

  const wasAlreadyPaid = existingSale?.payment_status === "paid";
  const isPaidNow = parsed.data.payment_status === "paid";

  await updateFirm(parsed.data.firm_id, {
    assigned_to: firm.assigned_to ?? salesOwnerId,
    status: isPaidNow ? "uretime_aktarildi" : "odeme_bekleniyor",
  });

  await createActivity({
    firm_id: parsed.data.firm_id,
    user_id: currentUser.id,
    type: isPaidNow ? "payment" : "sale",
    note: isPaidNow
      ? "Ödeme alındı. Müşteri üretim havuzuna aktarıldı."
      : "Satış kaydı açıldı, ödeme bekleniyor.",
  });

  if (isPaidNow && !wasAlreadyPaid) {
    const taskId = newId("production_tasks");
    const productType = parsed.data.product_type as ProductType;
    await setDocument("production_tasks", taskId, {
      id: taskId,
      firm_id: parsed.data.firm_id,
      title: buildProductionTaskTitle(productType),
      description: `${firm.company_name} için ödeme alındı. Üretim ekibi havuzdan işi üzerine alıp projeye başlayabilir.`,
      service_type: productType,
      assigned_to: null,
      created_by: currentUser.id,
      priority: "normal",
      status: "todo",
      due_date: null,
      started_at: null,
      completed_at: null,
      note: "Otomatik oluşturuldu: ödeme alındı, üretim havuzunda bekliyor.",
      created_at: now,
      updated_at: now,
    });

    await createActivity({
      firm_id: parsed.data.firm_id,
      user_id: currentUser.id,
      type: "note",
      note: "Üretim havuzuna otomatik görev açıldı. Developer havuzdan işi seçebilir.",
    });
  }

  invalidateSalesPaths(parsed.data.firm_id);
  return {
    success: parsed.data.payment_status === "paid" ? "Ödeme işlendi, satış kesinleşti." : "Satış kaydı oluşturuldu, ödeme bekleniyor.",
  };
}

export async function updateProductionTaskAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const currentUser = await requireUser();
  if (demoModeEnabled) return { error: "Demo modunda görev güncelleme kapalıdır." };

  const parsed = updateTaskSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Görev güncellemesi doğrulanamadı." };

  const task = await getTaskById(parsed.data.task_id);
  if (!task) return { error: "Görev bulunamadı." };

  const canManage = hasRole(currentUser, "admin") || task.assigned_to === currentUser.id;
  if (!canManage) return { error: "Bu görevi güncelleme yetkiniz yok." };

  await updateTask(parsed.data.task_id, {
    status: parsed.data.status,
    note: toNullable(parsed.data.note),
    ...(parsed.data.status === "in_progress" ? { started_at: new Date().toISOString() } : {}),
    ...(parsed.data.status === "done" ? { completed_at: new Date().toISOString() } : {}),
  });

  await createActivity({
    firm_id: task.firm_id,
    user_id: currentUser.id,
    type: "status_change",
    note: `Görev durumu ${parsed.data.status} olarak güncellendi.`,
  });

  invalidateSalesPaths(task.firm_id);
  return { success: "Üretim görevi güncellendi." };
}
