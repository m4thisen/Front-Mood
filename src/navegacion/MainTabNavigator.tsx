import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from './tipos';
import { TabBar } from '@/componentes/TabBar';
import { InicioScreen } from '@/pantallas/InicioScreen';
import { EstadisticasScreen } from '@/pantallas/EstadisticasScreen';
import { ComoVenisScreen } from '@/pantallas/ComoVenisScreen';
import { CuentaScreen } from '@/pantallas/CuentaScreen';
import { RegistroScreen } from '@/pantallas/RegistroScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

// Orden de los tabs = orden en la barra. "Registro" (Hoy) va al final a
// propósito, para quedar destacado a la derecha de todo.
export const MainTabNavigator: React.FC = () => (
  <Tab.Navigator screenOptions={{ headerShown: false }} tabBar={(props) => <TabBar {...props} />}>
    <Tab.Screen name="Inicio" component={InicioScreen} />
    <Tab.Screen name="Estadisticas" component={EstadisticasScreen} />
    <Tab.Screen name="ComoVenis" component={ComoVenisScreen} />
    <Tab.Screen name="Cuenta" component={CuentaScreen} />
    <Tab.Screen name="Registro" component={RegistroScreen} />
  </Tab.Navigator>
);
