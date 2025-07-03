// Content script that runs on all web pages
// This script can interact with the DOM and communicate with the extension

console.log("🌍 Content script starting on:", window.location.href);

// Load TensorFlow.js and NSFW detector
async function loadNSFWDetector() {
  try {
    console.log("🤖 Loading TensorFlow.js and NSFW detector...");

    // Check if TensorFlow.js is already loaded
    if (typeof tf === "undefined") {
      console.log("📥 Loading TensorFlow.js...");
      const tfScript = document.createElement("script");
      tfScript.src =
        "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.15.0/dist/tf.min.js";

      // Wait for TensorFlow.js to load
      await new Promise((resolve, reject) => {
        tfScript.onload = () => {
          console.log("✅ TensorFlow.js loaded successfully");
          resolve();
        };
        tfScript.onerror = reject;
        document.head.appendChild(tfScript);
      });
    }

    // Load NSFW detector script
    console.log("📥 Loading NSFW detector...");
    const nsfwScript = document.createElement("script");
    nsfwScript.src = chrome.runtime.getURL("nsfw-detector.js");

    await new Promise((resolve, reject) => {
      nsfwScript.onload = () => {
        console.log("✅ NSFW detector loaded and ready");
        resolve();
      };
      nsfwScript.onerror = reject;
      document.head.appendChild(nsfwScript);
    });
  } catch (error) {
    console.error("❌ Failed to load NSFW detector:", error);
  }
}

// Initialize NSFW detector when page loads
function initializeNSFWDetector() {
  // Add a small delay to ensure DOM is ready
  setTimeout(loadNSFWDetector, 1000);
}

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

  if (request.action === "analyzeNSFW") {
    // Handle NSFW analysis request
    console.log("🔞 NSFW analysis requested");

    if (window.nsfwDetector) {
      window.nsfwDetector
        .analyzePageImages({
          threshold: 0.6,
          maxImages: 10,
          skipSmallImages: true,
          minImageSize: 100,
        })
        .then((results) => {
          console.log("🔞 NSFW analysis complete:", results);
          sendResponse(results);
        })
        .catch((error) => {
          console.error("❌ NSFW analysis failed:", error);
          sendResponse({ error: error.message });
        });
    } else {
      sendResponse({ error: "NSFW detector not loaded" });
    }

    return true; // Keep channel open for async response
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
        width: 12px;
        height: 12px;
        background: linear-gradient(45deg, #667eea, #764ba2);
        border-radius: 50%;
        z-index: 10000;
        opacity: 0.7;
        transition: all 0.3s ease;
        cursor: pointer;
        border: 2px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    `;

  // Show on hover with enhanced styling
  indicator.addEventListener("mouseenter", () => {
    indicator.style.opacity = "1";
    indicator.style.transform = "scale(1.2)";
    indicator.title = "Website Info Tool Active - NSFW Detection Ready";
  });

  indicator.addEventListener("mouseleave", () => {
    indicator.style.opacity = "0.7";
    indicator.style.transform = "scale(1)";
  });

  document.body.appendChild(indicator);
  console.log("✅ Extension indicator added to page");
}

// Initialize everything when the page loads
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    addExtensionIndicator();
    initializeNSFWDetector();
  });
} else {
  addExtensionIndicator();
  initializeNSFWDetector();
}

// Console log to confirm the content script is loaded
console.log(
  "🔍 Website Info Tool extension loaded with NSFW detection capability"
);
