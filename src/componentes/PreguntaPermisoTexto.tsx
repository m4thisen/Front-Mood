import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';
import { Boton } from './Boton';
import { Icono } from './Icono';
import { colors, radius, spacing, typography } from '@/tema';
import { useTranslation } from '@/i18n';

/**
 * Debajo del texto del día, la primera vez que la persona escribe: le pregunta
 * si la IA puede leerlo. No interrumpe (no es una ventana) y aparece una sola
 * vez; después se cambia en Mi cuenta. El permiso nunca se da solo. La
 * explicación (privacy.explanation) dice qué se manda, para qué y cómo se
 * retira; es la misma que se ve en Mi cuenta.
 */
export const PreguntaPermisoTexto: React.FC<{ onResponder: (permitido: boolean) => void }> = ({ onResponder }) => {
  const { t } = useTranslation();
  return (
    <Animated.View entering={FadeInDown.duration(300)} exiting={FadeOut.duration(200)} style={styles.tarjeta}>
      <View style={styles.cabecera}>
        <Icono nombre="ia" tamano={16} color={colors.accentStrong} peso="semibold" />
        <Text style={[typography.bodyMedium, styles.titulo]}>{t('privacy.askTitle')}</Text>
      </View>
      <Text style={[typography.footnote, styles.explicacion]}>{t('privacy.explanation')}</Text>
      <Text style={[typography.footnote, styles.nota]}>{t('privacy.changeLater')}</Text>
      <View style={styles.botones}>
        <Boton titulo={t('common.notNow')} variante="secundario" onPress={() => onResponder(false)} style={styles.boton} />
        <Boton titulo={t('common.turnOn')} onPress={() => onResponder(true)} style={styles.boton} />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  tarjeta: {
    marginTop: spacing.md,
    padding: spacing.lg,
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
  },
  cabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  titulo: {
    flex: 1,
    color: colors.textPrimary,
  },
  explicacion: {
    color: colors.textSecondary,
  },
  nota: {
    color: colors.textTertiary,
  },
  botones: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  boton: {
    flex: 1,
  },
});
