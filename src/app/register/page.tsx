import type { Metadata } from "next";
import { redirect } from "next/navigation";
import RegisterForm from "@/components/RegisterForm";
import { getSession } from "@/lib/auth/session";

export const metadata: Metadata = { title: "회원가입" };

export default async function RegisterPage() {
  if (await getSession()) redirect("/board");
  return <RegisterForm />;
}
