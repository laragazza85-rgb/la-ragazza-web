import { apiRequest, applyRoleVisibility, getSession } from "/admin/common.js";

const logoutButton = document.querySelector("#admin-logout");
const mobileLogoutButton = document.querySelector("#admin-mobile-logout");
const mobileMenuButton = document.querySelector("#admin-mobile-menu-btn");
const mobileMenu = document.querySelector("#admin-mobile-menu");
const header = document.querySelector("#admin-header");
const headerInner = document.querySelector("#admin-header-inner");

function applyHeaderState() {
  const scrolled = window.scrollY > 36;
  header?.classList.toggle("is-scrolled", scrolled);
  headerInner?.classList.toggle("is-compact", scrolled);
}

function initHeaderMotion() {
  applyHeaderState();
  window.addEventListener("scroll", applyHeaderState, { passive: true });
  window.addEventListener("resize", applyHeaderState, { passive: true });
}

function initDropdowns() {
  document.querySelectorAll(".admin-nav-trigger").forEach((button) => {
    button.addEventListener("click", () => {
      const dropdown = button.closest(".admin-nav-dropdown");
      if (!dropdown) return;

      const shouldOpen = !dropdown.classList.contains("is-open");
      document.querySelectorAll(".admin-nav-dropdown").forEach((item) => {
        item.classList.remove("is-open");
        const trigger = item.querySelector(".admin-nav-trigger");
        trigger?.setAttribute("aria-expanded", "false");
      });

      if (shouldOpen) {
        dropdown.classList.add("is-open");
        button.setAttribute("aria-expanded", "true");
      }
    });
  });

  window.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    if (target.closest(".admin-nav-dropdown")) return;

    document.querySelectorAll(".admin-nav-dropdown").forEach((item) => {
      item.classList.remove("is-open");
      const trigger = item.querySelector(".admin-nav-trigger");
      trigger?.setAttribute("aria-expanded", "false");
    });
  });
}

function initMobileMenu() {
  const menuIcon =
    '<svg class="admin-mobile-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>';
  const closeIcon =
    '<svg class="admin-mobile-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>';

  function setMenuState(open) {
    if (!mobileMenu || !mobileMenuButton) return;

    mobileMenu.classList.toggle("is-open", open);
    mobileMenu.setAttribute("aria-hidden", open ? "false" : "true");
    mobileMenuButton.setAttribute("aria-expanded", open ? "true" : "false");
    mobileMenuButton.innerHTML = open ? closeIcon : menuIcon;
    document.body.style.overflow = open ? "hidden" : "";
  }

  mobileMenuButton?.addEventListener("click", () => {
    const isOpen = mobileMenu?.classList.contains("is-open") ?? false;
    setMenuState(!isOpen);
  });

  mobileMenu?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setMenuState(false), { passive: true });
  });

  window.addEventListener(
    "resize",
    () => {
      if (window.innerWidth >= 1024) {
        setMenuState(false);
      }
    },
    { passive: true }
  );

  window.__closeAdminMobileMenu = () => setMenuState(false);
}

(async function initHeader() {
  try {
    const user = await getSession();
    applyRoleVisibility(user);
    window.__adminSessionUser = user;

    async function logout() {
      window.__closeAdminMobileMenu?.();
      await apiRequest("/api/auth/logout", { method: "POST" });
      window.location.assign("/admin/login");
    }

    logoutButton?.addEventListener("click", logout);
    mobileLogoutButton?.addEventListener("click", logout);

    initDropdowns();
    initHeaderMotion();
    initMobileMenu();
  } catch {
    window.location.assign("/admin/login");
  }
})();
