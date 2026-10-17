import { handle, json, readJson } from "@/lib/api";
import { requireSession, requireSessionWithCsrf } from "@/lib/auth/session";
import { deletePost, getPostDetail, updatePost } from "@/lib/services/posts";
import { requireObjectId, validatePostInput } from "@/lib/security/validate";
import { HttpError } from "@/lib/api";

type Ctx = { id: string };

// 글 상세 조회 (비밀글은 작성자/관리자가 아니면 제목·본문이 비워져서 내려간다)
export const GET = handle<Ctx>(async (_req, { params }) => {
  const id = requireObjectId((await params).id);
  const session = await requireSession(); // 비로그인 → 401
  const post = await getPostDetail(id, session.user);
  if (!post) throw new HttpError(404, "존재하지 않는 게시글입니다.");
  return json(post);
});

// 글 수정: 로그인 + CSRF 토큰 + 작성자 본인 확인 + 입력값 검사
export const PUT = handle<Ctx>(async (req, { params }) => {
  const id = requireObjectId((await params).id);
  const session = await requireSessionWithCsrf(req);
  const input = validatePostInput(await readJson(req));
  await updatePost(id, session.user, input);
  return json({ id });
});

// 글 삭제: 로그인 + CSRF 토큰 + 작성자 본인 확인
export const DELETE = handle<Ctx>(async (req, { params }) => {
  const id = requireObjectId((await params).id);
  const session = await requireSessionWithCsrf(req);
  await deletePost(id, session.user);
  return json({ ok: true });
});
