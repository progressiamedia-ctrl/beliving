# Session Management with Expiry

## Overview
- Sessions expire after **24 hours** of login
- Uses localStorage to store session data with timestamp
- Automatically clears expired sessions

## Usage in Components

### In Client Components
```tsx
'use client';

import { useSession } from '@/lib/useSession';

export function MyComponent() {
  const { session, loading, logout } = useSession();

  if (loading) return <div>Loading...</div>;

  if (!session) {
    return <div>Please sign in</div>;
  }

  return (
    <div>
      <p>Welcome {session.email}</p>
      <button onClick={logout}>Sign out</button>
    </div>
  );
}
```

### After Sign In (in Sign In API response handler)
```tsx
import { saveSession } from '@/lib/session';

// After successful signin
const response = await fetch('/api/auth/signin', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});

const data = await response.json();

if (response.ok) {
  // Save session with timestamp (auto-expires in 24h)
  saveSession({
    id: data.id,
    email: data.email,
    user_type: data.user_type,
    verified: data.verified
  });
}
```

### After Sign Up (in Sign Up API response handler)
```tsx
import { saveSession } from '@/lib/session';

const response = await fetch('/api/auth/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password, user_type })
});

const data = await response.json();

if (response.ok) {
  // Save session with timestamp
  saveSession({
    id: data.id,
    email: data.email,
    user_type: data.user_type,
    verified: data.verified
  });
}
```

## Session Functions

### `getSession()`
Returns current session if valid, null if expired or not found.

```tsx
import { getSession } from '@/lib/session';

const session = getSession();
if (session) {
  console.log('User:', session.email);
}
```

### `saveSession(session)`
Saves session with current timestamp. Auto-expires in 24 hours.

```tsx
import { saveSession } from '@/lib/session';

saveSession({
  id: 'uuid',
  email: 'user@example.com',
  user_type: 'host',
  verified: true
});
```

### `clearSession()`
Manually clear session data.

```tsx
import { clearSession } from '@/lib/session';

clearSession(); // User is logged out
```

### `getSessionTimeRemaining()`
Get milliseconds until session expires.

```tsx
import { getSessionTimeRemaining } from '@/lib/session';

const remaining = getSessionTimeRemaining();
const hours = Math.floor(remaining / (1000 * 60 * 60));
console.log(`Session expires in ${hours} hours`);
```

## Session Details

- **Duration**: 24 hours
- **Storage**: localStorage
- **Auto-check**: Every 5 minutes via useSession hook
- **On Expire**: Session is cleared, user is logged out
- **Status Code**: 429 on rate limit, 401 on auth failure

## Rate Limiting

Both `/api/auth/signin` and `/api/auth/signup` have rate limiting:
- **Limit**: 5 attempts per 15 minutes
- **Per IP**: Rate limits are per client IP
- **Response**: 429 status code with `Retry-After: 900` header
