// ============================================================
//  Personal Dashboard — app.js
//  Features: Greeting, Focus Timer, To-Do List, Quick Links
//  Challenges: Light/Dark Mode, Custom Name, Prevent Duplicates
// ============================================================

// ─────────────────────────────────────────
// Utility: Local Storage helpers
// ─────────────────────────────────────────
const storage = {
    get(key, fallback = null) {
        try {
            const raw = localStorage.getItem(key);
            return raw !== null ? JSON.parse(raw) : fallback;
        } catch {
            return fallback;
        }
    },
    set(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    },
};

// ─────────────────────────────────────────
// Utility: Toast notification
// ─────────────────────────────────────────
let toastTimer = null;

function showToast(message, type = "info") {
    let toast = document.getElementById("toast");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "toast";
        toast.className = "toast";
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.className = `toast ${type === "error" ? "error" : ""}`;

    clearTimeout(toastTimer);

    // Force reflow so the animation restarts
    void toast.offsetWidth;
    toast.classList.add("show");

    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2500);
}

// ============================================================
// 1. THEME — Light / Dark Mode
// ============================================================
const themeToggleBtn = document.getElementById("themeToggle");
const themeIcon = themeToggleBtn.querySelector(".theme-icon");

function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    themeIcon.textContent = theme === "dark" ? "☀️" : "🌙";
}

function initTheme() {
    const saved = storage.get("theme", "light");
    applyTheme(saved);
}

themeToggleBtn.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme");
    const next = current === "dark" ? "light" : "dark";
    applyTheme(next);
    storage.set("theme", next);
});

// ============================================================
// 2. GREETING — Time, Date & Custom Name
// ============================================================
const timeDisplay    = document.getElementById("timeDisplay");
const dateDisplay    = document.getElementById("dateDisplay");
const greetingEl     = document.getElementById("greeting");
const userGreetingEl = document.getElementById("userGreeting");
const nameInput      = document.getElementById("nameInput");
const saveNameBtn    = document.getElementById("saveName");

const DAYS   = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"];

function getGreetingPhrase(hour) {
    if (hour >= 5  && hour < 12) return "Good Morning";
    if (hour >= 12 && hour < 17) return "Good Afternoon";
    if (hour >= 17 && hour < 21) return "Good Evening";
    return "Good Night";
}

function padTwo(n) {
    return String(n).padStart(2, "0");
}

function updateClock() {
    const now     = new Date();
    const h       = now.getHours();
    const m       = now.getMinutes();
    const s       = now.getSeconds();
    const day     = DAYS[now.getDay()];
    const date    = now.getDate();
    const month   = MONTHS[now.getMonth()];
    const year    = now.getFullYear();

    timeDisplay.textContent = `${padTwo(h)}:${padTwo(m)}:${padTwo(s)}`;
    dateDisplay.textContent = `${day}, ${month} ${date}, ${year}`;
    greetingEl.textContent  = getGreetingPhrase(h);
}

function renderUserGreeting() {
    const name = storage.get("userName", "");
    if (name) {
        userGreetingEl.textContent = `Welcome back, ${name}! 👋`;
        nameInput.value = name;
    } else {
        userGreetingEl.textContent = "";
    }
}

saveNameBtn.addEventListener("click", () => {
    const name = nameInput.value.trim();
    if (name) {
        storage.set("userName", name);
        renderUserGreeting();
        showToast(`Name saved: ${name}`);
    } else {
        showToast("Please enter a name.", "error");
    }
});

nameInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") saveNameBtn.click();
});

// Start the clock
updateClock();
setInterval(updateClock, 1000);

// ============================================================
// 3. FOCUS TIMER — Start / Stop / Reset + Custom Duration
// ============================================================
const timerDisplay  = document.getElementById("timerDisplay");
const startTimerBtn = document.getElementById("startTimer");
const stopTimerBtn  = document.getElementById("stopTimer");
const resetTimerBtn = document.getElementById("resetTimer");
const timerMinutes  = document.getElementById("timerMinutes");
const setTimerBtn   = document.getElementById("setTimer");

let timerDuration  = 25 * 60; // seconds
let timeRemaining  = timerDuration;
let timerInterval  = null;
let timerRunning   = false;

function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${padTwo(m)}:${padTwo(s)}`;
}

function updateTimerDisplay() {
    timerDisplay.textContent = formatTime(timeRemaining);
}

function startTimer() {
    if (timerRunning || timeRemaining <= 0) return;
    timerRunning = true;
    timerDisplay.classList.add("running");

    timerInterval = setInterval(() => {
        timeRemaining--;
        updateTimerDisplay();

        if (timeRemaining <= 0) {
            clearInterval(timerInterval);
            timerRunning = false;
            timerDisplay.classList.remove("running");
            showToast("⏰ Time's up! Great focus session!");
        }
    }, 1000);
}

function stopTimer() {
    if (!timerRunning) return;
    clearInterval(timerInterval);
    timerRunning = false;
    timerDisplay.classList.remove("running");
}

function resetTimer() {
    stopTimer();
    timeRemaining = timerDuration;
    updateTimerDisplay();
}

function setCustomTimer() {
    const mins = parseInt(timerMinutes.value, 10);
    if (isNaN(mins) || mins < 1 || mins > 60) {
        showToast("Enter a value between 1 and 60.", "error");
        return;
    }
    stopTimer();
    timerDuration  = mins * 60;
    timeRemaining  = timerDuration;
    updateTimerDisplay();
    showToast(`Timer set to ${mins} minute${mins > 1 ? "s" : ""}.`);
}

startTimerBtn.addEventListener("click", startTimer);
stopTimerBtn.addEventListener("click",  stopTimer);
resetTimerBtn.addEventListener("click", resetTimer);
setTimerBtn.addEventListener("click",   setCustomTimer);

updateTimerDisplay();

// ============================================================
// 4. TO-DO LIST — Add / Edit / Done / Delete / Sort
//    Challenges: Prevent Duplicates, Sort Tasks
// ============================================================
const todoInput  = document.getElementById("todoInput");
const addTodoBtn = document.getElementById("addTodo");
const sortBtn    = document.getElementById("sortTodos");
const todoList   = document.getElementById("todoList");

let todos     = storage.get("todos", []);
let sortedAsc = false;

function saveTodos() {
    storage.set("todos", todos);
}

function isDuplicate(text) {
    return todos.some(t => t.text.toLowerCase() === text.toLowerCase());
}

function addTodo() {
    const text = todoInput.value.trim();
    if (!text) {
        showToast("Task cannot be empty.", "error");
        return;
    }
    if (isDuplicate(text)) {
        showToast("Task already exists! (No duplicates)", "error");
        return;
    }
    todos.push({ id: Date.now(), text, done: false });
    saveTodos();
    todoInput.value = "";
    renderTodos();
    showToast("Task added!");
}

function toggleDone(id) {
    const task = todos.find(t => t.id === id);
    if (task) {
        task.done = !task.done;
        saveTodos();
        renderTodos();
    }
}

function deleteTodo(id) {
    todos = todos.filter(t => t.id !== id);
    saveTodos();
    renderTodos();
    showToast("Task deleted.");
}

function startEdit(id) {
    const item = document.querySelector(`.todo-item[data-id="${id}"]`);
    if (!item) return;

    const task     = todos.find(t => t.id === id);
    const textSpan = item.querySelector(".todo-text");
    const editBtn  = item.querySelector(".btn-icon.edit");

    // Replace text with input
    const input = document.createElement("input");
    input.type      = "text";
    input.className = "todo-edit-input";
    input.value     = task.text;
    textSpan.replaceWith(input);
    input.focus();

    // Swap edit button to save button
    editBtn.textContent = "💾";
    editBtn.classList.replace("edit", "save-edit");
    editBtn.title = "Save";

    // Save on button click
    editBtn.onclick = () => saveEdit(id, input.value);
    // Save on Enter key
    input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") saveEdit(id, input.value);
        if (e.key === "Escape") renderTodos(); // cancel edit
    });
}

function saveEdit(id, newText) {
    const text = newText.trim();
    if (!text) {
        showToast("Task cannot be empty.", "error");
        return;
    }
    // Allow saving the same text (not a real duplicate since it's the same task)
    const duplicate = todos.some(t => t.id !== id && t.text.toLowerCase() === text.toLowerCase());
    if (duplicate) {
        showToast("Another task with that name already exists.", "error");
        return;
    }
    const task = todos.find(t => t.id === id);
    if (task) {
        task.text = text;
        saveTodos();
        renderTodos();
        showToast("Task updated!");
    }
}

function sortTodos() {
    sortedAsc = !sortedAsc;
    todos.sort((a, b) => sortedAsc
        ? a.text.localeCompare(b.text)
        : b.text.localeCompare(a.text)
    );
    sortBtn.textContent = sortedAsc ? "Sort Z-A" : "Sort A-Z";
    saveTodos();
    renderTodos();
}

function renderTodos() {
    todoList.innerHTML = "";

    if (todos.length === 0) {
        todoList.innerHTML = `<p class="empty-msg">No tasks yet. Add one above!</p>`;
        return;
    }

    todos.forEach(task => {
        const li = document.createElement("li");
        li.className   = `todo-item${task.done ? " done" : ""}`;
        li.dataset.id  = task.id;

        li.innerHTML = `
            <input type="checkbox" class="todo-checkbox" ${task.done ? "checked" : ""} title="Mark done">
            <span class="todo-text">${escapeHtml(task.text)}</span>
            <div class="todo-actions">
                <button class="btn-icon edit" title="Edit task">✏️</button>
                <button class="btn-icon delete" title="Delete task">🗑️</button>
            </div>
        `;

        li.querySelector(".todo-checkbox").addEventListener("change", () => toggleDone(task.id));
        li.querySelector(".btn-icon.edit").addEventListener("click", () => startEdit(task.id));
        li.querySelector(".btn-icon.delete").addEventListener("click", () => deleteTodo(task.id));

        todoList.appendChild(li);
    });
}

// Prevent XSS when rendering task text
function escapeHtml(str) {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

addTodoBtn.addEventListener("click", addTodo);
sortBtn.addEventListener("click", sortTodos);
todoInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") addTodo();
});

// ============================================================
// 5. QUICK LINKS — Add / Delete / Open / Local Storage
// ============================================================
const linkNameInput   = document.getElementById("linkName");
const linkUrlInput    = document.getElementById("linkUrl");
const addLinkBtn      = document.getElementById("addLink");
const linksContainer  = document.getElementById("linksContainer");

let links = storage.get("quickLinks", []);

function saveLinks() {
    storage.set("quickLinks", links);
}

function addLink() {
    const name = linkNameInput.value.trim();
    let   url  = linkUrlInput.value.trim();

    if (!name || !url) {
        showToast("Please fill in both link name and URL.", "error");
        return;
    }

    // Prepend https:// if the user didn't include a protocol
    if (!/^https?:\/\//i.test(url)) {
        url = "https://" + url;
    }

    // Basic URL validation
    try {
        new URL(url);
    } catch {
        showToast("Invalid URL. Please check the address.", "error");
        return;
    }

    links.push({ id: Date.now(), name, url });
    saveLinks();
    linkNameInput.value = "";
    linkUrlInput.value  = "";
    renderLinks();
    showToast(`Link "${name}" added!`);
}

function deleteLink(id) {
    links = links.filter(l => l.id !== id);
    saveLinks();
    renderLinks();
    showToast("Link removed.");
}

function renderLinks() {
    linksContainer.innerHTML = "";

    if (links.length === 0) {
        linksContainer.innerHTML = `<p class="empty-msg">No links yet. Add your favorites above!</p>`;
        return;
    }

    links.forEach(link => {
        const item = document.createElement("div");
        item.className = "link-item";

        item.innerHTML = `
            <a href="${escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer"
               class="link-anchor">🔗 ${escapeHtml(link.name)}</a>
            <button class="btn-icon delete" title="Remove link">✕</button>
        `;

        item.querySelector(".btn-icon.delete").addEventListener("click", () => deleteLink(link.id));
        linksContainer.appendChild(item);
    });
}

addLinkBtn.addEventListener("click", addLink);
linkUrlInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") addLink();
});

// ============================================================
// 6. INIT — Run everything on load
// ============================================================
function init() {
    initTheme();
    renderUserGreeting();
    renderTodos();
    renderLinks();
}

init();
