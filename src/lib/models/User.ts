import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const UserSchema = new Schema(
  {
    // 소문자로 정규화해서 저장 (대소문자만 다른 중복 가입 방지)
    username: { type: String, required: true, unique: true, trim: true, lowercase: true, maxlength: 20 },
    // bcrypt 해시만 저장. 기본 조회에서는 제외(select: false)해서 실수로 노출되지 않게 한다.
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ["user", "admin"], default: "user" },
  },
  { timestamps: true },
);

export type UserDoc = InferSchemaType<typeof UserSchema> & { _id: mongoose.Types.ObjectId };

export const User: Model<InferSchemaType<typeof UserSchema>> =
  (mongoose.models.User as Model<InferSchemaType<typeof UserSchema>>) || mongoose.model("User", UserSchema);
