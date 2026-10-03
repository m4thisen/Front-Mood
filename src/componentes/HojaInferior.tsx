import React, { useEffect } from 'react';
import { Dimensions, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BotonIcono } from './Encabezados';
import { colors, radius, spacing, typography } from '@/tema';

interface Props {
  visible: boolean;
  titulo: string;
  onCerrar: () => void;
  children: React.ReactNode;
  /** Contenido fijo abajo (por ejemplo, el botón de guardar). */
  pie?: React.ReactNode;
}

const FUERA_DE_PANTALLA = Dimensions.get('window').height;

/**
 * Hoja que sube desde abajo, al estilo de iOS, para editar una preferencia
 * sin salir de la pantalla. Se cierra tocando afuera o con la ✕.
 *
 * La subida es una traslación pura (no una animación de layout), así la
 * hoja queda bien anclada aunque su contenido —un selector de fecha, por
 * ejemplo— se mida después de montarse.
 */
export const HojaInferior: React.FC<Props> = ({ visible, titulo, onCerrar, children, pie }) => {
  const insets = useSafeAreaInsets();
  const desplazamiento = useSharedValue(FUERA_DE_PANTALLA);

  useEffect(() => {
    desplazamiento.value = visible ? withSpring(0, { damping: 22, stiffness: 200 }) : FUERA_DE_PANTALLA;
  }, [visible, desplazamiento]);

  const estiloHoja = useAnimatedStyle(() => ({ transform: [{ translateY: desplazamiento.value }] }));

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onCerrar} statusBarTranslucent>
      <Animated.View entering={FadeIn.duration(180)} style={styles.fondo}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCerrar} accessibilityLabel="Cerrar" />
      </Animated.View>
      <Animated.View style={[styles.hoja, { paddingBottom: Math.max(insets.bottom, spacing.lg) }, estiloHoja]}>
        <View style={styles.agarre} />
        <View style={styles.cabecera}>
          <Text style={[typography.headline, styles.titulo]}>{titulo}</Text>
          <BotonIcono icono="cerrar" etiqueta="Cerrar" onPress={onCerrar} tamano={30} />
        </View>
        <ScrollView style={styles.contenido} bounces={false} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
        {pie && <View style={styles.pie}>{pie}</View>}
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  fondo: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.overlay,
  },
  hoja: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '85%',
    backgroundColor: colors.surfaceElevated,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    paddingHorizontal: spacing.xl,
  },
  agarre: {
    alignSelf: 'center',
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.borderStrong,
    marginTop: spacing.sm,
  },
  cabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  titulo: {
    color: colors.textPrimary,
  },
  contenido: {
    flexGrow: 0,
  },
  pie: {
    paddingTop: spacing.lg,
  },
});
