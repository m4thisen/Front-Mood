import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Icono } from './Icono';
import { iconoDeMarca } from './iconosDominio';
import { colors, radius, spacing, typography } from '@/tema';
import { PatronDevolucion } from '@/dominio';
import { useTranslation } from '@/i18n';

/**
 * Lo que suele acompañar a la persona: la frase de la IA y, al lado, sobre
 * cuántos días se vio (sale del cálculo del servidor, no de la IA). Es
 * correlación, no causa: así lo dicen las frases.
 */
export const PatronesDevolucion: React.FC<{ patrones: PatronDevolucion[] }> = ({ patrones }) => {
  const { t } = useTranslation();
  return (
    <View style={styles.tarjeta}>
      {patrones.map((patron, i) => {
        const suma = patron.efecto > 0;
        return (
          <React.Fragment key={patron.marca}>
            {i > 0 && <View style={styles.separador} />}
            <View style={styles.fila}>
              <View style={[styles.cuadroIcono, { backgroundColor: suma ? colors.success : colors.fillStrong }]}>
                <Icono nombre={iconoDeMarca(patron.marca)} tamano={15} color={suma ? '#FFFFFF' : colors.textSecondary} peso="semibold" />
              </View>
              <View style={styles.textos}>
                <Text style={[typography.bodyMedium, styles.texto]}>{patron.texto}</Text>
                <View style={styles.respaldo}>
                  <Icono nombre={suma ? 'subida' : 'bajada'} tamano={10} color={colors.textTertiary} peso="bold" />
                  <Text style={[typography.footnote, styles.dias]}>
                    {patron.dias === 1 ? t('howYouAre.seenOnDay') : t('howYouAre.seenOnDays').replace('{dias}', String(patron.dias))}
                  </Text>
                </View>
              </View>
            </View>
          </React.Fragment>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  tarjeta: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    paddingHorizontal: spacing.lg,
  },
  separador: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.separator,
    marginLeft: 28 + spacing.md,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  cuadroIcono: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textos: {
    flex: 1,
  },
  texto: {
    color: colors.textPrimary,
  },
  respaldo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  dias: {
    color: colors.textTertiary,
  },
});
