import { apiRequest, showMessage } from "/admin/common.js";

const statusEl = document.querySelector("#auth-status");
const form = document.querySelector("form[data-mode]");

form?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const mode = form.dataset.mode;
  const payload = Object.fromEntries(new FormData(form).entries());

  try {
    if (mode === "signup") {
      await apiRequest("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      showMessage(statusEl, "Cuenta creada con exito. Redirigiendo a login...");
      setTimeout(() => window.location.assign("/admin/login"), 900);
      return;
    }

    await apiRequest("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    window.location.assign("/admin");
  } catch (error) {
    showMessage(statusEl, error.message, true);
  }
});
