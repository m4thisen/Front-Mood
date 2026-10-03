import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { format, parseISO } from 'date-fns';
import { ScreenContainer } from '@/componentes/ScreenContainer';
import { Card } from '@/componentes/Card';
import { colors, radius, spacing, typography } from '@/tema';
import { useTranslation } from '@/i18n';
import { useApp } from '@/context/AppContext';
import { getMoodColor } from '@/tema/colors';
import { getOptionLabelKey } from '@/datos/catalogoBloques';
import { RootStackParamList } from '@/navegacion/tipos';
import { dateLocale } from '@/utils/fecha';

type Props = NativeStackScreenProps<RootStackParamList, 'DetalleDia'>;

export const DetalleDiaScreen: React.FC<Props> = ({ route, navigation }) => {
  const { date } = route.params;
  const { t, language } = useTranslation();
  const { entries } = useApp();
  const entry = entries[date];

  const dateLabel = format(parseISO(date), "EEEE d 'de' MMMM", { locale: dateLocale(language) });

  return (
    <ScreenContainer scroll contentStyle={styles.content}>
      <View style={styles.headerRow}>
        <View>
          <Text style={[typography.caption, styles.eyebrow]}>{date}</Text>
          <Text style={[typography.displayM, styles.dateLabel]}>{dateLabel}</Text>
        </View>
        <Pressable onPress={() => navigation.goBack()} style={styles.closeButton}>
          <Text style={styles.closeIcon}>✕</Text>
        </Pressable>
      </View>

      {!entry ? (
        <Card>
          <Text style={[typography.body, styles.emptyText]}>{t('dayDetail.noEntry')}</Text>
        </Card>
      ) : (
        <>
          <Card style={styles.moodCard} elevated>
            <View style={[styles.moodDot, { backgroundColor: getMoodColor(entry.mood) }]} />
            <View style={styles.moodInfo}>
              <Text style={[typography.caption, styles.moodEyebrow]}>{t('dayDetail.mood')}</Text>
              <Text style={[typography.title, styles.moodLabel]}>{t(`mood.${entry.mood}`)}</Text>
            </View>
            {entry.favorite && <Text style={styles.favoriteStar}>⭐</Text>}
          </Card>

          {entry.note ? (
            <Card style={styles.card}>
              <Text style={[typography.caption, styles.cardTitle]}>{t('dayDetail.note')}</Text>
              <Text style={[typography.body, styles.noteText]}>{entry.note}</Text>
            </Card>
          ) : null}

          {entry.selectedOptions.length > 0 && (
            <Card style={styles.card}>
              <Text style={[typography.caption, styles.cardTitle]}>{t('dayDetail.tags')}</Text>
              <View style={styles.tagsWrap}>
                {entry.selectedOptions.map((id) => (
                  <View key={id} style={styles.tagPill}>
                    <Text style={[typography.caption, styles.tagPillText]}>{t(getOptionLabelKey(id))}</Text>
                  </View>
                ))}
              </View>
            </Card>
          )}

          {(entry.song || entry.weather || entry.exerciseMinutes || entry.sleepHours) && (
            <Card style={styles.card}>
              {entry.song ? <DetailLine icon="🎧" label={entry.song} /> : null}
              {entry.weather ? <DetailLine icon="☁️" label={t(`weather.${entry.weather}`)} /> : null}
              {entry.exerciseMinutes ? (
                <DetailLine icon="⚡️" label={`${entry.exerciseMinutes} min`} />
              ) : null}
              {entry.sleepHours ? <DetailLine icon="💤" label={`${entry.sleepHours} h`} /> : null}
            </Card>
          )}
        </>
      )}
    </ScreenContainer>
  );
};

const DetailLine: React.FC<{ icon: string; label: string }> = ({ icon, label }) => (
  <View style={styles.detailLine}>
    <Text style={styles.detailIcon}>{icon}</Text>
    <Text style={[typography.body, styles.detailLabel]}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  content: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xl,
  },
  eyebrow: {
    color: colors.textTertiary,
  },
  dateLabel: {
    color: colors.textPrimary,
    textTransform: 'capitalize',
    marginTop: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    color: colors.textSecondary,
    fontSize: 15,
  },
  emptyText: {
    color: colors.textSecondary,
  },
  moodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  favoriteStar: {
    fontSize: 20,
    marginLeft: 'auto',
  },
  moodDot: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  moodInfo: {
    marginLeft: spacing.md,
  },
  moodEyebrow: {
    color: colors.textTertiary,
    textTransform: 'uppercase',
  },
  moodLabel: {
    color: colors.textPrimary,
  },
  card: {
    marginBottom: spacing.md,
  },
  cardTitle: {
    color: colors.textTertiary,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  noteText: {
    color: colors.textPrimary,
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tagPill: {
    backgroundColor: colors.surfaceElevatedAlt,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  tagPillText: {
    color: colors.textPrimary,
  },
  detailLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  detailIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  detailLabel: {
    color: colors.textPrimary,
  },
});
