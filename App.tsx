import 'react-native-gesture-handler';
import React, { useState, useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppState, AppStateStatus, useColorScheme } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import BiometricLock from './src/screens/BiometricLock';
import { SettingsProvider, useSettings } from './src/context/SettingsContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PaperProvider } from 'react-native-paper';

const LAST_BACKGROUND_KEY = '@memo_last_background';

function AppContent() {
  const [locked, setLocked] = useState(true);
  const [unlocked, setUnlocked] = useState(false);
  const appState = useRef(AppState.currentState);
  const { lockTimeout, themeMode, paperTheme } = useSettings();
  const systemColorScheme = useColorScheme();

  const isDark =
    themeMode === 'deep_black' ||
    themeMode === 'dark' ||
    (themeMode === 'system' && systemColorScheme === 'dark');

  useEffect(() => {
    const handleAppStateChange = async (nextState: AppStateStatus) => {
      if (appState.current === 'active' && (nextState === 'background' || nextState === 'inactive')) {
        await AsyncStorage.setItem(LAST_BACKGROUND_KEY, Date.now().toString());
      } else if (appState.current.match(/inactive|background/) && nextState === 'active') {
        const lastBg = await AsyncStorage.getItem(LAST_BACKGROUND_KEY);
        if (lastBg) {
          const timeSpentInBackgroundMs = Date.now() - parseInt(lastBg, 10);
          const timeoutMs = lockTimeout * 60 * 1000;
          if (timeSpentInBackgroundMs > timeoutMs) {
            setLocked(true);
            setUnlocked(false);
          }
        }
      }
      appState.current = nextState;
    };
    const sub = AppState.addEventListener('change', handleAppStateChange);
    return () => sub.remove();
  }, [lockTimeout]);

  return (
    <PaperProvider theme={paperTheme}>
      <SafeAreaProvider>
        <StatusBar style={isDark ? "light" : "dark"} />
        {locked && !unlocked ? (
          <BiometricLock onUnlocked={() => { setLocked(false); setUnlocked(true); }} />
        ) : (
          <AppNavigator />
        )}
      </SafeAreaProvider>
    </PaperProvider>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <AppContent />
    </SettingsProvider>
  );
}
