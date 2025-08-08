"use strict";

// Data shape:
// {
//   lists: [
//     { id, name, items: [ { id, name, qty, category, notes, done } ] }
//   ],
//   activeListId
// }

const STORAGE_KEY = "shoppingLists.v1";

/** @typedef {{id: string, name: string, qty: string, category: string, notes: string, done: boolean}} Item */
/** @typedef {{id: string, name: string, items: Item[]}} ShoppingList */
/** @typedef {{lists: ShoppingList[], activeListId: string | null}} AppState */

/** @type {AppState} */
let state = loadState();

// DOM refs
const listsNav = document.getElementById("listsNav");
const newListForm = document.getElementById("newListForm");
const newListNameInput = document.getElementById("newListName");
const activeListTitle = document.getElementById("activeListTitle");
const deleteListBtn = document.getElementById("deleteListBtn");
const clearDoneBtn = document.getElementById("clearDoneBtn");

const newItemForm = document.getElementById("newItemForm");
const itemNameInput = document.getElementById("itemName");
const itemQtyInput = document.getElementById("itemQty");
const itemCategoryInput = document.getElementById("itemCategory");
const itemNotesInput = document.getElementById("itemNotes");

const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const sortSelect = document.getElementById("sortSelect");

const itemsList = document.getElementById("itemsList");

const listLinkTemplate = /** @type {HTMLTemplateElement} */ (document.getElementById("listLinkTemplate"));
const itemTemplate = /** @type {HTMLTemplateElement} */ (document.getElementById("itemTemplate"));

const exportBtn = document.getElementById("exportBtn");
const importInput = document.getElementById("importInput");

init();

function init() {
  // Ensure at least one list exists
  if (state.lists.length === 0) {
    const initial = createList("Min första lista");
    state.lists.push(initial);
    state.activeListId = initial.id;
    saveState();
  } else if (!state.activeListId) {
    state.activeListId = state.lists[0].id;
    saveState();
  }

  // Event listeners
  newListForm.addEventListener("submit", onCreateListSubmit);
  activeListTitle.addEventListener("change", onRenameActiveList);
  deleteListBtn.addEventListener("click", onDeleteActiveList);
  clearDoneBtn.addEventListener("click", onClearDoneItems);

  newItemForm.addEventListener("submit", onAddItemSubmit);

  searchInput.addEventListener("input", renderItems);
  statusFilter.addEventListener("change", renderItems);
  sortSelect.addEventListener("change", renderItems);

  exportBtn.addEventListener("click", onExport);
  importInput.addEventListener("change", onImport);

  // Initial render
  renderListsNav();
  renderActiveListHeader();
  renderItems();
}

// State persistence
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { lists: [], activeListId: null };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") throw new Error("Invalid state");
    // Basic validation
    parsed.lists = Array.isArray(parsed.lists) ? parsed.lists : [];
    parsed.activeListId = parsed.activeListId ?? null;
    return parsed;
  } catch {
    return { lists: [], activeListId: null };
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// Helpers
function generateId(prefix = "id") {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function findActiveListIndex() {
  return state.lists.findIndex(l => l.id === state.activeListId);
}

function getActiveList() {
  const idx = findActiveListIndex();
  return idx >= 0 ? state.lists[idx] : null;
}

function createList(name) {
  /** @type {ShoppingList} */
  const list = { id: generateId("list"), name: name.trim() || "Ny lista", items: [] };
  return list;
}

function createItem({ name, qty = "", category = "", notes = "" }) {
  /** @type {Item} */
  const item = {
    id: generateId("item"),
    name: name.trim(),
    qty: qty.trim(),
    category: category.trim(),
    notes: notes.trim(),
    done: false,
  };
  return item;
}

// Event handlers - Lists
function onCreateListSubmit(ev) {
  ev.preventDefault();
  const name = newListNameInput.value.trim();
  if (!name) return;
  const list = createList(name);
  state.lists.unshift(list);
  state.activeListId = list.id;
  newListNameInput.value = "";
  saveState();
  renderListsNav();
  renderActiveListHeader();
  renderItems();
}

function onRenameActiveList() {
  const list = getActiveList();
  if (!list) return;
  const next = activeListTitle.value.trim();
  list.name = next || list.name;
  saveState();
  renderListsNav();
}

function onDeleteActiveList() {
  const idx = findActiveListIndex();
  if (idx < 0) return;
  const list = state.lists[idx];
  const confirmDelete = window.confirm(`Ta bort listan "${list.name}"?`);
  if (!confirmDelete) return;
  state.lists.splice(idx, 1);
  state.activeListId = state.lists[0]?.id ?? null;
  saveState();
  renderListsNav();
  renderActiveListHeader();
  renderItems();
}

// Event handlers - Items
function onAddItemSubmit(ev) {
  ev.preventDefault();
  const list = getActiveList();
  if (!list) return;

  const name = itemNameInput.value.trim();
  if (!name) return;

  const newItem = createItem({
    name,
    qty: itemQtyInput.value,
    category: itemCategoryInput.value,
    notes: itemNotesInput.value,
  });

  list.items.unshift(newItem);
  newItemForm.reset();
  itemNameInput.focus();
  saveState();
  renderItems();
}

function onToggleItem(itemId, done) {
  const list = getActiveList();
  if (!list) return;
  const item = list.items.find(it => it.id === itemId);
  if (!item) return;
  item.done = done;
  saveState();
  renderItems();
}

function onUpdateItemField(itemId, field, value) {
  const list = getActiveList();
  if (!list) return;
  const item = list.items.find(it => it.id === itemId);
  if (!item) return;
  item[field] = value;
  saveState();
  // No full re-render to keep focus; only class/status tweaks done in input handlers
}

function onRemoveItem(itemId) {
  const list = getActiveList();
  if (!list) return;
  const idx = list.items.findIndex(it => it.id === itemId);
  if (idx < 0) return;
  list.items.splice(idx, 1);
  saveState();
  renderItems();
}

function onClearDoneItems() {
  const list = getActiveList();
  if (!list) return;
  const hasDone = list.items.some(i => i.done);
  if (!hasDone) return;
  const ok = window.confirm("Rensa alla avklarade varor?");
  if (!ok) return;
  list.items = list.items.filter(i => !i.done);
  saveState();
  renderItems();
}

// Export/Import
function onExport() {
  const data = JSON.stringify(state, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const date = new Date().toISOString().slice(0, 10);
  a.download = `inkopslistor_${date}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function onImport(ev) {
  const file = ev.target.files?.[0];
  if (!file) return;
  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.lists)) {
      throw new Error("Ogiltigt format");
    }
    state = {
      lists: parsed.lists,
      activeListId: parsed.activeListId ?? parsed.lists[0]?.id ?? null,
    };
    saveState();
    renderListsNav();
    renderActiveListHeader();
    renderItems();
  } catch (err) {
    alert("Kunde inte importera: " + String(err?.message || err));
  } finally {
    ev.target.value = ""; // allow re-import same file
  }
}

// Rendering
function renderListsNav() {
  listsNav.innerHTML = "";
  const template = listLinkTemplate.content;

  state.lists.forEach(list => {
    const node = /** @type {HTMLButtonElement} */ (template.cloneNode(true).firstElementChild);
    node.dataset.id = list.id;
    node.querySelector(".name").textContent = list.name;
    const openCount = list.items.filter(i => !i.done).length;
    node.querySelector(".count").textContent = String(openCount);
    if (list.id === state.activeListId) node.setAttribute("aria-current", "page");
    node.addEventListener("click", () => {
      state.activeListId = list.id;
      saveState();
      renderListsNav();
      renderActiveListHeader();
      renderItems();
    });
    listsNav.appendChild(node);
  });
}

function renderActiveListHeader() {
  const list = getActiveList();
  if (!list) {
    activeListTitle.value = "";
    activeListTitle.disabled = true;
    deleteListBtn.disabled = true;
    clearDoneBtn.disabled = true;
    newItemForm.querySelectorAll("input,button").forEach(el => (el.disabled = true));
    itemsList.innerHTML = "";
    return;
  }
  activeListTitle.disabled = false;
  deleteListBtn.disabled = false;
  clearDoneBtn.disabled = false;
  newItemForm.querySelectorAll("input,button").forEach(el => (el.disabled = false));
  activeListTitle.value = list.name;
}

function applyFilters(items) {
  const q = searchInput.value.trim().toLowerCase();
  const status = /** @type {"all"|"open"|"done"} */ (statusFilter.value);
  let filtered = items;
  if (q) {
    filtered = filtered.filter(i =>
      i.name.toLowerCase().includes(q) ||
      i.category.toLowerCase().includes(q) ||
      i.notes.toLowerCase().includes(q)
    );
  }
  if (status === "open") filtered = filtered.filter(i => !i.done);
  if (status === "done") filtered = filtered.filter(i => i.done);

  const sortBy = /** @type {"default"|"status"|"name"|"category"} */ (sortSelect.value);
  if (sortBy === "status") {
    filtered = [...filtered].sort((a, b) => Number(a.done) - Number(b.done));
  } else if (sortBy === "name") {
    filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name, "sv"));
  } else if (sortBy === "category") {
    filtered = [...filtered].sort((a, b) => a.category.localeCompare(b.category, "sv"));
  }
  return filtered;
}

function renderItems() {
  const list = getActiveList();
  if (!list) return;
  itemsList.innerHTML = "";

  const items = applyFilters(list.items);

  items.forEach(item => {
    const node = /** @type {HTMLElement} */ (itemTemplate.content.cloneNode(true).firstElementChild);
    node.dataset.id = item.id;

    const toggle = node.querySelector(".toggle");
    const nameInput = node.querySelector(".item-name");
    const qtyInput = node.querySelector(".item-qty");
    const categoryInput = node.querySelector(".item-category");
    const notesInput = node.querySelector(".item-notes");
    const removeBtn = node.querySelector(".remove");

    toggle.checked = item.done;
    nameInput.value = item.name;
    qtyInput.value = item.qty;
    categoryInput.value = item.category;
    notesInput.value = item.notes;

    node.classList.toggle("done", item.done);

    toggle.addEventListener("change", () => onToggleItem(item.id, toggle.checked));
    nameInput.addEventListener("change", () => onUpdateItemField(item.id, "name", nameInput.value.trim()));
    qtyInput.addEventListener("change", () => onUpdateItemField(item.id, "qty", qtyInput.value.trim()));
    categoryInput.addEventListener("change", () => onUpdateItemField(item.id, "category", categoryInput.value.trim()));
    notesInput.addEventListener("change", () => onUpdateItemField(item.id, "notes", notesInput.value.trim()));

    removeBtn.addEventListener("click", () => onRemoveItem(item.id));

    // Drag & drop for manual ordering
    node.addEventListener("dragstart", (e) => {
      node.classList.add("dragging");
      e.dataTransfer?.setData("text/plain", item.id);
      e.dataTransfer?.setDragImage(node, 10, 10);
    });
    node.addEventListener("dragend", () => node.classList.remove("dragging"));

    node.addEventListener("dragover", (e) => {
      e.preventDefault();
    });

    node.addEventListener("drop", (e) => {
      e.preventDefault();
      const draggedId = e.dataTransfer?.getData("text/plain");
      if (!draggedId || draggedId === item.id) return;
      const from = list.items.findIndex(i => i.id === draggedId);
      const to = list.items.findIndex(i => i.id === item.id);
      if (from < 0 || to < 0) return;
      const [moved] = list.items.splice(from, 1);
      list.items.splice(to, 0, moved);
      saveState();
      renderItems();
    });

    itemsList.appendChild(node);
  });
}