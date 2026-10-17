import Landing from "@/components/Landing";
import { getSession } from "@/lib/auth/session";

// 사이트 첫 화면(메인 소개 페이지). 로그인 여부와 상관없이 항상 이 화면이 나온다.
export default async function HomePage() {
  const session = await getSession();
  return <Landing loggedIn={!!session} />;
}
