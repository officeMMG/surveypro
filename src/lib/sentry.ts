// Sentryの初期化はnext.config.ts内でwithSentryConfigを使用して行う
// このファイルはカスタムエラーログのユーティリティ

export function logError(error: unknown, context?: Record<string, unknown>) {
  if (process.env.NODE_ENV === "development") {
    console.error("[SurveyPro Error]", error, context)
    return
  }
  // Sentry SDKが初期化されている場合はcaptureExceptionを呼ぶ
  try {
    // dynamic importで循環参照を避ける
    import("@sentry/nextjs").then(({ captureException }) => {
      captureException(error, { extra: context })
    })
  } catch {
    console.error("[Sentry log failed]", error)
  }
}
