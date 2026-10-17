import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import type { SessionUser } from "@/lib/auth/session";

export default function Header({ user }: { user: SessionUser | null }) {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href="/" className="logo">
          <span aria-hidden="true">🛡️</span> 세이프보드
        </Link>
        <nav className="nav" aria-label="주 메뉴">
          {user ? (
            <>
              <Link href="/" className="btn btn-ghost">
                메인
              </Link>
              <Link href="/board" className="btn btn-ghost">
                게시판
              </Link>
              <span className="nav-user">
                {user.username}
                {user.role === "admin" && <span className="badge badge-admin">관리자</span>}
              </span>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost">
                로그인
              </Link>
              <Link href="/register" className="btn btn-primary">
                회원가입
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
