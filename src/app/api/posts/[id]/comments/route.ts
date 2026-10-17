import { handle, json, readJson } from "@/lib/api";
import { requireSessionWithCsrf } from "@/lib/auth/session";
import { addComment } from "@/lib/services/posts";
import { requireObjectId, validateCommentInput } from "@/lib/security/validate";

type Ctx = { id: string };

// 댓글 쓰기: 로그인 + CSRF 토큰 + 입력값 검사 + (비밀글이면) 열람 권한 확인
export const POST = handle<Ctx>(async (req, { params }) => {
  const postId = requireObjectId((await params).id);
  const session = await requireSessionWithCsrf(req);
  const { content } = validateCommentInput(await readJson(req));
  const id = await addComment(postId, session.user, content);
  return json({ id }, 201);
});
