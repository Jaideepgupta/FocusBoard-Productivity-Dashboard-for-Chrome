# 🎯 FocusBoard — Productivity Dashboard for Chrome

> Replace your new tab with a focus-first productivity dashboard that actually tracks your habits.

![FocusBoard Banner](https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=1200&auto=format&fit=crop)

---

## ✨ What It Does

FocusBoard replaces Chrome's default new tab page with a **Momentum-style productivity dashboard** — a full-screen wallpaper, a live clock, a task list, and a Focus Mode toggle. But unlike other new tab extensions, this one **tracks your habits and shows you the data**.

Every time you use FocusBoard, it quietly records:

- ✅ Tasks you mark as complete
- ⏱️ How long you stay in Focus Mode
- 🚫 Which distracting sites you tried to visit while focused

Open the **Analytics Dashboard** and see it all visualised across the past 7 days.

---

## 📸 Screenshots

| Main Dashboard | Analytics View |
|---|---|
| Clock, tasks, focus toggle | Charts, KPIs, blocked sites |

---

## 🚀 Features

### Main Dashboard
- **Live clock** with time-aware greeting (Good morning / afternoon / evening)
- **"What is your main focus today?"** — saved across sessions
- **Task widget** — add tasks, check them off, log completions automatically
- **Focus Mode toggle** — one click to enter deep work mode
- Glassmorphic UI over a full-screen wallpaper background

### Analytics Dashboard
- **3 KPI cards** — Tasks this week · Focus streak · Temptations blocked
- **4 charts** powered by Chart.js:
  - 📘 Tasks completed per day (bar)
  - 📗 Focus time per day in minutes (bar)
  - 📙 Focus sessions per day (trend line)
  - 📕 Top distracting sites you tried to visit (horizontal bar)
- Opens as a full-screen overlay — no new tab, no popup
- Empty state when no data exists yet

---

## 🗂️ Project Structure

```
focusboard/
├── manifest.json          Chrome extension config (Manifest V3)
├── newtab.html            Main UI + analytics panel markup
├── newtab.js              Dashboard logic, event wiring, navigation
├── background.js          Service worker — intercepts blocked sites
├── analytics.js           logEvent() helper + storage management
├── analyticsCharts.js     Chart.js rendering + data aggregation
├── analytics.css          All styles — glassmorphism + dark mode
└── chart.umd.min.js       Chart.js bundled locally (no CDN)
```

---

## 🧠 How the Data Layer Works

Rather than storing every raw event (which would balloon storage), FocusBoard aggregates into **daily summaries**:

```json
{
  "2025-07-14": {
    "tasksCompleted": 4,
    "focusSessionCount": 2,
    "focusMinutes": 47,
    "blockedSiteAttempts": {
      "instagram.com": 3,
      "youtube.com": 1
    }
  }
}
```

- All data lives in `chrome.storage.local` — **nothing leaves your machine**
- Records older than **30 days are automatically pruned**
- Focus duration is tracked by persisting start time to storage (not memory), so it survives service worker sleep cycles
- Chart.js instances are destroyed before every re-render to prevent canvas reuse errors

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Extension platform | Chrome Manifest V3 |
| Background processing | Service Worker (`background.js`) |
| Data storage | `chrome.storage.local` |
| Charts | Chart.js 4 (bundled locally) |
| Styling | CSS — glassmorphism + CSS Grid |
| JS | Vanilla ES Modules (`import`/`export`) |

---

## ⚙️ Installation (Developer Mode)

1. Clone or download this repository
   ```bash
   git clone https://github.com/yourusername/focusboard.git
   ```

2. Open Chrome and go to `chrome://extensions`

3. Enable **Developer Mode** (toggle in top-right corner)

4. Click **Load unpacked** and select the `focusboard/` folder

5. Open a new tab — FocusBoard is live 🎉

---

## 📊 Testing the Analytics

1. Add a few tasks and check them off
2. Toggle Focus Mode ON, wait a minute or two, toggle OFF
3. While Focus Mode is on, try visiting a site on your block list
4. Click the **📊 button** (bottom right) to open Analytics
5. Verify the numbers match your activity

To inspect raw storage data:
- Open DevTools → Application → Local Storage → `chrome-extension://...`
- Look for the `focusboard_analytics` key

---

## 🔭 What Could Come Next

- [ ] `declarativeNetRequest` rules for proper MV3 site blocking
- [ ] Custom block list management in the UI
- [ ] Daily goal setting with progress bars
- [ ] Data export as CSV or JSON
- [ ] Wallpaper rotation or custom image upload
- [ ] Weekly summary notification

---

## 📁 Key Files Explained

**`analytics.js`** — Single exported `logEvent(type, meta)` function. Handles all 4 event types, prunes old data on every write, and uses async/await for clean storage access.

**`analyticsCharts.js`** — Reads from storage, prepares 7-day rolling data (zero-fills missing days), renders 4 Chart.js charts, and computes KPIs. Destroys old chart instances before re-render.

**`background.js`** — Service worker that intercepts blocked site requests and calls `logEvent('site_blocked', { domain })`.

**`newtab.js`** — Wires the UI together. Persists focus start time to `chrome.storage.local` (not a JS variable) so duration tracking works even if the service worker restarts.

---

## 📄 License

MIT — free to use, modify, and build on.

---

*Built as part of a structured Chrome extension learning curriculum — Assignment 9 (HARD).*
