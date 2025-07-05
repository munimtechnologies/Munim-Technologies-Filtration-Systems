# NSFW Detector Loading Timeout Fixes

## Problem Summary

The NSFW detector was timing out after 15 seconds with the error:

```
❌ Analysis failed: NSFW detector loading timeout after 15s. Check console for details.
```

The detector status showed `{isLoaded: false, isLoading: false}`, indicating the model loading was failing.

## Root Causes Identified

1. **Timeout Mismatch**: Multiple timeout values were inconsistent across the loading chain
2. **Insufficient Loading Time**: TensorFlow.js and model loading needed more time
3. **Missing Content Security Policy**: Extension couldn't load external CDN resources
4. **Auto-initialization Issues**: The detector wasn't properly initializing after script load

## Latest Fix: TensorFlow.js Not Loading At All

### Problem

The detector was running fallback initialization attempts and never finding TensorFlow.js, indicating that the content script either wasn't running or TensorFlow.js wasn't loading from the CDN.

### Solution

1. **Enhanced Debugging**: Added extensive console logging throughout the content script to track exactly what's happening
2. **Multiple CDN Sources**: Added fallback CDN URLs for TensorFlow.js loading
3. **Removed Conflicts**: Removed TensorFlow.js script from popup.html to avoid conflicts
4. **Debug Page**: Created `debug-content-script.html` for comprehensive troubleshooting

### Files to Test

- Navigate to `chrome-extension://[extension-id]/debug-content-script.html` to see detailed debugging
- Check console logs for content script initialization messages
- Use the debug page to force-load TensorFlow.js and the detector

## Previous Fixes Applied

### 1. Extended Timeouts

**nsfw-detector.js:**

- Model loading timeout: `10 seconds → 30 seconds`

**content.js:**

- TensorFlow.js loading: `10 seconds → 30 seconds`
- Detector script loading: `5 seconds → 15 seconds`
- Wait times extended: `1 second → 2 seconds`
- Overall detector waiting: `30 seconds → 60 seconds`

**popup.js:**

- Wait for detector: `15 seconds → 60 seconds`
- Trigger loading delay: `5 seconds → 10 seconds`

### 2. Content Security Policy

**manifest.json:**
Added CSP to allow TensorFlow.js CDN loading:

```json
"content_security_policy": {
  "extension_pages": "script-src 'self' https://cdn.jsdelivr.net; object-src 'self'"
}
```

### 3. Enhanced Status Tracking

**nsfw-detector.js:**

- Added `window.getNSFWDetectorStatus()` function for detailed status reporting
- Added auto-initialization attempt after 3 seconds
- Improved logging and error handling

**content.js:**

- Enhanced `waitForNSFWDetector()` with detailed progress logging
- Better error handling and status updates
- Improved force reload functionality with script cleanup

### 4. Better Error Handling

- More descriptive error messages
- Detailed status logging at each step
- Graceful fallbacks and retry mechanisms
- Proper cleanup on force reload

## Testing

### Using the Test Page

1. **Load the test page**: Open `test-detector.html` in a tab with the extension active
2. **Check Status**: Click "Check Status" to see detailed detector information
3. **Run Test**: Once status shows "ready", click "Test Detector" to analyze images
4. **Monitor Logs**: Watch the log section for detailed progress information

### Expected Behavior

✅ **Success Indicators:**

- Status shows "✅ Detector loaded and ready"
- TensorFlow.js version is displayed
- Test detector button becomes enabled
- Image analysis completes without errors

❌ **Failure Indicators:**

- Status shows error messages
- TensorFlow.js not available
- Detector instance not found
- Analysis fails with timeout

### Manual Testing Steps

1. **Install Extension**: Load the updated extension in Chrome
2. **Navigate to Test Page**: Open `test-detector.html`
3. **Wait for Loading**: Allow up to 60 seconds for full initialization
4. **Check Console**: Monitor browser console for detailed logs
5. **Test Analysis**: Try analyzing images on any website

## Key Improvements

1. **Reliability**: Extended timeouts prevent premature failures
2. **Debugging**: Enhanced logging provides better diagnostic information
3. **Performance**: Auto-initialization reduces manual intervention
4. **Robustness**: Better error handling and recovery mechanisms

## Troubleshooting

### If detector still fails to load:

1. **Check Console**: Look for specific error messages
2. **Network Issues**: Verify CDN access to jsdelivr.net
3. **Model Files**: Ensure `model/model.json` and `model/group1-shard1of1.bin` exist
4. **Force Reload**: Use the reload detector button in the popup
5. **Extension Reload**: Reload the entire extension if needed

### Common Issues:

- **CDN Blocked**: Corporate networks may block jsdelivr.net
- **Model Corruption**: Re-download model files if needed
- **Memory Issues**: Large model may require more RAM
- **Browser Compatibility**: Ensure modern Chrome version

## Files Modified

1. `nsfw-detector.js` - Extended timeouts, added auto-init, improved status tracking
2. `content.js` - Extended timeouts, better error handling, enhanced logging
3. `popup.js` - Extended wait time, improved trigger logic
4. `manifest.json` - Added Content Security Policy
5. `test-detector.html` - New test page for verification
6. `NSFW_DETECTOR_FIXES.md` - This documentation file

## Current Issue Troubleshooting Guide

### Step 1: Check if Content Script is Running

1. Open any website and check the browser console
2. Look for messages like:
   - `🌍 Content script starting on: [URL]`
   - `🔧 Content script debugging info:`
   - `🔄 Initializing content script`
   - `🚀 initializeNSFWDetector() called`

If you don't see these messages, the content script isn't running.

### Step 2: Use the Debug Page

1. Navigate to `chrome-extension://[YOUR_EXTENSION_ID]/debug-content-script.html`
2. The page will automatically run checks and show the status
3. Use the buttons to force-load TensorFlow.js and the detector
4. Check the console logs section for detailed information

### Step 3: Check Browser Console

Look for specific error messages:

- **CSP Violations**: `Content Security Policy` errors
- **Network Errors**: `Failed to load resource` for TensorFlow.js
- **Script Errors**: JavaScript errors in the content script
- **Extension Errors**: `chrome.runtime` not available

### Step 4: Manual Testing

Open browser console and run:

```javascript
// Check if content script globals exist
console.log("Content script variables:", {
  nsfwDetectorStatus: typeof window.nsfwDetectorStatus,
  tensorflowReady: typeof window.tensorflowReady,
  loadNSFWDetector: typeof window.loadNSFWDetector,
  nsfwDetector: typeof window.nsfwDetector,
  tf: typeof window.tf,
});

// Try to force load TensorFlow.js
if (typeof window.loadTensorFlowJS === "function") {
  window.loadTensorFlowJS();
}
```

### Step 5: Check Extension Manifest

Verify in `manifest.json`:

- Content script is properly registered
- CSP allows CDN loading
- Permissions are correct

### Common Issues and Solutions

1. **Content Script Not Running**

   - Check that the extension is enabled
   - Refresh the page after enabling the extension
   - Check if the website blocks content scripts

2. **TensorFlow.js CDN Blocked**

   - Network/firewall blocking CDN access
   - CSP headers from the website blocking external scripts
   - Try different CDN URLs (handled automatically now)

3. **Extension Permissions**
   - Ensure the extension has proper permissions
   - Check if running in incognito mode affects it

### Debug Information to Collect

When reporting issues, include:

- Browser console logs (full output)
- Extension ID
- Website URL where it's failing
- Debug page results
- Network tab showing any failed requests

## Next Steps

After applying these fixes:

1. **Test thoroughly** with the test page and debug page
2. **Monitor performance** on various websites
3. **Check error logs** for any remaining issues
4. **Consider fallbacks** if CDN loading fails
5. **Optimize loading** if needed for better user experience
