// Plain constant, no next/headers import — safe to use from src/proxy.js,
// which runs in a different runtime context than Server Components/Route
// Handlers. src/lib/session.js re-exports this alongside the cookies()-based
// getSessionId() helper for use in those contexts.
export const SESSION_COOKIE = "rs_session";
