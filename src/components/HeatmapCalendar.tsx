import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { isSameMonth, isToday } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, spacing, typography } from '@/theme';
import { getMoodColor, getMoodGlow } from '@/theme/colors';
import { shade } from '@/utils/color';
import { getMonthGrid, monthLabel, toISODate, weekdayLabels } from '@/utils/date';
import { EntriesByDate, Language } from '@/types/models';

interface Props {
  year: number;
  month: number; // 0-indexed
  entries: EntriesByDate;
  language: Language;
  onSelectDay: (iso: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onSelectYear: (year: number) => void;
}

export const HeatmapCalendar: React.FC<Props> = ({
  year,
  month,
  entries,
  language,
  onSelectDay,
  onPrevMonth,
  onNextMonth,
  onSelectYear,
}) => {
  const weeks = getMonthGrid(year, month);
  const monthDate = new Date(year, month, 1);
  const weekdays = weekdayLabels(language);
  const [showYearPicker, setShowYearPicker] = useState(false);

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 9 }, (_, i) => currentYear - 6 + i);

  return (
    <View>
      <View style={styles.header}>
        <Pressable onPress={onPrevMonth} hitSlop={10} style={styles.navButton}>
          <Text style={styles.navArrow}>‹</Text>
        </Pressable>
        <Pressable onPress={() => setShowYearPicker((v) => !v)} hitSlop={6}>
          <Text style={[typography.title, styles.monthLabel]}>
            {monthLabel(year, month, language)} ▾
          </Text>
        </Pressable>
        <Pressable onPress={onNextMonth} hitSlop={10} style={styles.navButton}>
          <Text style={styles.navArrow}>›</Text>
        </Pressable>
      </View>

      {showYearPicker && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.yearRow}
          contentContainerStyle={styles.yearRowContent}
        >
          {yearOptions.map((y) => (
            <Pressable
              key={y}
              onPress={() => {
                onSelectYear(y);
                setShowYearPicker(false);
              }}
              style={[styles.yearChip, y === year && styles.yearChipActive]}
            >
              <Text style={[typography.bodyMedium, y === year ? styles.yearTextActive : styles.yearText]}>
                {y}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      <View style={styles.weekdayRow}>
        {weekdays.map((w, i) => (
          <Text key={i} style={[typography.micro, styles.weekdayLabel]}>
            {w}
          </Text>
        ))}
      </View>

      {weeks.map((week, wi) => (
        <View key={wi} style={styles.week}>
          {week.map((day) => {
            const inMonth = isSameMonth(day, monthDate);
            const iso = toISODate(day);
            const entry = entries[iso];
            const hasEntry = Boolean(entry) && inMonth;
            const color = getMoodColor(entry?.mood);
            const glow = getMoodGlow(entry?.mood);
            const today = isToday(day);

            return (
              <Pressable
                key={iso}
                onPress={() => inMonth && onSelectDay(iso)}
                disabled={!inMonth}
                style={styles.dayCell}
              >
                <View
                  style={[
                    styles.dayDot,
                    !inMonth && { backgroundColor: 'transparent' },
                    hasEntry && {
                      shadowColor: glow,
                      shadowOpacity: 1,
                      shadowRadius: 9,
                      shadowOffset: { width: 0, height: 0 },
                      elevation: 4,
                    },
                    today && styles.todayRing,
                  ]}
                >
                  {hasEntry && (
                    <LinearGradient
                      colors={[shade(color, 0.3), color, shade(color, -0.3)]}
                      start={{ x: 0.2, y: 0 }}
                      end={{ x: 0.85, y: 1 }}
                      style={StyleSheet.absoluteFill}
                    />
                  )}
                  <Text
                    style={[
                      styles.dayNumber,
                      { color: inMonth ? colors.textSecondary : 'transparent' },
                      hasEntry ? styles.dayNumberOnColor : null,
                    ]}
                  >
                    {inMonth ? day.getDate() : ''}
                  </Text>
                </View>
                {entry?.favorite && inMonth && <Text style={styles.favoriteBadge}>⭐</Text>}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navArrow: {
    color: colors.textPrimary,
    fontSize: 20,
    marginTop: -2,
  },
  monthLabel: {
    color: colors.textPrimary,
    textTransform: 'capitalize',
  },
  yearRow: {
    marginBottom: spacing.md,
  },
  yearRowContent: {
    paddingHorizontal: 2,
  },
  yearChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
  },
  yearChipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  yearText: {
    color: colors.textSecondary,
  },
  yearTextActive: {
    color: colors.background,
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  weekdayLabel: {
    flex: 1,
    textAlign: 'center',
    color: colors.textTertiary,
  },
  week: {
    flexDirection: 'row',
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  dayDot: {
    width: '82%',
    height: '82%',
    borderRadius: 14,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  todayRing: {
    borderWidth: 1.5,
    borderColor: colors.accent,
  },
  dayNumber: {
    fontSize: 12,
    fontFamily: 'Manrope_600SemiBold',
  },
  dayNumberOnColor: {
    color: 'rgba(5,11,30,0.7)',
  },
  favoriteBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    fontSize: 9,
  },
});
