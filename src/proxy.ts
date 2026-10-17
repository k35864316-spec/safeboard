import { NextResponse } from "next/server";

/**
 * [미구현] CSP(Content-Security-Policy) 헤더
 * 지금은 스크립트 실행을 제한하는 헤더를 붙이지 않는다.
 */
export function proxy() {
  return NextResponse.next();
}

export const config = {
  matcher: [
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
