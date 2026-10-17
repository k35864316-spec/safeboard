# 🛡️ 세이프보드 (SafeBoard)

웹서버보안프로그래밍 팀 프로젝트 — **로그인 기능이 있는 보안 강화 게시판**

게시판의 각 기능마다 자주 쓰이는 공격을 하나씩 정하고, 알맞은 방어 기법을 적용해 공격이 통하지 않게 만드는 프로젝트입니다.

- **기술 스택**: Next.js (App Router) · React · TypeScript · MongoDB(Mongoose) · bcryptjs
- **개발 환경**: VS Code, Node.js 20.9 이상

> ⚠️ **현재 상태: 인젝션 · XSS · CSRF 방어는 아직 구현하지 않았습니다.**
> 세 가지 방어는 일부러 꺼 둔 상태이므로 이 코드는 **의도적으로 취약**합니다.
> 로컬(`localhost`)에서만 실행하고, 인터넷에 배포하거나 외부에서 접속할 수 있게 열어 두지 마세요.
> 꺼 둔 위치에는 코드에 `[미구현]` 주석이 달려 있어 검색(`Ctrl+Shift+F` → `[미구현]`)으로 바로 찾을 수 있습니다.

---

## 1. 화면 구성

| 주소 | 설명 | 로그인 |
|---|---|---|
| `/` | **메인 소개 페이지** (프로젝트 소개, 보안 기능 카드). `npm run dev` 후 첫 화면 | 불필요 |
| `/login`, `/register` | 로그인 · 회원가입 | 불필요 |
| `/board` | **게시판** (목록 · 검색 · 페이징 · 조회수 · 글쓰기 버튼) | 필요 |
| `/posts/[id]` | 글 상세 · 댓글 (열 때마다 조회수 +1) | 필요 |
| `/posts/new`, `/posts/[id]/edit` | 글쓰기 · 수정 | 필요 |

- 로그인하지 않고 `/board`, `/posts/...` 로 들어가면 로그인 화면으로 이동합니다. 글 목록·상세를 가져오는 API 도 로그인이 필요합니다(401).
- 헤더(로그인 후): 로고 · `메인` · `게시판` · 사용자 이름 · `로그아웃`
- 소개 페이지의 카드(입력값 검증·인젝션, XSS, CSRF, 비밀번호 해시·세션, 접근 제어, 오류 숨김)는 **목표로 한 보안 기능 설명**입니다. 구현 현황은 아래 2번 표를 기준으로 보세요.

---

## 2. 보안 기능 구현 현황

| 보안 기능 | 현황 | 내용 | 파일 |
|---|---|---|---|
| NoSQL 인젝션 방어 | ❌ **미구현** | 입력값 타입 검사 없음, Mongoose `sanitizeFilter` 꺼짐, 검색어 이스케이프 없음 | `lib/security/validate.ts`, `lib/db.ts`, `lib/services/posts.ts`, `api/auth/login/route.ts` |
| XSS 방어 | ❌ **미구현** | 저장 전 특수문자 치환 없음, 제목·본문·댓글을 HTML 그대로 출력(`dangerouslySetInnerHTML`), CSP 헤더 없음 | `lib/services/posts.ts`, `app/board/page.tsx`, `app/posts/[id]/page.tsx`, `components/CommentSection.tsx`, `src/proxy.ts` |
| CSRF 방어 | ❌ **미구현** | CSRF 토큰·Origin 검증 없음, 쿠키 `SameSite` 미지정 | `lib/auth/session.ts`, `api/auth/logout/route.ts` |
| 비밀번호 해시 | ✅ 구현 | bcrypt(cost 12, 솔트 자동 포함). 조회 시 기본 제외(`select:false`) | `lib/auth/password.ts`, `lib/models/User.ts` |
| 안전한 세션 | ✅ 구현 | HttpOnly 쿠키(`COOKIE_SECURE=true` 시 Secure), 로그인마다 새 세션 토큰 발급, DB 에는 토큰 해시만 저장, 2시간 만료(TTL 인덱스) | `lib/auth/session.ts`, `lib/models/Session.ts` |
| 무작위 대입 차단 | ✅ 구현 | 아이디당 5회 실패 시 5분 차단. 없는 아이디도 동일하게 처리 | `lib/auth/rateLimit.ts`, `api/auth/login/route.ts` |
| 접근 제어 | ✅ 구현 | 글·댓글 수정·삭제는 작성자 본인만(서버에서 확인). 비밀글은 작성자·관리자만 열람 — 권한이 없으면 서버가 제목·본문을 내려보내지 않고, 검색에서도 제외 | `lib/services/posts.ts` |
| 로그인 필수 열람 | ✅ 구현 | 비로그인은 게시판·글 상세 접근 불가 | `app/board/page.tsx`, `app/posts/[id]/page.tsx`, `api/posts/*` |
| 오류 정보 숨김 | ✅ 구현 | 모든 API 를 `handle()` 로 감싸 상세 오류는 서버 로그에만 기록, 화면에는 일반 문구만 표시 | `lib/api.ts`, `app/error.tsx` |
| 보안 응답 헤더 | ✅ 구현 | `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `X-Powered-By` 제거 | `next.config.ts` |
| 입력 길이·빈 값 검사 | ✅ 구현 | 아이디 4~20자(영문 소문자·숫자·밑줄), 비밀번호 8~64자(영문+숫자), 제목 100 / 내용 5000 / 댓글 500자 (회원가입·글·댓글) | `lib/security/validate.ts` |

> 인젝션·XSS·CSRF 는 방어 코드를 제거했을 뿐 파일(`lib/security/escape.ts`, `lib/security/csrf.ts` 등)은 남아 있습니다. 나중에 구현할 때 이 파일들과 `[미구현]` 주석을 참고하세요.
> 프로젝트에는 파일 업로드 기능이 없어서 업로드 검증은 해당하지 않습니다.

---

## 3. 실행 방법

### ① 준비

1. **Node.js 20.9 이상** 설치 (`node -v` 로 확인, [nodejs.org](https://nodejs.org) LTS)
2. 저장소를 받습니다.
   ```bash
   git clone https://github.com/k35864316-spec/safeboard.git
   cd safeboard
   ```
3. VS Code 에서 `safeboard` 폴더를 엽니다. (**파일 → 폴더 열기**)

### ② 환경변수 만들기

`.env.local` 은 비밀번호가 들어가므로 저장소에 올라가지 않습니다. `.env.example` 을 복사해서 만드세요.

```bash
cp .env.example .env.local        # Windows(cmd): copy .env.example .env.local
```

`.env.local` 의 `MONGODB_URI` 를 사용할 MongoDB 에 맞게 수정합니다.

### ③ MongoDB 준비 (택 1)

| 방법 | 설명 |
|---|---|
| **MongoDB Atlas (무료)** | 클러스터를 만들고 **Database Access** 에서 DB 사용자를, **Network Access** 에서 접속 허용 IP 를 등록한 뒤, 연결 문자열을 `MONGODB_URI` 에 입력. 형식: `mongodb+srv://아이디:비밀번호@cluster0.xxxxx.mongodb.net/safeboard?retryWrites=true&w=majority` (DB 이름 `/safeboard` 를 꼭 넣으세요. 비밀번호의 특수문자는 URL 인코딩 필요) |
| Docker | [Docker Desktop](https://www.docker.com/products/docker-desktop/) 실행 후 `npm run db:up` (기본값 `mongodb://127.0.0.1:27017/safeboard` 그대로 사용) |
| 로컬 설치 | [MongoDB Community Server](https://www.mongodb.com/try/download/community) 설치 후 서비스 실행 (포트 27017) |

### ④ 실행

```bash
npm install        # 패키지 설치 (처음 한 번)
npm run seed       # 관리자·일반 계정 생성 (처음 한 번, 게시글은 만들지 않음)
npm run dev        # 개발 서버 → http://localhost:3000  (메인 소개 페이지가 먼저 나옵니다)
```

- `npm run dev` 를 실행하면 시작 전에 MongoDB 연결을 점검해서, 연결이 안 되면 해결 방법을 터미널에 안내합니다. 연결되면 `✅ MongoDB 연결 확인 완료` 가 출력됩니다.
- 코드를 바꿨는데 반영이 안 되면(특히 `models/` 의 스키마를 바꾼 경우) `Ctrl+C` 로 서버를 끄고 `npm run dev` 를 다시 실행하세요.
- 운영 모드: `npm run build && npm start`

### 테스트용 계정 (`npm run seed` 로 생성)

| 구분 | 아이디 | 비밀번호 |
|---|---|---|
| 관리자 | `admin` | `admin` (`ADMIN_PASSWORD=...` 환경변수로 변경 가능) |
| 일반 | `student1` | `Student1234!` |

- `admin` 계정은 DB 에 없으면 **`admin` 으로 로그인을 시도하는 순간 자동으로 만들어집니다**(seed 를 안 해도 됨). 비밀번호는 환경변수 `ADMIN_PASSWORD`, 없으면 `admin` 입니다. Vercel 에서는 Settings → Environment Variables 에 `ADMIN_PASSWORD` 를 추가하면 됩니다.
- seed 는 이미 있는 계정은 건너뜁니다. 비밀번호를 바꾸려면 DB 의 `users` 에서 해당 계정을 지운 뒤 다시 실행하세요.
- ⚠️ 개발용 계정입니다. 실제로 쓰는 곳에서는 사용하지 마세요.

### 자주 막히는 문제

| 증상 | 해결 |
|---|---|
| “서버 오류가 발생했습니다” | MongoDB 연결 문제가 대부분입니다. 정확한 원인은 **터미널 로그**에서 확인합니다 (화면에는 상세 오류를 숨깁니다). `.env.local` 의 `MONGODB_URI` 주소·비밀번호, Atlas Network Access 를 확인 |
| `npm install` 에서 `package.json` 을 못 찾는다는 오류 | 폴더 위치가 틀린 경우입니다. `package.json` 이 있는 폴더에서 실행하거나, 그 폴더의 `setup-windows.bat` 을 더블클릭 |
| 로그인이 안 됨 | `npm run seed` 를 했는지 확인 (아니면 회원가입으로 계정을 만드세요) |
| 5회 틀려서 로그인이 막힘 | 정상 동작입니다. 5분 뒤 다시 시도하세요 |
| 조회수가 안 올라감 | 서버를 껐다가 다시 켜세요 (스키마 변경이 반영되지 않은 경우) |
| 포트 3000 사용 중 | `npm run dev -- -p 3001` |

---

## 4. 현재 상태에서 확인할 수 있는 동작 (미구현 방어 시연)

방어가 꺼져 있으므로 아래가 **그대로 통과**합니다. 로컬에서만 확인하세요.

- **XSS**: 로그인 후 글쓰기에서 내용에 `<script>alert('xss')</script>` 를 입력하고 저장한 뒤 글을 열면 경고창이 뜹니다.
- **CSRF**: 로그인한 상태에서 브라우저 Console 에 아래를 실행하면 CSRF 토큰 없이도 글이 작성됩니다.
  ```js
  fetch("/api/posts", { method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "위조", content: "토큰 없음" }) }).then(r => console.log(r.status))
  ```
- **인젝션**: 로그인 요청의 아이디에 `{ "$ne": null }` 같은 객체를 보내도 서버가 형식 오류(400)로 거절하지 않고 쿼리까지 그대로 전달합니다.

방어를 구현한 뒤에는 위 요청이 각각 막히는지(경고창 없음 / 403 / 400) 확인하면 됩니다.

---

## 5. 폴더 구조

```
safeboard/
├─ scripts/
│  ├─ seed.ts                   # 개발용 계정 생성 (게시글은 만들지 않음)
│  └─ check-db.mjs              # npm run dev 시작 전 MongoDB 연결 점검
├─ src/
│  ├─ proxy.ts                  # (CSP 헤더 — 현재 미구현, 아무 것도 하지 않음)
│  ├─ app/
│  │  ├─ page.tsx               # 메인 소개 페이지 (/)
│  │  ├─ board/                 # 게시판: 목록 · 검색 · 페이징 · 조회수 · 글쓰기 버튼
│  │  ├─ posts/                 # 상세 · 글쓰기 · 수정
│  │  ├─ login/  register/      # 로그인 · 회원가입
│  │  ├─ intro/  security/      # 옛 주소 → 메인(/)으로 이동
│  │  ├─ error.tsx, global-error.tsx, not-found.tsx   # 에러 숨김
│  │  └─ api/
│  │     ├─ auth/               # register · login · logout
│  │     ├─ posts/              # 글 목록·CRUD · 댓글 작성
│  │     └─ comments/           # 댓글 삭제
│  ├─ components/               # Header · Landing(소개) · 폼 · 댓글 · 페이징 등
│  └─ lib/
│     ├─ db.ts                  # MongoDB 연결
│     ├─ api.ts                 # API 공통 래퍼(에러 숨김)
│     ├─ securityTopics.ts      # 소개 페이지 카드 내용
│     ├─ models/                # User · Post(조회수 포함) · Comment · Session · LoginAttempt
│     ├─ auth/                  # password · session · rateLimit
│     ├─ security/              # escape · validate · csrf (일부 방어는 현재 꺼져 있음)
│     └─ services/posts.ts      # 게시글/댓글 로직 (작성자 확인, 비밀글, 조회수)
```

---

## 6. 한계와 개선 아이디어

- **인젝션 · XSS · CSRF 방어 구현**: 현재 가장 먼저 해야 할 일입니다. 입력값 타입 검사와 `sanitizeFilter`, 저장·출력 이스케이프와 CSP, CSRF 토큰과 `SameSite` 쿠키가 대표적인 방어입니다.
- **로그인 차단 기준이 “아이디”**라서, 공격자가 특정 계정을 일부러 잠가버릴 수 있습니다(계정 잠금 DoS). 실서비스에서는 IP·기기 정보나 CAPTCHA 를 함께 씁니다.
- **조회수**는 새로고침할 때마다, 댓글을 쓰거나 지울 때도 올라갑니다. 사람당 한 번만 세는 중복 방지는 없습니다.
- **HTTPS 배포 시** `.env.local` 에 `COOKIE_SECURE=true` 를 설정해 세션 쿠키에 `Secure` 속성을 붙이세요. (배포는 방어 구현 후에 하세요)
- 이메일 인증, 비밀번호 재설정, 파일 업로드, 관리자 페이지 등은 범위에서 제외했습니다.
