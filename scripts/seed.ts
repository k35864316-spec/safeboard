/**
 * 개발용 시드 스크립트:  npm run seed
 *  - 관리자(admin) / 일반 사용자(student1) 계정 생성 (비밀번호는 bcrypt 해시로 저장)
 *  - 게시글은 만들지 않는다.
 */
import path from "node:path";
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function main() {
  // 환경변수 로딩 이후에 모듈을 불러온다.
  const { connectDB } = await import("../src/lib/db");
  const { User } = await import("../src/lib/models/User");
  const { hashPassword } = await import("../src/lib/auth/password");

  await connectDB();

  const adminPassword = process.env.ADMIN_PASSWORD || "admin";
  const accounts = [
    { username: "admin", password: adminPassword, role: "admin" as const },
    { username: "student1", password: "Student1234!", role: "user" as const },
  ];

  const users: Record<string, mongoose.Types.ObjectId> = {};
  for (const acc of accounts) {
    let user = await User.findOne({ username: acc.username });
    if (!user) {
      user = await User.create({
        username: acc.username,
        passwordHash: await hashPassword(acc.password),
        role: acc.role,
      });
      console.log(`✔ 계정 생성: ${acc.username} (${acc.role})`);
    } else {
      console.log(`- 이미 존재: ${acc.username}`);
    }
    users[acc.username] = user._id;
  }

  // 게시글은 만들지 않는다. (계정만 생성)

  console.log("\n시드 완료.  관리자: admin / (ADMIN_PASSWORD 또는 admin),  일반: student1 / Student1234!");
  console.log("※ 개발용 계정입니다. 실제 배포 전에는 반드시 비밀번호를 바꾸거나 계정을 삭제하세요.");
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("시드 실패:", err instanceof Error ? err.message : err);
  process.exit(1);
});
