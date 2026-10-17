import { connectDB } from "@/lib/db";

// [임시 점검용] 배포 환경에서 DB 연결이 되는지 확인한다. 비밀번호·연결 문자열은 절대 출력하지 않는다.
// 원인을 찾은 뒤에는 이 파일(src/app/api/health)을 삭제하세요.
export const dynamic = "force-dynamic";

export async function GET() {
  const uri = process.env.MONGODB_URI;
  const info = {
    envSet: typeof uri === "string" && uri.length > 0,
    scheme: uri ? uri.split("://")[0] : null,
    hasPlaceholder: uri ? /<|>/.test(uri) : null,
    hasQuotesOrPrefix: uri ? /^["']|^MONGODB_URI=/.test(uri.trim()) : null,
    hasDbName: uri ? /\.net\/[^/?]+/.test(uri) || /:\d+\/[^/?]+/.test(uri) : null,
  };
  try {
    await connectDB();
    return Response.json({ ok: true, ...info }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    const e = err as { name?: string; code?: string | number; message?: string };
    const message = String(e.message ?? "").replace(/mongodb(\+srv)?:\/\/\S+/gi, "[uri]").slice(0, 200);
    return Response.json(
      { ok: false, ...info, errorName: e.name, errorCode: e.code ?? null, message },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
