'use client';

import { useEffect, useState } from 'react';
import { getSession, clearSession, isSessionExpired } from './session';

export interface Session {
  id: string;
  email: string;
  user_type: 'guest' | 'host';
  verified: boolean;
}

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for expired session
    if (isSessionExpired()) {
      clearSession();
      setSession(null);
      setLoading(false);
      return;
    }

    // Load current session
    const currentSession = getSession();
    setSession(currentSession);
    setLoading(false);

    // Check session every 5 minutes
    const interval = setInterval(() => {
      const updated = getSession();
      setSession(updated);

      if (!updated && localStorage.getItem('beliving_session') !== null) {
        // Session expired during use
        clearSession();
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const logout = () => {
    clearSession();
    setSession(null);
  };

  return { session, loading, logout };
}
