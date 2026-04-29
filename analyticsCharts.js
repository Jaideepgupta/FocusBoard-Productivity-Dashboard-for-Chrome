// analyticsCharts.js

let activeCharts = {};

export async function renderAnalytics() {
  // Set default font to match the dashboard
  if (typeof Chart !== 'undefined') {
    Chart.defaults.font.family = 'sans-serif';
    Chart.defaults.color = '#cbd5e1'; // Light grey text for dark mode charts
    Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.1)'; // Subtle grid lines
  }

  const container = document.getElementById('charts-container');
  
  // Destroy existing charts to prevent memory leaks or canvas errors
  Object.values(activeCharts).forEach(chart => {
    if (chart) chart.destroy();
  });
  activeCharts = {};

  container.innerHTML = ''; // clear existing charts or messages
  
  let data;
  try {
    data = await chrome.storage.local.get('focusboard_analytics');
    // If the storage object is somehow a string or totally corrupted type
    if (data.focusboard_analytics && typeof data.focusboard_analytics !== 'object') {
      throw new Error('Malformed analytics object');
    }
  } catch (e) {
    console.warn('Storage corrupted, wiping analytics data and starting fresh:', e);
    await chrome.storage.local.remove('focusboard_analytics');
    data = {};
  }
  
  const analytics = data.focusboard_analytics || {};

  // Check if it's completely empty or all zeroes
  let hasData = false;
  for (const date in analytics) {
    const record = analytics[date];
    if (record.tasksCompleted > 0 || record.focusSessionCount > 0 || record.focusMinutes > 0 || Object.keys(record.blockedSiteAttempts || {}).length > 0) {
      hasData = true;
      break;
    }
  }

  if (!hasData) {
    container.innerHTML = '<p class="empty-state-text">No data yet. Complete some tasks and use Focus Mode to see your stats here.</p>';
    return;
  }

  // Data Preparation
  const chartData = prepareData(analytics);

  // Render HTML structure
  container.innerHTML = `
    <div class="kpi-row">
      <div class="kpi-card" aria-label="${chartData.totalTasks} tasks completed this week">
        <h3>✅ Tasks This Week</h3>
        <p class="kpi-value">${chartData.totalTasks}</p>
      </div>
      <div class="kpi-card" aria-label="${chartData.currentStreak} day focus streak">
        <h3>🔥 Focus Streak</h3>
        <p class="kpi-value">${chartData.currentStreak}</p>
      </div>
      <div class="kpi-card" aria-label="${chartData.totalBlocked} temptations blocked">
        <h3>⛔ Temptations Blocked</h3>
        <p class="kpi-value">${chartData.totalBlocked}</p>
      </div>
    </div>
    <div id="charts-grid">
      <div class="chart-wrapper">
        <canvas id="chart-tasks" aria-label="Tasks Completed Chart" role="img"></canvas>
      </div>
      <div class="chart-wrapper">
        <canvas id="chart-focus-time" aria-label="Focus Time Chart" role="img"></canvas>
      </div>
      <div class="chart-wrapper">
        <canvas id="chart-sessions" aria-label="Focus Sessions Chart" role="img"></canvas>
      </div>
      <div class="chart-wrapper" id="chart-blocked-wrapper">
        <canvas id="chart-blocked" aria-label="Blocked Sites Chart" role="img"></canvas>
      </div>
    </div>
  `;

  // Render Charts
  activeCharts.tasks = renderChart1(chartData.labels, chartData.tasksData);
  activeCharts.focusTime = renderChart2(chartData.labels, chartData.focusTimeData);
  activeCharts.sessions = renderChart3(chartData.labels, chartData.focusSessionsData);
  activeCharts.blocked = renderChart4(chartData.sortedDomains);
}

function prepareData(analytics) {
  const labels = [];
  const tasksData = [];
  const focusTimeData = [];
  const focusSessionsData = [];
  let totalTasks = 0;
  let totalBlocked = 0;
  let currentStreak = 0;
  const domainCounts = {};

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateKey = d.toISOString().split('T')[0];
    
    // Phase 4: Today label and missing days zero-filling
    const dayLabel = i === 0 ? "Today" : d.toLocaleDateString('en-US', { weekday: 'short' });
    labels.push(dayLabel);

    const record = analytics[dateKey] || {
      tasksCompleted: 0,
      focusSessionCount: 0,
      focusMinutes: 0,
      blockedSiteAttempts: {}
    };

    tasksData.push(record.tasksCompleted);
    focusTimeData.push(record.focusMinutes);
    focusSessionsData.push(record.focusSessionCount);

    totalTasks += record.tasksCompleted;
    
    for (const [domain, count] of Object.entries(record.blockedSiteAttempts || {})) {
      domainCounts[domain] = (domainCounts[domain] || 0) + count;
      totalBlocked += count;
    }
  }
  
  // Calculate Streak counting backward from today
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateKey = d.toISOString().split('T')[0];
    const record = analytics[dateKey] || { focusSessionCount: 0 };
    if (record.focusSessionCount > 0) {
      currentStreak++;
    } else {
      break;
    }
  }

  const sortedDomains = Object.entries(domainCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return { labels, tasksData, focusTimeData, focusSessionsData, sortedDomains, totalTasks, currentStreak, totalBlocked };
}

function renderChart1(labels, data) {
  return new Chart(document.getElementById('chart-tasks'), {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Tasks Completed',
        data,
        backgroundColor: '#4A90D9'
      }]
    },
    options: { maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
  });
}

function renderChart2(labels, data) {
  return new Chart(document.getElementById('chart-focus-time'), {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Focus Time (min)',
        data,
        backgroundColor: '#27AE60'
      }]
    },
    options: { maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }
  });
}

function renderChart3(labels, data) {
  return new Chart(document.getElementById('chart-sessions'), {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Focus Sessions',
        data,
        borderColor: '#8E44AD',
        backgroundColor: 'rgba(142, 68, 173, 0.2)',
        fill: true,
        tension: 0.3
      }]
    },
    options: { maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
  });
}

function renderChart4(sortedDomains) {
  const wrapper = document.getElementById('chart-blocked-wrapper');
  if (sortedDomains.length === 0) {
    wrapper.innerHTML = '<div class="empty-state-text">No blocked sites attempted — great focus!</div>';
    return null;
  }

  const labels = sortedDomains.map(d => d[0]);
  const data = sortedDomains.map(d => d[1]);

  return new Chart(document.getElementById('chart-blocked'), {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Blocked Attempts',
        data,
        backgroundColor: '#E74C3C'
      }]
    },
    options: {
      maintainAspectRatio: false,
      indexAxis: 'y',
      scales: { x: { beginAtZero: true, ticks: { stepSize: 1 } } }
    }
  });
}
