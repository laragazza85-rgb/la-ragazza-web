import {
  apiRequest,
  applyRoleVisibility,
  askDeleteConfirmation,
  askEditConfirmation,
  closeDialog,
  getQueryValue,
  getSession,
  openDialog,
  setQueryValue,
  showMessage
} from "/admin/common.js";

function getDefaultScope(user, currentScope) {
  if (user.role === "customer") return "mine";
  return ["mine", "others"].includes(currentScope) ? currentScope : "mine";
}

function bindScopeSwitch(viewSwitch, state, renderAll) {
  viewSwitch?.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement)) return;

    const scope = target.dataset.scope;
    if (!scope || scope === state.currentScope) return;

    state.currentScope = scope;
    setQueryValue("scope", scope);
    renderAll();
  });
}

export function initEntityCrudPage(config) {
  const state = {
    user: null,
    items: [],
    currentScope: getQueryValue("scope", "mine")
  };

  const rowsElement = document.querySelector(config.selectors.rows);
  const statusElement = document.querySelector(config.selectors.status);
  const contextLabel = document.querySelector(config.selectors.contextLabel);
  const viewSwitch = document.querySelector(config.selectors.viewSwitch);
  const createButton = document.querySelector(config.selectors.createButton);

  const modal = document.querySelector(config.selectors.modal);
  const modalTitle = document.querySelector(config.selectors.modalTitle);
  const modalClose = document.querySelector(config.selectors.modalClose);
  const form = document.querySelector(config.selectors.form);
  const submitButton = document.querySelector(config.selectors.submitButton);
  const cancelButton = document.querySelector(config.selectors.cancelButton);

  function resetForm() {
    form?.reset();
    if (config.setHiddenId) config.setHiddenId(form, "");
    if (submitButton) submitButton.textContent = config.submitLabels.create;
  }

  function openCreateModal() {
    resetForm();
    openDialog(modal, modalTitle, config.modalTitles.create);
  }

  function openEditModal(id) {
    const item = state.items.find((entry) => entry.id === id);
    if (!item || !form) return;

    config.fillForm(form, item);
    if (submitButton) submitButton.textContent = config.submitLabels.update;
    openDialog(modal, modalTitle, config.modalTitles.update);
  }

  function getVisibleItems() {
    if (state.user.role === "customer") {
      return state.items.filter((item) => item.user_id === state.user.id);
    }

    if (state.currentScope === "others") {
      return state.items.filter((item) => item.user_id !== state.user.id);
    }

    return state.items.filter((item) => item.user_id === state.user.id);
  }

  function renderScopeButtons() {
    if (!viewSwitch) return;

    if (state.user.role === "customer") {
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
    if (!rowsElement) return;

    const visibleItems = getVisibleItems();
    rowsElement.replaceChildren();

    if (visibleItems.length === 0) {
      const emptyRow = document.createElement("tr");
      const emptyCell = document.createElement("td");
      emptyCell.colSpan = config.columns;
      emptyCell.className = "admin-empty";
      emptyCell.textContent = config.messages.empty;
      emptyRow.append(emptyCell);
      rowsElement.append(emptyRow);
      return;
    }

    for (const item of visibleItems) {
      const row = document.createElement("tr");
      row.className = "admin-table-row";
      row.innerHTML = config.renderRow(item, state.user);
      rowsElement.append(row);
    }
  }

  function renderAll() {
    if (contextLabel) {
      contextLabel.textContent = config.getScopeLabel(state.user, state.currentScope);
    }
    renderScopeButtons();
    renderRows();
  }

  async function loadItems() {
    const data = await apiRequest(config.endpoints.list);
    state.items = data[config.responseKey];
    renderAll();
  }

  rowsElement?.addEventListener("click", async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const itemId = String(target.dataset.id ?? "").trim();
    if (!itemId) return;

    try {
      if (target.dataset.action === "edit") {
        openEditModal(itemId);
        return;
      }

      if (target.dataset.action === "delete") {
        if (!askDeleteConfirmation()) return;
        await apiRequest(config.endpoints.remove(itemId), { method: "DELETE" });
        showMessage(statusElement, config.messages.deleted);
        await loadItems();
      }
    } catch (error) {
      showMessage(statusElement, error.message, true);
    }
  });

  if (config.endpoints.updateStatus) {
    rowsElement?.addEventListener("change", async (event) => {
      const target = event.target;
      if (!(target instanceof HTMLSelectElement)) return;
      if (target.dataset.action !== "status") return;

      try {
        await apiRequest(config.endpoints.updateStatus(String(target.dataset.id ?? "").trim()), {
          method: "PATCH",
          body: JSON.stringify({ status: target.value })
        });
        showMessage(statusElement, config.messages.statusUpdated);
        await loadItems();
      } catch (error) {
        showMessage(statusElement, error.message, true);
      }
    });
  }

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = Object.fromEntries(new FormData(form).entries());
    const itemId = String(config.readHiddenId(formData) ?? "").trim();
    const payload = config.buildPayload(formData);

    try {
      if (itemId) {
        if (!askEditConfirmation()) return;
        await apiRequest(config.endpoints.update(itemId), {
          method: "PUT",
          body: JSON.stringify(payload)
        });
        showMessage(statusElement, config.messages.updated);
      } else {
        await apiRequest(config.endpoints.create, {
          method: "POST",
          body: JSON.stringify(payload)
        });
        showMessage(statusElement, config.messages.created);
      }

      closeDialog(modal, resetForm);
      await loadItems();
    } catch (error) {
      showMessage(statusElement, error.message, true);
    }
  });

  createButton?.addEventListener("click", openCreateModal);
  modalClose?.addEventListener("click", () => closeDialog(modal, resetForm));
  cancelButton?.addEventListener("click", () => closeDialog(modal, resetForm));

  bindScopeSwitch(viewSwitch, state, renderAll);

  (async function init() {
    try {
      state.user = await getSession();
      applyRoleVisibility(state.user);

      state.currentScope = getDefaultScope(state.user, state.currentScope);
      setQueryValue("scope", state.currentScope);

      await loadItems();

      if (getQueryValue("action") === "new") {
        openCreateModal();
      }
    } catch {
      window.location.assign("/admin/login");
    }
  })();
}

