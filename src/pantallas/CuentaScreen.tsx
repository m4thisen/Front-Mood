import React, { useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { ScreenContainer } from '@/componentes/ScreenContainer';
import { Card } from '@/componentes/Card';
import { GlowButton } from '@/componentes/GlowButton';
import { BlockChip } from '@/componentes/BlockChip';
import { colors, radius, spacing, typography, TAB_BAR_CLEARANCE } from '@/tema';
import { useTranslation } from '@/i18n';
import { useApp } from '@/context/AppContext';
import { exportEntriesAsCsv, exportEntriesAsPdf } from '@/servicios/ExportService';
import { scheduleDailyReminder } from '@/servicios/NotificacionService';
import { CustomTag } from '@/types/models';

const buildTime = (hour: number, minute: number): Date => {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d;
};

export const CuentaScreen: React.FC = () => {
  const { t, language, setLanguage } = useTranslation();
  const { profile, entries, streak, updateProfile, addCustomTag, removeCustomTag, logout } = useApp();
  const navigation = useNavigation<any>();

  const [newTagLabel, setNewTagLabel] = useState('');
  const [newTagType, setNewTagType] = useState<'boolean' | 'text'>('boolean');

  const [showTimePicker, setShowTimePicker] = useState(false);
  const [draftTime, setDraftTime] = useState(
    buildTime(profile?.notificationHour ?? 21, profile?.notificationMinute ?? 0)
  );

  const totalEntries = Object.keys(entries).length;
  const pad = (n: number) => n.toString().padStart(2, '0');

  const changeLanguage = (lang: 'es' | 'en') => {
    setLanguage(lang);
    updateProfile({ language: lang });
  };

  const handleAddTag = () => {
    const label = newTagLabel.trim();
    if (!label) return;
    const tag: CustomTag = { id: `custom.${Date.now()}`, label, type: newTagType };
    addCustomTag(tag);
    setNewTagLabel('');
  };

  const handleExportCsv = () => exportEntriesAsCsv(entries);
  const handleExportPdf = () => exportEntriesAsPdf(entries, profile);

  const openTimeEditor = () => {
    setDraftTime(buildTime(profile?.notificationHour ?? 21, profile?.notificationMinute ?? 0));
    setShowTimePicker(true);
  };

  const handleTimeChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setShowTimePicker(false);
    if (event.type === 'dismissed') return;
    if (selected) setDraftTime(selected);
  };

  const handleSaveTime = async () => {
    const hour = draftTime.getHours();
    const minute = draftTime.getMinutes();
    updateProfile({ notificationHour: hour, notificationMinute: minute });
    await scheduleDailyReminder(hour, minute, t('appName'), t('welcome.description'));
    setShowTimePicker(false);
  };

  const handleLogout = () => {
    Alert.alert(t('account.logout'), undefined, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('account.logout'),
        style: 'destructive',
        onPress: async () => {
          await logout();
          navigation.reset({ index: 0, routes: [{ name: 'Bienvenida' }] });
        },
      },
    ]);
  };

  return (
    <ScreenContainer scroll contentStyle={styles.content}>
      <Text style={[typography.displayM, styles.header]}>{t('account.title')}</Text>

      <Card style={styles.profileCard} elevated>
        <View style={styles.profileRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarInitial}>{profile?.name?.[0]?.toUpperCase() ?? '?'}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[typography.title, styles.name]}>{profile?.name}</Text>
          </View>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[typography.title, styles.statValue]}>{streak}</Text>
            <Text style={[typography.caption, styles.statLabel]}>{t('account.streak')}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[typography.title, styles.statValue]}>{totalEntries}</Text>
            <Text style={[typography.caption, styles.statLabel]}>{t('account.totalEntries')}</Text>
          </View>
        </View>
      </Card>

      <Card style={styles.card}>
        <Text style={[typography.subtitle, styles.cardTitle]}>{t('account.language')}</Text>
        <View style={styles.chipsRow}>
          {(['es', 'en'] as const).map((lang) => (
            <BlockChip
              key={lang}
              label={lang === 'es' ? 'Español' : 'English'}
              selected={language === lang}
              onPress={() => changeLanguage(lang)}
            />
          ))}
        </View>
      </Card>

      <Card style={styles.card}>
        <View style={styles.notificationHeader}>
          <Text style={[typography.subtitle, styles.cardTitle]}>{t('account.notificationTime')}</Text>
          {!showTimePicker && (
            <Pressable onPress={openTimeEditor}>
              <Text style={[typography.bodyMedium, styles.editLink]}>
                {t('account.editNotificationTime')}
              </Text>
            </Pressable>
          )}
        </View>

        {!showTimePicker ? (
          <Text style={[typography.displayM, styles.notificationTime]}>
            {pad(profile?.notificationHour ?? 21)}:{pad(profile?.notificationMinute ?? 0)}
          </Text>
        ) : (
          <View>
            <View style={styles.pickerCard}>
              <DateTimePicker
                value={draftTime}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleTimeChange}
                themeVariant="dark"
                is24Hour
              />
            </View>
            <GlowButton
              label={t('account.saveNotificationTime')}
              onPress={handleSaveTime}
              variant="secondary"
              style={{ marginTop: spacing.sm }}
            />
          </View>
        )}
      </Card>

      <Card style={styles.card}>
        <Text style={[typography.subtitle, styles.cardTitle]}>{t('account.customTags')}</Text>
        <View style={styles.chipsRow}>
          {profile?.customTags.map((tag) => (
            <Pressable key={tag.id} onPress={() => removeCustomTag(tag.id)} style={styles.removableTag}>
              <Text style={[typography.bodyMedium, styles.removableTagText]}>{tag.label} ✕</Text>
            </Pressable>
          ))}
        </View>
        <TextInput
          value={newTagLabel}
          onChangeText={setNewTagLabel}
          placeholder={t('account.newTagPlaceholder')}
          placeholderTextColor={colors.textTertiary}
          style={styles.tagInput}
        />
        <View style={styles.tagTypeRow}>
          <BlockChip
            label="Sí / No"
            selected={newTagType === 'boolean'}
            onPress={() => setNewTagType('boolean')}
          />
          <BlockChip label="Texto" selected={newTagType === 'text'} onPress={() => setNewTagType('text')} />
        </View>
        <GlowButton label={t('account.addCustomTag')} onPress={handleAddTag} variant="secondary" />
      </Card>

      <Card style={styles.card}>
        <Text style={[typography.subtitle, styles.cardTitle]}>{t('account.exportData')}</Text>
        <Text style={[typography.caption, styles.cardDesc]}>{t('account.exportDataDesc')}</Text>
        <View style={styles.exportRow}>
          <GlowButton
            label={t('account.exportCsv')}
            onPress={handleExportCsv}
            variant="secondary"
            style={styles.exportButton}
          />
          <GlowButton
            label={t('account.exportPdf')}
            onPress={handleExportPdf}
            variant="secondary"
            style={styles.exportButton}
          />
        </View>
      </Card>

      <GlowButton label={t('account.logout')} onPress={handleLogout} variant="ghost" />
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
  profileCard: {
    marginBottom: spacing.md,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.accent,
  },
  avatarInitial: {
    color: colors.accent,
    fontFamily: 'Manrope_700Bold',
    fontSize: 20,
  },
  profileInfo: {
    marginLeft: spacing.md,
  },
  name: {
    color: colors.textPrimary,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    color: colors.accent,
  },
  statLabel: {
    color: colors.textSecondary,
    marginTop: 2,
  },
  card: {
    marginBottom: spacing.md,
  },
  cardTitle: {
    color: colors.textPrimary,
  },
  cardDesc: {
    color: colors.textTertiary,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.sm,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  editLink: {
    color: colors.accent,
  },
  notificationTime: {
    color: colors.accent,
    marginTop: spacing.sm,
  },
  pickerCard: {
    backgroundColor: colors.surfaceElevatedAlt,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: spacing.md,
    paddingVertical: spacing.xs,
  },
  removableTag: {
    backgroundColor: colors.surfaceElevatedAlt,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  removableTagText: {
    color: colors.textPrimary,
  },
  tagInput: {
    backgroundColor: colors.surfaceElevatedAlt,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    color: colors.textPrimary,
    fontFamily: 'Manrope_500Medium',
    fontSize: 14,
    marginTop: spacing.xs,
  },
  tagTypeRow: {
    flexDirection: 'row',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  exportRow: {
    flexDirection: 'row',
  },
  exportButton: {
    flex: 1,
    marginRight: spacing.sm,
  },
});
