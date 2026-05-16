export const CONFIRM_DELETE_MESSAGE = "¿Seguro?";
export const CONFIRM_EDIT_MESSAGE = "¿Seguro que quieres confirmar cambios?";

const AUTH_ERROR_NAME = "AdminAuthSessionError";

let profilePromise = null;

export class AdminAuthSessionError extends Error {
  constructor(message = "Sesion requerida.") {
    super(message);
    this.name = AUTH_ERROR_NAME;
  }
}

export function isAuthSessionError(error) {
  return error instanceof AdminAuthSessionError || error?.name === AUTH_ERROR_NAME;
}

export function redirectToLogin() {
  if (window.__adminLoginRedirectStarted) return;

  window.__adminLoginRedirectStarted = true;
  window.location.replace("/admin/login");
}

export function handleAuthError(error) {
  if (!isAuthSessionError(error)) return false;

  redirectToLogin();
  return true;
}

export function escapeHtml(text) {
  return String(text ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function getQueryValue(name, fallback = "") {
  const params = new URLSearchParams(window.location.search);
  return params.get(name) ?? fallback;
}

export function setQueryValue(name, value) {
  const url = new URL(window.location.href);
  url.searchParams.set(name, value);
  history.replaceState({}, "", url);
}

export function showMessage(target, message, isError = false) {
  if (!target) return;
  target.textContent = message;
  target.className = `admin-status ${isError ? "error" : "success"}`;
}

export function askDeleteConfirmation() {
  return window.confirm(CONFIRM_DELETE_MESSAGE);
}

export function askEditConfirmation() {
  return window.confirm(CONFIRM_EDIT_MESSAGE);
}

export function openDialog(dialog, titleElement, titleText) {
  if (!dialog) return;
  if (titleElement) titleElement.textContent = titleText;
  dialog.showModal();
}

export function closeDialog(dialog, resetForm) {
  if (!dialog) return;
  dialog.close();
  if (typeof resetForm === "function") resetForm();
}

async function readBody(response) {
  const text = await response.text();
  if (!text) return {};

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return { raw: text };
  }

  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

function resolveApiUrl(url) {
  const baseUrl = window.__adminApiBase;
  if (!baseUrl) return url;
  if (/^https?:\/\//i.test(url)) return url;

  return new URL(url, baseUrl).toString();
}

function getSupabaseClient() {
  const supabase = window.__adminSupabase;
  if (!supabase) {
    throw new AdminAuthSessionError("Supabase no esta inicializado.");
  }

  return supabase;
}

export async function getAuthSession() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.getSession();
  if (error) throw new AdminAuthSessionError(error.message);

  if (!data.session?.access_token) {
    throw new AdminAuthSessionError();
  }

  return data.session;
}

async function refreshAuthSession() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.refreshSession();
  if (error) throw new AdminAuthSessionError(error.message);

  if (!data.session?.access_token) {
    throw new AdminAuthSessionError();
  }

  return data.session;
}

async function fetchWithAuth(url, options = {}) {
  const session = await getAuthSession();
  const headers = new Headers(options.headers ?? {});

  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  headers.set("Authorization", `Bearer ${session.access_token}`);

  return fetch(resolveApiUrl(url), {
    ...options,
    headers
  });
}

export async function apiRequest(url, options = {}) {
  let response = await fetchWithAuth(url, options);

  if (response.status === 401) {
    profilePromise = null;
    await refreshAuthSession();
    response = await fetchWithAuth(url, options);
  }

  const body = await readBody(response);
  if (response.status === 401) {
    throw new AdminAuthSessionError(body.error ?? body.raw ?? "Sesion requerida.");
  }

  if (!response.ok) {
    throw new Error(body.error ?? body.raw ?? "Error inesperado");
  }

  return body;
}

async function loadProfile() {
  const supabase = getSupabaseClient();
  const session = await getAuthSession();

  const { data: userData, error: userError } = await supabase.auth.getUser(session.access_token);
  if (userError) throw new AdminAuthSessionError(userError.message);

  const authUser = userData.user;
  if (!authUser) {
    throw new AdminAuthSessionError();
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id,email,role")
    .eq("id", authUser.id)
    .single();

  if (profileError) {
    throw new Error(`No se pudo cargar el perfil del usuario: ${profileError.message}`);
  }

  window.__adminSessionUser = profile;
  return profile;
}

export async function getSession() {
  if (!profilePromise) {
    profilePromise = loadProfile().catch((error) => {
      profilePromise = null;
      throw error;
    });
  }

  return profilePromise;
}

export function clearCachedSession() {
  profilePromise = null;
  window.__adminSessionUser = null;
}

export function applyRoleVisibility(user) {
  const adminOnly = document.querySelectorAll("[data-admin-only]");
  const nonAdminOnly = document.querySelectorAll("[data-not-admin-only]");

  if (user.role === "admin") {
    adminOnly.forEach((element) => {
      element.hidden = false;
    });
    nonAdminOnly.forEach((element) => {
      element.hidden = true;
    });
    return;
  }

  adminOnly.forEach((element) => {
    element.hidden = true;
  });
  nonAdminOnly.forEach((element) => {
    element.hidden = false;
  });
}
