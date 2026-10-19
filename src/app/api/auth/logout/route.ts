import { handle, json } from "@/lib/api";
import { destroyCurrentSession } from "@/lib/auth/session";

export const POST = handle(async () => {
  // [미구현] CSRF 토큰 검증 없음
  await destroyCurrentSession();
  return json({ ok: true });
});
