import type { Metadata } from "next";
import { redirect } from "next/navigation";
import PostForm from "@/components/PostForm";
import { getSession } from "@/lib/auth/session";

export const metadata: Metadata = { title: "글쓰기" };

export default async function NewPostPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  return <PostForm mode="create" />;
}
