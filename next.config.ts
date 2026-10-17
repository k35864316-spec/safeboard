import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 응답 헤더에서 "X-Powered-By: Next.js" 제거 (서버 정보 노출 최소화)
  poweredByHeader: false,
  reactStrictMode: true,
  // 개발 서버 실행 시 AGENTS.md 파일이 자동 생성되지 않도록 끈다.
  agentRules: false,

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // MIME 스니핑 방지
          { key: "X-Content-Type-Options", value: "nosniff" },
          // 클릭재킹 방지 (CSP frame-ancestors 와 함께 이중 적용)
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
