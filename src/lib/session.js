import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/sessionCookie";

export { SESSION_COOKIE };

// Reads the anonymous session id set by src/proxy.js. Server Components and
// Route Handlers only (matches the two contexts next/headers cookies()
// supports for reading).
export async function getSessionId() {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value || null;
}
