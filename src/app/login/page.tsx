import type { Metadata } from "next";
import { redirect } from "next/navigation";
import LoginForm from "@/components/LoginForm";
import { getSession } from "@/lib/auth/session";
import { firstParam } from "@/lib/security/validate";

export const metadata: Metadata = { title: "로그인" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ registered?: string | string[] }>;
}) {
  if (await getSession()) redirect("/board");
  const sp = await searchParams;
  return <LoginForm registered={firstParam(sp.registered) === "1"} />;
}
