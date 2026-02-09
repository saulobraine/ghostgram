# @ghostgram/app

GhostGram Mobile App - React Native with Expo

## Features

- 🔐 Authentication (login/register)
- 📸 Instagram WebView with script injection
- 🔄 Auto-sync with API
- 📊 History tracking
- ⚙️ Settings & profile management
- 🌙 Dark mode UI

## Tech Stack

- **Expo** ~50.0.0
- **Expo Router** for navigation
- **React Native WebView** for Instagram integration
- **Expo Secure Store** for token storage
- **@ghostgram/shared** for types and DTOs

## Setup

1. Install dependencies:
```bash
pnpm install
```

2. Start development server:
```bash
pnpm start
```

3. Run on device/simulator:
```bash
# iOS
pnpm ios

# Android
pnpm android

# Web (for testing)
pnpm web
```

## Architecture

### Screens
- **Index** - Loading/splash screen
- **Auth** - Login/register
- **(tabs)**
  - **Home** - Instagram WebView with GhostGram injection
  - **History** - View past scans and actions
  - **Settings** - Account settings and logout

### WebView Integration

The app uses React Native WebView to load Instagram and inject JavaScript:

```typescript
// Injected script detects login state
const injectedJavaScript = `
  (function() {
    // Check if user is logged in
    const isLoggedIn = document.cookie.includes('sessionid');
    
    // Send message to React Native
    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: 'loginState',
      isLoggedIn
    }));
  })();
`;
```

### API Integration

Uses the same `@ghostgram/shared` package as extension and API:

```typescript
import { apiClient } from './src/services/ApiClient';

// Login
const response = await apiClient.login({ email, password });

// Store token securely
await SecureStore.setItemAsync('ghostgram_token', response.accessToken);
```

## Development

### Hot Reload
Expo provides hot reload for fast development. Changes to TypeScript files are instantly reflected.

### Debugging
- Use React Native Debugger
- Console logs appear in terminal
- WebView logs use `console.log` inside injected JS

### Testing on Device
1. Install Expo Go app
2. Scan QR code from `pnpm start`
3. App loads on your device

## Building

### Development Build
```bash
eas build --profile development --platform ios
eas build --profile development --platform android
```

### Production Build
```bash
eas build --profile production --platform ios
eas build --profile production --platform android
```

### Submit to Stores
```bash
eas submit --platform ios
eas submit --platform android
```

## Environment Variables

Create `.env`:
```
API_URL=http://localhost:3001/api/v1
```

For production, update to deployed API URL.

## Project Structure

```
app/
├── app/                  # Expo Router screens
│   ├── _layout.tsx       # Root layout
│   ├── index.tsx         # Splash/loading
│   ├── auth.tsx          # Auth screen
│   └── (tabs)/           # Tab navigation
│       ├── _layout.tsx   # Tab layout
│       ├── home.tsx      # Instagram WebView
│       ├── history.tsx   # History screen
│       └── settings.tsx  # Settings screen
├── src/
│   └── services/
│       └── ApiClient.ts  # API integration
├── assets/               # Images, icons
├── app.json             # Expo config
├── package.json
└── tsconfig.json
```

## Next Steps

- [ ] Complete WebView script injection (scan functionality)
- [ ] Implement history screen with real data
- [ ] Add push notifications
- [ ] Implement deep linking
- [ ] Add offline support
- [ ] Implement plan upgrade flow
