import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { env } from './env.js';

// Base anonymous client
export const supabaseAnon: SupabaseClient = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

// Service-role client for privileged operations (Storage bucket admin, etc.)
export const supabaseAdmin: SupabaseClient = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

/**
 * Creates a scoped Supabase client with the user's JWT
 * so all operations strictly follow Supabase Row Level Security (RLS).
 */
export function createScopedClient(accessToken: string): SupabaseClient {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}

/**
 * Validates a Bearer token and retrieves user metadata.
 */
export async function verifyAuthToken(token: string): Promise<User> {
  const { data, error } = await supabaseAnon.auth.getUser(token);
  if (error || !data.user) {
    throw new Error(error?.message || 'Invalid or expired authentication token');
  }
  return data.user;
}

