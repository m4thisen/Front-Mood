import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer, DarkTheme, Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './tipos';
import { MainTabNavigator } from './MainTabNavigator';
import { BienvenidaScreen } from '@/pantallas/BienvenidaScreen';
import { DatosBasicosScreen } from '@/pantallas/onboarding/DatosBasicosScreen';
import { BloquesScreen } from '@/pantallas/onboarding/BloquesScreen';
import { TagsScreen } from '@/pantallas/onboarding/TagsScreen';
import { RecordatorioScreen } from '@/pantallas/onboarding/RecordatorioScreen';
import { ColorDelAlmaScreen } from '@/pantallas/onboarding/ColorDelAlmaScreen';
import { DetalleDiaScreen } from '@/pantallas/DetalleDiaScreen';
import { useSesionStore } from '@/stores/SesionStore';
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

/**
 * Las pantallas disponibles dependen del estado de la sesión: sin usuario
 * solo existe la bienvenida; con usuario sin configurar, el onboarding; y con
 * el onboarding completo, la app. Al cerrar sesión se vuelve sola a la
 * bienvenida, y si el onboarding quedó a medias se retoma en el próximo
 * ingreso (CU-04, postcondición de fallo).
 */
export const RootNavigator: React.FC = () => {
  const cargando = useSesionStore((s) => s.cargando);
  const usuario = useSesionStore((s) => s.usuario);
  const cargar = useSesionStore((s) => s.cargar);

  useEffect(() => {
    cargar();
  }, [cargar]);

  if (cargando) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}
      >
        {!usuario ? (
          <Stack.Screen name="Bienvenida" component={BienvenidaScreen} />
        ) : !usuario.onboardingCompleto ? (
          <Stack.Group>
            <Stack.Screen name="DatosBasicos" component={DatosBasicosScreen} />
            <Stack.Screen name="Bloques" component={BloquesScreen} />
            <Stack.Screen name="Tags" component={TagsScreen} />
            <Stack.Screen name="Recordatorio" component={RecordatorioScreen} />
            <Stack.Screen name="ColorDelAlma" component={ColorDelAlmaScreen} />
          </Stack.Group>
        ) : (
          <Stack.Group>
            <Stack.Screen name="Principal" component={MainTabNavigator} />
            <Stack.Screen
              name="DetalleDia"
              component={DetalleDiaScreen}
              options={{ presentation: 'modal' }}
            />
          </Stack.Group>
        )}
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
