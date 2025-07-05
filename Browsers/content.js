// Content script that runs on all web pages
// This script can interact with the DOM and communicate with the extension

console.log("🌍 Content script starting on:", window.location.href);
console.log("🔧 Content script debugging info:");
console.log("  - Chrome runtime available:", !!chrome?.runtime);
console.log("  - Extension ID:", chrome?.runtime?.id);
console.log("  - TensorFlow.js in window:", typeof window.tf);
console.log("  - Document ready state:", document.readyState);

// Global state for NSFW detector loading
window.nsfwDetectorStatus = {
  isLoading: false,
  isLoaded: false,
  error: null,
};

// Global state for TensorFlow.js
window.tensorflowReady = false;

// Alternative TensorFlow.js loading methods
async function loadTensorFlowJS() {
  const cdnUrls = [
    "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.15.0/dist/tf.min.js",
    "https://unpkg.com/@tensorflow/tfjs@4.15.0/dist/tf.min.js",
    "https://cdnjs.cloudflare.com/ajax/libs/tensorflow/4.15.0/tf.min.js",
  ];

  for (let i = 0; i < cdnUrls.length; i++) {
    const url = cdnUrls[i];
    console.log(
      `📥 Trying to load TensorFlow.js from CDN ${i + 1}/${
        cdnUrls.length
      }: ${url}`
    );

    try {
      const tfScript = document.createElement("script");
      tfScript.src = url;

      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          console.error(`❌ TensorFlow.js loading timeout for ${url}`);
          reject(new Error(`TensorFlow.js loading timeout for ${url}`));
        }, 30000);

        tfScript.onload = () => {
          clearTimeout(timeout);
          console.log(`✅ TensorFlow.js loaded from ${url}`);
          console.log("  - TensorFlow version:", window.tf?.version);

          if (typeof window.tf !== "undefined") {
            window.tensorflowReady = true;
            window.dispatchEvent(
              new CustomEvent("tensorflowReady", {
                detail: { version: window.tf.version, source: url },
              })
            );
            resolve();
          } else {
            reject(
              new Error(
                "TensorFlow.js loaded but global variable not available"
              )
            );
          }
        };

        tfScript.onerror = (error) => {
          clearTimeout(timeout);
          console.error(`❌ Failed to load TensorFlow.js from ${url}:`, error);
          reject(new Error(`Failed to load TensorFlow.js from ${url}`));
        };

        document.head.appendChild(tfScript);
      });

      // If we get here, loading was successful
      return;
    } catch (error) {
      console.warn(`⚠️ CDN ${i + 1} failed:`, error.message);
      if (i === cdnUrls.length - 1) {
        throw new Error("All TensorFlow.js CDN sources failed");
      }
    }
  }
}

// Load TensorFlow.js and NSFW detector
async function loadNSFWDetector() {
  if (
    window.nsfwDetectorStatus.isLoading ||
    window.nsfwDetectorStatus.isLoaded
  ) {
    console.log("🔄 NSFW detector already loading or loaded, skipping...");
    return;
  }

  try {
    window.nsfwDetectorStatus.isLoading = true;
    console.log("🤖 Loading TensorFlow.js and NSFW detector...");

    // Check if TensorFlow.js is already loaded
    if (typeof window.tf === "undefined") {
      console.log("📥 TensorFlow.js not found, attempting to load...");
      await loadTensorFlowJS();
    } else {
      console.log("✅ TensorFlow.js already available:", window.tf.version);
    }

    // Verify TensorFlow.js is working
    if (typeof window.tf === "undefined") {
      throw new Error("TensorFlow.js not available after loading");
    }

    // Load NSFW detector script
    console.log("📥 Loading NSFW detector script...");
    const nsfwScript = document.createElement("script");
    nsfwScript.src = chrome.runtime.getURL("nsfw-detector.js");

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        console.error("❌ NSFW detector script loading timeout");
        reject(new Error("NSFW detector script loading timeout"));
      }, 15000); // Extended to 15 seconds

      nsfwScript.onload = () => {
        clearTimeout(timeout);
        console.log("✅ NSFW detector script loaded");

        // Give the detector a moment to initialize
        setTimeout(() => {
          if (window.nsfwDetector) {
            console.log("✅ NSFW detector instance created and ready");
            console.log(
              "Detector methods:",
              Object.getOwnPropertyNames(window.nsfwDetector)
            );
            window.nsfwDetectorStatus.isLoaded = true;
            window.nsfwDetectorStatus.error = null;

            // Log detailed status
            if (typeof window.getNSFWDetectorStatus === "function") {
              console.log("Detailed status:", window.getNSFWDetectorStatus());
            }

            resolve();
          } else {
            console.error("❌ NSFW detector instance not created");
            reject(new Error("NSFW detector instance not created"));
          }
        }, 2000); // Extended wait time
      };

      nsfwScript.onerror = (error) => {
        clearTimeout(timeout);
        console.error("❌ Failed to load NSFW detector script:", error);
        reject(new Error("Failed to load NSFW detector script"));
      };

      document.head.appendChild(nsfwScript);
    });

    console.log("🎉 NSFW detector loading completed successfully");
  } catch (error) {
    console.error("❌ Failed to load NSFW detector:", error);
    window.nsfwDetectorStatus.error = error.message;
    window.nsfwDetectorStatus.isLoaded = false;
  } finally {
    window.nsfwDetectorStatus.isLoading = false;
  }
}

// Helper function to wait for NSFW detector to be ready
async function waitForNSFWDetector(maxWaitMs = 60000) {
  const startTime = Date.now();
  console.log(`🕐 Waiting for NSFW detector (max ${maxWaitMs / 1000}s)...`);

  while (Date.now() - startTime < maxWaitMs) {
    const elapsed = Math.round((Date.now() - startTime) / 1000);

    if (window.nsfwDetectorStatus.isLoaded && window.nsfwDetector) {
      console.log(`✅ NSFW detector ready after ${elapsed}s`);
      return true;
    }

    if (window.nsfwDetectorStatus.error) {
      console.error(
        `❌ NSFW detector error after ${elapsed}s:`,
        window.nsfwDetectorStatus.error
      );
      throw new Error(
        `NSFW detector failed to load: ${window.nsfwDetectorStatus.error}`
      );
    }

    if (
      !window.nsfwDetectorStatus.isLoading &&
      !window.nsfwDetectorStatus.isLoaded
    ) {
      console.log(`🔄 Starting NSFW detector loading at ${elapsed}s...`);
      // Try to load it
      await loadNSFWDetector();
    }

    // Log progress every 5 seconds
    if (elapsed > 0 && elapsed % 5 === 0) {
      console.log(
        `⏳ Still waiting for NSFW detector... (${elapsed}s elapsed)`
      );
      console.log("Status:", window.nsfwDetectorStatus);

      // Log detailed status if available
      if (typeof window.getNSFWDetectorStatus === "function") {
        console.log("Detailed status:", window.getNSFWDetectorStatus());
      }
    }

    // Wait a bit before checking again
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  console.error(
    `❌ NSFW detector timeout after ${Math.round(maxWaitMs / 1000)}s`
  );
  throw new Error("NSFW detector loading timeout");
}

// Initialize NSFW detector when page loads
function initializeNSFWDetector() {
  console.log("🚀 initializeNSFWDetector() called");
  // Add a small delay to ensure DOM is ready, then load detector
  setTimeout(async () => {
    console.log(
      "⏰ Initialization timeout triggered, starting loadNSFWDetector()"
    );
    try {
      await loadNSFWDetector();
      console.log("🎉 NSFW detector initialization complete");
    } catch (error) {
      console.error("❌ NSFW detector initialization failed:", error);
    }
  }, 2000);
}

// Function to force reload the detector (can be called from popup)
window.forceReloadNSFWDetector = async function () {
  console.log("🔄 Force reloading NSFW detector...");

  // Reset status
  window.nsfwDetectorStatus = {
    isLoading: false,
    isLoaded: false,
    error: null,
  };

  // Clear existing detector
  if (window.nsfwDetector) {
    try {
      window.nsfwDetector.dispose();
    } catch (e) {
      console.warn("Warning disposing detector:", e);
    }
    window.nsfwDetector = null;
  }

  // Remove existing scripts
  const existingTfScript = document.querySelector('script[src*="tensorflow"]');
  if (existingTfScript) {
    existingTfScript.remove();
  }

  const existingNsfwScript = document.querySelector(
    'script[src*="nsfw-detector"]'
  );
  if (existingNsfwScript) {
    existingNsfwScript.remove();
  }

  // Clear TensorFlow global
  if (window.tf) {
    delete window.tf;
  }

  // Reload
  try {
    await loadNSFWDetector();
    console.log("✅ Force reload completed successfully");
    return { success: true };
  } catch (error) {
    console.error("❌ Force reload failed:", error);
    return { success: false, error: error.message };
  }
};

// Function to get detailed status (can be called from popup)
window.getNSFWDetectorStatus = function () {
  return {
    status: window.nsfwDetectorStatus,
    tfAvailable: typeof window.tf !== "undefined",
    tfVersion: window.tf?.version,
    detectorAvailable: typeof window.nsfwDetector !== "undefined",
    detectorReady: window.nsfwDetector?.isModelReady?.() || false,
    timestamp: Date.now(),
  };
};

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

    waitForNSFWDetector()
      .then(() => {
        if (window.nsfwDetector) {
          return window.nsfwDetector.analyzePageImages({
            threshold: 0.6,
            maxImages: 10,
            skipSmallImages: true,
            minImageSize: 100,
          });
        } else {
          throw new Error("NSFW detector not available");
        }
      })
      .then((results) => {
        console.log("🔞 NSFW analysis complete:", results);
        sendResponse(results);
      })
      .catch((error) => {
        console.error("❌ NSFW analysis failed:", error);
        sendResponse({ error: error.message });
      });

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
console.log(
  "🔄 Initializing content script - document ready state:",
  document.readyState
);

if (document.readyState === "loading") {
  console.log("📄 Document still loading, adding DOMContentLoaded listener");
  document.addEventListener("DOMContentLoaded", () => {
    console.log("📄 DOMContentLoaded event fired, initializing...");
    addExtensionIndicator();
    initializeNSFWDetector();
  });
} else {
  console.log("📄 Document already loaded, initializing immediately");
  addExtensionIndicator();
  initializeNSFWDetector();
}

// Console log to confirm the content script is loaded
console.log(
  "🔍 Website Info Tool extension loaded with NSFW detection capability"
);
