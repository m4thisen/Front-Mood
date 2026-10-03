import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icono, NombreIcono } from './Icono';
import { colors, spacing, typography } from '@/tema';

interface PropsPantalla {
  titulo: string;
  /** Línea chica arriba del título (por ejemplo, la fecha de hoy). */
  antetitulo?: string;
  accion?: { icono: NombreIcono; etiqueta: string; onPress: () => void };
}

/** Título grande de pantalla, al estilo "large title" de iOS. */
export const EncabezadoPantalla: React.FC<PropsPantalla> = ({ titulo, antetitulo, accion }) => (
  <View style={styles.pantalla}>
    <View style={styles.textos}>
      {antetitulo && <Text style={[typography.footnote, styles.antetitulo]}>{antetitulo}</Text>}
      <Text style={[typography.largeTitle, styles.titulo]}>{titulo}</Text>
    </View>
    {accion && <BotonIcono icono={accion.icono} etiqueta={accion.etiqueta} onPress={accion.onPress} />}
  </View>
);

interface PropsSeccion {
  titulo: string;
  accion?: { titulo: string; onPress: () => void };
}

/** Encabezado chico que separa secciones dentro de una pantalla. */
export const EncabezadoSeccion: React.FC<PropsSeccion> = ({ titulo, accion }) => (
  <View style={styles.seccion}>
    <Text style={[typography.seccion, styles.tituloSeccion]}>{titulo}</Text>
    {accion && (
      <Pressable onPress={accion.onPress} hitSlop={10}>
        <Text style={[typography.footnote, styles.accionSeccion]}>{accion.titulo}</Text>
      </Pressable>
    )}
  </View>
);

/** Botón redondo de solo ícono. Siempre lleva una etiqueta para lectores de pantalla. */
export const BotonIcono: React.FC<{
  icono: NombreIcono;
  etiqueta: string;
  onPress: () => void;
  tamano?: number;
}> = ({ icono, etiqueta, onPress, tamano = 36 }) => (
  <Pressable
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={etiqueta}
    hitSlop={8}
    style={({ pressed }) => [
      styles.botonIcono,
      { width: tamano, height: tamano, borderRadius: tamano / 2 },
      pressed && styles.presionado,
    ]}
  >
    <Icono nombre={icono} tamano={tamano * 0.42} color={colors.textSecondary} peso="semibold" />
  </Pressable>
);

const styles = StyleSheet.create({
  pantalla: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  textos: {
    flex: 1,
  },
  antetitulo: {
    color: colors.textTertiary,
    textTransform: 'capitalize',
    marginBottom: 2,
  },
  titulo: {
    color: colors.textPrimary,
  },
  seccion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  tituloSeccion: {
    color: colors.textTertiary,
  },
  accionSeccion: {
    color: colors.accent,
  },
  botonIcono: {
    backgroundColor: colors.fillStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presionado: {
    opacity: 0.6,
  },
});
