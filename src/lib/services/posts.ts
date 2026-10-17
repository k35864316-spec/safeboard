import type { Types } from "mongoose";
import { connectDB, trusted } from "@/lib/db";
import { HttpError } from "@/lib/api";
import { Post } from "@/lib/models/Post";
import { Comment } from "@/lib/models/Comment";
import type { SessionUser } from "@/lib/auth/session";

export const PAGE_SIZE = 10;
export const SECRET_PLACEHOLDER = "비밀글입니다";

type LeanPost = {
  _id: Types.ObjectId;
  title: string;
  content: string;
  isSecret: boolean;
  author: Types.ObjectId;
  authorName: string;
  views?: number;
  createdAt: Date;
  updatedAt: Date;
};

type LeanComment = {
  _id: Types.ObjectId;
  post: Types.ObjectId;
  content: string;
  author: Types.ObjectId;
  authorName: string;
  createdAt: Date;
};

/*
 * 아래 view 타입의 title/content/authorName 은 "치환(escape)된 상태 그대로"이다.
 * 화면에서 보여줄 때는 unescapeHtml() 로 되돌린 뒤 React 텍스트로만 출력한다.
 */
export type PostListItem = {
  id: string;
  title: string;
  authorName: string;
  isSecret: boolean;
  locked: boolean;
  views: number;
  createdAt: string;
};

export type PostDetail = {
  id: string;
  title: string;
  content: string;
  authorName: string;
  isSecret: boolean;
  locked: boolean;
  isMine: boolean;
  views: number;
  createdAt: string;
  updatedAt: string;
};

export type CommentItem = {
  id: string;
  content: string;
  authorName: string;
  isMine: boolean;
  createdAt: string;
};

/** [비밀글 열람 제한] 비밀글은 작성자 본인 또는 관리자만 볼 수 있다. */
function canView(post: { isSecret: boolean; author: Types.ObjectId }, viewer: SessionUser | null): boolean {
  if (!post.isSecret) return true;
  if (!viewer) return false;
  return viewer.role === "admin" || String(post.author) === viewer.id;
}

export async function listPosts(opts: { page: number; q: string; viewer: SessionUser | null }) {
  await connectDB();
  const { q, viewer } = opts;

  const clauses: Record<string, unknown>[] = [];
  if (q) {
    // [미구현] 검색어를 이스케이프하지 않고 그대로 정규식으로 사용한다. (잘못된 정규식이면 결과 없음)
    let re: RegExp;
    try {
      re = new RegExp(q, "i");
    } catch {
      re = /(?!)/;
    }
    clauses.push({ $or: [{ title: trusted({ $regex: re }) }, { content: trusted({ $regex: re }) }] });
    // 검색 결과로 비밀글의 존재/내용이 추측되지 않도록, 볼 수 없는 비밀글은 검색 대상에서 제외한다.
    if (viewer?.role !== "admin") {
      clauses.push(viewer ? { $or: [{ isSecret: false }, { author: viewer.id }] } : { isSecret: false });
    }
  }
  const filter = clauses.length > 0 ? { $and: clauses } : {};

  const total = await Post.countDocuments(filter);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(opts.page, totalPages);

  const docs = await Post.find(filter)
    .select("title isSecret author authorName views createdAt")
    .sort({ createdAt: -1 })
    .skip((page - 1) * PAGE_SIZE)
    .limit(PAGE_SIZE)
    .lean<LeanPost[]>();

  const items: PostListItem[] = docs.map((d) => {
    const visible = canView(d, viewer);
    return {
      id: String(d._id),
      title: visible ? d.title : SECRET_PLACEHOLDER,
      authorName: d.authorName,
      isSecret: d.isSecret,
      locked: !visible,
      views: d.views ?? 0,
      createdAt: d.createdAt.toISOString(),
    };
  });

  return { items, page, totalPages, total, q };
}

export async function getPostDetail(id: string, viewer: SessionUser | null): Promise<PostDetail | null> {
  await connectDB();
  const post = await Post.findById(id).lean<LeanPost>();
  if (!post) return null;

  const visible = canView(post, viewer);
  return {
    id: String(post._id),
    // 볼 권한이 없으면 제목·본문을 서버에서 아예 내려보내지 않는다. (화면에서만 숨기는 것이 아님)
    title: visible ? post.title : SECRET_PLACEHOLDER,
    content: visible ? post.content : "",
    authorName: post.authorName,
    isSecret: post.isSecret,
    locked: !visible,
    isMine: !!viewer && String(post.author) === viewer.id,
    views: post.views ?? 0,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
  };
}

/**
 * [조회수] 글 상세를 열 때마다 1 증가시킨다. ($inc 는 DB 에서 원자적으로 처리되어 동시에 열어도 누락되지 않는다)
 * 볼 권한이 없는 비밀글은 호출하지 않는다.
 */
export async function incrementViews(id: string) {
  await connectDB();
  await Post.updateOne({ _id: id }, { $inc: { views: 1 } });
}

export async function getComments(postId: string, viewer: SessionUser | null): Promise<CommentItem[]> {
  await connectDB();
  const docs = await Comment.find({ post: postId }).sort({ createdAt: 1 }).limit(300).lean<LeanComment[]>();
  return docs.map((c) => ({
    id: String(c._id),
    content: c.content,
    authorName: c.authorName,
    isMine: !!viewer && String(c.author) === viewer.id,
    createdAt: c.createdAt.toISOString(),
  }));
}

export async function createPost(
  user: SessionUser,
  input: { title: string; content: string; isSecret: boolean },
): Promise<string> {
  await connectDB();
  const post = await Post.create({
    // [미구현] XSS 방어(저장 전 특수문자 치환) 없음. 입력한 값을 그대로 저장한다.
    title: input.title,
    content: input.content,
    isSecret: input.isSecret,
    author: user.id,
    authorName: user.username,
  });
  return String(post._id);
}

/** [작성자 본인 확인] 세션의 사용자 ID 와 DB 에 저장된 글 작성자 ID 가 같아야 수정할 수 있다. */
export async function updatePost(
  id: string,
  user: SessionUser,
  input: { title: string; content: string; isSecret: boolean },
) {
  await connectDB();
  const post = await Post.findById(id);
  if (!post) throw new HttpError(404, "존재하지 않는 게시글입니다.");
  if (String(post.author) !== user.id) throw new HttpError(403, "작성자 본인만 수정할 수 있습니다.");

  post.title = input.title;
  post.content = input.content;
  post.isSecret = input.isSecret;
  await post.save();
}

/** [작성자 본인 확인] 세션의 사용자 ID 와 글 작성자 ID 가 같아야 삭제할 수 있다. 댓글도 함께 삭제한다. */
export async function deletePost(id: string, user: SessionUser) {
  await connectDB();
  const post = await Post.findById(id).select("author").lean<Pick<LeanPost, "_id" | "author">>();
  if (!post) throw new HttpError(404, "존재하지 않는 게시글입니다.");
  if (String(post.author) !== user.id) throw new HttpError(403, "작성자 본인만 삭제할 수 있습니다.");

  await Post.deleteOne({ _id: id });
  await Comment.deleteMany({ post: id });
}

export async function addComment(postId: string, user: SessionUser, content: string) {
  await connectDB();
  const post = await Post.findById(postId).select("isSecret author").lean<Pick<LeanPost, "_id" | "isSecret" | "author">>();
  if (!post) throw new HttpError(404, "존재하지 않는 게시글입니다.");
  if (!canView(post, user)) throw new HttpError(403, "비밀글에는 댓글을 작성할 수 없습니다.");

  const comment = await Comment.create({
    post: postId,
    content,
    author: user.id,
    authorName: user.username,
  });
  return String(comment._id);
}

export async function deleteComment(id: string, user: SessionUser) {
  await connectDB();
  const comment = await Comment.findById(id).select("author").lean<Pick<LeanComment, "_id" | "author">>();
  if (!comment) throw new HttpError(404, "존재하지 않는 댓글입니다.");
  if (String(comment.author) !== user.id) throw new HttpError(403, "작성자 본인만 삭제할 수 있습니다.");
  await Comment.deleteOne({ _id: id });
}
