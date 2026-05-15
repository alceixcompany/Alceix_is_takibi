export type AppRole =
  | "admin"
  | "sales"
  | "developer"
  | "video_editor"
  | "videographer"
  | "graphic_designer"
  | "seo_specialist"
  | "content";

export type FirmStatus =
  | "yeni"
  | "atanmis"
  | "aranacak"
  | "arandi"
  | "ulasilamadi"
  | "ilgilenmedi"
  | "ilgilendi"
  | "whatsapp_atildi"
  | "teklif_verildi"
  | "odeme_bekleniyor"
  | "odeme_alindi"
  | "uretime_aktarildi"
  | "teslim_edildi"
  | "kara_liste";

export type ActivityType =
  | "assignment"
  | "call"
  | "status_change"
  | "note"
  | "whatsapp"
  | "sale"
  | "payment"
  | "message";

export type ProductType =
  | "website"
  | "ecommerce"
  | "custom_software"
  | "mobile_app"
  | "video_edit"
  | "video_shoot"
  | "graphic_design"
  | "logo"
  | "banner"
  | "social_post"
  | "story"
  | "reels"
  | "seo";

export type PaymentStatus = "pending" | "paid";

export type ProductionTaskPriority = "low" | "normal" | "high" | "urgent";

export type ProductionTaskStatus =
  | "todo"
  | "in_progress"
  | "waiting_client"
  | "revision"
  | "ready_to_deliver"
  | "done"
  | "cancelled";

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: AppRole[];
  phone: string | null;
  monthly_target: number;
  target_product_type: ProductType | null;
  commission_rate: number;
  active: boolean;
  created_at: string;
}

export interface Firm {
  id: string;
  company_name: string;
  sector: string | null;
  city: string | null;
  district: string | null;
  phone: string | null;
  instagram: string | null;
  website: string | null;
  has_website: boolean;
  source: string | null;
  assigned_to: string | null;
  status: FirmStatus;
  last_called_at: string | null;
  next_follow_up_at: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface Activity {
  id: string;
  firm_id: string;
  user_id: string | null;
  type: ActivityType;
  note: string | null;
  created_at: string;
}

export interface Sale {
  id: string;
  firm_id: string;
  user_id: string;
  product_type: ProductType;
  amount: number;
  commission: number;
  extra_commission: number;
  payment_status: PaymentStatus;
  payment_date: string | null;
  created_at: string;
}

export interface ProductionTask {
  id: string;
  firm_id: string;
  title: string;
  description: string | null;
  service_type: ProductType;
  assigned_to: string | null;
  created_by: string | null;
  priority: ProductionTaskPriority;
  status: ProductionTaskStatus;
  due_date: string | null;
  started_at: string | null;
  completed_at: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}


export type MessageStatus = "open" | "answered" | "closed";

export interface InternalMessage {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  subject: string;
  message: string;
  reply: string | null;
  status: MessageStatus;
  created_at: string;
  updated_at: string;
}

export interface CrmDataset {
  users: AppUser[];
  firms: Firm[];
  activities: Activity[];
  sales: Sale[];
  productionTasks: ProductionTask[];
  messages: InternalMessage[];
}

export interface ActionState {
  success?: string;
  error?: string;
}

export interface CommissionSummary {
  confirmedSales: number;
  targetQualifiedSales: number;
  revenue: number;
  baseCommission: number;
  extraCommission: number;
  totalCommission: number;
  progressRatio: number;
}
