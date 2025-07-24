// chart.js
// グラフ用ユーティリティをここに切り出し

// 表示する日数（過去7日間）
const GRAPH_DAYS = 7;
let completedChart = null;

/**
 * Chart.js の初期化
 * index.html に <canvas id="completedChart"></canvas> を用意し、
 * 必ず script.js よりも先に読み込んでください。
 */
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

/**
 * 過去 GRAPH_DAYS 日分の完了カウントでグラフを更新
 * @param {Array<Object>} todos - doneDates プロパティを持つタスク配列
 */
function updateChart(todos) {
  // 1. 過去 GRAPH_DAYS 日のラベル生成
  const labels = Array.from({ length: GRAPH_DAYS }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (GRAPH_DAYS - 1 - i));
    return d.toISOString().split('T')[0];
  });

  // 2. 各日付の完了数を集計
  const counts = {};
  todos.forEach(todo => {
    todo.doneDates.forEach(dateStr => {
      if (labels.includes(dateStr)) {
        counts[dateStr] = (counts[dateStr] || 0) + 1;
      }
    });
  });

  // 3. データ配列をラベル順に作成（0埋め）
  const data = labels.map(label => counts[label] || 0);

  // 4. Chart.js に反映
  completedChart.data.labels = labels;
  completedChart.data.datasets[0].data = data;
  completedChart.update();
}

// グローバルに公開
window.initChart = initChart;
window.updateChart = updateChart;
