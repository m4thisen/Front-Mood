import React, { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ScreenContainer } from '@/components/ScreenContainer';
import { Card } from '@/components/Card';
import { GlowButton } from '@/components/GlowButton';
import { MoodScale } from '@/components/MoodScale';
import { BlockChip } from '@/components/BlockChip';
import { colors, spacing, typography, TAB_BAR_CLEARANCE } from '@/theme';
import { useTranslation } from '@/i18n';
import { useApp } from '@/context/AppContext';
import { BLOCK_CATEGORIES, SPECIAL_BLOCKS } from '@/data/blocks';
import { DayEntry, MoodLevel, WeatherOption } from '@/types/models';
import { todayISO } from '@/utils/date';
import { AccordionSection } from '@/components/AccordionSection';

const WEATHER_OPTIONS: { key: WeatherOption; icon: string }[] = [
  { key: 'soleado', icon: '☀️' },
  { key: 'nublado', icon: '☁️' },
  { key: 'lluvia', icon: '🌧️' },
  { key: 'frio', icon: '❄️' },
  { key: 'calor', icon: '🔥' },
];

export const TodayEntryScreen: React.FC = () => {
  const { t } = useTranslation();
  const { profile, todayEntry, saveEntry } = useApp();
  const navigation = useNavigation<any>();

  const selectedCategories = useMemo(
    () => BLOCK_CATEGORIES.filter((c) => profile?.selectedBlocks.includes(c.key)),
    [profile]
  );
  const selectedSpecial = useMemo(
    () => SPECIAL_BLOCKS.filter((b) => profile?.selectedSpecialBlocks.includes(b.key)),
    [profile]
  );

  const [mood, setMood] = useState<MoodLevel | null>(todayEntry?.mood ?? null);
  const [note, setNote] = useState(todayEntry?.note ?? '');
  const [selectedOptions, setSelectedOptions] = useState<Set<string>>(
    new Set(todayEntry?.selectedOptions ?? [])
  );
  const [customValues, setCustomValues] = useState<Record<string, boolean | string>>(
    todayEntry?.customTagValues ?? {}
  );
  const [song, setSong] = useState(todayEntry?.song ?? '');
  const [weather, setWeather] = useState<WeatherOption | undefined>(todayEntry?.weather);
  const [exerciseMinutes, setExerciseMinutes] = useState(
    todayEntry?.exerciseMinutes?.toString() ?? ''
  );
  const [sleepHours, setSleepHours] = useState(todayEntry?.sleepHours?.toString() ?? '');
  const [favorite, setFavorite] = useState(todayEntry?.favorite ?? false);
  const [savedFlash, setSavedFlash] = useState(false);

  const toggleOption = (id: string) => {
    setSelectedOptions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleBooleanTag = (id: string) => {
    setCustomValues((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSave = async () => {
    if (!mood) return;
    const entry: DayEntry = {
      date: todayISO(),
      mood,
      note,
      loggedAtHour: new Date().getHours(),
      selectedOptions: Array.from(selectedOptions),
      customTagValues: customValues,
      song: song || undefined,
      weather,
      exerciseMinutes: exerciseMinutes ? Number(exerciseMinutes) : undefined,
      sleepHours: sleepHours ? Number(sleepHours) : undefined,
      favorite,
    };
    await saveEntry(entry);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2200);
    Alert.alert(t('today.savedPopupTitle'), t('today.savedPopupBody'), [
      { text: t('today.savedPopupCta'), onPress: () => navigation.navigate('Calendar') },
    ]);
  };

  return (
    <ScreenContainer scroll contentStyle={styles.content}>
      <Text style={[typography.displayM, styles.header]}>{t('today.title')}</Text>
      {todayEntry && <Text style={[typography.caption, styles.alreadyLogged]}>{t('today.alreadyLogged')}</Text>}

      <Card style={styles.card}>
        <Text style={[typography.subtitle, styles.cardTitle]}>{t('today.moodQuestion')}</Text>
        <View style={styles.moodWrapper}>
          <MoodScale value={mood} onChange={setMood} />
        </View>
        <Pressable onPress={() => setFavorite((f) => !f)} style={styles.favoriteToggle}>
          <Text style={[typography.bodyMedium, favorite ? styles.favoriteOn : styles.favoriteOff]}>
            {favorite ? t('today.favoriteToggleOn') : t('today.favoriteToggle')}
          </Text>
        </Pressable>
      </Card>

      <Card style={styles.card}>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder={t('today.notePlaceholder')}
          placeholderTextColor={colors.textTertiary}
          multiline
          style={styles.noteInput}
        />
      </Card>

            {selectedCategories.length > 0 && (
        <Card style={styles.card}>
          <Text style={[typography.subtitle, styles.cardTitle]}>{t('today.tagsTitle')}</Text>
          {selectedCategories.map((category, i) => (
            <AccordionSection
              key={category.key}
              title={t(category.titleKey)}
              icon={category.icon}
              defaultOpen={i === 0}
            >
              <View style={styles.chipsRow}>
                {category.options.map((option) => (
                  <BlockChip
                    key={option.id}
                    label={t(option.labelKey)}
                    selected={selectedOptions.has(option.id)}
                    onPress={() => toggleOption(option.id)}
                  />
                ))}
              </View>
            </AccordionSection>
          ))}
        </Card>
      )}

      {selectedSpecial.map((block) => {
        if (block.key === 'musica') {
          return (
            <Card key={block.key} style={styles.card}>
              <Text style={[typography.subtitle, styles.cardTitle]}>
                {block.icon} {t('today.songLabel')}
              </Text>
              <TextInput
                value={song}
                onChangeText={setSong}
                placeholder={t('today.songPlaceholder')}
                placeholderTextColor={colors.textTertiary}
                style={[styles.textInput, { marginTop: spacing.sm }]}
              />
            </Card>
          );
        }
        if (block.key === 'clima') {
          return (
            <Card key={block.key} style={styles.card}>
              <Text style={[typography.subtitle, styles.cardTitle]}>
                {block.icon} {t('today.weatherLabel')}
              </Text>
              <View style={[styles.chipsRow, { marginTop: spacing.sm }]}>
                {WEATHER_OPTIONS.map((w) => (
                  <BlockChip
                    key={w.key}
                    icon={w.icon}
                    label={t(`weather.${w.key}`)}
                    selected={weather === w.key}
                    onPress={() => setWeather(w.key)}
                  />
                ))}
              </View>
            </Card>
          );
        }
        if (block.key === 'ejercicio') {
          return (
            <Card key={block.key} style={styles.card}>
              <Text style={[typography.subtitle, styles.cardTitle]}>
                {block.icon} {t('today.exerciseLabel')}
              </Text>
              <TextInput
                value={exerciseMinutes}
                onChangeText={setExerciseMinutes}
                keyboardType="number-pad"
                placeholder="30"
                placeholderTextColor={colors.textTertiary}
                style={[styles.textInput, { marginTop: spacing.sm }]}
              />
            </Card>
          );
        }
        if (block.key === 'sueno') {
          return (
            <Card key={block.key} style={styles.card}>
              <Text style={[typography.subtitle, styles.cardTitle]}>
                {block.icon} {t('today.sleepLabel')}
              </Text>
              <TextInput
                value={sleepHours}
                onChangeText={setSleepHours}
                keyboardType="decimal-pad"
                placeholder="8"
                placeholderTextColor={colors.textTertiary}
                style={[styles.textInput, { marginTop: spacing.sm }]}
              />
            </Card>
          );
        }
        return null;
      })}

      {(profile?.customTags.length ?? 0) > 0 && (
        <Card style={styles.card}>
          <View style={styles.chipsRow}>
            {profile?.customTags.map((tag) =>
              tag.type === 'boolean' ? (
                <BlockChip
                  key={tag.id}
                  label={tag.label}
                  selected={Boolean(customValues[tag.id])}
                  onPress={() => toggleBooleanTag(tag.id)}
                />
              ) : (
                <View key={tag.id} style={styles.customTextField}>
                  <Text style={[typography.caption, styles.categoryLabel]}>{tag.label}</Text>
                  <TextInput
                    value={(customValues[tag.id] as string) ?? ''}
                    onChangeText={(val) => setCustomValues((prev) => ({ ...prev, [tag.id]: val }))}
                    placeholderTextColor={colors.textTertiary}
                    style={styles.textInput}
                  />
                </View>
              )
            )}
          </View>
        </Card>
      )}

      <GlowButton
        label={savedFlash ? t('today.savedToast') : t('today.saveEntry')}
        onPress={handleSave}
        disabled={!mood}
        style={styles.saveButton}
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
  },
  alreadyLogged: {
    color: colors.accent,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  card: {
    marginTop: spacing.lg,
  },
  cardTitle: {
    color: colors.textPrimary,
  },
  moodWrapper: {
    marginTop: spacing.lg,
  },
  favoriteToggle: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  favoriteOff: {
    color: colors.textTertiary,
  },
  favoriteOn: {
    color: colors.gold,
  },
  noteInput: {
    color: colors.textPrimary,
    fontFamily: 'Manrope_400Regular',
    fontSize: 15,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  categoryBlock: {
    marginTop: spacing.md,
  },
  categoryLabel: {
    color: colors.textTertiary,
    marginBottom: spacing.xs,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  textInput: {
    backgroundColor: colors.surfaceElevatedAlt,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    color: colors.textPrimary,
    fontFamily: 'Manrope_500Medium',
    fontSize: 14,
  },
  customTextField: {
    width: '100%',
    marginBottom: spacing.sm,
  },
  saveButton: {
    marginTop: spacing.xl,
  },
});
