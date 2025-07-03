# Website Info Tool - Chrome Extension

A powerful Chrome extension that provides detailed information about any website including domain info, technology stack, and page analytics.

## 🚀 Features

- **Website Analysis**: Get detailed information about any website
- **Technology Detection**: Automatically detect frameworks (React, Vue, Angular, jQuery)
- **Page Statistics**: Count images, links, scripts, and meta tags
- **Domain Information**: Display URL, title, and domain details
- **Copy to Clipboard**: Easy sharing of website information
- **Visit History**: Track your visits to different domains
- **Content Script Integration**: Subtle indicator when extension is active
- **Context Menu**: Right-click to analyze websites

## 📦 Installation

### Method 1: Developer Mode (Recommended for testing)

1. **Enable Developer Mode**:

   - Open Chrome and go to `chrome://extensions/`
   - Toggle "Developer mode" on (top right)

2. **Load the Extension**:

   - Click "Load unpacked"
   - Select the `Browsers` folder containing the extension files
   - The extension should now appear in your extensions list

3. **Add Icons** (Important):
   - Navigate to the `Browsers/icons/` folder
   - Add the required icon files: `icon16.png`, `icon32.png`, `icon48.png`, `icon128.png`
   - See `icons/README.md` for icon specifications

### Method 2: Package and Install

1. **Package the Extension**:

   ```bash
   # Go to chrome://extensions/
   # Click "Pack extension"
   # Select the Browsers folder
   # This creates a .crx file
   ```

2. **Install the Package**:
   - Drag the .crx file to the extensions page
   - Confirm installation

## 🎯 Usage

### Basic Analysis

1. **Click the Extension Icon**: Opens the popup with website analysis
2. **View Information**: See basic info, page stats, and technology details
3. **Refresh Data**: Click the refresh button to re-analyze
4. **Copy Information**: Use the copy button to save data to clipboard

### Advanced Features

- **Right-click Menu**: Right-click on any page and select "Analyze this website"
- **Extension Indicator**: Look for the small blue dot (top-right) when extension is active
- **Visit History**: Extension automatically tracks your visits per domain

## 🛠️ Extension Structure

```
Browsers/
├── manifest.json          # Extension configuration
├── popup.html            # Main popup interface
├── popup.css             # Popup styling
├── popup.js              # Popup functionality
├── content.js            # Content script (runs on pages)
├── background.js         # Background service worker
├── icons/                # Extension icons
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   ├── icon128.png
│   └── README.md
└── README.md            # This file
```

## 🔧 Technical Details

### Permissions

- `activeTab`: Access current tab for analysis
- `storage`: Save visit history and settings

### Manifest V3

This extension uses Manifest V3, the latest Chrome extension format with:

- Service worker background script
- Modern permissions system
- Enhanced security

### Browser Compatibility

- **Chrome**: Fully supported (primary target)
- **Edge**: Should work with Manifest V3 support
- **Firefox**: Needs manifest conversion for full compatibility

## 🎨 Customization

### Modifying the Interface

- Edit `popup.html` for layout changes
- Modify `popup.css` for styling updates
- Update `popup.js` for functionality changes

### Adding Features

- Extend `content.js` for page interaction features
- Modify `background.js` for new background tasks
- Update `manifest.json` for new permissions

### Technology Detection

The extension detects these frameworks/libraries:

- React (including Next.js apps)
- Vue.js
- Angular/AngularJS
- jQuery
- Custom detection via DOM analysis

## 🐛 Troubleshooting

### Common Issues

1. **Extension Not Loading**:

   - Check developer mode is enabled
   - Verify all files are in the correct folder
   - Check browser console for errors

2. **Missing Icons**:

   - Add PNG icon files to the `icons/` folder
   - Ensure correct naming (icon16.png, etc.)
   - Refresh the extension after adding icons

3. **Analysis Not Working**:

   - Check if the website blocks content scripts
   - Try refreshing the page and extension popup
   - Look for errors in the extension console

4. **Popup Not Showing**:
   - Right-click the extension icon and check if popup is set
   - Verify `popup.html` exists and is valid
   - Check manifest.json configuration

### Debug Mode

Open Chrome DevTools on the popup:

1. Right-click the extension icon
2. Select "Inspect popup"
3. View console logs and debug

## 📝 Contributing

Feel free to enhance this extension:

1. Fork the repository
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📄 License

This project is open source. Check the main repository for license details.

## 🚀 Future Enhancements

Potential improvements:

- [ ] Options page for settings
- [ ] Export data to different formats
- [ ] More detailed technology detection
- [ ] Performance metrics analysis
- [ ] Screenshot capture feature
- [ ] Bulk analysis of multiple tabs
- [ ] Integration with web development tools

---

**Happy analyzing! 🔍**
