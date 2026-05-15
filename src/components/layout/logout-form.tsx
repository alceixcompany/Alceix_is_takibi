import { LogOut } from "lucide-react";

import { logoutAction } from "@/lib/actions/auth";

export function LogoutForm() {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
      >
        <LogOut className="size-4" />
        Çıkış Yap
      </button>
    </form>
  );
}
