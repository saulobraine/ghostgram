import { useState, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import WebView, { WebViewMessageEvent } from 'react-native-webview';

const ALLOWED_INSTAGRAM_HOSTS = new Set(['instagram.com', 'www.instagram.com']);

type GhostGramWebViewMessage =
  | { type: 'ready'; url: string }
  | { type: 'loginState'; isLoggedIn: boolean };

function isAllowedInstagramUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && ALLOWED_INSTAGRAM_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
}

function parseWebViewMessage(rawValue: string): GhostGramWebViewMessage | null {
  try {
    const value = JSON.parse(rawValue) as unknown;

    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return null;
    }

    if ('type' in value && value.type === 'ready' && 'url' in value && typeof value.url === 'string') {
      return { type: 'ready', url: value.url };
    }

    if ('type' in value && value.type === 'loginState' && 'isLoggedIn' in value && typeof value.isLoggedIn === 'boolean') {
      return { type: 'loginState', isLoggedIn: value.isLoggedIn };
    }

    return null;
  } catch {
    return null;
  }
}

export default function HomeScreen() {
  const [loading, setLoading] = useState(true);
  const webViewRef = useRef<WebView>(null);

  const injectedJavaScript = `
    (function() {
      console.log('[GhostGram] Injected into Instagram WebView');

      window.addEventListener('message', function(event) {
        console.log('[GhostGram] Received message:', event.data);
      });

      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'ready',
          url: window.location.href
        }));
      }

      function checkLoginState() {
        const isLoggedIn = document.cookie.includes('sessionid');
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'loginState',
            isLoggedIn: isLoggedIn
          }));
        }
      }

      setInterval(checkLoginState, 5000);
      checkLoginState();
    })();
    true;
  `;

  const handleMessage = (event: WebViewMessageEvent) => {
    const message = parseWebViewMessage(event.nativeEvent.data);

    if (!message) {
      return;
    }

    if (message.type === 'ready') {
      if (!isAllowedInstagramUrl(message.url)) {
        return;
      }

      console.log('[App] WebView ready at:', message.url);
      return;
    }

    console.log('[App] Login state:', message.isLoggedIn);
  };

  const handleShouldStartLoadWithRequest = (request: { url: string }) => {
    return isAllowedInstagramUrl(request.url);
  };

  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#e1306c" />
        </View>
      )}
      <WebView
        ref={webViewRef}
        source={{ uri: 'https://www.instagram.com' }}
        style={styles.webview}
        originWhitelist={['https://instagram.com/*', 'https://www.instagram.com/*']}
        injectedJavaScript={injectedJavaScript}
        onMessage={handleMessage}
        onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15"
        sharedCookiesEnabled={true}
        thirdPartyCookiesEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  webview: {
    flex: 1,
  },
  loading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
    zIndex: 1,
  },
});
