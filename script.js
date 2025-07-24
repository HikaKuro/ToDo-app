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

  initChart();
}


function initChart() {
  const ctx = document.getElementById('completedChart').getContext('2d');
  completedChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: [],
      datasets: [{
        label: '完了タスク数',
        data: []
      }]
    },
    options: {
      scales: {
        x: { title: { display: true, text: '日付' } },
        y: { title: { display: true, text: '数' }, beginAtZero: true }
      }
    }
  });
}

// 今日の日付をYYYY-MM-DD形式で取得するヘルパー関数
// ISO形式の文字列から日付部分を抽出
function getToday() {
  return new Date().toISOString().split("T")[0];
}

// 日付が同じ週かどうかを判定するヘルパー関数
// 週の始まりを日曜日と仮定
function isSameWeek(d1, d2) {
  const date1 = new Date(d1);
  const date2 = new Date(d2);
  const start = dt => { const d = new Date(dt); d.setDate(d.getDate() - d.getDay()); return d.toDateString(); };
  return start(date1) === start(date2);
}

// 日付が同じ月かどうかを判定するヘルパー関数
// 月の始まりを1日と仮定
function isSameMonth(d1, d2) {
  const date1 = new Date(d1);
  const date2 = new Date(d2);
  return date1.getFullYear() === date2.getFullYear() && date1.getMonth() === date2.getMonth();
}

// 今日のタスクを表示するかどうかを判定するヘルパー関数
// タスクのタイプに応じて、完了日をチェック
function shouldShowToday(todo) {
  const today = getToday();
  switch (todo.type) {
    case "onetime":
    case "daily":
      return !todo.doneDates.includes(today);
    case "weekly":
      return !todo.doneDates.some(d => isSameWeek(d, today));
    case "monthly":
      return !todo.doneDates.some(d => isSameMonth(d, today));
    default:
      return true;
  }
}

// タスクのタイプをラベルに変換するヘルパー関数
// タスクのタイプに応じて、表示用のラベルを返す
function typeToLabel(type) {
  const map = { onetime: '突発', daily: '毎日', weekly: '毎週', monthly: '毎月' };
  return map[type] || '';
}

// タスクをリストにレンダリングする関数
// タスクのタイプに応じて、リストに追加する
function renderTask(todo, index) {
  if (!shouldShowToday(todo)) return;// 今日のタスクでない場合はスキップ

  const li = document.createElement("li");// タスクのリストアイテムを作成
  li.dataset.id = todo.id;// タスクのIDをデータ属性に設定
  li.draggable = true;// ドラッグ可能に設定
  li.classList.add("draggable");// ドラッグ可能なクラスを追加

  const today = getToday();// 今日の日付を取得
  const done = todo.doneDates.includes(today);// 今日のタスクが完了しているかどうかをチェック

  const checkbox = document.createElement("input");// チェックボックスを作成
  checkbox.type = "checkbox";// チェックボックスのタイプを設定
  checkbox.checked = done;// 今日のタスクが完了している場合はチェックを入れる
  checkbox.disabled = false;// 完了済みタスクはチェックボックスを無効化しない
  checkbox.onclick = () => {
    if (!done) {
      todo.doneDates.push(today);// 今日の日付を完了日として追加
      saveTasks();// タスクを保存
      refreshTasks(); // タスクを再描画
      // 完了タスクのチャートを更新
    }
  };

  const span = document.createElement("span");// タスクのテキストを表示するためのスパンを作成
  span.textContent = `${index + 1}. ${todo.text}（${typeToLabel(todo.type)}）`;// タスクのテキストとタイプを表示
  if (done) span.style.textDecoration = "line-through";// 完了済みタスクは取り消し線を表示

  const editBtn = document.createElement("button");// 編集ボタンを作成
  editBtn.textContent = "編集";// 編集ボタンのテキストを設定
  editBtn.onclick = () => {
    const newText = prompt("タスクを編集", todo.text);// タスクのテキストを編集するためのプロンプトを表示
    if (newText !== null) {
      todo.text = newText.trim();// 新しいテキストを設定
      saveTasks();// タスクを保存
      refreshTasks();// タスクを再描画
    }
  };

  const delBtn = document.createElement("button");// 削除ボタンを作成
  delBtn.textContent = "削除";// 削除ボタンのテキストを設定
  delBtn.onclick = () => {
    todos = todos.filter(t => t.id !== todo.id);// タスクを削除
    saveTasks();// タスクを保存
    refreshTasks();// タスクを再描画
  };

  const upBtn = document.createElement("button");// 上へ移動ボタンを作成
   upBtn.textContent = "↑"; upBtn.onclick = () => moveTask(todo.id, -1);// 上へ移動ボタンのクリックイベントを設定
  const downBtn = document.createElement("button"); // 下へ移動ボタンを作成
  downBtn.textContent = "↓"; downBtn.onclick = () => moveTask(todo.id, 1);// 下へ移動ボタンのクリックイベントを設定

  [checkbox, span, editBtn, delBtn, upBtn, downBtn].forEach(el => li.appendChild(el));// 作成した要素をリストアイテムに追加

  document.getElementById(`taskList-${todo.type}`).appendChild(li);// タスクのタイプに応じたリストにリストアイテムを追加
}

function moveTask(id, direction) {
  const idx = todos.findIndex(t => t.id === id);// タスクのIDを使ってインデックスを取得
  if (idx === -1) return;// タスクが見つからない場合は何もしない

  const target = todos[idx];// タスクを取得
  const sameType = todos.filter(t => t.type === target.type);// 同じタイプのタスクをフィルタリング
  const sameTypeIds = sameType.map(t => t.id);// 同じタイプのタスクのIDを取得
  const typeIdx = sameTypeIds.indexOf(id);// タスクのインデックスを取得

  const newIdx = typeIdx + direction;// 新しいインデックスを計算
  if (newIdx < 0 || newIdx >= sameType.length) return;// 新しいインデックスが範囲外の場合は何もしない

  // 並び替え
  [sameType[typeIdx], sameType[newIdx]] = [sameType[newIdx], sameType[typeIdx]];// タスクを入れ替え

  // 全体のtodosを更新
  todos = todos.filter(t => t.type !== target.type).concat(sameType);// 同じタイプのタスクを除外して、入れ替えたタスクを追加
  saveTasks();// タスクを保存
  refreshTasks();// タスクを再描画
}

function refreshTasks() {
  // クリア
  ["onetime", "daily", "weekly", "monthly"].forEach(type => {
    document.getElementById(`taskList-${type}`).innerHTML = '';
  });
  const completedList = document.getElementById("completedTasks");
  completedList.innerHTML = '';

  // 通常と完了リスト描画
  todos.forEach((todo, idx) => {
    const today = getToday();
    const doneToday = (todo.type === 'weekly'
      ? todo.doneDates.some(d => isSameWeek(d, today))
      : todo.type === 'monthly'
        ? todo.doneDates.some(d => isSameMonth(d, today))
        : todo.doneDates.includes(today));

    if (shouldShowToday(todo)) {
      renderTask(todo, idx);
    } else if (doneToday) {
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
    todos.forEach(todo => {
      todo.doneDates.forEach(d => counts[d] = (counts[d] || 0) + 1);
    });
    const labels = Object.keys(counts).sort();
    completedChart.data.labels = labels;
    completedChart.data.datasets[0].data = labels.map(d => counts[d]);
    completedChart.update();
  }
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


// ドラッグ＆ドロップ
document.addEventListener("dragstart", e => { if (e.target.classList.contains("draggable")) e.target.classList.add("dragging"); });
document.addEventListener("dragend", e => { if (e.target.classList.contains("dragging")) e.target.classList.remove("dragging"); });
function handleDragOver(e) { e.preventDefault(); const dragging = document.querySelector(".dragging"); const after = getDragAfterElement(e.currentTarget, e.clientY); if (!after) e.currentTarget.appendChild(dragging); else e.currentTarget.insertBefore(dragging, after); }
function handleDrop(e) { e.preventDefault(); const list = e.currentTarget; const type = list.dataset.type; const ids = Array.from(list.children).map(li => li.dataset.id);
  const reordered = ids.map(id => todos.find(t => t.id === id));
  todos = todos.filter(t => t.type !== type).concat(reordered);
  saveTasks(); refreshTasks();
}
function getDragAfterElement(container, y) {
  return [...container.querySelectorAll('li:not(.dragging)')]
    .reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      return (offset < 0 && offset > closest.offset) ? { offset, element: child } : closest;
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

loadTasks();
