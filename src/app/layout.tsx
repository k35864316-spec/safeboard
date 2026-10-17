import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import Header from "@/components/Header";
import { getSession } from "@/lib/auth/session";

// 요청마다 CSP nonce 를 새로 만들어 적용해야 하므로 항상 동적으로 렌더링한다.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "세이프보드", template: "%s · 세이프보드" },
  description: "웹 보안 기법을 적용한 게시판",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  return (
    <html lang="ko">
      <body>
        <AuthProvider value={{ user: session?.user ?? null, csrfToken: session?.csrfToken ?? null }}>
          <Header user={session?.user ?? null} />
          <main className="container main">{children}</main>
          <footer className="site-footer">
            <div className="container">웹서버보안프로그래밍 팀 프로젝트</div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
