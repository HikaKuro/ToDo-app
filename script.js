const input = document.getElementById("taskInput");
const addBtn = document.getElementById("addBtn");
const typeSelect = document.getElementById("taskType");

let todos = [];
let completedChart = null;

function saveTasks() {
  localStorage.setItem("todos", JSON.stringify(todos));
}

input.addEventListener("keypress", (e) => {
  if (e.key === "Enter") addBtn.click();
});

function loadTasks() {
  const data = JSON.parse(localStorage.getItem("todos"));
  if (data) {
    todos = data.map(todo => ({
      ...todo,
      doneDates: todo.doneDates || []
    }));
    refreshTasks();
  }

  // ドラッグ＆ドロップ設定
  ["onetime", "daily", "weekly", "monthly"].forEach(type => {
    const list = document.getElementById(`taskList-${type}`);
    if (list) {
      list.addEventListener("dragover", handleDragOver);
      list.addEventListener("drop", handleDrop);
    }
  });
}

function initChart() {
  const ctx = document.getElementById('completedChart').getContext('2d');
  completedChart = new Chart(ctx, {
    type: 'bar',
    data: { labels: [], datasets: [{ label: '完了タスク数', data: [] }] },
    options: {
      scales: {
        x: { title: { display: true, text: '日付' } },
        y: { title: { display: true, text: '数' }, beginAtZero: true }
      }
    }
  });
}

function getToday() {
  return new Date().toISOString().split("T")[0];
}

function isSameWeek(d1, d2) {
  const date1 = new Date(d1);
  const date2 = new Date(d2);
  const start = dt => { const d = new Date(dt); d.setDate(d.getDate() - d.getDay()); return d.toDateString(); };
  return start(date1) === start(date2);
}

function isSameMonth(d1, d2) {
  const date1 = new Date(d1);
  const date2 = new Date(d2);
  return date1.getFullYear() === date2.getFullYear() && date1.getMonth() === date2.getMonth();
}

function shouldShowToday(todo) {
  const today = getToday();
  switch (todo.type) {
    case "onetime":
    case "daily":    return !todo.doneDates.includes(today);
    case "weekly":   return !todo.doneDates.some(d => isSameWeek(d, today));
    case "monthly":  return !todo.doneDates.some(d => isSameMonth(d, today));
    default:          return true;
  }
}

function typeToLabel(type) {
  const map = { onetime: '突発', daily: '毎日', weekly: '毎週', monthly: '毎月' };
  return map[type] || '';
}

function renderTask(todo, index) {
  if (!shouldShowToday(todo)) return;

  const li = document.createElement("li");
  li.dataset.id = todo.id;
  li.draggable = true;
  li.classList.add("draggable");

  const today = getToday();
  const done = todo.doneDates.includes(today);

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = done;
  checkbox.onclick = () => {
    if (!done) {
      todo.doneDates.push(today);
      saveTasks();
      refreshTasks();
    }
  };

  const span = document.createElement("span");
  span.textContent = `${index + 1}. ${todo.text}（${typeToLabel(todo.type)}）`;
  if (done) span.style.textDecoration = "line-through";

  const editBtn = document.createElement("button");
  editBtn.textContent = "編集";
  editBtn.onclick = () => {
    const newText = prompt("タスクを編集", todo.text);
    if (newText !== null) {
      todo.text = newText.trim();
      saveTasks();
      refreshTasks();
    }
  };

  const delBtn = document.createElement("button");
  delBtn.textContent = "削除";
  delBtn.onclick = () => {
    todos = todos.filter(t => t.id !== todo.id);
    saveTasks();
    refreshTasks();
  };

  // moveTask() を呼び出す上下移動ボタン
  const upBtn = document.createElement("button"); upBtn.textContent = "↑"; upBtn.onclick = () => moveTask(todo.id, -1);
  const downBtn = document.createElement("button"); downBtn.textContent = "↓"; downBtn.onclick = () => moveTask(todo.id, 1);

  [checkbox, span, editBtn, delBtn, upBtn, downBtn].forEach(el => li.appendChild(el));
  document.getElementById(`taskList-${todo.type}`).appendChild(li);
}

/**
 * タスク順序を移動
 */
function moveTask(id, direction) {
  const index = todos.findIndex(t => t.id === id);
  if (index === -1) return;
  const todo = todos[index];
  // 同じカテゴリ内での順序を入れ替え
  const sameType = todos.filter(t => t.type === todo.type);
  const groupIdx = sameType.findIndex(t => t.id === id);
  const targetGroupIdx = groupIdx + direction;
  if (targetGroupIdx < 0 || targetGroupIdx >= sameType.length) return;
  const targetId = sameType[targetGroupIdx].id;
  const targetIndex = todos.findIndex(t => t.id === targetId);
  [todos[index], todos[targetIndex]] = [todos[targetIndex], todos[index]];
  saveTasks();
  refreshTasks();
}

function refreshTasks() {
  ["onetime", "daily", "weekly", "monthly"].forEach(type => {
    document.getElementById(`taskList-${type}`).innerHTML = '';  
  });
  const completedList = document.getElementById("completedTasks");
  completedList.innerHTML = '';

  todos.forEach((todo, idx) => {
    const today = getToday();
    const doneToday = todo.type === 'weekly'
      ? todo.doneDates.some(d => isSameWeek(d, today))
      : todo.type === 'monthly'
        ? todo.doneDates.some(d => isSameMonth(d, today))
        : todo.doneDates.includes(today);

    if (shouldShowToday(todo)) renderTask(todo, idx);
    else if (doneToday) {
      const li = document.createElement('li');
      li.textContent = `${todo.text}（${typeToLabel(todo.type)}）`;
      li.style.textDecoration = 'line-through';
      const undoBtn = document.createElement('button');
      undoBtn.textContent = '戻す';
      undoBtn.onclick = () => {
        if (todo.type === 'weekly') todo.doneDates = todo.doneDates.filter(d => !isSameWeek(d, today));
        else if (todo.type === 'monthly') todo.doneDates = todo.doneDates.filter(d => !isSameMonth(d, today));
        else todo.doneDates = todo.doneDates.filter(d => d !== today);
        saveTasks(); refreshTasks();
      };
      li.appendChild(undoBtn);
      completedList.appendChild(li);
    }
  });

  // グラフ更新
  if (completedChart) {
    const counts = {};
    todos.forEach(todo => todo.doneDates.forEach(d => counts[d] = (counts[d] || 0) + 1));
    const labels = Object.keys(counts).sort();
    completedChart.data.labels = labels;
    completedChart.data.datasets[0].data = labels.map(d => counts[d]);
    completedChart.update();
  }

  updateChart(todos);
}

function addTask(text, type) {
  todos.push({ id: Date.now().toString(), text, type, doneDates: [] });
  saveTasks();
  refreshTasks();
}

addBtn.onclick = () => {
  const text = input.value.trim();
  if (!text) return;
  addTask(text, typeSelect.value);
  input.value = '';
  typeSelect.value = 'onetime';
};

// ドラッグ＆ドロップ処理
document.addEventListener("dragstart", e => { if (e.target.classList.contains("draggable")) e.target.classList.add("dragging"); });
document.addEventListener("dragend", e => { if (e.target.classList.contains("dragging")) e.target.classList.remove("dragging"); });
function handleDragOver(e) { e.preventDefault(); const dragging = document.querySelector(".dragging"); const after = getDragAfterElement(e.currentTarget, e.clientY); if (!after) e.currentTarget.appendChild(dragging); else e.currentTarget.insertBefore(dragging, after); }
function handleDrop(e) { e.preventDefault(); const list = e.currentTarget; const type = list.dataset.type; const ids = Array.from(list.children).map(li => li.dataset.id); const reordered = ids.map(id => todos.find(t => t.id === id)); todos = todos.filter(t => t.type !== type).concat(reordered); saveTasks(); refreshTasks(); }
function getDragAfterElement(container, y) {
  return [...container.querySelectorAll('li:not(.dragging)')]
    .reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      return (offset < 0 && offset > closest.offset) ? { offset, element: child } : closest;
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// 初期化
window.addEventListener('DOMContentLoaded', () => {
  initChart();
  loadTasks();
});
