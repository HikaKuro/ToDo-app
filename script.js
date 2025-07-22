const input = document.getElementById("taskInput");
const addBtn = document.getElementById("addBtn");
const typeSelect = document.getElementById("taskType");

let todos = [];

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
  ["onetime", "daily", "weekly", "monthly"].forEach(type => {
  const list = document.getElementById(`taskList-${type}`);
  if (list) {
    list.addEventListener("dragover", handleDragOver);
    list.addEventListener("drop", handleDrop);
  }
});

}

function getToday() {
  const d = new Date();
  return d.toISOString().split("T")[0];
}

function isSameWeek(dateStr1, dateStr2) {
  const d1 = new Date(dateStr1);
  const d2 = new Date(dateStr2);
  const startOfWeek = date => {
    const d = new Date(date);
    d.setDate(d.getDate() - d.getDay());
    return d.toDateString();
  };
  return startOfWeek(d1) === startOfWeek(d2);
}

function isSameMonth(dateStr1, dateStr2) {
  const d1 = new Date(dateStr1);
  const d2 = new Date(dateStr2);
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth();
}

function shouldShowToday(todo) {
  const today = getToday();
  switch (todo.type) {
    case "onetime":
    case "daily":
      return !todo.doneDates.includes(today);
    case "weekly":
      return !todo.doneDates.some(date => isSameWeek(date, today));
    case "monthly":
      return !todo.doneDates.some(date => isSameMonth(date, today));
    default:
      return true;
  }
}

function typeToLabel(type) {
  switch (type) {
    case "onetime": return "突発";
    case "daily": return "毎日";
    case "weekly": return "毎週";
    case "monthly": return "毎月";
    default: return "";
  }
}

function renderTask(todo, index) {
  if (!shouldShowToday(todo)) return;

  const li = document.createElement("li");
  li.dataset.id = todo.id;
  li.draggable = true;
  li.classList.add("draggable");

  const today = getToday();
  const isDoneToday = todo.doneDates.includes(today);

  const span = document.createElement("span");
  span.textContent = `${index + 1}. ${todo.text}（${typeToLabel(todo.type)}）`;
  if (isDoneToday) {
    span.style.textDecoration = "line-through";
    span.style.color = "#888";
  }

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = isDoneToday;
  checkbox.disabled = isDoneToday;
  checkbox.onclick = () => {
    if (!isDoneToday) {
      todo.doneDates.push(today);
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

  li.appendChild(checkbox);
  li.appendChild(span);
  li.appendChild(delBtn);

  const targetList = document.getElementById(`taskList-${todo.type}`);
  if (targetList) targetList.appendChild(li);
}

function refreshTasks() {
  // 通常タスクリストを初期化
  ["onetime", "daily", "weekly", "monthly"].forEach(type => {
    const list = document.getElementById(`taskList-${type}`);
    if (list) list.innerHTML = "";
  });

  // 完了タスクリストも初期化
  const completedList = document.getElementById("completedTasks");
  if (completedList) completedList.innerHTML = "";

  ["onetime", "daily", "weekly", "monthly"].forEach(type => {
    const typeTodos = todos.filter(todo => todo.type === type);
    typeTodos.forEach((todo, idx) => {
      const today = getToday();
      const isDoneToday = todo.doneDates.includes(today) ||
        (todo.type === "weekly" && todo.doneDates.some(date => isSameWeek(date, today))) ||
        (todo.type === "monthly" && todo.doneDates.some(date => isSameMonth(date, today)));

      if (shouldShowToday(todo)) {
        renderTask(todo, idx);
      } else if (completedList && isDoneToday) {
        // 完了タスクとして表示
        const li = document.createElement("li");
        li.textContent = `${todo.text}（${typeToLabel(todo.type)}）✔`;
        li.style.textDecoration = "line-through";
        li.style.color = "#888";
        completedList.appendChild(li);
      }
    });
  });
}


function addTask(text, type) {
  const todo = {
    id: Date.now().toString(),
    text,
    type,
    doneDates: []
  };
  todos.push(todo);
  saveTasks();
  refreshTasks();
}

addBtn.onclick = () => {
  const text = input.value.trim();
  const type = typeSelect.value;
  if (text) {
    addTask(text, type);
    input.value = "";
    typeSelect.value = "onetime";
  }
};

// --- ドラッグ操作のイベントリスナー ---
document.addEventListener("dragstart", (e) => {
  if (e.target.classList.contains("draggable")) {
    e.target.classList.add("dragging");
  }
});

document.addEventListener("dragend", (e) => {
  if (e.target.classList.contains("draggable")) {
    e.target.classList.remove("dragging");
  }
});

function handleDragOver(e) {
  e.preventDefault();
  const dragging = document.querySelector(".dragging");
  const afterElement = getDragAfterElement(e.currentTarget, e.clientY);
  if (afterElement == null) {
    e.currentTarget.appendChild(dragging);
  } else {
    e.currentTarget.insertBefore(dragging, afterElement);
  }
}

function handleDrop(e) {
  e.preventDefault();
  const list = e.currentTarget;
  const type = list.dataset.type;

  const ids = Array.from(list.children).map(li => li.dataset.id);
  const newOrder = ids.map(id => todos.find(todo => todo.id === id));
  const others = todos.filter(todo => todo.type !== type);
  todos = [...others, ...newOrder];

  saveTasks();
  refreshTasks();
}

function getDragAfterElement(container, y) {
  const elements = [...container.querySelectorAll("li:not(.dragging)")];
  return elements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) {
      return { offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}


// 各リストにイベントリスナー追加
["onetime", "daily", "weekly", "monthly"].forEach(type => {
  const list = document.getElementById(`taskList-${type}`);
  if (list) {
    list.addEventListener("dragover", handleDragOver);
    list.addEventListener("drop", handleDrop);
  }
});

loadTasks();
