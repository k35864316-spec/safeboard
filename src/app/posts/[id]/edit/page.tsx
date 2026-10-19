import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import PostForm from "@/components/PostForm";
import { getSession } from "@/lib/auth/session";
import { getPostDetail } from "@/lib/services/posts";

export const metadata: Metadata = { title: "글 수정" };

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[a-f0-9]{24}$/i.test(id)) notFound();

  const session = await getSession();
  if (!session) redirect("/login");

  const post = await getPostDetail(id, session.user);
  if (!post) notFound();
  // [작성자 본인 확인] 화면 진입 단계에서도 한 번 막는다. (실제 수정 API 에서도 서버가 다시 검사한다)
  if (!post.isMine) redirect(`/posts/${id}`);

  return (
    <PostForm
      mode="edit"
      postId={post.id}
      initial={{ title: post.title, content: post.content, isSecret: post.isSecret }}
    />
  );
}
