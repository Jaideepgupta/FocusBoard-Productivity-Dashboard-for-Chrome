import { logEvent } from './analytics.js';
import { renderAnalytics } from './analyticsCharts.js';

let isFocusModeOn = false;

function updateClock() {
  const timeDisplay = document.getElementById('time-display');
  const greetingDisplay = document.getElementById('greeting-display');
  if (!timeDisplay || !greetingDisplay) return;

  const now = new Date();
  let hours = now.getHours();
  let minutes = now.getMinutes();
  
  let greeting = 'Good evening';
  if (hours < 12) greeting = 'Good morning';
  else if (hours < 18) greeting = 'Good afternoon';
  
  greetingDisplay.textContent = `${greeting}, Friend`;

  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; 
  minutes = minutes < 10 ? '0' + minutes : minutes;
  
  timeDisplay.textContent = `${hours}:${minutes} ${ampm}`;
}

document.addEventListener('DOMContentLoaded', () => {
  // Initialize clock
  updateClock();
  setInterval(updateClock, 1000);

  // Focus Input
  const focusInput = document.getElementById('main-focus-input');
  if (focusInput) {
    chrome.storage.local.get('mainFocus', (data) => {
      if (data.mainFocus) focusInput.value = data.mainFocus;
    });
    focusInput.addEventListener('change', (e) => {
      chrome.storage.local.set({ mainFocus: e.target.value });
    });
  }

  // Navigation
  const navDashboard = document.getElementById('nav-dashboard');
  const navAnalytics = document.getElementById('nav-analytics');
  const mainDashboard = document.getElementById('main-dashboard');
  const analyticsPanel = document.getElementById('analytics-panel');

  if (navDashboard && navAnalytics) {
    navAnalytics.addEventListener('click', async () => {
      try {
        mainDashboard.style.display = 'none';
        analyticsPanel.hidden = false;
        await renderAnalytics();
      } catch (err) {
        console.error(err);
        alert("CRITICAL ERROR: " + err.message + "\n\n" + err.stack);
      }
    });

    navDashboard.addEventListener('click', () => {
      analyticsPanel.hidden = true;
      mainDashboard.style.display = 'flex';
    });
  }

  // Focus Mode Toggle
  const focusBtn = document.getElementById('focus-toggle-btn');
  const focusText = document.getElementById('focus-text');
  
  if (focusBtn) {
    chrome.storage.local.get(['focusModeActive', 'focusModeStartTime'], (data) => {
      isFocusModeOn = !!data.focusModeActive;
      if (isFocusModeOn) {
        focusBtn.classList.add('active');
        focusText.textContent = 'FOCUS MODE: ON';
      }
    });

    focusBtn.addEventListener('click', () => {
      isFocusModeOn = !isFocusModeOn;
      if (isFocusModeOn) {
        focusBtn.classList.add('active');
        focusText.textContent = 'FOCUS MODE: ON';
        console.log("Focus Mode ON");
        
        const startTime = Date.now();
        chrome.storage.local.set({ focusModeActive: true, focusModeStartTime: startTime });
        logEvent('focus_mode_on');
      } else {
        focusBtn.classList.remove('active');
        focusText.textContent = 'FOCUS MODE: OFF';
        console.log("Focus Mode OFF");
        
        chrome.storage.local.get('focusModeStartTime', (data) => {
          const startTime = data.focusModeStartTime;
          if (startTime) {
            let minutes = Math.round((Date.now() - startTime) / 60000);
            if (minutes === 0) minutes = 1; 
            logEvent('focus_mode_off', { minutes });
          }
          chrome.storage.local.set({ focusModeActive: false, focusModeStartTime: null });
        });
      }
    });
  }

  // Task Widget
  const taskInput = document.getElementById('new-task-input');
  const taskList = document.getElementById('task-list');

  function addTask() {
    const text = taskInput.value.trim();
    if (!text) return;

    const li = document.createElement('li');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.style.cursor = 'pointer';
    
    const span = document.createElement('span');
    span.textContent = text;

    checkbox.addEventListener('change', () => {
      if (checkbox.checked) {
        span.style.textDecoration = 'line-through';
        span.style.color = 'rgba(255,255,255,0.5)';
        checkbox.disabled = true;
        logEvent('task_completed');
      }
    });

    li.appendChild(checkbox);
    li.appendChild(span);
    taskList.appendChild(li);
    
    taskInput.value = '';
  }

  if (taskInput) {
    taskInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') addTask();
    });
  }

  // Logs Logic
  const viewLogsBtn = document.getElementById('view-logs-btn');
  const clearDataBtn = document.getElementById('clear-data-btn');

  if (viewLogsBtn) {
    viewLogsBtn.addEventListener('click', () => {
      chrome.storage.local.get('focusboard_analytics', (data) => {
        console.log("=== RAW ANALYTICS LOGS ===");
        console.log(JSON.stringify(data.focusboard_analytics, null, 2));
        alert("Raw data printed to the Console!");
      });
    });
  }

  if (clearDataBtn) {
    clearDataBtn.addEventListener('click', () => {
      if (confirm("Are you sure you want to delete all analytics data?")) {
        chrome.storage.local.remove('focusboard_analytics', () => {
          alert("All data cleared! Refreshing page...");
          window.location.reload();
        });
      }
    });
  }
});
