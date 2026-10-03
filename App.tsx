import React from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import {
  Fraunces_400Regular,
  Fraunces_400Regular_Italic,
  Fraunces_500Medium,
} from '@expo-google-fonts/fraunces';
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';

import { AppProvider } from '@/context/AppContext';
import { I18nProvider } from '@/i18n';
import { SincronizarIdioma } from '@/navegacion/SincronizarIdioma';
import { RootNavigator } from '@/navegacion/RootNavigator';
import { colors } from '@/tema';

export default function App() {
  const [fontsLoaded] = useFonts({
    Fraunces_400Regular,
    Fraunces_400Regular_Italic,
    Fraunces_500Medium,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  if (!fontsLoaded) {
    return <View style={styles.splash} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppProvider>
          <I18nProvider>
            <SincronizarIdioma />
            <StatusBar style="light" />
            <RootNavigator />
          </I18nProvider>
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
