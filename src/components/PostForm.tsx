"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { apiRequest } from "@/lib/clientApi";
import { LIMITS } from "@/lib/limits";
import { useAuth } from "@/components/AuthProvider";

type Props = {
  mode: "create" | "edit";
  postId?: string;
  initial?: { title: string; content: string; isSecret: boolean };
};

export default function PostForm({ mode, postId, initial }: Props) {
  const router = useRouter();
  const { csrfToken } = useAuth();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [isSecret, setIsSecret] = useState(initial?.isSecret ?? false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);

    const res =
      mode === "create"
        ? await apiRequest<{ id: string }>("/api/posts", {
            method: "POST",
            body: { title, content, isSecret },
            csrfToken,
          })
        : await apiRequest<{ id: string }>(`/api/posts/${postId}`, {
            method: "PUT",
            body: { title, content, isSecret },
            csrfToken,
          });

    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    router.push(`/posts/${res.data.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="card form" noValidate>
      <h1 className="page-title">{mode === "create" ? "글쓰기" : "글 수정"}</h1>
      {error && (
        <p className="notice notice-error" role="alert">
          {error}
        </p>
      )}

      <label className="field">
        <span>제목</span>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={LIMITS.TITLE_MAX}
          required
          autoFocus
        />
        <small className="counter">
          {title.length} / {LIMITS.TITLE_MAX}
        </small>
      </label>

      <label className="field">
        <span>내용</span>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={LIMITS.CONTENT_MAX}
          rows={12}
          required
        />
        <small className="counter">
          {content.length} / {LIMITS.CONTENT_MAX}
        </small>
      </label>

      <label className="check">
        <input type="checkbox" checked={isSecret} onChange={(e) => setIsSecret(e.target.checked)} />
        <span>🔒 비밀글 (작성자 본인과 관리자만 볼 수 있습니다)</span>
      </label>

      <div className="form-actions">
        <button type="button" className="btn btn-ghost" onClick={() => router.back()} disabled={busy}>
          취소
        </button>
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? "저장 중..." : mode === "create" ? "등록" : "수정 완료"}
        </button>
      </div>
    </form>
  );
}
