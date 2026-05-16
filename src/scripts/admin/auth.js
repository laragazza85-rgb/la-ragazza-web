import { createSupabaseBrowserClient } from "../../lib/supabaseClient.js";

function getFormValues(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function setStatus(target, message, isError = false) {
  if (!target) return;
  target.textContent = message;
  target.className = `admin-status ${isError ? "error" : "success"}`;
}

export function initAdminAuthForm({ form, status, mode, supabaseUrl, supabaseAnonKey }) {
  const supabase = createSupabaseBrowserClient({ url: supabaseUrl, anonKey: supabaseAnonKey });

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const payload = getFormValues(form);

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: String(payload.email ?? "").trim(),
          password: String(payload.password ?? "")
        });

        if (error) throw error;

        setStatus(status, "Cuenta creada. Revisa tu email si tienes confirmacion activa y luego inicia sesion.");
        form.reset();
        window.location.assign("/admin/login");
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: String(payload.email ?? "").trim(),
        password: String(payload.password ?? "")
      });

      if (error) throw error;

      window.location.assign("/admin");
    } catch (error) {
      setStatus(status, error instanceof Error ? error.message : "Error inesperado", true);
    }
  });
}