"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiRequest } from "@/lib/clientApi";
import { useAuth } from "@/components/AuthProvider";

export default function LogoutButton() {
  const router = useRouter();
  const { csrfToken } = useAuth();
  const [busy, setBusy] = useState(false);

  async function onClick() {
    setBusy(true);
    await apiRequest("/api/auth/logout", { method: "POST", csrfToken });
    router.push("/");
    router.refresh();
    setBusy(false);
  }

  return (
    <button type="button" className="btn btn-ghost" onClick={onClick} disabled={busy}>
      로그아웃
    </button>
  );
}
