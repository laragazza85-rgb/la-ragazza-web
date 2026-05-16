export const CONFIRM_DELETE_MESSAGE = "¿Seguro?";
export const CONFIRM_EDIT_MESSAGE = "¿Seguro que quieres confirmar cambios?";

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

export async function apiRequest(url, options = {}) {
  const supabase = window.__adminSupabase;
  const sessionResult = supabase ? await supabase.auth.getSession() : { data: { session: null } };
  const accessToken = sessionResult.data.session?.access_token;

  const response = await fetch(resolveApiUrl(url), {
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
    },
    ...options
  });

  const body = await readBody(response);
  if (!response.ok) {
    throw new Error(body.error ?? body.raw ?? "Error inesperado");
  }

  return body;
}

export async function getSession() {
  const supabase = window.__adminSupabase;
  if (!supabase) {
    throw new Error("Supabase no esta inicializado.");
  }

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;

  const session = sessionData.session;
  if (!session) {
    throw new Error("Sesion requerida.");
  }

  const { data: userData, error: userError } = await supabase.auth.getUser(session.access_token);
  if (userError) throw userError;

  const authUser = userData.user;
  if (!authUser) {
    throw new Error("Sesion requerida.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id,email,role")
    .eq("id", authUser.id)
    .single();

  if (profileError) throw profileError;

  return profile;
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
