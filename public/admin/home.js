import { applyRoleVisibility, getSession } from "/admin/common.js";

const greeting = document.querySelector("#admin-home-greeting");

(async function initHome() {
  try {
    const user = window.__adminSessionUser ?? (await getSession());
    applyRoleVisibility(user);

    if (greeting) {
      greeting.textContent = `Hola ${user.email}, bienvenido al Centro de control.`;
    }
  } catch {
    window.location.assign("/admin/login");
  }
})();
