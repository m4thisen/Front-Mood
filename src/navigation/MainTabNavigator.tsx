import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from './types';
import { TabBar } from '@/components/TabBar';
import { CalendarScreen } from '@/screens/main/CalendarScreen';
import { StatsScreen } from '@/screens/main/StatsScreen';
import { TodayEntryScreen } from '@/screens/main/TodayEntryScreen';
import { AccountScreen } from '@/screens/main/AccountScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

// Orden de los tabs = orden en el navbar. "Today" (subir tu día) va al
// final a propósito, para quedar a la derecha de todo.
export const MainTabNavigator: React.FC = () => (
  <Tab.Navigator
    screenOptions={{ headerShown: false }}
    tabBar={(props) => <TabBar {...props} />}
  >
    <Tab.Screen name="Calendar" component={CalendarScreen} />
    <Tab.Screen name="Stats" component={StatsScreen} />
    <Tab.Screen name="Account" component={AccountScreen} />
    <Tab.Screen name="Today" component={TodayEntryScreen} />
  </Tab.Navigator>
);
