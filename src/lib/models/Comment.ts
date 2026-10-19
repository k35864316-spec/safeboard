import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const CommentSchema = new Schema(
  {
    post: { type: Schema.Types.ObjectId, ref: "Post", required: true, index: true },
    content: { type: String, required: true, maxlength: 5000 },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    authorName: { type: String, required: true },
  },
  { timestamps: true },
);

export type CommentDoc = InferSchemaType<typeof CommentSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
};

export const Comment: Model<InferSchemaType<typeof CommentSchema>> =
  (mongoose.models.Comment as Model<InferSchemaType<typeof CommentSchema>>) ||
  mongoose.model("Comment", CommentSchema);
