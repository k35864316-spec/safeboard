import { handle, json } from "@/lib/api";
import { requireSessionWithCsrf } from "@/lib/auth/session";
import { deleteComment } from "@/lib/services/posts";
import { requireObjectId } from "@/lib/security/validate";

type Ctx = { id: string };

// 댓글 삭제: 로그인 + CSRF 토큰 + 작성자 본인 확인
export const DELETE = handle<Ctx>(async (req, { params }) => {
  const id = requireObjectId((await params).id);
  const session = await requireSessionWithCsrf(req);
  await deleteComment(id, session.user);
  return json({ ok: true });
});
