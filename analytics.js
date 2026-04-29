// analytics.js

/**
 * Helper to log events for the FocusBoard Analytics dashboard.
 * @param {string} type - The event type ('task_completed', 'focus_mode_on', 'focus_mode_off', 'site_blocked')
 * @param {Object} [meta] - Optional metadata (e.g., { minutes: 5 } or { domain: 'youtube.com' })
 */
export async function logEvent(type, meta = {}) {
  const today = new Date().toISOString().split('T')[0];
  
  const data = await chrome.storage.local.get('focusboard_analytics');
  let analytics = data.focusboard_analytics || {};

  // Prune keys older than 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  for (const dateKey of Object.keys(analytics)) {
    if (new Date(dateKey) < thirtyDaysAgo) {
      delete analytics[dateKey];
    }
  }

  // Initialize today's record if it doesn't exist
  if (!analytics[today]) {
    analytics[today] = {
      tasksCompleted: 0,
      focusSessionCount: 0,
      focusMinutes: 0,
      blockedSiteAttempts: {}
    };
  }

  // Update today's record based on event type
  switch (type) {
    case 'task_completed':
      analytics[today].tasksCompleted++;
      break;
    case 'focus_mode_on':
      analytics[today].focusSessionCount++;
      break;
    case 'focus_mode_off':
      if (typeof meta.minutes === 'number') {
        analytics[today].focusMinutes += meta.minutes;
      }
      break;
    case 'site_blocked':
      if (meta.domain) {
        if (!analytics[today].blockedSiteAttempts[meta.domain]) {
          analytics[today].blockedSiteAttempts[meta.domain] = 0;
        }
        analytics[today].blockedSiteAttempts[meta.domain]++;
      }
      break;
  }

  // Write the updated object back to storage
  await chrome.storage.local.set({ focusboard_analytics: analytics });
}
