import type {
  ActivityType,
  AppRole,
  FirmStatus,
  ProductType,
  ProductionTaskPriority,
  ProductionTaskStatus,
} from "@/lib/types";

export const APP_NAME = "Alceix Panel";
export const DEMO_AUTH_COOKIE = "salesflow-demo-user";
export const FIREBASE_SESSION_COOKIE = "agency-crm-session";
export const DEFAULT_DEMO_PASSWORD = "Demo1234!";

export const ROLE_LABELS: Record<AppRole, string> = {
  admin: "Admin",
  sales: "Satış",
  developer: "Developer",
  video_editor: "Video editör",
  videographer: "Videographer",
  graphic_designer: "Grafik tasarımcı",
  seo_specialist: "SEO uzmanı",
  content: "İçerik",
};

export const ROLE_STYLES: Record<AppRole, string> = {
  admin: "bg-amber-100 text-amber-900 border-amber-200",
  sales: "bg-emerald-100 text-emerald-900 border-emerald-200",
  developer: "bg-sky-100 text-sky-900 border-sky-200",
  video_editor: "bg-violet-100 text-violet-900 border-violet-200",
  videographer: "bg-fuchsia-100 text-fuchsia-900 border-fuchsia-200",
  graphic_designer: "bg-rose-100 text-rose-900 border-rose-200",
  seo_specialist: "bg-lime-100 text-lime-900 border-lime-200",
  content: "bg-rose-100 text-rose-900 border-rose-200",
};

export const ROLE_OPTIONS = Object.entries(ROLE_LABELS).map(([value, label]) => ({
  value: value as AppRole,
  label,
}));

export const PRODUCTION_ROLES: AppRole[] = [
  "developer",
  "video_editor",
  "videographer",
  "graphic_designer",
  "seo_specialist",
  "content",
];

export const FIRM_STATUS_META: Record<
  FirmStatus,
  { label: string; className: string }
> = {
  yeni: { label: "Yeni", className: "bg-slate-100 text-slate-800 border-slate-200" },
  atanmis: {
    label: "Atanmış",
    className: "bg-blue-100 text-blue-800 border-blue-200",
  },
  aranacak: {
    label: "Aranacak",
    className: "bg-cyan-100 text-cyan-900 border-cyan-200",
  },
  arandi: {
    label: "Arandı",
    className: "bg-slate-200 text-slate-900 border-slate-300",
  },
  ulasilamadi: {
    label: "Ulaşılamadı",
    className: "bg-orange-100 text-orange-900 border-orange-200",
  },
  ilgilenmedi: {
    label: "İlgilenmedi",
    className: "bg-zinc-200 text-zinc-900 border-zinc-300",
  },
  ilgilendi: {
    label: "İlgilendi",
    className: "bg-emerald-100 text-emerald-900 border-emerald-200",
  },
  whatsapp_atildi: {
    label: "WhatsApp Atıldı",
    className: "bg-lime-100 text-lime-900 border-lime-200",
  },
  teklif_verildi: {
    label: "Teklif Verildi",
    className: "bg-purple-100 text-purple-900 border-purple-200",
  },
  odeme_bekleniyor: {
    label: "Ödeme Bekleniyor",
    className: "bg-amber-100 text-amber-900 border-amber-200",
  },
  odeme_alindi: {
    label: "Ödeme Alındı",
    className: "bg-teal-100 text-teal-900 border-teal-200",
  },
  uretime_aktarildi: {
    label: "Üretime Aktarıldı",
    className: "bg-indigo-100 text-indigo-900 border-indigo-200",
  },
  teslim_edildi: {
    label: "Teslim Edildi",
    className: "bg-fuchsia-100 text-fuchsia-900 border-fuchsia-200",
  },
  kara_liste: {
    label: "Kara Liste",
    className: "bg-red-100 text-red-900 border-red-200",
  },
};

export const FIRM_STATUS_OPTIONS = Object.entries(FIRM_STATUS_META).map(
  ([value, meta]) => ({
    value: value as FirmStatus,
    label: meta.label,
  }),
);

export const PRODUCT_OPTIONS: Array<{
  value: ProductType;
  label: string;
  price: number;
}> = [
  { value: "website", label: "Web sitesi", price: 30000 },
  { value: "ecommerce", label: "E-ticaret", price: 55000 },
  { value: "custom_software", label: "Özel yazılım", price: 90000 },
  { value: "mobile_app", label: "Mobil uygulama", price: 120000 },
  { value: "video_edit", label: "Video edit", price: 9000 },
  { value: "video_shoot", label: "Video çekim", price: 18000 },
  { value: "graphic_design", label: "Grafik tasarım", price: 8000 },
  { value: "logo", label: "Logo", price: 12000 },
  { value: "banner", label: "Banner", price: 3500 },
  { value: "social_post", label: "Sosyal medya post", price: 2500 },
  { value: "story", label: "Story", price: 2000 },
  { value: "reels", label: "Reels", price: 6000 },
  { value: "seo", label: "SEO", price: 25000 },
];

export const PRODUCT_META = Object.fromEntries(
  PRODUCT_OPTIONS.map((product) => [product.value, product]),
) as Record<ProductType, (typeof PRODUCT_OPTIONS)[number]>;

export const ACTIVITY_LABELS: Record<ActivityType, string> = {
  assignment: "Atama",
  call: "Arama",
  status_change: "Durum Güncellendi",
  note: "Not",
  whatsapp: "WhatsApp",
  sale: "Satış",
  payment: "Ödeme",
  message: "Mesaj",
};

export const PRODUCTION_STATUS_META: Record<
  ProductionTaskStatus,
  { label: string; className: string }
> = {
  todo: { label: "Bekliyor", className: "bg-slate-100 text-slate-800 border-slate-200" },
  in_progress: {
    label: "Devam Ediyor",
    className: "bg-amber-100 text-amber-900 border-amber-200",
  },
  waiting_client: {
    label: "Müşteri Bekleniyor",
    className: "bg-cyan-100 text-cyan-900 border-cyan-200",
  },
  revision: {
    label: "Revizyon",
    className: "bg-purple-100 text-purple-900 border-purple-200",
  },
  ready_to_deliver: {
    label: "Teslim Edilecek",
    className: "bg-blue-100 text-blue-900 border-blue-200",
  },
  done: { label: "Teslim Edildi", className: "bg-emerald-100 text-emerald-900 border-emerald-200" },
  cancelled: { label: "İptal", className: "bg-red-100 text-red-900 border-red-200" },
};

export const PRODUCTION_STATUS_OPTIONS = Object.entries(PRODUCTION_STATUS_META).map(
  ([value, meta]) => ({
    value: value as ProductionTaskStatus,
    label: meta.label,
  }),
);

export const TASK_PRIORITY_META: Record<
  ProductionTaskPriority,
  { label: string; className: string }
> = {
  low: { label: "Düşük", className: "bg-slate-100 text-slate-800 border-slate-200" },
  normal: { label: "Normal", className: "bg-blue-100 text-blue-900 border-blue-200" },
  high: { label: "Yüksek", className: "bg-amber-100 text-amber-900 border-amber-200" },
  urgent: { label: "Acil", className: "bg-red-100 text-red-900 border-red-200" },
};

export const TASK_PRIORITY_OPTIONS = Object.entries(TASK_PRIORITY_META).map(
  ([value, meta]) => ({
    value: value as ProductionTaskPriority,
    label: meta.label,
  }),
);

export const CALL_TARGET_PER_DAY = 25;
