import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import Pagination from "@/components/Pagination";
import { getSession } from "@/lib/auth/session";
import { formatDate } from "@/lib/format";
import { LIMITS } from "@/lib/limits";
import { firstParam, parsePage, parseSearch } from "@/lib/security/validate";
import { PAGE_SIZE, listPosts } from "@/lib/services/posts";

export const metadata: Metadata = { title: "게시판" };

type SearchParams = Promise<{ page?: string | string[]; q?: string | string[] }>;

export default async function BoardPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const session = await getSession();
  // 로그인하지 않은 사용자는 게시판 내용을 볼 수 없다. → 로그인 화면으로 보낸다.
  if (!session) redirect("/login");
  const { items, page, totalPages, total, q } = await listPosts({
    page: parsePage(firstParam(sp.page)),
    q: parseSearch(firstParam(sp.q)),
    viewer: session.user,
  });

  return (
    <>
      <div className="toolbar">
        <h1 className="page-title">게시판</h1>
        <div className="toolbar-right">
        <form action="/board" method="get" className="search" role="search">
          <input
            type="search"
            name="q"
            defaultValue={q}
            maxLength={LIMITS.SEARCH_MAX}
            placeholder="제목·내용 검색"
            aria-label="검색어"
          />
          <button type="submit" className="btn btn-primary">
            검색
          </button>
        </form>
        <Link href="/posts/new" className="btn btn-primary">
          글쓰기
        </Link>
        </div>
      </div>

      {q && (
        <p className="muted search-info">
          “{q}” 검색 결과 {total}건 · <Link href="/board">전체 보기</Link>
        </p>
      )}

      {items.length === 0 ? (
        <div className="card empty-card">
          <p>{q ? "검색 결과가 없습니다." : "아직 게시글이 없습니다. 첫 글을 작성해 보세요!"}</p>
        </div>
      ) : (
        <ul className="post-list card">
          {items.map((post, i) => (
            <li key={post.id} className="post-row">
              <span className="post-no muted">{total - (page - 1) * PAGE_SIZE - i}</span>
              <Link href={`/posts/${post.id}`} className={post.locked ? "post-title locked" : "post-title"}>
                {post.isSecret && <span aria-label="비밀글">🔒 </span>}
                {/* [미구현] XSS 방어 없음: 제목을 HTML 그대로 출력한다 */}
                <span dangerouslySetInnerHTML={{ __html: post.title }} />
              </Link>
              <span className="post-author">{post.authorName}</span>
              <span className="post-views muted">조회 {post.views}</span>
              <time className="post-date muted" dateTime={post.createdAt}>
                {formatDate(post.createdAt)}
              </time>
            </li>
          ))}
        </ul>
      )}

      <Pagination page={page} totalPages={totalPages} q={q} />
    </>
  );
}
