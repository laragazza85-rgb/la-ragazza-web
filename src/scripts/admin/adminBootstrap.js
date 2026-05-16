import { createSupabaseBrowserClient } from '../../lib/supabaseClient.js';

const bootstrapScript = document.currentScript;

if (!(bootstrapScript instanceof HTMLScriptElement)) {
  throw new Error('No se encontro el script de bootstrap del admin.');
}

const supabaseUrl = bootstrapScript.dataset.supabaseUrl;
const supabaseAnonKey = bootstrapScript.dataset.supabaseAnonKey;
const publicApiBaseUrl = bootstrapScript.dataset.publicApiBaseUrl;

window.__adminSupabase = createSupabaseBrowserClient({
  url: supabaseUrl,
  anonKey: supabaseAnonKey
});

window.__adminApiBase = publicApiBaseUrl ?? '';