# Installation Instructions

## Step 1: Add Original Bundle Code

Open `bundle.js` and replace the placeholder content with the original minified code from the user script.

The original code starts with:
```javascript
(()=>{"use strict";var e={100:(e,t,n)=>{...
```

Copy the **entire** original script code and paste it into `bundle.js`, replacing all placeholder content.

## Step 2: Generate Icons

1. Open `generate-icons.html` in a browser
2. Click "Generate Icons" to preview
3. Click "Download All Icons" to save the icon files
4. Move the downloaded PNG files to the `icons/` folder:
   - `icon16.png`
   - `icon48.png`
   - `icon128.png`

## Step 3: Load Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `chrome-extension` folder

## Step 4: Use the Extension

1. Navigate to `https://www.instagram.com`
2. Click the extension icon in the toolbar
3. Click "Enable Extension" to activate
4. The Instagram Unfollowers interface will replace the Instagram page
5. Use the options page (right-click extension icon → Options) to configure timing settings

## Troubleshooting

- **Extension doesn't work**: Make sure `bundle.js` contains the original code
- **Icons missing**: Generate icons using `generate-icons.html` and place them in `icons/` folder
- **Storage issues**: The extension uses `chrome.storage` which syncs across devices
- **Not loading on Instagram**: Make sure you're on `www.instagram.com` and the extension is enabled

