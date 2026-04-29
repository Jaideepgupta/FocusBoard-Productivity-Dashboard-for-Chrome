// background.js
import { logEvent } from './analytics.js';

// --- MOCK FOCUSBOARD EXISTING LOGIC ---

// MOCK: Blocked site interception
// In a real extension, this might be a chrome.webRequest.onBeforeRequest listener
function handleSiteBlocked(url) {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname;
    
    // [Phase 1.5] Wire up blocked site logging
    logEvent('site_blocked', { domain });
    console.log(`Blocked site logged: ${domain}`);
  } catch (e) {
    console.error("Invalid URL passed to handleSiteBlocked", e);
  }
}

// Dummy listener to represent the interception
if (typeof chrome !== 'undefined' && chrome.webRequest && chrome.webRequest.onBeforeRequest) {
  chrome.webRequest.onBeforeRequest.addListener(
    function(details) {
      // Example logic checking against a blocklist
      // Assuming the site matches and is blocked
      handleSiteBlocked(details.url);
    },
    { urls: ["<all_urls>"] }
  );
}

// Expose mock function for testing (in Service Worker environment, self is used)
self.mockHandleSiteBlocked = handleSiteBlocked;
