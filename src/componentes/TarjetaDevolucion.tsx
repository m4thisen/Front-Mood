import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Icono } from './Icono';
import { colors, radius, spacing, typography } from '@/tema';
import { Devolucion } from '@/dominio';

interface Props {
  devolucion: Devolucion;
  /** Cuándo es: "Hoy", "Del jueves 29", "Del lunes 19 al domingo 25". */
  cuando: string;
}

/**
 * Una devolución de "Cómo venís" (CU-21): lo que escribió la IA a partir de
 * lo que calculó el servidor. Lo que viene mañana y la sugerencia van
 * aparte, para que se lean de un vistazo.
 */
export const TarjetaDevolucion: React.FC<Props> = ({ devolucion, cuando }) => (
  <View style={styles.tarjeta}>
    <View style={styles.cabecera}>
      <View style={styles.cuadroIcono}>
        <Icono nombre="ia" tamano={16} color={colors.accentStrong} peso="semibold" />
      </View>
      <Text style={[typography.footnote, styles.cuando]}>{cuando}</Text>
    </View>
    <Text style={[typography.headline, styles.titulo]}>{devolucion.titulo}</Text>
    <Text style={[typography.body, styles.resumen]}>{devolucion.resumen}</Text>

    {devolucion.manana && (
      <View style={styles.aparte}>
        <Icono nombre="franjaManana" tamano={16} color={colors.textSecondary} />
        <Text style={[typography.bodyMedium, styles.textoAparte]}>{devolucion.manana}</Text>
      </View>
    )}
    <View style={[styles.aparte, styles.sugerencia]}>
      <Icono nombre="sugerencia" tamano={16} color={colors.accentStrong} relleno />
      <Text style={[typography.bodyMedium, styles.textoAparte]}>{devolucion.sugerencia}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  tarjeta: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    padding: spacing.lg,
  },
  cabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  cuadroIcono: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cuando: {
    flex: 1,
    color: colors.textTertiary,
  },
  titulo: {
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  resumen: {
    color: colors.textPrimary,
    fontSize: 16,
    lineHeight: 24,
  },
  aparte: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.fill,
  },
  sugerencia: {
    backgroundColor: colors.accentSoft,
  },
  textoAparte: {
    flex: 1,
    color: colors.textPrimary,
  },
});
