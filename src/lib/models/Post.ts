import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const PostSchema = new Schema(
  {
    // 서버에서 특수문자를 치환(escape)한 뒤 저장하므로 길이 여유를 크게 둔다. (실제 글자수 제한은 API에서 검사)
    title: { type: String, required: true, maxlength: 1000 },
    content: { type: String, required: true, maxlength: 40000 },
    isSecret: { type: Boolean, default: false },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    authorName: { type: String, required: true },
    // 조회수 (이 필드가 없는 예전 글은 0 으로 취급한다)
    views: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

PostSchema.index({ createdAt: -1 });

export type PostDoc = InferSchemaType<typeof PostSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const Post: Model<InferSchemaType<typeof PostSchema>> =
  (mongoose.models.Post as Model<InferSchemaType<typeof PostSchema>>) || mongoose.model("Post", PostSchema);
