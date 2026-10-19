"use client";

// 레이아웃 자체에서 오류가 났을 때(예: 세션 조회 중 DB 연결 실패)의 최후 방어선. 상세 내용은 노출하지 않는다.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="ko">
      <body style={{ fontFamily: "system-ui, sans-serif", display: "grid", placeItems: "center", minHeight: "100vh", margin: 0 }}>
        <div style={{ textAlign: "center" }}>
          <h1>문제가 발생했습니다</h1>
          <p>서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.</p>
          <button type="button" onClick={reset}>
            다시 시도
          </button>
        </div>
      </body>
    </html>
  );
}
