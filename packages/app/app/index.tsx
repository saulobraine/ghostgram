import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { apiClient } from '../src/services/ApiClient';

export default function IndexScreen() {
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const hasSession = await apiClient.restoreSession();

      if (hasSession) {
        router.replace('/(tabs)/home');
        return;
      }

      router.replace('/auth');
    } catch {
      router.replace('/auth');
    }
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#e1306c" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
