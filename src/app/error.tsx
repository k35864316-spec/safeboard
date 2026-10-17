"use client";

/**
 * [서버 에러 숨김] 페이지 렌더링 중 오류(예: DB 연결 실패)가 나도
 * 오류 내용·쿼리·스택트레이스를 화면에 보여주지 않고 표준 안내 문구만 보여준다.
 * (error.message 를 일부러 출력하지 않는다. 상세 내용은 서버 콘솔에만 남는다)
 */
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="card empty-card">
      <h1 className="page-title">문제가 발생했습니다</h1>
      <p className="muted">서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.</p>
      <button type="button" className="btn btn-primary" onClick={reset}>
        다시 시도
      </button>
    </div>
  );
}
