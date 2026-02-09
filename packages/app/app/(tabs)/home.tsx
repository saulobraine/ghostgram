import { useState, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import WebView from 'react-native-webview';

export default function HomeScreen() {
  const [loading, setLoading] = useState(true);
  const webViewRef = useRef<WebView>(null);

  const injectedJavaScript = `
    (function() {
      // Inject GhostGram functionality into Instagram
      console.log('[GhostGram] Injected into Instagram WebView');
      
      // Listen for messages from React Native
      window.addEventListener('message', function(event) {
        console.log('[GhostGram] Received message:', event.data);
      });
      
      // Send message to React Native when ready
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'ready',
          url: window.location.href
        }));
      }
      
      // Detect login state
      function checkLoginState() {
        const isLoggedIn = document.cookie.includes('sessionid');
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'loginState',
            isLoggedIn: isLoggedIn
          }));
        }
      }
      
      // Check login state periodically
      setInterval(checkLoginState, 5000);
      checkLoginState();
      
      // TODO: Inject scan functionality
      // This would be similar to the extension's content script
    })();
    true;
  `;

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('[App] Message from WebView:', data);
      
      if (data.type === 'ready') {
        console.log('[App] WebView ready at:', data.url);
      } else if (data.type === 'loginState') {
        console.log('[App] Login state:', data.isLoggedIn);
      }
    } catch (error) {
      console.error('[App] Error parsing message:', error);
    }
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
        injectedJavaScript={injectedJavaScript}
        onMessage={handleMessage}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15"
        sharedCookiesEnabled={true}
        thirdPartyCookiesEnabled={true}
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
