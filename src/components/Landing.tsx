import Link from "next/link";
import { TOPICS } from "@/lib/securityTopics";

// 인젝션·XSS·CSRF 방어는 아직 구현하지 않아 소개 카드에서 제외한다.
const HIDDEN = new Set(["injection", "xss", "csrf"]);
const SHOWN = TOPICS.filter((t) => !HIDDEN.has(t.slug));

export default function Landing({ loggedIn = false }: { loggedIn?: boolean }) {
  return (
    <div className="landing">
      <section className="hero card">
        <p className="hero-kicker">웹서버보안프로그래밍 팀 프로젝트</p>
        <h1 className="hero-title">
          <span aria-hidden="true">🛡️</span> 보안을 기능마다 적용한 게시판
        </h1>
        <p className="hero-desc">
          게시판의 각 기능에 대응하는 웹 취약점을 찾고, 그에 맞는 보안 기능을 단계적으로 적용하고 있습니다.
          {loggedIn ? "상단의 게시판 메뉴에서 게시판을 이용할 수 있습니다." : "회원가입 후 로그인하면 게시판을 이용할 수 있습니다."}
        </p>
        <div className="hero-actions">
          {loggedIn ? (
            <Link href="/board" className="btn btn-primary">
              게시판으로 가기
            </Link>
          ) : (
            <>
              <Link href="/login" className="btn btn-primary">
                로그인
              </Link>
              <Link href="/register" className="btn btn-ghost">
                회원가입
              </Link>
            </>
          )}
        </div>
      </section>

      <h2 className="section-title">적용한 보안 기능</h2>
      <div className="feature-grid">
        {SHOWN.map((t) => (
          <article key={t.slug} className="card feature">
            <h3 className="feature-title">
              <span aria-hidden="true">{t.icon}</span> {t.title}
            </h3>
            <p className="feature-sum">{t.summary}</p>
          </article>
        ))}
      </div>

      <p className="muted landing-note">
        팀원 · 정용훈(팀장) · 김명준 · 조서원 &nbsp;|&nbsp; Next.js · TypeScript · MongoDB(Mongoose)
      </p>
    </div>
  );
}
