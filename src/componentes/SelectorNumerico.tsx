import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icono, NombreIcono } from './Icono';
import { colors, radius, spacing, typography } from '@/tema';
import { hapticos } from '@/utils/hapticos';

interface Props {
  /** null = todavía no se cargó (el dato es opcional). */
  valor: number | null;
  onCambio: (valor: number | null) => void;
  paso: number;
  min: number;
  max: number;
  /** Valor que toma al tocar "+" o "−" por primera vez. */
  inicial: number;
  unidad: string;
  titulo: string;
  icono: NombreIcono;
  /** Texto que se muestra mientras no hay valor. */
  vacio: string;
}

const formatear = (valor: number) => (Number.isInteger(valor) ? String(valor) : valor.toFixed(1).replace('.', ','));

/**
 * Selector de cantidades con − y +, en lugar del teclado: cargar el sueño o
 * el ejercicio lleva dos toques (el registro completo debe tomar menos de un
 * minuto, criterio de la prueba de usabilidad).
 */
export const SelectorNumerico: React.FC<Props> = ({
  valor,
  onCambio,
  paso,
  min,
  max,
  inicial,
  unidad,
  titulo,
  icono,
  vacio,
}) => {
  const cambiar = (direccion: 1 | -1) => {
    hapticos.seleccion();
    if (valor === null) return onCambio(inicial);
    const siguiente = Math.round((valor + direccion * paso) * 10) / 10;
    onCambio(Math.min(max, Math.max(min, siguiente)));
  };

  return (
    <View style={styles.contenedor}>
      <View style={styles.cabecera}>
        <Icono nombre={icono} tamano={15} color={colors.textTertiary} />
        <Text style={[typography.footnote, styles.titulo]}>{titulo}</Text>
        {valor !== null && (
          <Pressable onPress={() => onCambio(null)} hitSlop={10} accessibilityLabel={`Borrar ${titulo}`}>
            <Icono nombre="cerrar" tamano={11} color={colors.textTertiary} peso="bold" />
          </Pressable>
        )}
      </View>
      <View style={styles.fila}>
        <BotonPaso icono="menos" onPress={() => cambiar(-1)} etiqueta={`Menos ${titulo}`} />
        {valor === null ? (
          <Text style={[typography.footnote, styles.vacio]}>{vacio}</Text>
        ) : (
          <Text style={[typography.numero, styles.valor]}>
            {formatear(valor)}
            <Text style={[typography.footnote, styles.unidad]}> {unidad}</Text>
          </Text>
        )}
        <BotonPaso icono="agregar" onPress={() => cambiar(1)} etiqueta={`Más ${titulo}`} />
      </View>
    </View>
  );
};

const BotonPaso: React.FC<{ icono: NombreIcono; onPress: () => void; etiqueta: string }> = ({
  icono,
  onPress,
  etiqueta,
}) => (
  <Pressable
    onPress={onPress}
    hitSlop={6}
    accessibilityRole="button"
    accessibilityLabel={etiqueta}
    style={({ pressed }) => [styles.boton, pressed && styles.presionado]}
  >
    <Icono nombre={icono} tamano={14} color={colors.textPrimary} peso="bold" />
  </Pressable>
);

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    padding: spacing.md,
  },
  cabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.sm,
  },
  titulo: {
    flex: 1,
    color: colors.textTertiary,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  valor: {
    color: colors.textPrimary,
    fontSize: 22,
    lineHeight: 28,
  },
  vacio: {
    color: colors.textTertiary,
  },
  unidad: {
    color: colors.textSecondary,
  },
  boton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.fillStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presionado: {
    opacity: 0.6,
  },
});
