import { NavigatorScreenParams } from '@react-navigation/native';

export type MainTabParamList = {
  Inicio: undefined;
  Estadisticas: undefined;
  ComoVenis: undefined;
  Registro: undefined;
  Cuenta: undefined;
};

export type RootStackParamList = {
  Bienvenida: undefined;
  DatosBasicos: undefined;
  Bloques: undefined;
  Tags: undefined;
  Recordatorio: undefined;
  ColorDelAlma: undefined;
  Principal: NavigatorScreenParams<MainTabParamList> | undefined;
  DetalleDia: { fecha: string };
};