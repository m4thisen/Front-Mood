import React from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Icono } from './Icono';
import { colors, radius, spacing, typography } from '@/tema';
import { MensajeCuidado } from '@/dominio';
import { useTranslation } from '@/i18n';

/**
 * El mensaje de cuidado: va en lugar de la devolución cuando lo que escribió
 * la persona hoy tiene señales claras de riesgo. Lo escribió el equipo (no la
 * IA) y llega del servidor, con los teléfonos verificados. Cada línea se
 * llama con un toque.
 */
export const TarjetaCuidado: React.FC<{ cuidado: MensajeCuidado }> = ({ cuidado }) => {
  const { t } = useTranslation();
  return (
    <View style={styles.tarjeta}>
      <View style={styles.cuadroIcono}>
        <Icono nombre="cuidado" tamano={22} color={colors.accentStrong} relleno />
      </View>
      <Text style={[typography.title, styles.titulo]}>{cuidado.titulo}</Text>
      <Text style={[typography.body, styles.mensaje]}>{cuidado.mensaje}</Text>

      <View style={styles.lineas}>
        {cuidado.lineas.map((linea, i) => (
          <Pressable
            key={linea.marcar}
            onPress={() => void Linking.openURL(`tel:${linea.marcar}`)}
            style={({ pressed }) => [styles.linea, i > 0 && styles.separador, pressed && styles.presionada]}
            accessibilityRole="button"
            accessibilityLabel={t('care.call').replace('{numero}', linea.numero).replace('{nombre}', linea.nombre)}
          >
            <View style={styles.cuadroTelefono}>
              <Icono nombre="telefono" tamano={15} color="#FFFFFF" relleno />
            </View>
            <View style={styles.datos}>
              <Text style={[typography.bodyMedium, styles.numero]}>
                {linea.numero} <Text style={styles.nombre}>· {linea.nombre}</Text>
              </Text>
              <Text style={[typography.footnote, styles.detalle]}>{linea.detalle}</Text>
            </View>
          </Pressable>
        ))}
      </View>

      <Text style={[typography.footnote, styles.aclaracion]}>{cuidado.aclaracion}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  tarjeta: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    padding: spacing.lg,
  },
  cuadroIcono: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  titulo: {
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  mensaje: {
    color: colors.textPrimary,
    fontSize: 16,
    lineHeight: 24,
  },
  lineas: {
    marginTop: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.fill,
    overflow: 'hidden',
  },
  linea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  separador: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.separator,
  },
  presionada: {
    backgroundColor: colors.fillStrong,
  },
  cuadroTelefono: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  datos: {
    flex: 1,
  },
  numero: {
    color: colors.textPrimary,
  },
  nombre: {
    color: colors.textSecondary,
  },
  detalle: {
    color: colors.textTertiary,
    marginTop: 1,
  },
  aclaracion: {
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
});
