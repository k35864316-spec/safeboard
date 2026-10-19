"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiRequest } from "@/lib/clientApi";
import { useAuth } from "@/components/AuthProvider";

export default function DeletePostButton({ postId }: { postId: string }) {
  const router = useRouter();
  const { csrfToken } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    if (!window.confirm("이 게시글을 삭제할까요? 댓글도 함께 삭제되며 되돌릴 수 없습니다.")) return;
    setBusy(true);
    setError(null);
    const res = await apiRequest(`/api/posts/${postId}`, { method: "DELETE", csrfToken });
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    router.push("/board");
    router.refresh();
  }

  return (
    <>
      <button type="button" className="btn btn-danger" onClick={onClick} disabled={busy}>
        {busy ? "삭제 중..." : "삭제"}
      </button>
      {error && (
        <span className="inline-error" role="alert">
          {error}
        </span>
      )}
    </>
  );
}
