import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { format, parseISO } from 'date-fns';
import { ScreenContainer } from '@/componentes/ScreenContainer';
import { Card } from '@/componentes/Card';
import { GlowButton } from '@/componentes/GlowButton';
import { colors, radius, spacing, typography } from '@/tema';
import { useTranslation } from '@/i18n';
import { useRegistroStore } from '@/stores/RegistroStore';
import { useSesionStore } from '@/stores/SesionStore';
import { getMoodColor } from '@/tema/colors';
import { claveTraduccionEtiqueta } from '@/datos/catalogoBloques';
import { RootStackParamList } from '@/navegacion/tipos';
import { dateLocale, todayISO } from '@/utils/fecha';
import { esEditable } from '@/dominio';

type Props = NativeStackScreenProps<RootStackParamList, 'DetalleDia'>;

/**
 * Detalle de un día (CU-15). Los días anteriores son de solo lectura (RN-03);
 * si es el día de hoy, se ofrece cargarlo o editarlo.
 */
export const DetalleDiaScreen: React.FC<Props> = ({ route, navigation }) => {
  const { fecha } = route.params;
  const { t, language } = useTranslation();
  const registro = useRegistroStore((s) => s.registros[fecha]);
  // Se incluyen también los tags desactivados: sus valores históricos se siguen mostrando.
  const tags = useSesionStore((s) => s.tags);
  const editable = esEditable({ fecha }, todayISO());

  const dateLabel = format(parseISO(fecha), "EEEE d 'de' MMMM", { locale: dateLocale(language) });

  const irAHoy = () => {
    navigation.goBack();
    navigation.navigate('Principal', { screen: 'Registro' } as never);
  };

  const valoresTags = registro
    ? Object.entries(registro.valoresTags)
        .map(([id, valor]) => {
          const nombre = tags.find((tag) => tag.id === id)?.nombre;
          if (!nombre || valor === false || valor === '') return null;
          return valor === true ? nombre : `${nombre}: ${valor}`;
        })
        .filter((v): v is string => v !== null)
    : [];

  return (
    <ScreenContainer scroll contentStyle={styles.content}>
      <View style={styles.headerRow}>
        <View>
          <Text style={[typography.caption, styles.eyebrow]}>{fecha}</Text>
          <Text style={[typography.displayM, styles.dateLabel]}>{dateLabel}</Text>
        </View>
        <Pressable onPress={() => navigation.goBack()} style={styles.closeButton}>
          <Text style={styles.closeIcon}>✕</Text>
        </Pressable>
      </View>

      {!registro ? (
        <Card>
          <Text style={[typography.body, styles.emptyText]}>{t('dayDetail.noEntry')}</Text>
          {editable && (
            <GlowButton label={t('dayDetail.logToday')} onPress={irAHoy} style={styles.action} />
          )}
        </Card>
      ) : (
        <>
          <Card style={styles.moodCard} elevated>
            <View style={[styles.moodDot, { backgroundColor: getMoodColor(registro.nivelAnimo) }]} />
            <View style={styles.moodInfo}>
              <Text style={[typography.caption, styles.moodEyebrow]}>{t('dayDetail.mood')}</Text>
              <Text style={[typography.title, styles.moodLabel]}>{t(`mood.${registro.nivelAnimo}`)}</Text>
            </View>
            {registro.destacado && <Text style={styles.favoriteStar}>⭐</Text>}
          </Card>

          {registro.texto ? (
            <Card style={styles.card}>
              <Text style={[typography.caption, styles.cardTitle]}>{t('dayDetail.note')}</Text>
              <Text style={[typography.body, styles.noteText]}>{registro.texto}</Text>
            </Card>
          ) : null}

          {registro.etiquetas.length + valoresTags.length > 0 && (
            <Card style={styles.card}>
              <Text style={[typography.caption, styles.cardTitle]}>{t('dayDetail.tags')}</Text>
              <View style={styles.tagsWrap}>
                {registro.etiquetas.map((clave) => (
                  <View key={clave} style={styles.tagPill}>
                    <Text style={[typography.caption, styles.tagPillText]}>{t(claveTraduccionEtiqueta(clave))}</Text>
                  </View>
                ))}
                {valoresTags.map((texto) => (
                  <View key={texto} style={styles.tagPill}>
                    <Text style={[typography.caption, styles.tagPillText]}>{texto}</Text>
                  </View>
                ))}
              </View>
            </Card>
          )}

          {(registro.cancion ||
            registro.climas.length > 0 ||
            registro.minutosEjercicio !== null ||
            registro.horasSueno !== null) && (
            <Card style={styles.card}>
              {registro.cancion ? (
                <DetailLine
                  icon="🎧"
                  label={[registro.cancion.titulo, registro.cancion.artista].filter(Boolean).join(' — ')}
                />
              ) : null}
              {registro.climas.length > 0 ? (
                <DetailLine icon="☁️" label={registro.climas.map((c) => t(`weather.${c}`)).join(', ')} />
              ) : null}
              {registro.minutosEjercicio !== null ? (
                <DetailLine icon="⚡️" label={`${registro.minutosEjercicio} min`} />
              ) : null}
              {registro.horasSueno !== null ? <DetailLine icon="💤" label={`${registro.horasSueno} h`} /> : null}
            </Card>
          )}

          {editable ? (
            <GlowButton label={t('dayDetail.editToday')} onPress={irAHoy} variant="secondary" />
          ) : (
            <Text style={[typography.caption, styles.readOnly]}>{t('dayDetail.readOnly')}</Text>
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
  action: {
    marginTop: spacing.md,
  },
  readOnly: {
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
