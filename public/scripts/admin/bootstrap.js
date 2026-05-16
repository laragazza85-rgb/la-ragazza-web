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

const bootstrapScript = document.currentScript;

if (!(bootstrapScript instanceof HTMLScriptElement)) {
  throw new Error('No se encontro el bootstrap del admin.');
}

const supabaseUrl = bootstrapScript.dataset.supabaseUrl;
const supabaseAnonKey = bootstrapScript.dataset.supabaseAnonKey;
const publicApiBaseUrl = bootstrapScript.dataset.publicApiBaseUrl;

window.__adminSupabase = createSupabaseBrowserClient({
  url: supabaseUrl,
  anonKey: supabaseAnonKey
});

window.__adminApiBase = publicApiBaseUrl ?? '';