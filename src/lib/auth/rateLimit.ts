import { connectDB, trusted } from "@/lib/db";
import { LoginAttempt } from "@/lib/models/LoginAttempt";

/** [무작위 대입 차단] 5회 연속 실패하면 5분간 해당 아이디의 로그인을 막는다. */
export const MAX_FAILURES = 5;
export const LOCK_MS = 5 * 60 * 1000;

/** 잠겨 있다면 남은 시간(초)을, 아니면 0 을 반환한다. */
export async function getLockRemainingSeconds(key: string): Promise<number> {
  await connectDB();
  const now = new Date();
  const record = await LoginAttempt.findOne({ key }).lean();
  if (record?.lockedUntil && record.lockedUntil > now) {
    return Math.ceil((record.lockedUntil.getTime() - now.getTime()) / 1000);
  }
  return 0;
}

/**
 * 로그인 실패를 1회 기록한다. (원자적 $inc 로 동시 요청에서도 횟수가 누락되지 않게 한다)
 * @returns 이번 실패로 잠겼는지 여부와 남은 시도 횟수
 */
export async function recordLoginFailure(key: string): Promise<{ locked: boolean; remaining: number }> {
  await connectDB();
  const now = new Date();

  // 만료된 기록은 지우고 새로 센다.
  await LoginAttempt.deleteOne({ key, expiresAt: trusted({ $lte: now }) });

  const update = { $inc: { count: 1 }, $set: { expiresAt: new Date(now.getTime() + LOCK_MS) } };
  let record;
  try {
    record = await LoginAttempt.findOneAndUpdate({ key }, update, { upsert: true, new: true });
  } catch (err) {
    // 동시 요청으로 upsert 가 겹쳤을 때(E11000) 한 번만 재시도
    if ((err as { code?: number }).code !== 11000) throw err;
    record = await LoginAttempt.findOneAndUpdate({ key }, update, { upsert: true, new: true });
  }

  if (record && record.count >= MAX_FAILURES) {
    await LoginAttempt.updateOne({ key }, { $set: { lockedUntil: new Date(now.getTime() + LOCK_MS) } });
    return { locked: true, remaining: 0 };
  }
  return { locked: false, remaining: Math.max(0, MAX_FAILURES - (record?.count ?? 0)) };
}

export async function clearLoginFailures(key: string) {
  await connectDB();
  await LoginAttempt.deleteOne({ key });
}
