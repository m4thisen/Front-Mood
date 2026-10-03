import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer, DarkTheme, Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './tipos';
import { MainTabNavigator } from './MainTabNavigator';
import { BienvenidaScreen } from '@/pantallas/BienvenidaScreen';
import { DatosBasicosScreen } from '@/pantallas/onboarding/DatosBasicosScreen';
import { BloquesScreen } from '@/pantallas/onboarding/BloquesScreen';
import { BloquesEspecialesScreen } from '@/pantallas/onboarding/BloquesEspecialesScreen';
import { RecordatorioScreen } from '@/pantallas/onboarding/RecordatorioScreen';
import { DetalleDiaScreen } from '@/pantallas/DetalleDiaScreen';
import { useApp } from '@/context/AppContext';
import { ColorDelAlmaScreen } from '@/pantallas/onboarding/ColorDelAlmaScreen';
import { colors } from '@/tema';

const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.background,
    card: colors.background,
    border: colors.border,
    primary: colors.accent,
    text: colors.textPrimary,
  },
};

export const RootNavigator: React.FC = () => {
  const { isLoading, profile } = useApp();

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  const startOnboarding = !profile || !profile.onboardingComplete;

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        initialRouteName={startOnboarding ? 'Bienvenida' : 'Principal'}
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}
      >
        <Stack.Screen name="Bienvenida" component={BienvenidaScreen} />
        <Stack.Screen name="DatosBasicos" component={DatosBasicosScreen} />
        <Stack.Screen name="Bloques" component={BloquesScreen} />
        <Stack.Screen name="BloquesEspeciales" component={BloquesEspecialesScreen} />
        <Stack.Screen name="Recordatorio" component={RecordatorioScreen} />
        <Stack.Screen name="ColorDelAlma" component={ColorDelAlmaScreen} />
        <Stack.Screen name="Principal" component={MainTabNavigator} />
        <Stack.Screen
          name="DetalleDia"
          component={DetalleDiaScreen}
          options={{ presentation: 'modal' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
