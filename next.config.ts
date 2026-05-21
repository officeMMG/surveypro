import type { NextConfig } from "next"
import { withSentryConfig } from "@sentry/nextjs"

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" }, // Google OAuth アバター
    ],
  },
  // APIキーをクライアントに公開しないための設定
  // NEXT_PUBLIC_ プレフィックスのない変数はサーバーサイドのみ
  serverExternalPackages: ["@prisma/client"],
}

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  disableLogger: true,
})
