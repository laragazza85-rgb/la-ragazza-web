import { createClient } from "@supabase/supabase-js";

export function createSupabaseBrowserClient({ url, anonKey }) {
  if (!url || !anonKey) {
    throw new Error("Supabase URL y anon key son obligatorios.");
  }

  return createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });
}