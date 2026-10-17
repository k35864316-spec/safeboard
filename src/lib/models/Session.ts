import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/**
 * 서버 측 세션 저장소.
 * - 브라우저 쿠키에는 무작위 토큰 원문만 들어가고, DB 에는 SHA-256 해시만 저장한다.
 *   (DB 가 유출돼도 해시로는 세션을 탈취할 수 없다)
 * - csrfToken: 이 세션 전용 CSRF 토큰 (상태 변경 요청 때 대조)
 * - expiresAt: TTL 인덱스로 만료된 세션은 MongoDB 가 자동 삭제
 */
const SessionSchema = new Schema({
  tokenHash: { type: String, required: true, unique: true },
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  csrfToken: { type: String, required: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
});

export const Session: Model<InferSchemaType<typeof SessionSchema>> =
  (mongoose.models.Session as Model<InferSchemaType<typeof SessionSchema>>) ||
  mongoose.model("Session", SessionSchema);
