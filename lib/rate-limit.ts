/**
 * Simple in-memory rate limiter
 * Tracks requests by IP address
 */

interface RateLimitStore {
  [ip: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 5;

export function rateLimit(ip: string): { success: boolean; remaining: number } {
  const now = Date.now();
  const record = store[ip];

  // Initialize or reset if window expired
  if (!record || now > record.resetTime) {
    store[ip] = {
      count: 1,
      resetTime: now + WINDOW_MS,
    };
    return { success: true, remaining: MAX_REQUESTS - 1 };
  }

  // Increment counter
  store[ip].count++;

  // Check if limit exceeded
  if (store[ip].count > MAX_REQUESTS) {
    return { success: false, remaining: 0 };
  }

  return { success: true, remaining: MAX_REQUESTS - store[ip].count };
}

export function getClientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';
  return ip;
}
