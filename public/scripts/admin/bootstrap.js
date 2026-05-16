import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

function createSupabaseBrowserClient({ url, anonKey }) {
  if (!url || !anonKey) {
    throw new Error('Supabase URL y anon key son obligatorios.');
  }

  return createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });
}

const scriptUrl = new URL(import.meta.url);
const supabaseUrl = scriptUrl.searchParams.get('supabaseUrl');
const supabaseAnonKey = scriptUrl.searchParams.get('supabaseAnonKey');
const publicApiBaseUrl = scriptUrl.searchParams.get('publicApiBaseUrl');

window.__adminSupabase = createSupabaseBrowserClient({
  url: supabaseUrl,
  anonKey: supabaseAnonKey
});

window.__adminApiBase = publicApiBaseUrl ?? '';