const input = document.getElementById("taskInput");
const addBtn = document.getElementById("addBtn");
const taskList = document.getElementById("taskList");
const typeSelect = document.getElementById("taskType");

// 保存用データ
let todos = [];

// 👉 todos を JSON文字列にして、ブラウザに保存します。
//保存先は localStorage（PCの中のブラウザに保存される仕組み）。
function saveTasks() {
  localStorage.setItem("todos", JSON.stringify(todos));
}

// 👉 ページを開いたときに、保存されているタスクを読み込みます。
function loadTasks() {
  const data = JSON.parse(localStorage.getItem("todos"));
  if (data) {
    todos = data.map(todo => ({
      ...todo,
      doneDates: todo.doneDates || []
    }));

    refreshTasks();
  }
}

// 👉 同じ月かどうかをチェックする関数です。
function shouldShowToday(todo) {
  const today = getToday();

  switch (todo.type) {
    case "onetime":
      return !todo.doneDates.includes(today);

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

function isSameWeek(dateStr1, dateStr2) {
  const d1 = new Date(dateStr1);
  const d2 = new Date(dateStr2);

  const startOfWeek = (date) => {
    const d = new Date(date);
    d.setDate(d.getDate() - d.getDay()); // 日曜日にする
    return d.toDateString();
  };

  return startOfWeek(d1) === startOfWeek(d2);
}

function isSameMonth(dateStr1, dateStr2) {
  const d1 = new Date(dateStr1);
  const d2 = new Date(dateStr2);

  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth();
}


// 👉 タスクを表示するための関数です。
function renderTask(todo, index) {
  const li = document.createElement("li");
  li.setAttribute("draggable", true);
  li.dataset.id = todo.id;

  // 番号やチェックボックスなどはこれまでと同様に追加…

  // 🟡 ドラッグ開始
  li.addEventListener("dragstart", (e) => {
    li.classList.add("dragging");
    e.dataTransfer.setData("text/plain", todo.id);
  });

  // 🟡 ドラッグ終了
  li.addEventListener("dragend", () => {
    li.classList.remove("dragging");
  });

  const listId = `taskList-${todo.type}`;
  const targetList = document.getElementById(listId);
  if (targetList) {
    targetList.appendChild(li);

    // 🔵 ドロップ先のイベントは一度だけ追加（最初のタスクのときだけ）
    if (!targetList.dataset.listenerAdded) {
      targetList.addEventListener("dragover", handleDragOver);
      targetList.addEventListener("drop", handleDrop);
      targetList.dataset.listenerAdded = true;
    }
  }
}

// 🟢 ドラッグ中にリスト上に乗ったとき
function handleDragOver(e) {
  e.preventDefault(); // 必須
  const dragging = document.querySelector(".dragging");
  const afterElement = getDragAfterElement(e.currentTarget, e.clientY);
  const list = e.currentTarget;
  if (afterElement == null) {
    list.appendChild(dragging);
  } else {
    list.insertBefore(dragging, afterElement);
  }
}

// 🟢 ドロップされたとき
function handleDrop(e) {
  e.preventDefault();
  const droppedId = e.dataTransfer.getData("text/plain");
  const listType = e.currentTarget.dataset.type;
  const ids = Array.from(e.currentTarget.children).map(li => li.dataset.id);
  const newOrder = ids.map(id => todos.find(todo => todo.id === id));

  // 同じtypeのものだけ並び替える
  const others = todos.filter(todo => todo.type !== listType);
  todos = [...others, ...newOrder];
  saveTasks();
  refreshTasks();
}

// 🔵 ドラッグ先の位置を取得
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



// 👉 新しいタスクを追加する関数です。
function addTask(text, type) {
  const todo = {
    id: Date.now().toString(),
    text,
    type,
    doneDates: [] // 次のステップで使う
  };
  todos.push(todo);
  renderTask(todo);
  saveTasks();
}

// イベントリスナーを設定
addBtn.onclick = () => {
  const text = input.value.trim();
  const type = typeSelect.value;
  if (text) {
    addTask(text, type);
    input.value = "";
    typeSelect.value = "onetime";
  }
};

function typeToLabel(type) {
  switch (type) {
    case "onetime": return "突発";
    case "daily": return "毎日";
    case "weekly": return "毎週";
    case "monthly": return "毎月";
    default: return "";
  }
}

function getToday() {
  const d = new Date();
  return d.toISOString().split("T")[0]; // 例: "2025-07-21"
}

function refreshTasks() {
  ["onetime", "daily", "weekly", "monthly"].forEach(type => {
    const list = document.getElementById(`taskList-${type}`);
    if (list) list.innerHTML = "";
  });

  todos.forEach((todo, index) => renderTask(todo, index));
}




loadTasks();
