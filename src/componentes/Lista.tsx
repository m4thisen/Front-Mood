import React from 'react';
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Icono, NombreIcono } from './Icono';
import { colors, radius, spacing, typography } from '@/tema';

/**
 * Lista agrupada al estilo de Ajustes de iOS: filas dentro de una tarjeta,
 * separadas por una línea fina que empieza después del ícono.
 */
export const GrupoLista: React.FC<{ children: React.ReactNode; style?: StyleProp<ViewStyle> }> = ({
  children,
  style,
}) => {
  const filas = React.Children.toArray(children).filter(Boolean);
  return (
    <View style={[styles.grupo, style]}>
      {filas.map((fila, i) => (
        <React.Fragment key={i}>
          {i > 0 && <View style={styles.separador} />}
          {fila}
        </React.Fragment>
      ))}
    </View>
  );
};

interface PropsFila {
  titulo: string;
  icono?: NombreIcono;
  /** Color del cuadradito del ícono. */
  colorIcono?: string;
  valor?: string;
  onPress?: () => void;
  destructiva?: boolean;
  /** Contenido a la derecha en lugar del valor (un switch, un selector…). */
  accesorio?: React.ReactNode;
}

export const FilaLista: React.FC<PropsFila> = ({
  titulo,
  icono,
  colorIcono = colors.accent,
  valor,
  onPress,
  destructiva = false,
  accesorio,
}) => {
  const contenido = (
    <>
      {icono && (
        <View style={[styles.cuadroIcono, { backgroundColor: destructiva ? colors.danger : colorIcono }]}>
          <Icono nombre={icono} tamano={15} color="#FFFFFF" peso="semibold" />
        </View>
      )}
      <Text style={[typography.bodyMedium, styles.titulo, destructiva && styles.tituloDestructivo]} numberOfLines={1}>
        {titulo}
      </Text>
      {accesorio ?? (valor ? <Text style={[typography.bodyMedium, styles.valor]} numberOfLines={1}>{valor}</Text> : null)}
      {onPress && !destructiva && <Icono nombre="adelante" tamano={13} color={colors.textTertiary} peso="semibold" />}
    </>
  );

  if (!onPress) return <View style={styles.fila}>{contenido}</View>;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.fila, pressed && styles.presionada]}
    >
      {contenido}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  grupo: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    overflow: 'hidden',
  },
  separador: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.separator,
    marginLeft: spacing.lg + 28 + spacing.md,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  presionada: {
    backgroundColor: colors.fill,
  },
  cuadroIcono: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: {
    flex: 1,
    color: colors.textPrimary,
  },
  tituloDestructivo: {
    color: colors.danger,
  },
  valor: {
    color: colors.textTertiary,
    maxWidth: '50%',
  },
});
