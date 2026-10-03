import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Icono, NombreIcono } from './Icono';
import { colors, radius, spacing, typography } from '@/tema';
import { hapticos } from '@/utils/hapticos';

interface Props {
  etiqueta: string;
  seleccionado: boolean;
  onPress: () => void;
  icono?: NombreIcono;
}

/** Opción que se marca y desmarca (etiquetas, clima, bloques). */
export const Chip: React.FC<Props> = ({ etiqueta, seleccionado, onPress, icono }) => (
  <Pressable
    onPress={() => {
      hapticos.seleccion();
      onPress();
    }}
    accessibilityRole="checkbox"
    accessibilityState={{ checked: seleccionado }}
    style={({ pressed }) => [styles.chip, seleccionado && styles.seleccionado, pressed && styles.presionado]}
  >
    {icono && (
      <Icono
        nombre={icono}
        tamano={15}
        relleno={seleccionado}
        color={seleccionado ? colors.accentStrong : colors.textSecondary}
      />
    )}
    <Text style={[typography.bodyMedium, styles.texto, seleccionado && styles.textoSeleccionado]}>
      {etiqueta}
    </Text>
  </Pressable>
);

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 34,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.fill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  seleccionado: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
  },
  presionado: {
    opacity: 0.7,
  },
  texto: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  textoSeleccionado: {
    color: colors.textPrimary,
  },
});
