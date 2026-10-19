import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/safeboard";

// [미구현] NoSQL Injection 2차 방어(sanitizeFilter)는 꺼져 있다. 쿼리 조건에 섞인 $ 연산자를 그대로 해석한다.
mongoose.set("strictQuery", true);

type Cache = { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
const globalForMongoose = globalThis as unknown as { _safeboardMongoose?: Cache };
const cache: Cache = (globalForMongoose._safeboardMongoose ??= { conn: null, promise: null });

/** 개발 모드의 핫 리로드에서 연결이 계속 늘어나지 않도록 전역에 캐시한다. */
export async function connectDB() {
  if (cache.conn) return cache.conn;
  cache.promise ??= mongoose.connect(MONGODB_URI, {
    bufferCommands: false,
    serverSelectionTimeoutMS: 5000,
  });
  try {
    cache.conn = await cache.promise;
  } catch (err) {
    cache.promise = null;
    throw err;
  }
  return cache.conn;
}

/** (sanitizeFilter 를 껐으므로 지금은 효과가 없다. 나중에 다시 켜도 코드가 동작하도록 남겨 둔다) */
export const trusted = mongoose.trusted;
