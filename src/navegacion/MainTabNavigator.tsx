import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from './tipos';
import { TabBar } from '@/componentes/TabBar';
import { InicioScreen } from '@/pantallas/InicioScreen';
import { EstadisticasScreen } from '@/pantallas/EstadisticasScreen';
import { RegistroScreen } from '@/pantallas/RegistroScreen';
import { CuentaScreen } from '@/pantallas/CuentaScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

// Orden de los tabs = orden en el navbar. "Today" (subir tu día) va al
// final a propósito, para quedar a la derecha de todo.
export const MainTabNavigator: React.FC = () => (
  <Tab.Navigator
    screenOptions={{ headerShown: false }}
    tabBar={(props) => <TabBar {...props} />}
  >
    <Tab.Screen name="Inicio" component={InicioScreen} />
    <Tab.Screen name="Estadisticas" component={EstadisticasScreen} />
    <Tab.Screen name="Cuenta" component={CuentaScreen} />
    <Tab.Screen name="Registro" component={RegistroScreen} />
  </Tab.Navigator>
);
