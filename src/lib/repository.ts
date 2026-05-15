import { demoActivities, demoFirms, demoProductionTasks, demoSales, demoUsers } from "@/lib/demo-data";
import { PRODUCTION_ROLES } from "@/lib/constants";
import { cookies } from "next/headers";

import { FIREBASE_SESSION_COOKIE } from "@/lib/constants";
import { demoModeEnabled, firebaseAdminConfigured } from "@/lib/env";
import { getAdminDb } from "@/lib/firebase/admin";
import { getRestCollection } from "@/lib/firebase/rest";
import { getIdTokenFromCookieValue } from "@/lib/firebase/session";
import { normalizeRoleValue } from "@/lib/auth";
import type {
  Activity,
  AppRole,
  AppUser,
  CrmDataset,
  Firm,
  ProductionTask,
  Sale,
  InternalMessage,
} from "@/lib/types";

function toIso(value: unknown) {
  if (!value) return new Date().toISOString();
  if (typeof value === "string") return value;
  if (typeof value === "object" && value !== null && "toDate" in value) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return String(value);
}

export function mapUser(record: Record<string, unknown>, id?: string): AppUser {
  return {
    id: String(id ?? record.uid ?? record.id ?? ""),
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
    created_at: toIso(record.created_at ?? record.createdAt),
  };
}

export function mapFirm(record: Record<string, unknown>, id?: string): Firm {
  return {
    id: String(record.id ?? id ?? ""),
    company_name: String(record.company_name ?? record.companyName ?? ""),
    sector: typeof record.sector === "string" ? record.sector : null,
    city: typeof record.city === "string" ? record.city : null,
    district: typeof record.district === "string" ? record.district : null,
    phone: typeof record.phone === "string" ? record.phone : null,
    instagram: typeof record.instagram === "string" ? record.instagram : null,
    website: typeof record.website === "string" ? record.website : null,
    has_website: Boolean(record.has_website ?? record.hasWebsite ?? false),
    source: typeof record.source === "string" ? record.source : null,
    assigned_to: typeof record.assigned_to === "string" ? record.assigned_to : null,
    status: String(record.status ?? "yeni") as Firm["status"],
    last_called_at: record.last_called_at ? toIso(record.last_called_at) : null,
    next_follow_up_at: record.next_follow_up_at ? toIso(record.next_follow_up_at) : null,
    note: typeof record.note === "string" ? record.note : null,
    created_at: toIso(record.created_at ?? record.createdAt),
    updated_at: toIso(record.updated_at ?? record.updatedAt),
  };
}

export function mapActivity(record: Record<string, unknown>, id?: string): Activity {
  return {
    id: String(record.id ?? id ?? ""),
    firm_id: String(record.firm_id ?? ""),
    user_id: typeof record.user_id === "string" ? record.user_id : null,
    type: String(record.type ?? "note") as Activity["type"],
    note: typeof record.note === "string" ? record.note : null,
    created_at: toIso(record.created_at ?? record.createdAt),
  };
}

export function mapSale(record: Record<string, unknown>, id?: string): Sale {
  return {
    id: String(record.id ?? id ?? ""),
    firm_id: String(record.firm_id ?? ""),
    user_id: String(record.user_id ?? ""),
    product_type: String(record.product_type ?? record.productType ?? record.service_type ?? record.serviceType ?? "website") as Sale["product_type"],
    amount: Number(record.amount ?? 0),
    commission: Number(record.commission ?? record.commission_amount ?? record.commissionAmount ?? 0),
    extra_commission: Number(record.extra_commission ?? record.extraCommission ?? 0),
    payment_status: String(record.payment_status ?? record.paymentStatus ?? "pending") as Sale["payment_status"],
    payment_date: record.payment_date ?? record.paymentDate ? toIso(record.payment_date ?? record.paymentDate) : null,
    created_at: toIso(record.created_at ?? record.createdAt),
  };
}


export function mapMessage(record: Record<string, unknown>, id?: string): InternalMessage {
  return {
    id: String(record.id ?? id ?? ""),
    user_id: String(record.user_id ?? record.userId ?? ""),
    user_name: String(record.user_name ?? record.userName ?? ""),
    user_email: String(record.user_email ?? record.userEmail ?? ""),
    subject: String(record.subject ?? "Genel mesaj"),
    message: String(record.message ?? ""),
    reply: typeof record.reply === "string" ? record.reply : null,
    status: String(record.status ?? "open") as InternalMessage["status"],
    created_at: toIso(record.created_at ?? record.createdAt),
    updated_at: toIso(record.updated_at ?? record.updatedAt),
  };
}

export function mapTask(record: Record<string, unknown>, id?: string): ProductionTask {
  return {
    id: String(record.id ?? id ?? ""),
    firm_id: String(record.firm_id ?? ""),
    title: String(record.title ?? record.task_type ?? "Görev"),
    description: typeof record.description === "string" ? record.description : null,
    service_type: String(record.service_type ?? "website") as ProductionTask["service_type"],
    assigned_to: typeof record.assigned_to === "string" ? record.assigned_to : null,
    created_by: typeof record.created_by === "string" ? record.created_by : null,
    priority: String(record.priority ?? "normal") as ProductionTask["priority"],
    status: String(record.status ?? "todo") as ProductionTask["status"],
    due_date: record.due_date ? toIso(record.due_date) : null,
    started_at: record.started_at ? toIso(record.started_at) : null,
    completed_at: record.completed_at ? toIso(record.completed_at) : null,
    note: typeof record.note === "string" ? record.note : null,
    created_at: toIso(record.created_at ?? record.createdAt),
    updated_at: toIso(record.updated_at ?? record.updatedAt),
  };
}

function hasRole(user: AppUser, role: AppRole) {
  return user.role.includes(role);
}

function hasProductionRole(user: AppUser) {
  return user.role.some((role) => PRODUCTION_ROLES.includes(role));
}

function sortByDateDesc<T extends { created_at: string }>(items: T[]) {
  return [...items].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

const CALL_QUEUE_STATUSES: Firm["status"][] = [
  "yeni",
  "atanmis",
  "aranacak",
  "whatsapp_atildi",
  "odeme_bekleniyor",
];

function isSharedCallQueueFirm(firm: Firm) {
  return CALL_QUEUE_STATUSES.includes(firm.status);
}

function filterDataset(currentUser: AppUser, dataset: CrmDataset): CrmDataset {
  const isAdmin = hasRole(currentUser, "admin") || ["altay@demo.crm", "altay52gt@gmail.com"].includes(currentUser.email.toLowerCase());
  const isSales = hasRole(currentUser, "sales");
  const isProducer = hasProductionRole(currentUser);

  if (isAdmin) return dataset;

  const visibleFirmIds = new Set<string>();

  if (isSales) {
    dataset.firms
      .filter((firm) => firm.assigned_to === currentUser.id || isSharedCallQueueFirm(firm))
      .forEach((firm) => visibleFirmIds.add(firm.id));
  }

  if (isProducer) {
    dataset.productionTasks
      .filter((task) => !task.assigned_to || task.assigned_to === currentUser.id)
      .forEach((task) => visibleFirmIds.add(task.firm_id));
  }

  const firms = sortByDateDesc(dataset.firms.filter((firm) => visibleFirmIds.has(firm.id)));
  const sales = sortByDateDesc(
    dataset.sales.filter((sale) => sale.user_id === currentUser.id || visibleFirmIds.has(sale.firm_id)),
  );
  const activities = sortByDateDesc(
    dataset.activities.filter(
      (activity) => activity.user_id === currentUser.id || visibleFirmIds.has(activity.firm_id),
    ),
  );
  const productionTasks = sortByDateDesc(
    dataset.productionTasks.filter(
      (task) => !task.assigned_to || task.assigned_to === currentUser.id || visibleFirmIds.has(task.firm_id),
    ),
  );
  const messages = sortByDateDesc(
    dataset.messages.filter((message) => message.user_id === currentUser.id),
  );

  const relatedUserIds = new Set<string>([currentUser.id]);
  firms.forEach((firm) => firm.assigned_to && relatedUserIds.add(firm.assigned_to));
  productionTasks.forEach((task) => task.assigned_to && relatedUserIds.add(task.assigned_to));

  return {
    users: dataset.users.filter((user) => relatedUserIds.has(user.id)),
    firms,
    activities,
    sales,
    productionTasks,
    messages,
  };
}

type RawFirebaseDataset = {
  users: AppUser[];
  firms: Firm[];
  activities: Activity[];
  sales: Sale[];
  productionTasks: ProductionTask[];
  messages: InternalMessage[];
};

const DATASET_CACHE_TTL_MS = Number(process.env.CRM_DATA_CACHE_TTL_MS ?? 15000);
const rawDatasetCache = new Map<string, { expiresAt: number; value: Promise<RawFirebaseDataset> }>();

export function clearCrmDatasetCache() {
  rawDatasetCache.clear();
}

function getCachedRawDataset(key: string, loader: () => Promise<RawFirebaseDataset>) {
  const now = Date.now();
  const cached = rawDatasetCache.get(key);
  if (cached && cached.expiresAt > now) return cached.value;

  const value = loader().catch((error) => {
    rawDatasetCache.delete(key);
    throw error;
  });

  rawDatasetCache.set(key, { expiresAt: now + DATASET_CACHE_TTL_MS, value });
  return value;
}

async function getCollection<T>(name: string, mapper: (record: Record<string, unknown>, id: string) => T) {
  const snapshot = await getAdminDb().collection(name).get();
  return snapshot.docs.map((doc) => mapper(doc.data(), doc.id));
}

async function getRestTokenFromCookie() {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get(FIREBASE_SESSION_COOKIE)?.value;
  if (!authCookie) return null;
  return getIdTokenFromCookieValue(authCookie);
}

async function getRestCollectionMapped<T>(name: string, mapper: (record: Record<string, unknown>, id: string) => T) {
  const token = await getRestTokenFromCookie();
  if (!token) return [];

  try {
    const docs = await getRestCollection(name, token);
    return docs.map((doc) => mapper(doc, String(doc.id ?? "")));
  } catch (error) {
    console.warn(`[Firebase REST] ${name} koleksiyonu okunamadı:`, error);
    return [];
  }
}

async function readRawFirebaseDataset(): Promise<RawFirebaseDataset> {
  const loader = firebaseAdminConfigured ? getCollection : getRestCollectionMapped;

  const [users, firms, activities, sales, productionTasks, messages] = await Promise.all([
    loader("users", mapUser),
    loader("firms", mapFirm),
    loader("activities", mapActivity),
    loader("sales", mapSale),
    loader("production_tasks", mapTask),
    loader("messages", mapMessage),
  ]);

  return {
    users: users.sort((a, b) => a.name.localeCompare(b.name, "tr")),
    firms: sortByDateDesc(firms),
    activities: sortByDateDesc(activities),
    sales: sortByDateDesc(sales),
    productionTasks: sortByDateDesc(productionTasks),
    messages: sortByDateDesc(messages),
  };
}

async function getFirebaseDataset(currentUser: AppUser): Promise<CrmDataset> {
  // Her sayfa geçişinde 6 Firestore koleksiyonunu tekrar tekrar okumak sistemi yavaşlatıyordu.
  // Kısa süreli server-side cache sayfa geçişlerini hızlandırır; veri yazıldığında cache temizlenir.
  const cacheKey = firebaseAdminConfigured ? "admin-sdk:raw" : `rest:${currentUser.id}`;
  const rawDataset = await getCachedRawDataset(cacheKey, readRawFirebaseDataset);
  const users = rawDataset.users.some((item) => item.id === currentUser.id)
    ? rawDataset.users
    : [currentUser, ...rawDataset.users];

  return filterDataset(currentUser, {
    ...rawDataset,
    users,
  });
}

function getDemoDataset(currentUser: AppUser): CrmDataset {
  return filterDataset(currentUser, {
    users: demoUsers,
    firms: sortByDateDesc(demoFirms),
    activities: sortByDateDesc(demoActivities),
    sales: sortByDateDesc(demoSales),
    productionTasks: sortByDateDesc(demoProductionTasks),
    messages: [],
  });
}

export async function loadCrmDataset(currentUser: AppUser) {
  if (demoModeEnabled) return getDemoDataset(currentUser);
  return getFirebaseDataset(currentUser);
}
