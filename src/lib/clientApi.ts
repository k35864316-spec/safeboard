/** 브라우저에서 API 를 호출하는 도우미. 상태 변경 요청에는 CSRF 토큰을 헤더(x-csrf-token)에 실어 보낸다. */
export type ApiResult<T> = { ok: true; data: T } | { ok: false; status: number; error: string };

export async function apiRequest<T = Record<string, unknown>>(
  url: string,
  opts: { method: "POST" | "PUT" | "DELETE"; body?: unknown; csrfToken?: string | null },
): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, {
      method: opts.method,
      headers: {
        "Content-Type": "application/json",
        ...(opts.csrfToken ? { "x-csrf-token": opts.csrfToken } : {}),
      },
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
      credentials: "same-origin",
    });

    let data: unknown = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }

    if (!res.ok) {
      const message =
        typeof data === "object" && data !== null && "error" in data && typeof data.error === "string"
          ? data.error
          : "요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.";
      return { ok: false, status: res.status, error: message };
    }
    return { ok: true, data: data as T };
  } catch {
    return { ok: false, status: 0, error: "서버에 연결할 수 없습니다. 네트워크 상태를 확인해 주세요." };
  }
}
