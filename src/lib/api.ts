import { NextResponse } from "next/server";

/** 사용자에게 그대로 보여줘도 안전한 메시지를 담은 에러. */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export const GENERIC_SERVER_ERROR = "서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

type RouteContext<P> = { params: Promise<P> };

/**
 * [서버 에러 숨김]
 * 모든 API 라우트를 이 함수로 감싼다.
 *  - 우리가 의도적으로 던진 HttpError  → 안내 메시지를 그대로 응답
 *  - 그 외 모든 예외(DB 오류, 코드 버그 등) → 상세 내용은 서버 콘솔에만 기록하고,
 *    사용자에게는 표준 안내 문구만 응답 (스택트레이스/쿼리/DB 주소 노출 차단)
 */
export function handle<P = Record<string, never>>(
  fn: (req: Request, ctx: RouteContext<P>) => Promise<Response>,
) {
  return async (req: Request, ctx: RouteContext<P>) => {
    try {
      return await fn(req, ctx);
    } catch (err) {
      if (err instanceof HttpError) {
        return json({ error: err.message }, err.status);
      }
      console.error("[API ERROR]", req.method, new URL(req.url).pathname, err);
      return json({ error: GENERIC_SERVER_ERROR }, 500);
    }
  };
}

/** 요청 본문(JSON)을 안전하게 읽는다. 객체가 아니면 400. */
export async function readJson(req: Request): Promise<Record<string, unknown>> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new HttpError(400, "요청 형식이 올바르지 않습니다.");
  }
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw new HttpError(400, "요청 형식이 올바르지 않습니다.");
  }
  return body as Record<string, unknown>;
}
