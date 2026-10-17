import bcrypt from "bcryptjs";

/**
 * [비밀번호 해싱]
 * 평문 비밀번호는 절대 저장하지 않고 bcrypt 해시(솔트 자동 포함)만 DB 에 저장한다.
 * cost 12 = 2^12 번 반복 연산 → 무차별 대입 비용을 크게 높인다.
 */
const BCRYPT_COST = 12;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_COST);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/**
 * 존재하지 않는 아이디로 로그인을 시도해도 bcrypt 비교를 똑같이 수행하기 위한 더미 해시.
 * (응답 시간 차이로 "이 아이디는 가입되어 있다"는 사실이 새어나가는 것을 방지)
 */
export const DUMMY_HASH = bcrypt.hashSync("dummy-password-for-timing", BCRYPT_COST);
