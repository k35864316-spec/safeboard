import Link from "next/link";

const WINDOW = 5;

function href(page: number, q: string) {
  const params = new URLSearchParams();
  if (page > 1) params.set("page", String(page));
  if (q) params.set("q", q);
  const qs = params.toString();
  return qs ? `/board?${qs}` : "/board";
}

/** 1 · 2 · 3 … 페이지 번호 (현재 페이지 기준으로 최대 5개씩 표시) */
export default function Pagination({ page, totalPages, q }: { page: number; totalPages: number; q: string }) {
  if (totalPages <= 1) return null;

  let start = Math.max(1, page - Math.floor(WINDOW / 2));
  const end = Math.min(totalPages, start + WINDOW - 1);
  start = Math.max(1, end - WINDOW + 1);
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  return (
    <nav className="pagination" aria-label="페이지 이동">
      {page > 1 ? (
        <Link href={href(page - 1, q)} className="page-link" aria-label="이전 페이지">
          ‹
        </Link>
      ) : (
        <span className="page-link page-disabled" aria-hidden="true">
          ‹
        </span>
      )}
      {pages.map((p) =>
        p === page ? (
          <span key={p} className="page-link page-current" aria-current="page">
            {p}
          </span>
        ) : (
          <Link key={p} href={href(p, q)} className="page-link">
            {p}
          </Link>
        ),
      )}
      {page < totalPages ? (
        <Link href={href(page + 1, q)} className="page-link" aria-label="다음 페이지">
          ›
        </Link>
      ) : (
        <span className="page-link page-disabled" aria-hidden="true">
          ›
        </span>
      )}
    </nav>
  );
}
