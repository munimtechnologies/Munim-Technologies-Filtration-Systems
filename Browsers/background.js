// Background service worker for the Website Info Tool extension

// Extension installation/update handler
chrome.runtime.onInstalled.addListener((details) => {
  console.log("Website Info Tool installed/updated");

  if (details.reason === "install") {
    // Set default settings
    chrome.storage.sync.set({
      enableIndicator: true,
      autoAnalyze: false,
    });

    // Extension installed successfully
    console.log("Website Info Tool installed successfully!");
  }
});

// Handle browser action (extension icon) click
chrome.action.onClicked.addListener((tab) => {
  // This is triggered when the extension doesn't have a popup
  // Since we have a popup, this won't normally trigger
  console.log("Extension icon clicked for tab:", tab.id);
});

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    // Store visit information
    storeVisitInfo(tab);
  }
});

// Store visit information
async function storeVisitInfo(tab) {
  try {
    const domain = new URL(tab.url).hostname;
    const timestamp = Date.now();
    console.log("💾 Storing visit info for domain:", domain);

    // Get existing visits for this domain
    const result = await chrome.storage.local.get([domain]);
    const visits = result[domain] || [];

    // Add new visit
    visits.push({
      url: tab.url,
      title: tab.title,
      timestamp: timestamp,
    });

    // Keep only last 10 visits per domain
    if (visits.length > 10) {
      visits.splice(0, visits.length - 10);
    }

    // Store updated visits
    await chrome.storage.local.set({ [domain]: visits });
  } catch (error) {
    console.error("Error storing visit info:", error);
  }
}

// Handle messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("📨 Background received message:", request);
  if (request.action === "getVisitHistory") {
    getVisitHistory(request.domain)
      .then((history) => sendResponse({ success: true, history }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true; // Keep message channel open
  }

  if (request.action === "clearHistory") {
    clearVisitHistory()
      .then(() => sendResponse({ success: true }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true;
  }
});

// Get visit history for a domain
async function getVisitHistory(domain) {
  try {
    const result = await chrome.storage.local.get([domain]);
    return result[domain] || [];
  } catch (error) {
    console.error("Error getting visit history:", error);
    return [];
  }
}

// Clear visit history
async function clearVisitHistory() {
  try {
    await chrome.storage.local.clear();
    console.log("Visit history cleared");
  } catch (error) {
    console.error("Error clearing history:", error);
    throw error;
  }
}

// Context menu setup (optional)
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "analyzeWebsite",
    title: "Analyze this website",
    contexts: ["page"],
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "analyzeWebsite") {
    // Open the popup or trigger analysis
    chrome.action.openPopup();
  }
});

console.log("Website Info Tool background script loaded");
