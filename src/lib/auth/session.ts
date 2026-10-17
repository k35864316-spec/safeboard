import { createHash, randomBytes } from "node:crypto";
import { cache } from "react";
import { cookies } from "next/headers";
import { connectDB, trusted } from "@/lib/db";
import { Session } from "@/lib/models/Session";
import { User } from "@/lib/models/User";
import { generateCsrfToken } from "@/lib/security/csrf";
import { HttpError } from "@/lib/api";

export const SESSION_COOKIE = "sb_session";
const SESSION_TTL_MS = 2 * 60 * 60 * 1000; // 2시간

export type SessionUser = { id: string; username: string; role: "user" | "admin" };
export type CurrentSession = { user: SessionUser; csrfToken: string };

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

function cookieOptions(expires: Date) {
  return {
    // [세션 쿠키 보안] JavaScript(document.cookie)로 읽을 수 없게 해서 XSS 로 인한 세션 탈취를 막는다.
    httpOnly: true,
    // [미구현] SameSite 속성을 지정하지 않는다. (CSRF 보조 방어 없음)
    secure: process.env.COOKIE_SECURE === "true",
    path: "/",
    expires,
  };
}

/**
 * [로그인 시 새 세션 토큰 발급]
 * 로그인에 성공할 때마다 기존 세션(있다면)을 폐기하고 새 토큰을 발급한다.
 * 로그인 전에 공격자가 심어둔 세션 ID 를 그대로 쓰게 만드는 세션 고정(Session Fixation) 공격을 막는다.
 */
export async function issueNewSession(userId: string) {
  await connectDB();
  const store = await cookies();

  const oldToken = store.get(SESSION_COOKIE)?.value;
  if (typeof oldToken === "string" && oldToken.length > 0) {
    await Session.deleteOne({ tokenHash: sha256(oldToken) });
  }

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await Session.create({
    tokenHash: sha256(token),
    user: userId,
    csrfToken: generateCsrfToken(),
    expiresAt,
  });
  store.set(SESSION_COOKIE, token, cookieOptions(expiresAt));
}

export async function destroyCurrentSession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (typeof token === "string" && token.length > 0) {
    await connectDB();
    await Session.deleteOne({ tokenHash: sha256(token) });
  }
  store.delete(SESSION_COOKIE);
}

/** 현재 요청의 로그인 세션을 반환한다. (없거나 만료됐으면 null) 한 요청 안에서는 결과를 재사용한다. */
export const getSession = cache(async (): Promise<CurrentSession | null> => {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (typeof token !== "string" || !/^[a-f0-9]{64}$/.test(token)) return null;

  await connectDB();
  const session = await Session.findOne({
    tokenHash: sha256(token),
    expiresAt: trusted({ $gt: new Date() }),
  }).lean();
  if (!session) return null;

  const user = await User.findById(session.user).lean();
  if (!user) return null;

  return {
    user: { id: String(user._id), username: user.username, role: user.role === "admin" ? "admin" : "user" },
    csrfToken: session.csrfToken,
  };
});

/** 로그인 필수 API 용: 로그인 안 했으면 401. */
export async function requireSession(): Promise<CurrentSession> {
  const session = await getSession();
  if (!session) throw new HttpError(401, "로그인이 필요합니다.");
  return session;
}

/** 로그인 + CSRF 토큰 검증까지 통과해야 하는 "상태 변경" API 용. */
export async function requireSessionWithCsrf(req: Request): Promise<CurrentSession> {
  // [미구현] CSRF 토큰·Origin 검증 없음. 로그인만 확인한다.
  void req;
  return requireSession();
}
