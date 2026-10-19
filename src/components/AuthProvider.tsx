"use client";

import { createContext, useContext } from "react";

export type AuthUser = { id: string; username: string; role: "user" | "admin" };
export type AuthState = { user: AuthUser | null; csrfToken: string | null };

const AuthContext = createContext<AuthState>({ user: null, csrfToken: null });

/** 서버(layout)가 확인한 로그인 정보와 CSRF 토큰을 클라이언트 컴포넌트에 전달한다. */
export function AuthProvider({ value, children }: { value: AuthState; children: React.ReactNode }) {
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  return useContext(AuthContext);
}
