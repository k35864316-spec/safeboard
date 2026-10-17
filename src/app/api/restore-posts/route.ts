import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { ensureDefaultAdmin } from "@/lib/auth/bootstrap";
import { User } from "@/lib/models/User";
import { Post } from "@/lib/models/Post";
import { Comment } from "@/lib/models/Comment";

// [임시 복구용] 예전에 `test` DB 에 저장된 admin 의 게시글(과 그 댓글)을 `safeboard` DB 로 복사한다.
//  - 같은 _id 로 넣기 때문에 여러 번 실행해도 중복되지 않는다. (원본은 지우지 않는다)
//  - 작성자 연결은 현재 DB 의 admin 계정으로 바꿔서 저장한다.
// 복구가 끝나면 이 파일(src/app/api/restore-posts)을 삭제하세요.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();
    await ensureDefaultAdmin();
    const admin = await User.findOne({ username: "admin" }).lean();
    if (!admin) return Response.json({ ok: false, error: "admin 계정이 없습니다." }, { status: 500 });

    const src = mongoose.connection.useDb("test", { useCache: true });
    const srcPosts = await src.collection("posts").find({ authorName: "admin" }).toArray();
    const postIds = srcPosts.map((p) => p._id);

    let posts = 0;
    if (srcPosts.length > 0) {
      const res = await Post.collection.bulkWrite(
        srcPosts.map(({ _id, ...rest }) => ({
          updateOne: { filter: { _id }, update: { $setOnInsert: { ...rest, author: admin._id } }, upsert: true },
        })),
      );
      posts = res.upsertedCount;
    }

    let comments = 0;
    const srcComments = postIds.length ? await src.collection("comments").find({ post: { $in: postIds } }).toArray() : [];
    const mapped: typeof srcComments = [];
    for (const c of srcComments) {
      const au = await User.findOne({ username: c.authorName }).select("_id").lean();
      if (au) mapped.push({ ...c, author: au._id });
    }
    if (mapped.length > 0) {
      const res = await Comment.collection.bulkWrite(
        mapped.map(({ _id, ...rest }) => ({ updateOne: { filter: { _id }, update: { $setOnInsert: rest }, upsert: true } })),
      );
      comments = res.upsertedCount;
    }

    return Response.json({
      ok: true,
      foundPosts: srcPosts.length,
      copiedPosts: posts,
      foundComments: srcComments.length,
      copiedComments: comments,
    });
  } catch (err) {
    const e = err as { name?: string; message?: string };
    return Response.json({ ok: false, errorName: e.name, message: String(e.message ?? "").slice(0, 200) }, { status: 500 });
  }
}
