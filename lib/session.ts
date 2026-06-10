/**
 * Session management with expiry
 * Sessions expire after 24 hours of login
 */

const SESSION_KEY = 'beliving_session';
const SESSION_TIMESTAMP_KEY = 'beliving_session_time';
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface Session {
  id: string;
  email: string;
  user_type: 'guest' | 'host';
  verified: boolean;
}

export function saveSession(session: Session): void {
  if (typeof window === 'undefined') return;

  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  localStorage.setItem(SESSION_TIMESTAMP_KEY, Date.now().toString());
}

export function getSession(): Session | null {
  if (typeof window === 'undefined') return null;

  const sessionData = localStorage.getItem(SESSION_KEY);
  const timestamp = localStorage.getItem(SESSION_TIMESTAMP_KEY);

  if (!sessionData || !timestamp) return null;

  // Check if session has expired
  const sessionTime = parseInt(timestamp, 10);
  const now = Date.now();

  if (now - sessionTime > SESSION_DURATION_MS) {
    clearSession();
    return null;
  }

  try {
    return JSON.parse(sessionData);
  } catch {
    clearSession();
    return null;
  }
}

export function clearSession(): void {
  if (typeof window === 'undefined') return;

  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(SESSION_TIMESTAMP_KEY);
}

export function getSessionTimeRemaining(): number {
  if (typeof window === 'undefined') return 0;

  const timestamp = localStorage.getItem(SESSION_TIMESTAMP_KEY);
  if (!timestamp) return 0;

  const sessionTime = parseInt(timestamp, 10);
  const now = Date.now();
  const elapsed = now - sessionTime;
  const remaining = Math.max(0, SESSION_DURATION_MS - elapsed);

  return remaining;
}

export function isSessionExpired(): boolean {
  return getSession() === null && localStorage.getItem(SESSION_KEY) !== null;
}
