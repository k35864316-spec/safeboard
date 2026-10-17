"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { apiRequest } from "@/lib/clientApi";
import { LIMITS } from "@/lib/limits";
import { useAuth } from "@/components/AuthProvider";

export type CommentView = {
  id: string;
  content: string; // 서버에서 원래 글자로 되돌린 값. 아래에서 반드시 React 텍스트({})로만 출력한다.
  authorName: string;
  isMine: boolean;
  createdAt: string; // 서버에서 미리 포맷한 문자열
};

export default function CommentSection({ postId, comments }: { postId: string; comments: CommentView[] }) {
  const router = useRouter();
  const { user, csrfToken } = useAuth();
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const res = await apiRequest(`/api/posts/${postId}/comments`, {
      method: "POST",
      body: { content },
      csrfToken,
    });
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setContent("");
    router.refresh();
  }

  async function onDelete(id: string) {
    if (!window.confirm("이 댓글을 삭제할까요?")) return;
    setError(null);
    const res = await apiRequest(`/api/comments/${id}`, { method: "DELETE", csrfToken });
    if (!res.ok) {
      setError(res.error);
      return;
    }
    router.refresh();
  }

  return (
    <section className="comments" aria-labelledby="comments-title">
      <h2 id="comments-title" className="section-title">
        댓글 <span className="muted">{comments.length}</span>
      </h2>

      {comments.length === 0 ? (
        <p className="muted empty">아직 댓글이 없습니다.</p>
      ) : (
        <ul className="comment-list">
          {comments.map((c) => (
            <li key={c.id} className="comment">
              <div className="comment-head">
                <strong>{c.authorName}</strong>
                <span className="muted">{c.createdAt}</span>
                {c.isMine && (
                  <button type="button" className="link-btn" onClick={() => onDelete(c.id)}>
                    삭제
                  </button>
                )}
              </div>
              {/* 텍스트 노드로만 출력 → React 가 출력 시점에 한 번 더 이스케이프한다 */}
              {/* [미구현] XSS 방어 없음: 댓글을 HTML 그대로 출력한다 */}
              <p className="comment-body" dangerouslySetInnerHTML={{ __html: c.content }} />
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p className="notice notice-error" role="alert">
          {error}
        </p>
      )}

      {user ? (
        <form onSubmit={onSubmit} className="comment-form" noValidate>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={LIMITS.COMMENT_MAX}
            rows={3}
            placeholder="댓글을 입력하세요"
            aria-label="댓글 입력"
            required
          />
          <div className="form-actions">
            <small className="counter">
              {content.length} / {LIMITS.COMMENT_MAX}
            </small>
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? "등록 중..." : "댓글 등록"}
            </button>
          </div>
        </form>
      ) : (
        <p className="muted">
          댓글을 쓰려면 <Link href="/login">로그인</Link>해 주세요.
        </p>
      )}
    </section>
  );
}
