import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/** 로그인 실패 횟수 기록 (무작위 대입 공격 차단용). 아이디 단위로 집계한다. */
const LoginAttemptSchema = new Schema({
  key: { type: String, required: true, unique: true },
  count: { type: Number, default: 0 },
  lockedUntil: { type: Date, default: null },
  // 마지막 실패 후 이 시각이 지나면 기록 만료 (TTL 인덱스가 자동 삭제)
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
});

export const LoginAttempt: Model<InferSchemaType<typeof LoginAttemptSchema>> =
  (mongoose.models.LoginAttempt as Model<InferSchemaType<typeof LoginAttemptSchema>>) ||
  mongoose.model("LoginAttempt", LoginAttemptSchema);
