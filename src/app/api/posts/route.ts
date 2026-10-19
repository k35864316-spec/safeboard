import { handle, json, readJson } from "@/lib/api";
import { requireSession, requireSessionWithCsrf } from "@/lib/auth/session";
import { createPost, listPosts } from "@/lib/services/posts";
import { firstParam, parsePage, parseSearch, validatePostInput } from "@/lib/security/validate";

// 글 목록 + 검색 + 페이징
export const GET = handle(async (req) => {
  const params = new URL(req.url).searchParams;
  const session = await requireSession(); // 비로그인 → 401
  const result = await listPosts({
    page: parsePage(firstParam(params.get("page"))),
    q: parseSearch(firstParam(params.get("q"))),
    viewer: session.user,
  });
  return json(result);
});

// 글 쓰기: 로그인 + CSRF 토큰 + 입력값 검사
export const POST = handle(async (req) => {
  const session = await requireSessionWithCsrf(req);
  const input = validatePostInput(await readJson(req));
  const id = await createPost(session.user, input);
  return json({ id }, 201);
});
