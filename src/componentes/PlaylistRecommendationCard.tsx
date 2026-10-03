import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from './Card';
import { colors, radius, spacing, typography } from '@/tema';
import { shade } from '@/utils/color';
import { useTranslation } from '@/i18n';
import { useApp } from '@/context/AppContext';
import { generateRecommendedPlaylists } from '@/api/simulado/devolucionesSimuladas';

const COVER_SIZE = 116;
const NOTE_ICONS = ['🎵', '🎧', '🎶', '🎼'];

/**
 * Playlists sugeridas según el ánimo reciente, en carrusel horizontal con
 * "portada" generada (degradé del color del mood + ícono) — mock hasta que
 * se conecte la API real de Spotify, pero ya se ve como una feature real.
 */
export const PlaylistRecommendationCard: React.FC = () => {
  const { t, language } = useTranslation();
  const { entries, soulColor } = useApp();

  const playlists = useMemo(() => generateRecommendedPlaylists(entries, language), [entries, language]);
  const baseColor = soulColor ?? colors.accent;

  return (
    <Card style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={[typography.subtitle, styles.title]}>🎧 {t('ai.playlistsTitle')}</Text>
        <View style={styles.badge}>
          <Text style={[typography.micro, styles.badgeText]}>{t('ai.playlistsBadge')}</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.carousel}
      >
        {playlists.map((playlist, i) => {
          const tint = shade(baseColor, (i % 2 === 0 ? 1 : -1) * (0.1 + i * 0.08));
          return (
            <View key={i} style={styles.item}>
              <LinearGradient
                colors={[shade(tint, 0.25), tint, shade(tint, -0.35)]}
                start={{ x: 0.15, y: 0 }}
                end={{ x: 0.9, y: 1 }}
                style={styles.cover}
              >
                <Text style={styles.coverIcon}>{NOTE_ICONS[i % NOTE_ICONS.length]}</Text>
              </LinearGradient>
              <Text style={[typography.bodyMedium, styles.itemTitle]} numberOfLines={1}>
                {playlist.title}
              </Text>
              <Text style={[typography.caption, styles.itemSubtitle]} numberOfLines={2}>
                {playlist.subtitle}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
    paddingHorizontal: 0,
    paddingVertical: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  title: {
    color: colors.textPrimary,
  },
  badge: {
    backgroundColor: colors.surfaceElevatedAlt,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  badgeText: {
    color: colors.textTertiary,
  },
  carousel: {
    paddingHorizontal: spacing.lg,
  },
  item: {
    width: COVER_SIZE,
    marginRight: spacing.md,
  },
  cover: {
    width: COVER_SIZE,
    height: COVER_SIZE,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  coverIcon: {
    fontSize: 34,
  },
  itemTitle: {
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  itemSubtitle: {
    color: colors.textTertiary,
    marginTop: 2,
  },
});
