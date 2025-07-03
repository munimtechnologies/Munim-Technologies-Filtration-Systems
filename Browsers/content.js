// Content script that runs on all web pages
// This script can interact with the DOM and communicate with the extension

console.log("🌍 Content script starting on:", window.location.href);

// Listen for messages from the popup or background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getPageInfo") {
    // Gather page information
    const pageInfo = {
      url: window.location.href,
      title: document.title,
      domain: window.location.hostname,
      protocol: window.location.protocol,
      path: window.location.pathname,
      timestamp: Date.now(),
    };

    console.log("📋 Sending page info:", pageInfo);
    sendResponse(pageInfo);
  }

  if (request.action === "highlightImages") {
    // Example functionality: highlight all images on the page
    const images = document.querySelectorAll("img");
    images.forEach((img) => {
      img.style.border = "3px solid #ff4444";
      img.style.boxShadow = "0 0 10px rgba(255, 68, 68, 0.5)";
    });

    // Remove highlight after 3 seconds
    setTimeout(() => {
      images.forEach((img) => {
        img.style.border = "";
        img.style.boxShadow = "";
      });
    }, 3000);

    console.log("✅ Images highlighted, removing in 3 seconds");
    sendResponse({ success: true, count: images.length });
  }

  if (request.action === "scrollToTop") {
    // Scroll to top of page
    window.scrollTo({ top: 0, behavior: "smooth" });
    sendResponse({ success: true });
  }

  return true; // Keep the message channel open for async responses
});

// Optional: Add a subtle indicator that the extension is active
function addExtensionIndicator() {
  // Only add if not already present
  if (document.getElementById("website-info-indicator")) return;

  const indicator = document.createElement("div");
  indicator.id = "website-info-indicator";
  indicator.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        width: 8px;
        height: 8px;
        background: #667eea;
        border-radius: 50%;
        z-index: 10000;
        opacity: 0.7;
        transition: opacity 0.3s ease;
    `;

  // Show on hover
  indicator.addEventListener("mouseenter", () => {
    indicator.style.opacity = "1";
    indicator.title = "Website Info Tool Active";
  });

  indicator.addEventListener("mouseleave", () => {
    indicator.style.opacity = "0.7";
  });

  document.body.appendChild(indicator);
  console.log("✅ Extension indicator added to page");
}

// Add the indicator when the page loads
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", addExtensionIndicator);
} else {
  addExtensionIndicator();
}

// Console log to confirm the content script is loaded
console.log("🔍 Website Info Tool extension loaded");
