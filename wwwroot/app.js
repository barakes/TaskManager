const API = "/api";

const state = {
  tasks: [],
  categories: [],
  status: "",
  search: "",
  sort: "dueDate",
};

const STATUS_LABELS = { ToDo: "לביצוע", InProgress: "בתהליך", Done: "הושלמה" };
const PRIORITY_LABELS = {
  Low: "עדיפות נמוכה",
  Medium: "עדיפות בינונית",
  High: "עדיפות גבוהה",
};
const PRIORITY_ORDER = { High: 0, Medium: 1, Low: 2 };

const el = (id) => document.getElementById(id);

// ---------- תקשורת עם השרת ----------

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(API + path, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
  } catch {
    throw new Error("לא ניתן להתחבר לשרת. ודא שהשרת פועל.");
  }

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return response.status === 204 ? null : response.json();
}

async function getErrorMessage(response) {
  try {
    const data = await response.json();
    if (data.message) return data.message;
    if (data.errors) return Object.values(data.errors).flat().join(" ");
  } catch {
    // התשובה לא הייתה JSON
  }
  return `אירעה שגיאה בשרת (קוד ${response.status})`;
}

// ---------- טעינת נתונים ----------

async function loadCategories() {
  state.categories = await request("/categories");
  const select = el("category-input");
  for (const category of state.categories) {
    const option = document.createElement("option");
    option.value = category.id;
    option.textContent = category.name;
    select.appendChild(option);
  }
}

async function loadTasks() {
  const params = new URLSearchParams();
  if (state.status) params.set("status", state.status);
  if (state.search) params.set("search", state.search);
  const query = params.toString();

  state.tasks = await request("/tasks" + (query ? "?" + query : ""));
  renderTasks();
}

async function refresh() {
  try {
    await loadTasks();
    hideError();
  } catch (error) {
    showError(error.message);
  }
}

// ---------- הצגה ----------

function renderTasks() {
  const list = el("task-list");
  list.innerHTML = "";

  const tasks = sortTasks(state.tasks);
  el("empty-message").hidden = tasks.length > 0;

  for (const task of tasks) {
    list.appendChild(createTaskCard(task));
  }
}

function sortTasks(tasks) {
  const sorted = [...tasks];

  if (state.sort === "dueDate") {
    sorted.sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate.localeCompare(b.dueDate);
    });
  } else if (state.sort === "priority") {
    sorted.sort(
      (a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority],
    );
  } else if (state.sort === "created") {
    sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  return sorted;
}

function createTaskCard(task) {
  const card = document.createElement("li");
  card.className = "task-card" + (task.status === "Done" ? " done" : "");
  card.dataset.id = task.id;

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = task.status === "Done";
  checkbox.title = "סימון כהושלמה";
  checkbox.dataset.action = "toggle";

  const main = document.createElement("div");
  main.className = "task-main";

  const title = document.createElement("div");
  title.className = "task-title";
  title.textContent = task.title;

  const badges = document.createElement("div");
  badges.className = "badges";
  badges.append(...createBadges(task));

  main.append(title, badges);

  const actions = document.createElement("div");
  actions.className = "task-actions";
  actions.append(
    createButton("עריכה", "btn btn-small", "edit"),
    createButton("מחיקה", "btn btn-small btn-danger", "delete"),
  );

  card.append(checkbox, main, actions);
  return card;
}

function createButton(text, className, action) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.textContent = text;
  button.dataset.action = action;
  return button;
}

function createBadges(task) {
  const badges = [createBadge(STATUS_LABELS[task.status])];

  badges.push(
    createBadge(
      PRIORITY_LABELS[task.priority],
      task.priority === "High" ? "badge-high" : "",
    ),
  );

  if (task.categoryName) {
    badges.push(createBadge(task.categoryName));
  }

  if (task.dueDate) {
    const overdue = task.status !== "Done" && isOverdue(task.dueDate);
    badges.push(
      createBadge(
        "יעד: " + formatDate(task.dueDate),
        overdue ? "badge-overdue" : "",
      ),
    );
  }

  return badges;
}

function createBadge(text, extraClass = "") {
  const badge = document.createElement("span");
  badge.className = ("badge " + extraClass).trim();
  badge.textContent = text;
  return badge;
}

function formatDate(value) {
  return new Date(value).toLocaleDateString("he-IL");
}

function isOverdue(value) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(value) < today;
}

function showError(message) {
  const banner = el("error-banner");
  banner.textContent = message;
  banner.hidden = false;
}

function hideError() {
  el("error-banner").hidden = true;
}

// ---------- סינון, חיפוש ומיון ----------

el("status-tabs").addEventListener("click", (event) => {
  const tab = event.target.closest(".tab");
  if (!tab) return;

  document
    .querySelectorAll(".tab")
    .forEach((t) => t.classList.remove("active"));
  tab.classList.add("active");

  state.status = tab.dataset.status;
  refresh();
});

let searchTimer;
el("search-input").addEventListener("input", (event) => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    state.search = event.target.value.trim();
    refresh();
  }, 300);
});

el("sort-select").addEventListener("change", (event) => {
  state.sort = event.target.value;
  renderTasks();
});

// ---------- טופס יצירה ועריכה ----------

let editingId = null;

function openTaskForm(task = null) {
  editingId = task ? task.id : null;

  el('form-title').textContent = task ? 'עריכת משימה' : 'משימה חדשה';
  el('title-input').value = task?.title ?? '';
  el('description-input').value = task?.description ?? '';
  el('status-input').value = task?.status ?? 'ToDo';
  el('priority-input').value = task?.priority ?? 'Medium';
  el('due-date-input').value = task?.dueDate ? task.dueDate.slice(0, 10) : '';
  el('category-input').value = task?.categoryId ?? '';

  clearFormErrors();
  el('task-dialog').showModal();
  el('title-input').focus();
}

function clearFormErrors() {
  el('title-input').classList.remove('invalid');
  el('title-error').hidden = true;
  el('form-error').hidden = true;
}

function showFieldError(message) {
  el('title-input').classList.add('invalid');
  el('title-error').textContent = message;
  el('title-error').hidden = false;
  el('title-input').focus();
}

el('task-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  clearFormErrors();

  const title = el('title-input').value.trim();
  if (!title) {
    showFieldError('יש להזין כותרת למשימה');
    return;
  }

  const categoryValue = el('category-input').value;
  const body = {
    title,
    description: el('description-input').value.trim() || null,
    status: el('status-input').value,
    priority: el('priority-input').value,
    dueDate: el('due-date-input').value || null,
    categoryId: categoryValue ? Number(categoryValue) : null
  };

  const saveButton = event.submitter;
  saveButton.disabled = true;

  try {
    if (editingId) {
      await request(`/tasks/${editingId}`, { method: 'PUT', body: JSON.stringify(body) });
    } else {
      await request('/tasks', { method: 'POST', body: JSON.stringify(body) });
    }
    el('task-dialog').close();
    await refresh();
  } catch (error) {
    el('form-error').textContent = error.message;
    el('form-error').hidden = false;
  } finally {
    saveButton.disabled = false;
  }
});

el('title-input').addEventListener('input', clearFormErrors);
el('cancel-form-btn').addEventListener('click', () => el('task-dialog').close());
el('new-task-btn').addEventListener('click', () => openTaskForm());

// ---------- פעולות על כרטיסים ----------

let selectedTask = null;

const findTask = (id) => state.tasks.find((t) => t.id === id);

el('task-list').addEventListener('click', (event) => {
  const card = event.target.closest('.task-card');
  if (!card) return;

  const task = findTask(Number(card.dataset.id));
  const action = event.target.dataset.action;

  if (action === 'toggle') {
    toggleDone(task, event.target);
  } else if (action === 'edit') {
    openTaskForm(task);
  } else if (action === 'delete') {
    openDeleteDialog(task);
  } else {
    openDetails(task);
  }
});

async function toggleDone(task, checkbox) {
  const newStatus = checkbox.checked ? 'Done' : 'ToDo';
  checkbox.disabled = true;

  try {
    const updated = await request(`/tasks/${task.id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus })
    });

    const index = state.tasks.findIndex((t) => t.id === updated.id);
    if (state.status && updated.status !== state.status) {
      state.tasks.splice(index, 1);
    } else {
      state.tasks[index] = updated;
    }

    renderTasks();
    hideError();
  } catch (error) {
    checkbox.checked = !checkbox.checked;
    showError(error.message);
  } finally {
    checkbox.disabled = false;
  }
}

// ---------- חלון פרטי משימה ----------

function openDetails(task) {
  selectedTask = task;

  el('details-title').textContent = task.title;
  el('details-badges').replaceChildren(...createBadges(task));
  el('details-description').textContent = task.description || 'אין תיאור';

  const lines = [];
  if (task.dueDate) lines.push('יעד: ' + formatDate(task.dueDate));
  lines.push('נוצרה: ' + formatDateTime(task.createdAt));
  lines.push('עודכנה: ' + formatDateTime(task.updatedAt));

  const parts = [];
  lines.forEach((line, i) => {
    if (i > 0) parts.push(document.createElement('br'));
    parts.push(line);
  });
  el('details-dates').replaceChildren(...parts);

  el('details-dialog').showModal();
}

function formatDateTime(value) {
  return new Date(value).toLocaleString('he-IL', { dateStyle: 'short', timeStyle: 'short' });
}

el('close-details-btn').addEventListener('click', () => el('details-dialog').close());

el('details-edit-btn').addEventListener('click', () => {
  el('details-dialog').close();
  openTaskForm(selectedTask);
});

el('details-delete-btn').addEventListener('click', () => {
  el('details-dialog').close();
  openDeleteDialog(selectedTask);
});

// ---------- אישור מחיקה ----------

function openDeleteDialog(task) {
  selectedTask = task;
  el('delete-dialog').showModal();
}

el('cancel-delete-btn').addEventListener('click', () => el('delete-dialog').close());

el('confirm-delete-btn').addEventListener('click', async (event) => {
  const button = event.currentTarget;
  button.disabled = true;

  try {
    await request(`/tasks/${selectedTask.id}`, { method: 'DELETE' });
    el('delete-dialog').close();
    await refresh();
  } catch (error) {
    el('delete-dialog').close();
    showError(error.message);
  } finally {
    button.disabled = false;
  }
});

// ---------- הפעלה ----------

async function init() {
  try {
    await loadCategories();
    await loadTasks();
  } catch (error) {
    showError(error.message);
  }
}

init();
