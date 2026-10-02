import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer, DarkTheme, Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { MainTabNavigator } from './MainTabNavigator';
import { WelcomeScreen } from '@/screens/onboarding/WelcomeScreen';
import { RegisterScreen } from '@/screens/onboarding/RegisterScreen';
import { BlocksSelectionScreen } from '@/screens/onboarding/BlocksSelectionScreen';
import { SpecialBlocksScreen } from '@/screens/onboarding/SpecialBlocksScreen';
import { NotificationTimeScreen } from '@/screens/onboarding/NotificationTimeScreen';
import { DayDetailScreen } from '@/screens/DayDetailScreen';
import { useApp } from '@/context/AppContext';
import { SoulRevealScreen } from '@/screens/onboarding/SoulRevealScreen';
import { colors } from '@/theme';

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
        initialRouteName={startOnboarding ? 'Welcome' : 'MainTabs'}
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}
      >
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="BlocksSelection" component={BlocksSelectionScreen} />
        <Stack.Screen name="SpecialBlocks" component={SpecialBlocksScreen} />
        <Stack.Screen name="NotificationTime" component={NotificationTimeScreen} />
        <Stack.Screen name="SoulReveal" component={SoulRevealScreen} />
        <Stack.Screen name="MainTabs" component={MainTabNavigator} />
        <Stack.Screen
          name="DayDetail"
          component={DayDetailScreen}
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
