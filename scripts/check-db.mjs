/**
 * npm run dev 직전에 자동 실행되는 점검 스크립트 (predev).
 * MongoDB 에 접속할 수 있는지 확인하고, 안 되면 해결 방법을 안내한다. (개발 서버 실행은 막지 않는다)
 */
import fs from "node:fs";
import path from "node:path";
import mongoose from "mongoose";

function readEnvFile(file) {
  try {
    const out = {};
    for (const line of fs.readFileSync(path.resolve(process.cwd(), file), "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
      if (m && !line.trim().startsWith("#")) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
    return out;
  } catch {
    return {};
  }
}

const env = { ...readEnvFile(".env"), ...readEnvFile(".env.local"), ...process.env };
const uri = env.MONGODB_URI || "mongodb://127.0.0.1:27017/safeboard";
const shown = uri.replace(/\/\/([^:@/]+):[^@/]*@/, "//$1:****@"); // 비밀번호는 가려서 출력

if (!fs.existsSync(path.resolve(process.cwd(), ".env.local"))) {
  console.log("ℹ️  .env.local 이 없어 기본 설정을 사용합니다. (.env.example 을 .env.local 로 복사하면 설정을 바꿀 수 있습니다)");
}

try {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
  console.log(`✅ MongoDB 연결 확인 완료 (${shown})`);
  await mongoose.disconnect();
} catch {
  console.log(`
⚠️  MongoDB 에 연결할 수 없습니다 (${shown})
   DB 없이는 로그인·게시판이 동작하지 않습니다. 아래 중 하나로 MongoDB 를 켠 뒤 다시 실행하세요.

   1) Docker 사용:       npm run db:up
   2) 로컬 설치 사용:    MongoDB Community Server 를 설치하고 서비스가 실행 중인지 확인
   3) MongoDB Atlas 사용: .env.local 의 MONGODB_URI 를 Atlas 연결 문자열로 변경
`);
}
process.exit(0);
