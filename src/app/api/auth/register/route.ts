import { handle, HttpError, json, readJson } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import { hashPassword } from "@/lib/auth/password";
import { validateNewPassword, validateUsername } from "@/lib/security/validate";

export const POST = handle(async (req) => {
  const body = await readJson(req);
  const username = validateUsername(body.username);
  const password = validateNewPassword(body.password);

  await connectDB();
  if (await User.exists({ username })) {
    throw new HttpError(409, "이미 사용 중인 아이디입니다.");
  }

  // 평문 비밀번호 대신 bcrypt 해시만 저장
  const passwordHash = await hashPassword(password);
  try {
    await User.create({ username, passwordHash });
  } catch (err) {
    if ((err as { code?: number }).code === 11000) {
      throw new HttpError(409, "이미 사용 중인 아이디입니다.");
    }
    throw err;
  }

  return json({ ok: true }, 201);
});
