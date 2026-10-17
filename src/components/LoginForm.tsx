"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { apiRequest } from "@/lib/clientApi";
import { LIMITS } from "@/lib/limits";

export default function LoginForm({ registered }: { registered: boolean }) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const res = await apiRequest("/api/auth/login", { method: "POST", body: { username, password } });
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      setPassword("");
      return;
    }
    router.push("/board");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="card form" noValidate>
      <h1 className="page-title">로그인</h1>
      {registered && <p className="notice notice-ok">회원가입이 완료되었습니다. 로그인해 주세요.</p>}
      {error && (
        <p className="notice notice-error" role="alert">
          {error}
        </p>
      )}

      <label className="field">
        <span>아이디</span>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          maxLength={LIMITS.USERNAME_MAX}
          autoComplete="username"
          autoFocus
          required
        />
      </label>

      <label className="field">
        <span>비밀번호</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          maxLength={LIMITS.PASSWORD_MAX}
          autoComplete="current-password"
          required
        />
      </label>

      <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
        {busy ? "확인 중..." : "로그인"}
      </button>
    </form>
  );
}
