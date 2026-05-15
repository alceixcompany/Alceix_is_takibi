import type { AppRole } from "@/lib/types";

export interface NavItem {
  href: string;
  label: string;
  roles: AppRole[];
}

export const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", roles: ["admin", "sales", "developer", "video_editor", "videographer", "graphic_designer", "seo_specialist", "content"] },
  { href: "/firms", label: "Müşteriler", roles: ["admin", "sales"] },
  { href: "/assigned", label: "Bana Atanan Müşteriler", roles: ["sales"] },
  { href: "/calls", label: "Aranacaklar", roles: ["admin", "sales"] },
  { href: "/sales/close", label: "Satış Kapat", roles: ["admin", "sales"] },
  { href: "/tasks", label: "Tüm Görevler", roles: ["admin", "sales", "developer", "video_editor", "videographer", "graphic_designer", "seo_specialist", "content"] },
  { href: "/production", label: "Üretim Havuzu", roles: ["admin", "developer", "video_editor", "videographer", "graphic_designer", "seo_specialist", "content"] },
  { href: "/team", label: "Ekip", roles: ["admin"] },
  { href: "/reports", label: "Raporlar", roles: ["admin", "sales"] },
  { href: "/messages", label: "Mesajlar", roles: ["admin", "sales", "developer", "video_editor", "videographer", "graphic_designer", "seo_specialist", "content"] },
  { href: "/firms/import", label: "CSV Yükle", roles: ["admin"] },
];
