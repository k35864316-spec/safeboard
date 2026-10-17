import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import CommentSection from "@/components/CommentSection";
import DeletePostButton from "@/components/DeletePostButton";
import { getSession } from "@/lib/auth/session";
import { formatDate } from "@/lib/format";
import { getComments, getPostDetail, incrementViews } from "@/lib/services/posts";

export const metadata: Metadata = { title: "게시글" };

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[a-f0-9]{24}$/i.test(id)) notFound();

  const session = await getSession();
  // 로그인하지 않으면 글 내용을 볼 수 없다.
  if (!session) redirect("/login");
  const viewer = session.user;
  const post = await getPostDetail(id, viewer);
  if (!post) notFound();

  // 열람 권한이 있는 글만 조회수를 올린다. (화면에는 이번 조회가 반영된 값을 보여 준다)
  if (!post.locked) {
    await incrementViews(id);
    post.views += 1;
  }

  const comments = post.locked ? [] : await getComments(id, viewer);

  return (
    <article>
      <div className="card post-card">
        {post.locked ? (
          <div className="locked-panel">
            <p className="locked-icon" aria-hidden="true">
              🔒
            </p>
            <h1 className="page-title">비밀글입니다</h1>
            <p className="muted">작성자 본인과 관리자만 볼 수 있는 글입니다.</p>
          </div>
        ) : (
          <>
            <h1 className="post-heading">
              {post.isSecret && <span aria-label="비밀글">🔒 </span>}
              <span dangerouslySetInnerHTML={{ __html: post.title }} />
            </h1>
            <div className="post-meta muted">
              <span>{post.authorName}</span>
              <span>{formatDate(post.createdAt)}</span>
              <span>조회 {post.views}</span>
              {post.updatedAt !== post.createdAt && <span>(수정됨 {formatDate(post.updatedAt)})</span>}
            </div>
            {/* [미구현] XSS 방어 없음: 본문을 HTML 그대로 출력한다 */}
            <div className="post-content" dangerouslySetInnerHTML={{ __html: post.content }} />
          </>
        )}

        <div className="post-actions">
          <Link href="/board" className="btn btn-ghost">
            목록
          </Link>
          {post.isMine && (
            <>
              <Link href={`/posts/${post.id}/edit`} className="btn btn-ghost">
                수정
              </Link>
              <DeletePostButton postId={post.id} />
            </>
          )}
        </div>
      </div>

      {!post.locked && (
        <CommentSection
          postId={post.id}
          comments={comments.map((c) => ({
            id: c.id,
            content: c.content,
            authorName: c.authorName,
            isMine: c.isMine,
            createdAt: formatDate(c.createdAt),
          }))}
        />
      )}
    </article>
  );
}
