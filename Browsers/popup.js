document.addEventListener("DOMContentLoaded", async () => {
  console.log("🚀 Website Info Tool popup opened");

  const loadingDiv = document.getElementById("loading");
  const contentDiv = document.getElementById("content");
  const refreshBtn = document.getElementById("refreshBtn");
  const copyBtn = document.getElementById("copyBtn");
  const analyzeNSFWBtn = document.getElementById("analyzeNSFWBtn");
  const reloadDetectorBtn = document.getElementById("reloadDetectorBtn");

  let currentData = null;

  console.log("📋 Popup elements initialized:", {
    loadingDiv: !!loadingDiv,
    contentDiv: !!contentDiv,
    refreshBtn: !!refreshBtn,
    copyBtn: !!copyBtn,
    analyzeNSFWBtn: !!analyzeNSFWBtn,
    reloadDetectorBtn: !!reloadDetectorBtn,
  });

  // Get current tab and load website info
  async function loadWebsiteInfo() {
    try {
      console.log("🔍 Starting website analysis...");

      // Initialize NSFW status
      updateNSFWStatus("Checking page content...", "#007bff");

      loadingDiv.style.display = "block";
      contentDiv.style.display = "none";

      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      console.log("📡 Current tab:", tab.url);

      // Inject content script and get data
      console.log("💉 Injecting analysis script into tab:", tab.id);
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: analyzeWebsite,
      });

      console.log("📊 Analysis results:", results);

      if (results && results[0] && results[0].result) {
        currentData = results[0].result;
        console.log("✅ Website data retrieved:", currentData);
        displayWebsiteInfo(currentData);
      } else {
        throw new Error("Failed to analyze website");
      }
    } catch (error) {
      console.error("❌ Error loading website info:", error);
      updateNSFWStatus("Analysis failed", "#dc3545");
      showError("Failed to analyze website. Please try again.");
    }
  }

  // Function to be injected into the page
  async function analyzeWebsite() {
    console.log("🔬 Analyzing website from injected script...");
    const url = window.location.href;
    const title = document.title;
    const domain = window.location.hostname;
    console.log("🌐 Basic info collected:", { url, title, domain });

    // Count different elements
    const images = document.querySelectorAll("img").length;
    const links = document.querySelectorAll("a").length;
    const scripts = document.querySelectorAll("script").length;
    console.log("📈 Element counts:", { images, links, scripts });

    // Detect framework/technology
    let framework = "Unknown";
    if (window.React) framework = "React";
    else if (window.Vue) framework = "Vue.js";
    else if (window.angular) framework = "Angular";
    else if (window.jQuery || window.$) framework = "jQuery";
    else if (document.querySelector("[data-reactroot]")) framework = "React";
    else if (document.querySelector("[data-v-]")) framework = "Vue.js";
    else if (document.querySelector("[ng-app], [ng-controller]"))
      framework = "AngularJS";
    console.log("🛠️ Framework detected:", framework);

    // Count meta tags
    const metaTags = document.querySelectorAll("meta").length;
    console.log("🏷️ Meta tags count:", metaTags);

    // Basic NSFW analysis (quick scan) if detector is available
    let nsfwAnalysis = null;
    try {
      if (
        window.nsfwDetectorStatus &&
        window.nsfwDetectorStatus.isLoaded &&
        window.nsfwDetector
      ) {
        console.log("🔞 Starting basic NSFW analysis...");
        // Try to load model and do quick analysis
        await window.nsfwDetector.loadModel();
        nsfwAnalysis = await window.nsfwDetector.analyzePageImages({
          threshold: 0.7,
          maxImages: 3,
          skipSmallImages: true,
          minImageSize: 150,
        });
        console.log("🔞 Basic NSFW analysis complete:", nsfwAnalysis);
      } else {
        console.log("⏳ NSFW detector not ready for basic analysis");
      }
    } catch (error) {
      console.warn("⚠️ Could not perform initial NSFW analysis:", error);
      nsfwAnalysis = { error: error.message };
    }

    const result = {
      url: url,
      title: title,
      domain: domain,
      images: images,
      links: links,
      scripts: scripts,
      framework: framework,
      metaTags: metaTags,
      timestamp: new Date().toLocaleString(),
      nsfwAnalysis: nsfwAnalysis,
    };

    console.log("📋 Analysis complete, returning data:", result);
    return result;
  }

  // Display the website information
  function displayWebsiteInfo(data) {
    console.log("🖼️ Displaying website info in popup");
    document.getElementById("url").textContent = data.url;
    document.getElementById("title").textContent = data.title || "No title";
    document.getElementById("domain").textContent = data.domain;
    document.getElementById("images").textContent = data.images;
    document.getElementById("links").textContent = data.links;
    document.getElementById("scripts").textContent = data.scripts;
    document.getElementById("framework").textContent = data.framework;
    document.getElementById("metaTags").textContent = data.metaTags;

    // Update NSFW analysis results
    updateNSFWResults(data.nsfwAnalysis);

    // Auto-run detailed NSFW analysis after initial display
    setTimeout(() => {
      updateNSFWStatus("Auto-starting detailed analysis...", "#007bff");
      analyzeNSFWImages(true); // true = automatic analysis
    }, 1000);

    loadingDiv.style.display = "none";
    contentDiv.style.display = "block";
    console.log("✅ Popup display updated successfully");
  }

  // Show error message
  function showError(message) {
    console.log("❌ Showing error:", message);
    loadingDiv.innerHTML = `<div class="error">${message}</div>`;
  }

  // Update NSFW status in UI
  function updateNSFWStatus(status, color = "#666") {
    const statusElement = document.getElementById("nsfwStatus");
    if (statusElement) {
      statusElement.textContent = status;
      statusElement.style.color = color;
    }
  }

  // Update NSFW results in UI
  function updateNSFWResults(nsfwAnalysis) {
    console.log("🔞 Updating NSFW results:", nsfwAnalysis);

    if (!nsfwAnalysis || nsfwAnalysis.error) {
      document.getElementById("nsfwImages").textContent = "Not analyzed";
      document.getElementById("imagesAnalyzed").textContent = "0";
      document.getElementById("safetyScore").textContent = "Unknown";
      updateNSFWStatus(nsfwAnalysis?.error || "Not analyzed", "#dc3545");
      return;
    }

    const { totalAnalyzed, nsfwFound } = nsfwAnalysis;
    const safetyPercentage =
      totalAnalyzed > 0
        ? Math.round(((totalAnalyzed - nsfwFound) / totalAnalyzed) * 100)
        : 100;

    document.getElementById("nsfwImages").textContent = `${nsfwFound}`;
    document.getElementById("imagesAnalyzed").textContent = `${totalAnalyzed}`;

    // Color code safety score
    const safetyElement = document.getElementById("safetyScore");
    safetyElement.textContent = `${safetyPercentage}% Safe`;

    if (safetyPercentage >= 90) {
      safetyElement.style.color = "#4caf50"; // Green
    } else if (safetyPercentage >= 70) {
      safetyElement.style.color = "#ff9800"; // Orange
    } else {
      safetyElement.style.color = "#f44336"; // Red
    }

    // Update status
    updateNSFWStatus("Analysis complete", "#28a745");

    // Display detailed results if available
    if (nsfwAnalysis.results && nsfwAnalysis.results.length > 0) {
      displayImageResults(nsfwAnalysis.results);
    }
  }

  // Display individual image analysis results
  function displayImageResults(results) {
    const resultsContainer = document.getElementById("imageResults");
    const resultsSection = document.getElementById("imageResultsSection");

    if (!resultsContainer || !resultsSection) return;

    resultsContainer.innerHTML = "";

    if (results.length === 0) {
      resultsContainer.innerHTML =
        '<div class="no-images-message">No images analyzed</div>';
      resultsSection.style.display = "block";
      return;
    }

    results.forEach((result, index) => {
      const item = document.createElement("div");
      item.className = `image-result-item ${
        result.isNSFW
          ? "nsfw"
          : result.topPrediction.probability > 0.3
          ? "warning"
          : "safe"
      }`;

      const thumbnail = document.createElement("img");
      thumbnail.className = "image-thumbnail";
      thumbnail.src = result.src;
      thumbnail.alt = result.alt || "Image";
      thumbnail.onerror = () => {
        thumbnail.src =
          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 24 24'%3E%3Cpath fill='%23ccc' d='M5 21q-.825 0-1.412-.587T3 19V5q0-.825.588-1.412T5 3h14q.825 0 1.413.588T21 5v14q0 .825-.587 1.413T19 21zm1-4h12l-3.75-5l-3 4L9 13z'/%3E%3C/svg%3E";
      };

      const info = document.createElement("div");
      info.className = "image-info";

      const classification = document.createElement("div");
      classification.className = `image-classification ${
        result.isNSFW
          ? "nsfw"
          : result.topPrediction.probability > 0.3
          ? "warning"
          : "safe"
      }`;
      classification.textContent = `${result.topPrediction.className} ${
        result.isNSFW ? "⚠️" : "✅"
      }`;

      const confidence = document.createElement("div");
      confidence.className = "image-confidence";
      confidence.textContent = `${(
        result.topPrediction.probability * 100
      ).toFixed(1)}% confidence`;

      const dimensions = document.createElement("div");
      dimensions.className = "image-dimensions";
      dimensions.textContent = `${result.width}×${result.height}px`;

      info.appendChild(classification);
      info.appendChild(confidence);
      info.appendChild(dimensions);

      item.appendChild(thumbnail);
      item.appendChild(info);
      resultsContainer.appendChild(item);
    });

    resultsSection.style.display = "block";
  }

  // Analyze NSFW images on demand or automatically
  async function analyzeNSFWImages(isAutomatic = false) {
    console.log(
      isAutomatic
        ? "🔞 Auto-analyzing NSFW content..."
        : "🔞 Analyze NSFW button clicked"
    );

    try {
      const originalText = analyzeNSFWBtn.textContent;
      if (!isAutomatic) {
        analyzeNSFWBtn.textContent = "🤖 Analyzing...";
        analyzeNSFWBtn.disabled = true;
      }

      // Update status
      updateNSFWStatus("Starting analysis...", "#007bff");

      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      // Update status
      updateNSFWStatus("Checking detector status...", "#007bff");

      // Execute detailed NSFW analysis in content script
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: async () => {
          try {
            // Helper function to wait for NSFW detector with progress logging
            async function waitForDetector(maxWait = 60000) {
              const start = Date.now();
              let lastLogTime = 0;
              let retryCount = 0;
              const maxRetries = 2;

              while (Date.now() - start < maxWait) {
                const elapsed = Date.now() - start;

                // Log progress every 2 seconds
                if (elapsed - lastLogTime > 2000) {
                  console.log(
                    `⏳ Waiting for detector... ${Math.round(
                      elapsed / 1000
                    )}s elapsed`
                  );
                  console.log("Status:", window.nsfwDetectorStatus);
                  console.log(
                    "TensorFlow available:",
                    typeof window.tf !== "undefined"
                  );
                  console.log(
                    "NSFW detector available:",
                    typeof window.nsfwDetector !== "undefined"
                  );
                  lastLogTime = elapsed;
                }

                // Check if detector is ready
                if (
                  window.nsfwDetectorStatus &&
                  window.nsfwDetectorStatus.isLoaded &&
                  window.nsfwDetector
                ) {
                  console.log(
                    `✅ Detector ready after ${Math.round(elapsed / 1000)}s`
                  );
                  return { success: true, elapsed: Math.round(elapsed / 1000) };
                }

                // Check for errors
                if (
                  window.nsfwDetectorStatus &&
                  window.nsfwDetectorStatus.error
                ) {
                  console.error(
                    "Detector error detected:",
                    window.nsfwDetectorStatus.error
                  );

                  // Try to retry loading if we haven't exceeded max retries
                  if (retryCount < maxRetries) {
                    retryCount++;
                    console.log(
                      `🔄 Retrying detector load (attempt ${retryCount}/${maxRetries})...`
                    );

                    // Reset status and try to force reload
                    window.nsfwDetectorStatus = {
                      isLoading: false,
                      isLoaded: false,
                      error: null,
                    };

                    // Wait a bit before retry
                    await new Promise((resolve) => setTimeout(resolve, 2000));
                    continue;
                  } else {
                    throw new Error(
                      `Detector error after ${retryCount} retries: ${window.nsfwDetectorStatus.error}`
                    );
                  }
                }

                // If nothing is happening after 10 seconds, try to trigger loading
                if (
                  elapsed > 10000 &&
                  (!window.nsfwDetectorStatus ||
                    (!window.nsfwDetectorStatus.isLoading &&
                      !window.nsfwDetectorStatus.isLoaded))
                ) {
                  console.log(
                    "🔄 Detector seems stuck, trying to trigger loading..."
                  );

                  // Get detailed status first
                  if (typeof window.getNSFWDetectorStatus === "function") {
                    const status = window.getNSFWDetectorStatus();
                    console.log("📊 Detailed detector status:", status);
                  }

                  // Try to force reload
                  if (typeof window.forceReloadNSFWDetector === "function") {
                    console.log("🔄 Attempting force reload...");
                    const reloadResult = await window.forceReloadNSFWDetector();
                    console.log("Force reload result:", reloadResult);
                  } else if (
                    typeof window.initializeNSFWDetector === "function"
                  ) {
                    console.log("🔄 Attempting initialization...");
                    window.initializeNSFWDetector();
                  }
                }

                await new Promise((resolve) => setTimeout(resolve, 500));
              }

              console.error(
                `❌ Detector timeout after ${Math.round(maxWait / 1000)}s`
              );
              console.log("Final status:", window.nsfwDetectorStatus);
              console.log("Available globals:", {
                tf: typeof window.tf,
                nsfwDetector: typeof window.nsfwDetector,
                nsfwDetectorStatus: window.nsfwDetectorStatus,
              });

              throw new Error(
                `NSFW detector loading timeout after ${Math.round(
                  maxWait / 1000
                )}s. Check console for details.`
              );
            }

            // Wait for detector to be ready
            console.log("🔞 Waiting for NSFW detector to be ready...");
            const detectorResult = await waitForDetector();

            // Load model if not already loaded
            console.log("🔞 Loading NSFW model...");
            if (!window.nsfwDetector.isModelReady()) {
              await window.nsfwDetector.loadModel();
            }

            // Analyze page images with detailed settings
            console.log("🔞 Starting detailed image analysis...");
            const analysis = await window.nsfwDetector.analyzePageImages({
              threshold: 0.6,
              maxImages: 20,
              skipSmallImages: true,
              minImageSize: 50,
            });

            return {
              ...analysis,
              detectorLoadTime: detectorResult.elapsed,
              timestamp: Date.now(),
            };
          } catch (error) {
            console.error("❌ NSFW analysis error:", error);
            return {
              error: error.message,
              detectorStatus: window.nsfwDetectorStatus,
              timestamp: Date.now(),
            };
          }
        },
      });

      const analysisResult = results[0].result;

      if (analysisResult.error) {
        console.error("❌ Analysis failed:", analysisResult);
        updateNSFWStatus(`Error: ${analysisResult.error}`, "#dc3545");

        // Log detailed error info
        if (analysisResult.detectorStatus) {
          console.log(
            "Detector status at failure:",
            analysisResult.detectorStatus
          );
        }

        throw new Error(analysisResult.error);
      }

      // Show loading time info
      if (analysisResult.detectorLoadTime) {
        updateNSFWStatus(
          `Detector loaded in ${analysisResult.detectorLoadTime}s, analyzing images...`,
          "#28a745"
        );
      }

      // Update current data and UI
      if (currentData) {
        currentData.nsfwAnalysis = analysisResult;
      }
      updateNSFWResults(analysisResult);

      console.log("✅ NSFW analysis completed:", analysisResult);

      // Visual feedback (only for manual analysis)
      if (!isAutomatic) {
        analyzeNSFWBtn.textContent = "✅ Analyzed!";
        analyzeNSFWBtn.style.backgroundColor = "#4caf50";

        setTimeout(() => {
          analyzeNSFWBtn.textContent = originalText;
          analyzeNSFWBtn.style.backgroundColor = "";
          analyzeNSFWBtn.disabled = false;
        }, 2000);
      }
    } catch (error) {
      console.error("❌ Failed to analyze NSFW content:", error);

      // Show error status and update button for manual analysis
      updateNSFWStatus(`Failed: ${error.message}`, "#dc3545");

      if (!isAutomatic) {
        analyzeNSFWBtn.textContent = "❌ Error";
        analyzeNSFWBtn.style.backgroundColor = "#f44336";

        setTimeout(() => {
          analyzeNSFWBtn.textContent = "🔞 Analyze Images";
          analyzeNSFWBtn.style.backgroundColor = "";
          analyzeNSFWBtn.disabled = false;
        }, 2000);
      }
    }
  }

  // Copy information to clipboard
  async function copyToClipboard() {
    console.log("📋 Copy button clicked");
    if (!currentData) {
      console.log("❌ No data to copy");
      return;
    }

    // Get NSFW data
    const nsfwData = currentData.nsfwAnalysis;
    const nsfwImages = nsfwData ? nsfwData.nsfwFound : "Not analyzed";
    const imagesAnalyzed = nsfwData ? nsfwData.totalAnalyzed : "0";
    const safetyScore =
      nsfwData && nsfwData.totalAnalyzed > 0
        ? `${Math.round(
            ((nsfwData.totalAnalyzed - nsfwData.nsfwFound) /
              nsfwData.totalAnalyzed) *
              100
          )}% Safe`
        : "Unknown";

    const info = `Website Information
━━━━━━━━━━━━━━━━━━━━
📋 Basic Info:
  • URL: ${currentData.url}
  • Title: ${currentData.title}
  • Domain: ${currentData.domain}

📊 Page Stats:
  • Images: ${currentData.images}
  • Links: ${currentData.links}
  • Scripts: ${currentData.scripts}

🛠️ Technology:
  • Framework: ${currentData.framework}
  • Meta Tags: ${currentData.metaTags}

🔞 Content Safety:
  • NSFW Images: ${nsfwImages}
  • Images Analyzed: ${imagesAnalyzed}
  • Safety Score: ${safetyScore}

Analyzed: ${currentData.timestamp}
Generated by Website Info Tool`;

    try {
      await navigator.clipboard.writeText(info);
      console.log("✅ Data copied to clipboard successfully");
      copyBtn.textContent = "✅ Copied!";
      setTimeout(() => {
        copyBtn.textContent = "📋 Copy Info";
      }, 2000);
    } catch (error) {
      console.error("❌ Failed to copy:", error);
    }
  }

  // Reload NSFW detector manually
  async function reloadNSFWDetector() {
    console.log("🔧 Manual detector reload requested");

    try {
      const originalText = reloadDetectorBtn.textContent;
      reloadDetectorBtn.textContent = "🔄 Reloading...";
      reloadDetectorBtn.disabled = true;

      updateNSFWStatus("Manually reloading detector...", "#007bff");

      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      // Execute force reload in content script
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: async () => {
          try {
            if (typeof window.forceReloadNSFWDetector === "function") {
              const result = await window.forceReloadNSFWDetector();
              console.log("🔧 Force reload result:", result);
              return result;
            } else {
              return {
                success: false,
                error: "Force reload function not available",
              };
            }
          } catch (error) {
            console.error("❌ Force reload error:", error);
            return { success: false, error: error.message };
          }
        },
      });

      const reloadResult = results[0].result;

      if (reloadResult.success) {
        updateNSFWStatus("Detector reloaded successfully", "#28a745");
        reloadDetectorBtn.textContent = "✅ Reloaded!";
        reloadDetectorBtn.style.backgroundColor = "#4caf50";

        // Try to re-analyze after successful reload
        setTimeout(() => {
          analyzeNSFWImages(true);
        }, 1000);
      } else {
        updateNSFWStatus(`Reload failed: ${reloadResult.error}`, "#dc3545");
        reloadDetectorBtn.textContent = "❌ Failed";
        reloadDetectorBtn.style.backgroundColor = "#f44336";
      }

      setTimeout(() => {
        reloadDetectorBtn.textContent = originalText;
        reloadDetectorBtn.style.backgroundColor = "";
        reloadDetectorBtn.disabled = false;
      }, 3000);
    } catch (error) {
      console.error("❌ Failed to reload detector:", error);
      updateNSFWStatus(`Reload error: ${error.message}`, "#dc3545");

      reloadDetectorBtn.textContent = "❌ Error";
      reloadDetectorBtn.style.backgroundColor = "#f44336";

      setTimeout(() => {
        reloadDetectorBtn.textContent = "🔧 Reload Detector";
        reloadDetectorBtn.style.backgroundColor = "";
        reloadDetectorBtn.disabled = false;
      }, 3000);
    }
  }

  // Event listeners
  refreshBtn.addEventListener("click", () => {
    console.log("🔄 Refresh button clicked");
    loadWebsiteInfo();
  });
  copyBtn.addEventListener("click", copyToClipboard);
  analyzeNSFWBtn.addEventListener("click", analyzeNSFWImages);
  reloadDetectorBtn.addEventListener("click", reloadNSFWDetector);

  console.log("👂 Event listeners attached");

  // Initial load
  console.log("🎬 Starting initial website analysis...");
  loadWebsiteInfo();
});
