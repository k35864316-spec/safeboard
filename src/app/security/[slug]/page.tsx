import { redirect } from "next/navigation";

// 보안 기능 설명은 로그인 후 게시판의 게시글로 옮겼다. 예전 주소로 들어오면 첫 화면으로 보낸다.
export default function SecurityMovedPage() {
  redirect("/");
}
