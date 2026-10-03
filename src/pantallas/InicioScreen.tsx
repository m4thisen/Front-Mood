import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ScreenContainer } from '@/componentes/ScreenContainer';
import { HeatmapCalendar } from '@/componentes/HeatmapCalendar';
import { SoulOrb } from '@/componentes/SoulOrb';
import { Card } from '@/componentes/Card';
import { AiSummaryCard } from '@/componentes/AiSummaryCard';
import { PlaylistRecommendationCard } from '@/componentes/PlaylistRecommendationCard';
import { HabitRecommendationCard } from '@/componentes/HabitRecommendationCard';
import { colors, spacing, typography, TAB_BAR_CLEARANCE } from '@/tema';
import { useTranslation } from '@/i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CoachMark } from '@/componentes/CoachMark';
import { useApp } from '@/context/AppContext';

export const InicioScreen: React.FC = () => {
  const { t, language } = useTranslation();
  const { entries, streak, soulColor } = useApp();
  const navigation = useNavigation<any>();

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [showCoachMark, setShowCoachMark] = useState(false);

  React.useEffect(() => {
    AsyncStorage.getItem('@mood/coachmark-today-seen').then((seen) => {
      if (!seen) setShowCoachMark(true);
    });
  }, []);

  const dismissCoachMark = () => {
    setShowCoachMark(false);
    AsyncStorage.setItem('@mood/coachmark-today-seen', '1');
  };

  const goPrev = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  };
  const goNext = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
  };

  return (
    <ScreenContainer scroll contentStyle={styles.content}>
      <Text style={[typography.displayM, styles.header]}>{t('calendar.title')}</Text>

      <Card style={styles.soulCard} elevated>
        <SoulOrb color={soulColor} size={84} />
        <View style={styles.soulInfo}>
          <Text style={[typography.caption, styles.soulLabel]}>{t('calendar.soulColor')}</Text>
          <View style={styles.streakRow}>
            <Text style={styles.streakFlame}>🔥</Text>
            <Text style={[typography.title, styles.streakNumber]}>{streak}</Text>
            <Text style={[typography.caption, styles.streakLabel]}>{t('calendar.streakDays')}</Text>
          </View>
        </View>
      </Card>

      <Card style={styles.calendarCard}>
        <HeatmapCalendar
          year={year}
          month={month}
          entries={entries}
          language={language}
          onSelectDay={(date) => navigation.navigate('DetalleDia', { date })}
          onPrevMonth={goPrev}
          onNextMonth={goNext}
          onSelectYear={setYear}
        />
      </Card>

      <AiSummaryCard />
      <PlaylistRecommendationCard />
      <HabitRecommendationCard />
      <CoachMark
        message={t('coach.todayStep')}
        step="1/1"
        visible={showCoachMark}
        onDismiss={dismissCoachMark}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingTop: spacing.lg,
    paddingBottom: TAB_BAR_CLEARANCE,
  },
  header: {
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  soulCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  soulInfo: {
    marginLeft: spacing.lg,
    flex: 1,
  },
  soulLabel: {
    color: colors.textTertiary,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakFlame: {
    fontSize: 16,
    marginRight: 6,
  },
  streakNumber: {
    color: colors.textPrimary,
    marginRight: 6,
  },
  streakLabel: {
    color: colors.textSecondary,
  },
  calendarCard: {
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.md,
  },
});
