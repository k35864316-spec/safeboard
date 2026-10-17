# 🛡️ 세이프보드 (SafeBoard)

웹서버보안프로그래밍 팀 프로젝트 — **로그인 기능이 있는 보안 강화 게시판**

게시판의 각 기능마다 실제로 자주 쓰이는 공격을 하나씩 정해서, 알맞은 방어 기법을 적용해 공격이 통하지 않게 만든 프로젝트입니다.
(팀 회의록 2026-10-02 기준)

- **기술 스택**: Next.js (App Router) · React · TypeScript · MongoDB(Mongoose) · bcryptjs
- **개발 환경**: VSCode, Node.js 20.9 이상

---

## 1. 실행 방법

### ① VS Code 에서 열기

1. 압축을 풀고 VS Code 에서 **파일 → 폴더 열기**로 `safeboard` 폴더를 엽니다.
2. 오른쪽 아래 “권장 확장 설치” 알림이 뜨면 설치합니다. (MongoDB for VS Code, Docker)
3. **Node.js 20.9 이상**이 필요합니다. `node -v` 로 확인하세요. (없으면 [nodejs.org](https://nodejs.org) 의 LTS 설치)
4. 터미널을 엽니다: **`` Ctrl + ` ``** (맥: `` ⌃ + ` ``)

> `.env.local`(환경변수)은 이미 들어 있어서 따로 만들 필요가 없습니다.

### ② MongoDB 준비 (택 1)

| 방법 | 설명 |
|---|---|
| **Docker (가장 쉬움)** | [Docker Desktop](https://www.docker.com/products/docker-desktop/) 설치·실행 후 `npm run db:up` |
| 로컬 설치 | [MongoDB Community Server](https://www.mongodb.com/try/download/community) 설치 후 서비스 실행 (기본 포트 27017) |
| MongoDB Atlas | 무료 클러스터를 만들고 연결 문자열을 `.env.local` 의 `MONGODB_URI` 에 입력 |

### ③ 프로젝트 실행

```bash
npm install        # 패키지 설치 (처음 한 번)
npm run seed       # 관리자/일반 계정 + 샘플 게시글 생성 (처음 한 번)
npm run dev        # 개발 서버 → http://localhost:3000
```

`npm run dev` 를 실행하면 시작 전에 MongoDB 연결을 자동으로 점검해서, 연결이 안 되면 해결 방법을 터미널에 안내합니다.
운영 모드로 확인하려면: `npm run build && npm start`

### VS Code 편의 기능

- **실행 및 디버그(F5)**: `세이프보드: 서버 디버그` 를 선택하면 중단점을 걸고 서버 코드를 디버깅할 수 있습니다.
- **작업 실행(`Ctrl+Shift+P` → `Tasks: Run Task`)**: MongoDB 켜기 / 시드 데이터 생성 / 개발 서버 실행 / 타입 검사
- **MongoDB for VS Code**: 왼쪽 MongoDB 아이콘 → 연결 추가 → `mongodb://127.0.0.1:27017` 로 `safeboard` DB 의 `users`, `posts` 컬렉션을 직접 확인할 수 있습니다. (비밀번호가 평문이 아니라 bcrypt 해시로 저장된 것을 발표에서 보여주기 좋습니다)

### 자주 막히는 문제

| 증상 | 해결 |
|---|---|
| 화면에 “서버 오류가 발생했습니다” | MongoDB 가 꺼져 있는 경우가 대부분입니다. `npm run db:up` 후 새로고침. 정확한 원인은 **터미널 로그**에서 확인합니다 (보안상 화면에는 상세 오류를 숨깁니다) |
| `npm install` 에서 `package.json` 을 못 찾는다는 오류 | 폴더 위치가 틀린 경우입니다. `package.json` 이 있는 폴더의 **`setup-windows.bat` 을 더블클릭**하면 그 폴더에서 설치를 진행하고, 문제가 있으면 원인을 화면에 보여 줍니다 |
| `npm run db:up` 실패 | Docker Desktop 이 실행 중인지 확인 |
| 로그인이 안 됨 | `npm run seed` 를 했는지 확인 (아니면 회원가입으로 계정을 만드세요) |
| 5회 틀려서 로그인이 막힘 | 정상 동작입니다. 5분 뒤 다시 시도하세요 |
| 포트 3000 사용 중 | `npm run dev -- -p 3001` |

### ③ 테스트용 계정 (`npm run seed` 로 생성)

| 구분 | 아이디 | 비밀번호 |
|---|---|---|
| 관리자 | `admin` | `Admin1234!` (`.env.local` 의 `ADMIN_PASSWORD` 로 변경 가능) |
| 일반 | `student1` | `Student1234!` |

> ⚠️ 개발용 계정입니다. 실제로 배포한다면 반드시 비밀번호를 바꾸거나 계정을 삭제하세요.

---

## 2. 기능 ↔ 보안 대응표 (회의록 5번 항목)

### A. 로그인 및 세션 관리 — 김명준

| 기능 | 방어하는 공격 | 구현 내용 | 파일 |
|---|---|---|---|
| 비밀번호 해싱 | DB 유출 시 비밀번호 노출 | bcrypt(cost 12) 해시만 저장, 조회 시 기본 제외(`select:false`) | `lib/auth/password.ts`, `lib/models/User.ts` |
| NoSQL 인젝션 차단 | `{"$ne":null}` 로 비밀번호 없이 로그인 | 아이디·비밀번호가 **문자열이 아니면 400 거절** + Mongoose `sanitizeFilter`(2차 방어선) | `lib/security/validate.ts`, `lib/db.ts` |
| 무작위 대입 차단 | 비밀번호 대입 공격 | **5회 실패 시 5분 차단**(Rate Limit). 없는 아이디도 동일하게 처리 | `lib/auth/rateLimit.ts`, `api/auth/login/route.ts` |
| 세션 쿠키 보안 | 세션 탈취(XSS), 세션 고정 | **HttpOnly** + SameSite=Lax 쿠키, **로그인 때마다 새 세션 토큰 발급**(기존 세션 폐기), DB에는 토큰 해시만 저장 | `lib/auth/session.ts`, `lib/models/Session.ts` |

### B. 게시글 및 댓글 작성 — 정용훈

| 기능 | 방어하는 공격 | 구현 내용 | 파일 |
|---|---|---|---|
| XSS 방어 | 게시글/댓글에 악성 스크립트 삽입 | `< > & " '` 를 `&lt; &gt; …` 글자로 **치환해서 저장**, 출력은 React 텍스트로만 (`dangerouslySetInnerHTML` 미사용) | `lib/security/escape.ts`, `lib/services/posts.ts` |
| 입력값 검사 | 비정상 데이터 | 빈 값·공백·글자 수 초과(제목 100 / 내용 5000 / 댓글 500자)를 **서버에서 검증** | `lib/security/validate.ts` |
| 스크립트 실행 제한(CSP) | 인라인 스크립트 실행 | 요청마다 **nonce 기반 CSP 헤더** 적용 — nonce 없는 스크립트는 실행 불가 | `src/proxy.ts`, `next.config.ts` |

### C. 비밀글 및 상태 변경 — 조서원

| 기능 | 방어하는 공격 | 구현 내용 | 파일 |
|---|---|---|---|
| CSRF 방어 | 사용자 몰래 글 작성·수정·삭제 | 세션별 CSRF 토큰을 `x-csrf-token` 헤더와 대조(타이밍 안전 비교) + Origin 확인 | `lib/security/csrf.ts`, `lib/auth/session.ts` |
| 작성자 본인 확인 | 남의 글 수정·삭제 | 세션의 사용자 ID 와 DB 글 작성자 ID 를 **서버에서** 대조 | `lib/services/posts.ts` |
| 비밀글 열람 제한 | 비밀글 무단 열람 | 작성자·관리자가 아니면 제목/본문을 **서버에서 아예 내려보내지 않고** “비밀글입니다” 표시. 검색으로 비밀글 내용을 추측하는 것도 차단 | `lib/services/posts.ts` |

### 공통 — 기본 게시판 기능

| 기능 | 구현 내용 | 파일 |
|---|---|---|
| DB 구조 설계 | `User`, `Post`, `Comment` 컬렉션 (+ 보안용 `Session`, `LoginAttempt`) | `lib/models/*` |
| 기본 화면 및 CRUD | 글 목록, **페이징(1·2·3…)**, 검색창, 작성·수정·삭제, 댓글 | `app/page.tsx`, `app/posts/*`, `components/*` |
| 서버 에러 숨김 | 모든 API 를 `handle()` 로 감싸 **상세 오류는 서버 콘솔에만 기록**, 화면에는 표준 안내 문구만 표시. 페이지 오류도 `error.tsx` 가 동일하게 처리 | `lib/api.ts`, `app/error.tsx` |

---

## 3. 보안 동작 직접 확인하기 (시연용)

서버를 켠 상태에서 터미널로 실행해 보세요. (`npm run seed` 를 먼저 실행)

**① NoSQL 인젝션 차단** — 비밀번호 없이 로그인을 시도

```bash
curl -i -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":{"$ne":null},"password":{"$ne":null}}'
# → 400 Bad Request  {"error":"아이디 형식이 올바르지 않습니다."}
```

**② 무작위 대입 차단** — 틀린 비밀번호를 연속 시도

```bash
for i in 1 2 3 4 5 6; do
  curl -s -X POST http://localhost:3000/api/auth/login \
    -H 'Content-Type: application/json' \
    -d '{"username":"student1","password":"wrong1234"}'; echo
done
# → 1~4번째: 401 (남은 시도 4→1회), 5번째부터: 429 (5분 차단)
```

**③ XSS 방어** — 브라우저에서 로그인 후 글쓰기 → 제목/내용에 아래를 입력하고 등록

```
<script>alert('xss')</script>
<img src=x onerror=alert(1)>
```

→ 경고창이 뜨지 않고 **글자 그대로** 화면에 표시되면 성공 (시드 데이터에도 예시 글이 있습니다).
개발자도구 → Network → 문서 응답 헤더에서 `Content-Security-Policy` 를 확인할 수 있습니다.

**④ CSRF 방어** — 로그인 쿠키는 있지만 CSRF 토큰이 없는 위조 요청

```bash
curl -s -c jar.txt -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' -d '{"username":"student1","password":"Student1234!"}' > /dev/null

curl -i -b jar.txt -X POST http://localhost:3000/api/posts \
  -H 'Content-Type: application/json' -d '{"title":"위조","content":"위조된 요청"}'
# → 403 Forbidden  (CSRF 토큰 불일치)
```

**⑤ 작성자 본인 확인 / 비밀글**
- `student1` 으로 글을 쓰고, 다른 계정(`admin` 은 수정·삭제 불가, 새로 가입한 계정)으로 해당 글의 수정·삭제를 시도 → 403
- `student1` 의 비밀글을 로그아웃 상태 또는 다른 일반 계정으로 열기 → “비밀글입니다”

---

## 4. 폴더 구조

```
safeboard/
├─ scripts/seed.ts              # 개발용 계정/샘플 데이터 생성
├─ src/
│  ├─ proxy.ts                  # [B] CSP(nonce) 헤더
│  ├─ app/
│  │  ├─ page.tsx               # 글 목록 · 검색 · 페이징
│  │  ├─ posts/                 # 상세 · 글쓰기 · 수정
│  │  ├─ login/  register/      # 로그인 · 회원가입
│  │  ├─ error.tsx, global-error.tsx, not-found.tsx   # 에러 숨김
│  │  └─ api/
│  │     ├─ auth/               # [A] register · login · logout
│  │     ├─ posts/              # [B][C] 글 CRUD · 댓글 작성
│  │     └─ comments/           # [C] 댓글 삭제
│  ├─ components/               # 화면 컴포넌트 (폼, 헤더, 댓글, 페이징)
│  └─ lib/
│     ├─ db.ts                  # MongoDB 연결 + sanitizeFilter
│     ├─ api.ts                 # API 공통 래퍼(에러 숨김)
│     ├─ models/                # User · Post · Comment · Session · LoginAttempt
│     ├─ auth/                  # [A] password · session · rateLimit
│     ├─ security/              # [B] escape · validate  [C] csrf
│     └─ services/posts.ts      # [B][C] 게시글/댓글 로직 (작성자 확인, 비밀글)
```

---

## 5. 한계와 개선 아이디어 (발표 때 언급하기 좋은 내용)

- **로그인 차단 기준이 “아이디”**라서, 공격자가 특정 계정을 일부러 잠가버릴 수 있습니다(계정 잠금 DoS). 실서비스에서는 IP·기기 정보와 함께 판단하거나 CAPTCHA 를 추가합니다. IP 는 프록시 헤더로 위조될 수 있어 이번 프로젝트에서는 아이디 기준으로 구현했습니다.
- **CSP 의 `style-src` 는 `'unsafe-inline'`** 입니다. 스크립트 실행(`script-src`)은 nonce 로 엄격하게 제한했지만, 스타일은 Next.js/React 호환성을 위해 인라인을 허용했습니다.
- **HTTPS 배포 시** `.env.local` 에 `COOKIE_SECURE=true` 를 설정해 세션 쿠키에 `Secure` 속성을 붙이세요.
- 회원가입 시 이메일 인증, 비밀번호 재설정, 로그인 알림, 관리자 페이지 등은 범위에서 제외했습니다.
