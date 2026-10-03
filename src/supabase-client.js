let clientPromise;

export function getSupabaseClient() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return Promise.resolve(null);
  clientPromise ??= import('@supabase/supabase-js').then(({ createClient }) =>
    createClient(url, key, {
      auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    }),
  );
  return clientPromise;
}

export function authErrorKey(error) {
  if (error?.code === 'invalid_credentials') return 'invalid';
  if (error?.code === 'email_not_confirmed') return 'unconfirmed';
  if (error?.code === 'weak_password') return 'weak';
  if (error?.status === 429 || error?.code?.startsWith('over_')) return 'rateLimit';
  if (error?.name === 'AuthRetryableFetchError' || error instanceof TypeError) return 'network';
  return 'error';
}
