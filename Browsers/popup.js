document.addEventListener("DOMContentLoaded", async () => {
  console.log("🚀 Website Info Tool popup opened");

  const loadingDiv = document.getElementById("loading");
  const contentDiv = document.getElementById("content");
  const refreshBtn = document.getElementById("refreshBtn");
  const copyBtn = document.getElementById("copyBtn");

  let currentData = null;

  console.log("📋 Popup elements initialized:", {
    loadingDiv: !!loadingDiv,
    contentDiv: !!contentDiv,
    refreshBtn: !!refreshBtn,
    copyBtn: !!copyBtn,
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
  function analyzeWebsite() {
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

    loadingDiv.style.display = "none";
    contentDiv.style.display = "block";
    console.log("✅ Popup display updated successfully");
  }

  // Show error message
  function showError(message) {
    console.log("❌ Showing error:", message);
    loadingDiv.innerHTML = `<div class="error">${message}</div>`;
  }

  // Copy information to clipboard
  async function copyToClipboard() {
    console.log("📋 Copy button clicked");
    if (!currentData) {
      console.log("❌ No data to copy");
      return;
    }

    const info = `Website Information
URL: ${currentData.url}
Title: ${currentData.title}
Domain: ${currentData.domain}
Images: ${currentData.images}
Links: ${currentData.links}
Scripts: ${currentData.scripts}
Framework: ${currentData.framework}
Meta Tags: ${currentData.metaTags}
Analyzed: ${currentData.timestamp}`;

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

  console.log("👂 Event listeners attached");

  // Initial load
  console.log("🎬 Starting initial website analysis...");
  loadWebsiteInfo();
});
