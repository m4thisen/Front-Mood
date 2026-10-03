import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { CaraAnimo } from './CaraAnimo';
import { NIVELES_ANIMO, NivelAnimo } from '@/dominio';
import { colors, typography } from '@/tema';
import { getMoodColor } from '@/tema/colors';
import { useTranslation } from '@/i18n';
import { hapticos } from '@/utils/hapticos';

interface Props {
  valor: NivelAnimo | null;
  onCambio: (nivel: NivelAnimo) => void;
}

/**
 * Escala de cinco niveles (RF-09). Las etiquetas están siempre visibles y,
 * al elegir un nivel, los demás se atenúan para que la elección se lea de
 * un vistazo.
 */
export const EscalaAnimo: React.FC<Props> = ({ valor, onCambio }) => {
  const { t } = useTranslation();
  return (
    <View style={styles.fila} accessibilityRole="radiogroup">
      {NIVELES_ANIMO.map((nivel) => (
        <Opcion
          key={nivel}
          nivel={nivel}
          etiqueta={t(`mood.${nivel}`)}
          seleccionado={valor === nivel}
          atenuado={valor !== null && valor !== nivel}
          onPress={() => {
            hapticos.seleccion();
            onCambio(nivel);
          }}
        />
      ))}
    </View>
  );
};

const Opcion: React.FC<{
  nivel: NivelAnimo;
  etiqueta: string;
  seleccionado: boolean;
  atenuado: boolean;
  onPress: () => void;
}> = ({ nivel, etiqueta, seleccionado, atenuado, onPress }) => {
  const escala = useSharedValue(1);
  const opacidad = useSharedValue(1);

  useEffect(() => {
    escala.value = withSpring(seleccionado ? 1.16 : 1, { damping: 11, stiffness: 220 });
    opacidad.value = withTiming(atenuado ? 0.38 : 1, { duration: 180 });
  }, [seleccionado, atenuado, escala, opacidad]);

  const estiloCara = useAnimatedStyle(() => ({
    transform: [{ scale: escala.value }],
    opacity: opacidad.value,
  }));

  return (
    <Pressable
      onPress={onPress}
      hitSlop={4}
      accessibilityRole="radio"
      accessibilityState={{ selected: seleccionado }}
      accessibilityLabel={etiqueta}
      style={styles.opcion}
    >
      <Animated.View
        style={[
          styles.cara,
          seleccionado && { shadowColor: getMoodColor(nivel), shadowOpacity: 0.7, shadowRadius: 14 },
          estiloCara,
        ]}
      >
        <CaraAnimo nivel={nivel} tamano={52} />
        {seleccionado && <View style={styles.anillo} />}
      </Animated.View>
      <Text
        style={[typography.micro, styles.etiqueta, seleccionado && styles.etiquetaSeleccionada]}
        numberOfLines={1}
      >
        {etiqueta}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  fila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  opcion: {
    alignItems: 'center',
    width: 62,
  },
  cara: {
    width: 52,
    height: 52,
    shadowOffset: { width: 0, height: 0 },
  },
  anillo: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: colors.textPrimary,
  },
  etiqueta: {
    color: colors.textTertiary,
    marginTop: 10,
  },
  etiquetaSeleccionada: {
    color: colors.textPrimary,
  },
});
