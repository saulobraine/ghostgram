# GhostGram - Chrome Extension

## Setup Instructions

1. **Add the original bundle code to `bundle.js`**:

   - Open `bundle.js`
   - Replace the placeholder content with the original minified bundle code from the user script
   - The code should start with `(()=>{"use strict";var e={...`

2. **Load the extension in Chrome**:

   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select this project folder (the root directory)

3. **Usage**:
   - Navigate to `https://www.instagram.com`
   - Click the extension icon to enable/disable
   - Use the options page to configure timing settings

## Files Structure

- `manifest.json` - Extension manifest (Manifest V3)
- `content.js` - Content script that injects the bundle
- `bundle.js` - Original minified code (needs to be filled with actual code)
- `popup.html/js` - Extension popup interface
- `options.html/js` - Options/settings page
- `background.js` - Service worker for background tasks
- `styles.css` - Extracted CSS styles
- `icons/` - Extension icons

## Notes

- The extension uses `chrome.storage` instead of `localStorage` for better sync across devices
- The content script creates a localStorage wrapper that uses chrome.storage
- Make sure to add the original bundle code to `bundle.js` before using
