import { WebView } from 'react-native-webview';
import { StyleSheet, Alert } from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRef } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

export default function RootLayout() {
  const webviewRef = useRef<WebView>(null);

  const handleMessage = async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      if (data.type === 'SAVE_CREDENTIALS') {
        // Save the email and password securely to the device
        await SecureStore.setItemAsync('elektra_email', data.email);
        await SecureStore.setItemAsync('elektra_password', data.password);
      } 
      else if (data.type === 'REQUEST_BIOMETRIC') {
        // 1. Check if we have saved credentials
        const savedEmail = await SecureStore.getItemAsync('elektra_email');
        const savedPassword = await SecureStore.getItemAsync('elektra_password');

        if (!savedEmail || !savedPassword) {
          Alert.alert("Setup Required", "Please login with your email and password first to enable biometric login.");
          return;
        }

        // 2. Check if hardware supports biometrics
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();

        if (!hasHardware || !isEnrolled) {
          Alert.alert("Unavailable", "Biometrics are not set up or unavailable on this device.");
          return;
        }

        // 3. Prompt FaceID/Fingerprint
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Login to Elektra',
          fallbackLabel: 'Use Passcode'
        });

        if (result.success) {
          // 4. Send the credentials back to the Vite frontend
          const script = `
            window.dispatchEvent(new CustomEvent('BIOMETRIC_SUCCESS', { 
              detail: { email: '${savedEmail}', password: '${savedPassword}' } 
            }));
            true;
          `;
          webviewRef.current?.injectJavaScript(script);
        }
      }
    } catch (err) {
      console.log('Error handling message:', err);
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <WebView 
          ref={webviewRef}
          source={{ uri: `https://embroider-abdomen-liable.ngrok-free.dev` }} 
          style={styles.webview}
          mixedContentMode="always"
          domStorageEnabled={true}
          javaScriptEnabled={true}
          onMessage={handleMessage}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  webview: {
    flex: 1,
  },
});
