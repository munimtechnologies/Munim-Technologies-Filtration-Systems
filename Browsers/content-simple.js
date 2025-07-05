// Enhanced content script to load NSFW detector dependencies
console.log(
  "🚀 ENHANCED CONTENT SCRIPT LOADED - This should appear in console!"
);
console.log("🔗 URL:", window.location.href);
console.log("🏠 Domain:", window.location.hostname);
console.log("⚡ Chrome extension:", !!chrome?.runtime);

// Global flag to show we're loaded
window.testContentScriptLoaded = true;

// Load TensorFlow.js dynamically with more robust approach
async function loadTensorFlowJS() {
  return new Promise((resolve, reject) => {
    if (
      typeof window.tf !== "undefined" &&
      window.tf.version &&
      typeof window.tf.loadLayersModel === "function"
    ) {
      console.log("✅ TensorFlow.js already fully loaded");
      resolve();
      return;
    }

    console.log("📦 Loading TensorFlow.js...");
    const script = document.createElement("script");
    script.src = chrome.runtime.getURL("tf.min.js");

    // Simple timeout for the entire loading process
    const timeout = setTimeout(() => {
      console.error("❌ TensorFlow.js loading timeout after 20 seconds");
      reject(new Error("TensorFlow.js loading timeout"));
    }, 20000);

    script.onload = () => {
      console.log(
        "📦 TensorFlow.js script loaded, waiting for initialization..."
      );

      // Wait a bit for the script to execute
      setTimeout(() => {
        console.log("🔍 Checking TensorFlow.js availability...");

        // Simple check with shorter intervals
        const checkReady = () => {
          console.log("🔍 Checking tf object:", {
            exists: typeof window.tf !== "undefined",
            version: window.tf?.version,
            loadLayersModel: typeof window.tf?.loadLayersModel,
            keys: window.tf ? Object.keys(window.tf).slice(0, 5) : [],
          });

          if (
            window.tf &&
            window.tf.version &&
            typeof window.tf.loadLayersModel === "function"
          ) {
            console.log(
              "✅ TensorFlow.js fully initialized with version:",
              window.tf.version
            );
            clearTimeout(timeout);
            window.tensorflowReady = true;
            window.dispatchEvent(
              new CustomEvent("tensorflowReady", {
                detail: { version: window.tf.version },
              })
            );
            resolve();
          } else {
            console.log(
              "⏳ TensorFlow.js not fully ready yet, checking again in 1 second..."
            );
            setTimeout(checkReady, 1000);
          }
        };

        // Start checking
        checkReady();
      }, 1000); // Wait 1 second for script to execute
    };

    script.onerror = (error) => {
      console.error("❌ Failed to load TensorFlow.js script:", error);
      clearTimeout(timeout);
      reject(error);
    };

    document.head.appendChild(script);
  });
}

// Load NSFW detector script
async function loadNSFWDetector() {
  return new Promise((resolve, reject) => {
    if (typeof window.nsfwDetector !== "undefined") {
      console.log("✅ NSFW detector already loaded");
      resolve();
      return;
    }

    console.log("📦 Loading NSFW detector...");
    const script = document.createElement("script");
    script.src = chrome.runtime.getURL("nsfw-detector.js");
    script.onload = () => {
      console.log("✅ NSFW detector loaded successfully");
      resolve();
    };
    script.onerror = (error) => {
      console.error("❌ Failed to load NSFW detector:", error);
      reject(error);
    };
    document.head.appendChild(script);
  });
}

// Initialize all dependencies
async function initializeDependencies() {
  try {
    console.log("🔄 Initializing dependencies...");

    // Load TensorFlow.js first
    await loadTensorFlowJS();

    // Then load NSFW detector
    await loadNSFWDetector();

    console.log("✅ All dependencies loaded successfully");

    // Set up global status tracking
    window.nsfwDetectorStatus = {
      isLoaded: false,
      isLoading: false,
      error: null,
      dependenciesLoaded: true,
    };

    return true;
  } catch (error) {
    console.error("❌ Failed to initialize dependencies:", error);
    window.nsfwDetectorStatus = {
      isLoaded: false,
      isLoading: false,
      error: error.message,
      dependenciesLoaded: false,
    };
    return false;
  }
}

// Start initialization immediately
console.log("🔄 Starting dependency initialization...");
initializeDependencies();

// Force reload function for popup to use
window.forceReloadNSFWDetector = async function () {
  console.log("🔧 Force reloading NSFW detector...");

  try {
    // Reset status
    window.nsfwDetectorStatus = {
      isLoaded: false,
      isLoading: false,
      error: null,
      dependenciesLoaded: false,
    };

    // Dispose existing detector if it exists
    if (
      window.nsfwDetector &&
      typeof window.nsfwDetector.dispose === "function"
    ) {
      window.nsfwDetector.dispose();
    }

    // Clear existing detector
    window.nsfwDetector = null;

    // Reinitialize dependencies
    const success = await initializeDependencies();

    if (success) {
      console.log("✅ Force reload successful");
      return { success: true, message: "NSFW detector reloaded successfully" };
    } else {
      console.error("❌ Force reload failed");
      return { success: false, error: "Failed to reinitialize dependencies" };
    }
  } catch (error) {
    console.error("❌ Force reload error:", error);
    return { success: false, error: error.message };
  }
};

// Add a visible indicator
setTimeout(() => {
  const indicator = document.createElement("div");
  indicator.id = "simple-test-indicator";
  indicator.innerHTML = "🔍 Extension Working";
  indicator.style.cssText = `
    position: fixed;
    top: 10px;
    left: 10px;
    background: #28a745;
    color: white;
    padding: 5px 10px;
    border-radius: 5px;
    z-index: 10000;
    font-size: 12px;
    font-family: Arial, sans-serif;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  `;

  try {
    document.body.appendChild(indicator);
    console.log("✅ Simple test indicator added successfully");
  } catch (error) {
    console.error("❌ Failed to add indicator:", error);
  }
}, 1000);

// Listen for messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("📨 Simple content script received message:", request);

  if (request.action === "testContentScript") {
    sendResponse({
      success: true,
      message: "Simple content script is working!",
      url: window.location.href,
    });
  }

  return true;
});

console.log("🎉 Simple content script initialization complete");
