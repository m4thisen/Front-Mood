import { createNavigationContainerRef } from '@react-navigation/native';
import { RootStackParamList } from './tipos';

/** Para navegar desde fuera de una pantalla (por ejemplo, al tocar el recordatorio). */
export const navegacion = createNavigationContainerRef<RootStackParamList>();
