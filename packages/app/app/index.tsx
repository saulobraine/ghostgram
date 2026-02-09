import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export default function IndexScreen() {
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const token = await SecureStore.getItemAsync('ghostgram_token');
      
      if (token) {
        router.replace('/(tabs)/home');
      } else {
        router.replace('/auth');
      }
    } catch (error) {
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
