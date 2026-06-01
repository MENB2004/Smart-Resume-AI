import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from './src/context/ThemeContext';
import { darkGradient, lightColors } from './src/utils/theme';

/**
 * Inner component that has access to ThemeContext.
 * Wraps the app in a full-screen gradient so dark mode shows
 * a rich blue gradient behind all transparent screen containers.
 */
const ThemedApp = () => {
  const { isDarkMode } = useTheme();

  // Nav container theme: transparent background so gradient shows through
  const navTheme = isDarkMode
    ? { ...DarkTheme, colors: { ...DarkTheme.colors, background: 'transparent' } }
    : { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: lightColors.background } };

  return (
    <AuthProvider>
      <LinearGradient
        colors={isDarkMode ? darkGradient : [lightColors.background, lightColors.background]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      >
        <NavigationContainer theme={navTheme as any}>
          <StatusBar style={isDarkMode ? 'light' : 'dark'} />
          <AppNavigator />
        </NavigationContainer>
      </LinearGradient>
    </AuthProvider>
  );
};

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#020B18' }}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ThemedApp />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
