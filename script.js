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
function renderTask(todo) {
  const li = document.createElement("li");

  const span = document.createElement("span");
  const today = getToday(); // 今日の日付

  const isDoneToday = todo.doneDates.includes(today);
  span.textContent = `${todo.text}（${typeToLabel(todo.type)}）`;
  if (isDoneToday) {
    span.style.textDecoration = "line-through";
    span.style.color = "#888";
  }

  // 完了ボタン
  const doneBtn = document.createElement("button");
  doneBtn.textContent = isDoneToday ? "完了済" : "完了";
  doneBtn.disabled = isDoneToday;
  doneBtn.onclick = () => {
    if (!todo.doneDates.includes(today)) {
      todo.doneDates.push(today);
      saveTasks();
      refreshTasks(); // 再描画して反映
    }
  };

  // 削除ボタン
  const delBtn = document.createElement("button");
  delBtn.textContent = "削除";
  delBtn.onclick = () => {
    todos = todos.filter(t => t.id !== todo.id);
    li.remove();
    saveTasks();
  };

  li.appendChild(span);
  li.appendChild(doneBtn);
  li.appendChild(delBtn);
  taskList.appendChild(li);
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
  taskList.innerHTML = "";
  todos.forEach(todo => {
    if (shouldShowToday(todo)) {
      renderTask(todo);
    }
  });
}


loadTasks();
