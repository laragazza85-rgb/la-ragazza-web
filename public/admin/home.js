import { applyRoleVisibility, getSession, handleAuthError } from "/admin/common.js";

const greeting = document.querySelector("#admin-home-greeting");

(async function initHome() {
  try {
    const user = window.__adminSessionUser ?? (await getSession());
    applyRoleVisibility(user);

    if (greeting) {
      greeting.textContent = `Hola ${user.email}, bienvenido al Centro de control.`;
    }
  } catch (error) {
    if (handleAuthError(error)) return;

    if (greeting) {
      greeting.textContent = error instanceof Error ? error.message : "No se pudo cargar el perfil.";
    }
  }
})();
