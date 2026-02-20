import { createClient } from '@supabase/supabase-js'

/**
 * Server-only Supabase client using the service role key.
 * Bypasses RLS - use only in API routes that need to read/write data
 * for unauthenticated users (e.g. candidates taking tests) or admin operations.
 *
 * Set SUPABASE_SERVICE_ROLE_KEY in .env.local (from Supabase Dashboard → Settings → API).
 */
export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. ' +
      'Add SUPABASE_SERVICE_ROLE_KEY from Supabase Dashboard → Settings → API.'
    )
  }
  return createClient(url, key)
}
