'use client';

import { useState, useCallback } from 'react';
import { saveSession } from '@/lib/session';

export function useMagicLink() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentEmail, setSentEmail] = useState<string | null>(null);

  const sendMagicLink = useCallback(async (email: string) => {
    setLoading(true);
    setError(null);
    setSentEmail(null);
    try {
      const response = await fetch('/api/magic-links/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send magic link');
      }

      setSentEmail(email);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send magic link';
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyToken = useCallback(async (token: string, userType: 'guest' | 'host', firstName?: string, lastName?: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/magic-links/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          user_type: userType,
          first_name: firstName,
          last_name: lastName
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to verify token');
      }

      const user = await response.json();

      // Save session with timestamp
      saveSession({
        id: user.id,
        email: user.email,
        user_type: user.user_type,
        verified: user.verified
      });

      return user;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to verify token';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    sentEmail,
    sendMagicLink,
    verifyToken
  };
}
