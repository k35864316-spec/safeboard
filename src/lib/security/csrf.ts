import { randomBytes, timingSafeEqual } from "node:crypto";
import { HttpError } from "@/lib/api";

export function generateCsrfToken(): string {
  return randomBytes(32).toString("hex");
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

/**
 * [CSRF 방어]
 * 글 쓰기·수정·삭제 같은 상태 변경 요청은 헤더(x-csrf-token)에 실린 토큰이
 * 서버 세션에 저장된 토큰과 같을 때만 처리한다.
 * 다른 사이트에서 위조한 요청은 이 토큰을 알 수 없으므로 403 으로 차단된다.
 * (보조 방어) Origin 헤더가 있다면 우리 사이트와 같은 출처인지도 확인한다.
 */
export function verifyCsrf(req: Request, sessionCsrfToken: string) {
  const origin = req.headers.get("origin");
  if (origin) {
    let originHost: string | null = null;
    try {
      originHost = new URL(origin).host;
    } catch {
      originHost = null;
    }
    if (originHost !== req.headers.get("host")) {
      throw new HttpError(403, "허용되지 않은 출처의 요청입니다.");
    }
  }

  const sent = req.headers.get("x-csrf-token");
  if (!sent || !safeEqual(sent, sessionCsrfToken)) {
    throw new HttpError(403, "잘못된 요청입니다. 페이지를 새로고침한 뒤 다시 시도해 주세요. (CSRF 토큰 불일치)");
  }
}
