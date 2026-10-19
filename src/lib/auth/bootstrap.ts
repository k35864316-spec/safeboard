import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import { hashPassword } from "@/lib/auth/password";

/**
 * 관리자 계정(admin)이 DB 에 없으면 만들어 둔다. (npm run seed 를 따로 실행하지 않아도 되게 하기 위함)
 *  - 아이디: admin
 *  - 비밀번호: 환경변수 ADMIN_PASSWORD, 없으면 "admin"
 * 비밀번호는 평문이 아니라 bcrypt 해시로 저장한다. 이미 admin 계정이 있으면 아무것도 바꾸지 않는다.
 * ⚠️ 기본 비밀번호(admin)는 누구나 추측할 수 있으므로 시연 용도로만 사용하세요.
 */
export async function ensureDefaultAdmin() {
  await connectDB();
  if (await User.exists({ username: "admin" })) return;
  try {
    await User.create({
      username: "admin",
      passwordHash: await hashPassword(process.env.ADMIN_PASSWORD || "admin"),
      role: "admin",
    });
  } catch (err) {
    // 동시에 두 요청이 만들려고 하면 한쪽은 중복 오류(E11000)가 난다. 이미 만들어진 것이므로 무시한다.
    if ((err as { code?: number }).code !== 11000) throw err;
  }
}
