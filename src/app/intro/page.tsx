import { redirect } from "next/navigation";

// 소개 페이지는 첫 화면(/)으로 합쳤다. 예전 주소로 들어오면 첫 화면으로 보낸다.
export default function IntroMovedPage() {
  redirect("/");
}
