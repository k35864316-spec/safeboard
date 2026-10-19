"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { apiRequest } from "@/lib/clientApi";
import { LIMITS } from "@/lib/limits";

export default function RegisterForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("비밀번호 확인이 일치하지 않습니다.");
      return;
    }
    setBusy(true);
    const res = await apiRequest("/api/auth/register", { method: "POST", body: { username, password } });
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    router.push("/login?registered=1");
  }

  return (
    <form onSubmit={onSubmit} className="card form" noValidate>
      <h1 className="page-title">회원가입</h1>
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
        <small>영문 소문자·숫자·밑줄(_) {LIMITS.USERNAME_MIN}~{LIMITS.USERNAME_MAX}자</small>
      </label>

      <label className="field">
        <span>비밀번호</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          maxLength={LIMITS.PASSWORD_MAX}
          autoComplete="new-password"
          required
        />
        <small>영문과 숫자를 포함해 {LIMITS.PASSWORD_MIN}자 이상</small>
      </label>

      <label className="field">
        <span>비밀번호 확인</span>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          maxLength={LIMITS.PASSWORD_MAX}
          autoComplete="new-password"
          required
        />
      </label>

      <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
        {busy ? "처리 중..." : "가입하기"}
      </button>
    </form>
  );
}
