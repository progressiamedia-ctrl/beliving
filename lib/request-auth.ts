import { NextRequest, NextResponse } from 'next/server'

/**
 * Extract user ID from Authorization header (Bearer token)
 * Client passes: Authorization: Bearer {userId}
 */
export function extractUserIdFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  try {
    return authHeader.substring('Bearer '.length)
  } catch {
    return null
  }
}

/**
 * Verify user is authenticated and accessing their own data
 */
export function requireAuth(request: NextRequest, requestedUserId: string): { userId: string } | NextResponse {
  const userId = extractUserIdFromRequest(request)

  if (!userId) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }

  if (userId !== requestedUserId) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 403 }
    )
  }

  return { userId }
}

/**
 * Verify cron job request with CRON_SECRET
 */
export function requireCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    return false
  }

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false
  }

  const token = authHeader.substring('Bearer '.length)
  return token === cronSecret
}

/**
 * Verify admin request (for now, just check CRON_SECRET as a placeholder)
 * TODO: Implement proper role-based access control
 */
export function requireAdmin(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  const adminSecret = process.env.ADMIN_SECRET

  if (!adminSecret) {
    return false
  }

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false
  }

  const token = authHeader.substring('Bearer '.length)
  return token === adminSecret
}
