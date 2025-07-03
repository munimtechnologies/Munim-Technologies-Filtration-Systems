# 🐛 Extension Debugging Guide

## Where to See the Logs

### 1. **Popup Logs** (Most Important)

**How to View:**

- Right-click the extension icon → "Inspect popup"
- This opens DevTools for the popup

**What You'll See:**

- 🚀 "Website Info Tool popup opened"
- 🔍 "Starting website analysis..."
- 📡 Current tab URL
- 💉 "Injecting analysis script..."
- 📊 Analysis results
- ✅ "Website data retrieved:"
- 🖼️ "Displaying website info in popup"
- 🔄 When refresh button clicked
- 📋 When copy button clicked

### 2. **Page Content Logs**

**How to View:**

- Press F12 on any webpage
- Look in the Console tab

**What You'll See:**

- 🌍 "Content script starting on: [URL]"
- 🔬 "Analyzing website from injected script..."
- 🌐 Basic info collected
- 📈 Element counts (images, links, scripts)
- 🛠️ Framework detected
- 🏷️ Meta tags count
- 📋 "Analysis complete, returning data:"
- 🔵 "Adding extension indicator"

### 3. **Background Script Logs**

**How to View:**

- Go to: `chrome://extensions/`
- Find your extension
- Click "service worker" (blue link)

**What You'll See:**

- 🚀 Installation/update messages
- 📄 Tab loading events
- 💾 Visit info storage
- 📨 Message handling
- 📋 Context menu setup

## 🔍 Testing Steps with Logs

### Step 1: Install Extension

1. Check background logs for: "Website Info Tool installed successfully!"

### Step 2: Visit Any Website

1. Check page console for: "Content script starting on: [URL]"
2. Look for blue dot indicator in top-right

### Step 3: Click Extension Icon

1. Right-click icon → "Inspect popup"
2. Should see full analysis sequence:
   ```
   🚀 Website Info Tool popup opened
   📋 Popup elements initialized
   🎬 Starting initial website analysis...
   🔍 Starting website analysis...
   📡 Current tab: [URL]
   💉 Injecting analysis script into tab: [ID]
   ```

### Step 4: Check Page Analysis

1. In page console, look for:
   ```
   🔬 Analyzing website from injected script...
   🌐 Basic info collected: {url, title, domain}
   📈 Element counts: {images, links, scripts}
   🛠️ Framework detected: [framework]
   📋 Analysis complete, returning data: [full object]
   ```

### Step 5: Test Buttons

1. Click "🔄 Refresh" → should see "Refresh button clicked"
2. Click "📋 Copy Info" → should see "Copy button clicked" + "Data copied to clipboard"

## 🚨 Common Issues & Their Logs

### Extension Won't Load

**Check:** Background logs for installation errors

### Popup Won't Open

**Check:** Right-click icon → "Inspect popup" for JavaScript errors

### Analysis Not Working

**Check:** Page console for content script errors
**Look for:** Missing "Content script starting" or analysis logs

### No Blue Dot Showing

**Check:** Page console for "Adding extension indicator" message

## 💡 Pro Tips

1. **Keep DevTools Open:** Always inspect popup before clicking icon
2. **Check Multiple Tabs:** Test on different websites
3. **Watch Console:** Logs appear in real-time as you use the extension
4. **Clear Console:** Use Ctrl+L to clear logs between tests
5. **Reload Extension:** If logs stop appearing, reload the extension

---

**Happy debugging! 🔍**
