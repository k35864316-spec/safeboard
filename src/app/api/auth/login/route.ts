import { handle, HttpError, json, readJson } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import { DUMMY_HASH, verifyPassword } from "@/lib/auth/password";
import { issueNewSession } from "@/lib/auth/session";
import {
  clearLoginFailures,
  getLockRemainingSeconds,
  recordLoginFailure,
} from "@/lib/auth/rateLimit";

const LOCKED_MESSAGE = (seconds: number) =>
  `로그인을 5회 실패하여 잠시 차단되었습니다. ${Math.ceil(seconds / 60)}분 후에 다시 시도해 주세요.`;

export const POST = handle(async (req) => {
  const body = await readJson(req);

  // [NoSQL Injection 차단] 아이디/비밀번호는 반드시 "문자열"이어야 한다.
  // {"username": {"$ne": null}} 같은 연산자 객체는 이 검증에서 400 으로 거절된다.
  // [미구현] 입력값 검증 없이 요청에 담긴 값을 그대로 사용한다. (타입·형식 검사 없음)
  const rawUsername = body.username as string;
  const username = typeof rawUsername === "string" ? rawUsername.trim().toLowerCase() : rawUsername;
  const password = body.password as string;

  // [무작위 대입 차단] 이미 잠긴 아이디라면 비밀번호 검사조차 하지 않고 거절
  const lockedFor = await getLockRemainingSeconds(username);
  if (lockedFor > 0) throw new HttpError(429, LOCKED_MESSAGE(lockedFor));

  await connectDB();
  const user = await User.findOne({ username }).select("+passwordHash");

  // 아이디가 없어도 bcrypt 비교를 똑같이 수행 (응답 시간으로 가입 여부를 추측하지 못하게)
  const ok = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);

  if (!user || !ok) {
    const { locked, remaining } = await recordLoginFailure(username);
    if (locked) throw new HttpError(429, LOCKED_MESSAGE(5 * 60));
    // 아이디 존재 여부와 상관없이 항상 같은 문구를 사용
    throw new HttpError(401, `아이디 또는 비밀번호가 올바르지 않습니다. (남은 시도 ${remaining}회)`);
  }

  await clearLoginFailures(username);

  // [세션 쿠키 보안] 로그인 성공 시마다 새 세션 토큰을 발급하고 HttpOnly 쿠키로 내려준다.
  await issueNewSession(String(user._id));

  return json({ user: { username: user.username, role: user.role } });
});
