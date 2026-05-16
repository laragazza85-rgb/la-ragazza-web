import {
  apiRequest,
  applyRoleVisibility,
  askDeleteConfirmation,
  askEditConfirmation,
  closeDialog,
  escapeHtml,
  getQueryValue,
  getSession,
  openDialog,
  setQueryValue,
  showMessage
} from "/admin/common.js";

const REQUEST_STATUS = ["active", "approved", "rejected", "cancelled"];

const state = {
  user: null,
  roleRequests: [],
  currentScope: getQueryValue("scope", "mine")
};

const rowsElement = document.querySelector("#request-rows");
const statusElement = document.querySelector("#request-status");
const contextLabel = document.querySelector("#requests-context-label");
const viewSwitch = document.querySelector("#requests-view-switch");
const createButton = document.querySelector("#request-create-btn");

const modal = document.querySelector("#request-modal");
const modalTitle = document.querySelector("#request-modal-title");
const modalClose = document.querySelector("#request-modal-close");
const requestForm = document.querySelector("#request-form");
const submitButton = document.querySelector("#request-submit");
const cancelButton = document.querySelector("#request-cancel");

function getVisibleRequests() {
  if (state.user.role !== "admin") {
    return state.roleRequests.filter((item) => item.user_id === state.user.id);
  }

  if (state.currentScope === "others") {
    return state.roleRequests.filter((item) => item.user_id !== state.user.id);
  }

  return state.roleRequests.filter((item) => item.user_id === state.user.id);
}

function renderScopeLabel() {
  if (state.user.role !== "admin") {
    contextLabel.textContent = "Estas viendo tus solicitudes de cambio.";
    return;
  }

  contextLabel.textContent =
    state.currentScope === "others"
      ? "Estas viendo solicitudes enviadas por otros usuarios."
      : "Estas viendo tus solicitudes.";
}

function renderScopeButtons() {
  if (state.user.role !== "admin") {
    viewSwitch.hidden = true;
    return;
  }

  viewSwitch.hidden = false;
  viewSwitch.querySelectorAll(".admin-view-btn").forEach((button) => {
    if (!(button instanceof HTMLButtonElement)) return;
    button.classList.toggle("is-active", button.dataset.scope === state.currentScope);
  });
}

function renderRows() {
  const requests = getVisibleRequests();
  rowsElement.innerHTML = "";

  if (requests.length === 0) {
    rowsElement.innerHTML = `<tr><td colspan="6" class="admin-empty">No hay solicitudes para esta vista.</td></tr>`;
    return;
  }

  for (const request of requests) {
    const isActive = request.is_active === 1;
    const canEdit = isActive && (state.user.role === "admin" || request.user_id === state.user.id);

    const row = document.createElement("tr");
    row.className = "admin-table-row";
    row.innerHTML = `
      <td data-label="ID">${escapeHtml(request.id)}</td>
      <td data-label="Usuario">${escapeHtml(request.requester_email)}</td>
      <td data-label="Rol solicitado">${escapeHtml(request.requested_role)}</td>
      <td class="admin-col-comments" data-label="Justificacion">${escapeHtml(request.justification)}</td>
      <td data-label="Estado">
        ${
          state.user.role === "admin" && isActive
            ? `<select class="admin-select admin-select-compact" data-action="status" data-id="${escapeHtml(request.id)}">
                ${REQUEST_STATUS.map(
                  (status) =>
                    `<option value="${status}" ${request.status === status ? "selected" : ""}>${status}</option>`
                ).join("")}
              </select>`
            : `<span class="admin-pill-status">${escapeHtml(request.status)}</span>`
        }
      </td>
      <td class="admin-row-actions" data-label="Acciones">
        ${
          canEdit
            ? `<button data-action="edit" data-id="${escapeHtml(request.id)}" class="admin-btn admin-btn-soft">Editar</button>
               <button data-action="delete" data-id="${escapeHtml(request.id)}" class="admin-btn admin-btn-danger">Eliminar</button>`
            : "-"
        }
      </td>
    `;

    rowsElement.append(row);
  }
}

function openModal(title) {
  openDialog(modal, modalTitle, title);
}

function resetRequestForm() {
  requestForm.reset();
  requestForm.request_id.value = "";
  submitButton.textContent = "Guardar solicitud";
}

function closeModal() {
  closeDialog(modal, resetRequestForm);
}

function openCreateModal() {
  resetRequestForm();
  openModal("Nueva solicitud");
}

function openEditModal(id) {
  const requestItem = state.roleRequests.find((item) => item.id === id);
  if (!requestItem) return;

  requestForm.request_id.value = String(requestItem.id);
  requestForm.requested_role.value = requestItem.requested_role;
  requestForm.justification.value = requestItem.justification;
  submitButton.textContent = "Actualizar solicitud";
  openModal("Editar solicitud");
}

async function loadRequests() {
  const { roleRequests } = await apiRequest("/api/role-requests");
  state.roleRequests = roleRequests;

  renderScopeLabel();
  renderScopeButtons();
  renderRows();
}

function initScopeSwitch() {
  viewSwitch?.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement)) return;

    const scope = target.dataset.scope;
    if (!scope || scope === state.currentScope) return;

    state.currentScope = scope;
    setQueryValue("scope", scope);
    renderScopeLabel();
    renderScopeButtons();
    renderRows();
  });
}

rowsElement?.addEventListener("click", async (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;

  const requestId = String(target.dataset.id ?? "").trim();
  if (!requestId) return;

  try {
    if (target.dataset.action === "edit") {
      openEditModal(requestId);
      return;
    }

    if (target.dataset.action === "delete") {
      if (!askDeleteConfirmation()) return;
      await apiRequest(`/api/role-requests/${requestId}`, { method: "DELETE" });
      showMessage(statusElement, "Solicitud eliminada.");
      await loadRequests();
    }
  } catch (error) {
    showMessage(statusElement, error.message, true);
  }
});

rowsElement?.addEventListener("change", async (event) => {
  const target = event.target;
  if (!(target instanceof HTMLSelectElement)) return;
  if (target.dataset.action !== "status") return;

  try {
    await apiRequest(`/api/role-requests/${target.dataset.id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: target.value })
    });
    showMessage(statusElement, "Estado actualizado.");
    await loadRequests();
  } catch (error) {
    showMessage(statusElement, error.message, true);
  }
});

requestForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = Object.fromEntries(new FormData(requestForm).entries());
  const payload = {
    requested_role: formData.requested_role,
    justification: formData.justification
  };

  const requestId = String(formData.request_id ?? "").trim();

  try {
    if (requestId) {
      if (!askEditConfirmation()) return;
      await apiRequest(`/api/role-requests/${requestId}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });
      showMessage(statusElement, "Solicitud actualizada.");
    } else {
      await apiRequest("/api/role-requests", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      showMessage(statusElement, "Solicitud creada.");
    }

    closeModal();
    await loadRequests();
  } catch (error) {
    showMessage(statusElement, error.message, true);
  }
});

createButton?.addEventListener("click", openCreateModal);
modalClose?.addEventListener("click", closeModal);
cancelButton?.addEventListener("click", closeModal);

(async function initRequestsPage() {
  try {
    state.user = await getSession();
    applyRoleVisibility(state.user);

    if (state.user.role !== "admin") {
      state.currentScope = "mine";
      setQueryValue("scope", "mine");
    } else if (!["mine", "others"].includes(state.currentScope)) {
      state.currentScope = "mine";
      setQueryValue("scope", "mine");
    }

    initScopeSwitch();
    await loadRequests();

    if (getQueryValue("action") === "new") {
      openCreateModal();
    }
  } catch {
    window.location.assign("/admin/login");
  }
})();
