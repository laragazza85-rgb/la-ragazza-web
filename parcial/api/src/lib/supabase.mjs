import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env.mjs";
import { HttpError } from "../utils/httpError.mjs";

function ensureSupabaseConfig() {
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    throw new Error("Faltan SUPABASE_URL o SUPABASE_ANON_KEY en el entorno.");
  }
}

  function ensureServiceKey() {
    if (!env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY en el entorno.");
    }
  }

export function createServerSupabaseClient(accessToken) {
  ensureSupabaseConfig();

  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    },
    global: {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
    }
  });
}

  export function createServiceSupabaseClient() {
    ensureSupabaseConfig();
    ensureServiceKey();
    return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    });
  }

export function getBearerToken(request) {
  const header = request.headers.authorization ?? "";
  if (!header.toLowerCase().startsWith("bearer ")) return "";
  return header.slice(7).trim();
}

export async function resolveRequestAuth(request) {
  const accessToken = getBearerToken(request);
  if (!accessToken) {
    throw new HttpError(401, "Sesion requerida.");
  }

  const supabase = createServerSupabaseClient(accessToken);
  const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);
  if (userError || !userData.user) {
    throw new HttpError(401, "Sesion requerida.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id,email,role")
    .eq("id", userData.user.id)
    .single();

  if (profileError || !profile) {
    throw new HttpError(401, "Sesion requerida.");
  }

  return {
    accessToken,
    supabase,
    user: profile,
    authUser: userData.user
  };
}