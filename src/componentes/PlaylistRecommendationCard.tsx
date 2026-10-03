import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Icono } from './Icono';
import { colors, radius, spacing, typography } from '@/tema';
import { shade } from '@/utils/color';
import { useTranslation } from '@/i18n';
import { useIndicadoresProgreso, useListaRegistros } from '@/stores/RegistroStore';
import { generateRecommendedPlaylists } from '@/api/simulado/devolucionesSimuladas';

const TAMANO_PORTADA = 136;

/**
 * Música para tu momento (RF-24), en carrusel horizontal. Las portadas se
 * generan con el Color del Alma hasta que, en la iteración 5, lleguen las
 * canciones reales resueltas en Spotify.
 */
export const PlaylistRecommendationCard: React.FC = () => {
  const { language } = useTranslation();
  const registros = useListaRegistros();
  const { colorDelAlma } = useIndicadoresProgreso();

  const sugerencias = useMemo(() => generateRecommendedPlaylists(registros, language), [registros, language]);
  const base = colorDelAlma ?? colors.accent;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.carrusel}
      style={styles.desborde}
    >
      {sugerencias.map((sugerencia, i) => {
        const tono = shade(base, (i % 2 === 0 ? 1 : -1) * (0.08 + i * 0.07));
        return (
          <View key={sugerencia.title} style={styles.item}>
            <LinearGradient
              colors={[shade(tono, 0.3), tono, shade(tono, -0.4)]}
              start={{ x: 0.1, y: 0 }}
              end={{ x: 0.9, y: 1 }}
              style={styles.portada}
            >
              <Icono nombre="musica" tamano={30} color="rgba(255,255,255,0.92)" peso="semibold" />
            </LinearGradient>
            <Text style={[typography.bodyMedium, styles.titulo]} numberOfLines={1}>
              {sugerencia.title}
            </Text>
            <Text style={[typography.footnote, styles.subtitulo]} numberOfLines={2}>
              {sugerencia.subtitle}
            </Text>
          </View>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  // El carrusel llega hasta los bordes de la pantalla, como en Apple Music.
  desborde: {
    marginHorizontal: -spacing.xl,
  },
  carrusel: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  item: {
    width: TAMANO_PORTADA,
  },
  portada: {
    width: TAMANO_PORTADA,
    height: TAMANO_PORTADA,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  titulo: {
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  subtitulo: {
    color: colors.textTertiary,
    marginTop: 1,
  },
});
