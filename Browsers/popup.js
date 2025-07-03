document.addEventListener("DOMContentLoaded", async () => {
  console.log("🚀 Website Info Tool popup opened");

  const loadingDiv = document.getElementById("loading");
  const contentDiv = document.getElementById("content");
  const refreshBtn = document.getElementById("refreshBtn");
  const copyBtn = document.getElementById("copyBtn");
  const analyzeNSFWBtn = document.getElementById("analyzeNSFWBtn");

  let currentData = null;

  console.log("📋 Popup elements initialized:", {
    loadingDiv: !!loadingDiv,
    contentDiv: !!contentDiv,
    refreshBtn: !!refreshBtn,
    copyBtn: !!copyBtn,
    analyzeNSFWBtn: !!analyzeNSFWBtn,
  });

  // Get current tab and load website info
  async function loadWebsiteInfo() {
    try {
      console.log("🔍 Starting website analysis...");
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
      if (window.nsfwDetector) {
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

    loadingDiv.style.display = "none";
    contentDiv.style.display = "block";
    console.log("✅ Popup display updated successfully");
  }

  // Show error message
  function showError(message) {
    console.log("❌ Showing error:", message);
    loadingDiv.innerHTML = `<div class="error">${message}</div>`;
  }

  // Update NSFW results in UI
  function updateNSFWResults(nsfwAnalysis) {
    console.log("🔞 Updating NSFW results:", nsfwAnalysis);

    if (!nsfwAnalysis || nsfwAnalysis.error) {
      document.getElementById("nsfwImages").textContent = "Not analyzed";
      document.getElementById("imagesAnalyzed").textContent = "0";
      document.getElementById("safetyScore").textContent = "Unknown";
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
  }

  // Analyze NSFW images on demand
  async function analyzeNSFWImages() {
    console.log("🔞 Analyze NSFW button clicked");

    try {
      const originalText = analyzeNSFWBtn.textContent;
      analyzeNSFWBtn.textContent = "🤖 Analyzing...";
      analyzeNSFWBtn.disabled = true;

      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      // Execute detailed NSFW analysis in content script
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: async () => {
          try {
            // Load model if not already loaded
            await window.nsfwDetector.loadModel();

            // Analyze page images with detailed settings
            const analysis = await window.nsfwDetector.analyzePageImages({
              threshold: 0.6,
              maxImages: 20,
              skipSmallImages: true,
              minImageSize: 50,
            });

            return analysis;
          } catch (error) {
            console.error("❌ NSFW analysis error:", error);
            return { error: error.message };
          }
        },
      });

      const analysisResult = results[0].result;

      if (analysisResult.error) {
        throw new Error(analysisResult.error);
      }

      // Update current data and UI
      if (currentData) {
        currentData.nsfwAnalysis = analysisResult;
      }
      updateNSFWResults(analysisResult);

      console.log("✅ NSFW analysis completed:", analysisResult);

      // Visual feedback
      analyzeNSFWBtn.textContent = "✅ Analyzed!";
      analyzeNSFWBtn.style.backgroundColor = "#4caf50";

      setTimeout(() => {
        analyzeNSFWBtn.textContent = originalText;
        analyzeNSFWBtn.style.backgroundColor = "";
        analyzeNSFWBtn.disabled = false;
      }, 2000);
    } catch (error) {
      console.error("❌ Failed to analyze NSFW content:", error);

      analyzeNSFWBtn.textContent = "❌ Error";
      analyzeNSFWBtn.style.backgroundColor = "#f44336";

      setTimeout(() => {
        analyzeNSFWBtn.textContent = "🔞 Analyze Images";
        analyzeNSFWBtn.style.backgroundColor = "";
        analyzeNSFWBtn.disabled = false;
      }, 2000);
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

  // Event listeners
  refreshBtn.addEventListener("click", () => {
    console.log("🔄 Refresh button clicked");
    loadWebsiteInfo();
  });
  copyBtn.addEventListener("click", copyToClipboard);
  analyzeNSFWBtn.addEventListener("click", analyzeNSFWImages);

  console.log("👂 Event listeners attached");

  // Initial load
  console.log("🎬 Starting initial website analysis...");
  loadWebsiteInfo();
});
