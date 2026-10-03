import React, { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ScreenContainer } from '@/componentes/ScreenContainer';
import { Card } from '@/componentes/Card';
import { GlowButton } from '@/componentes/GlowButton';
import { MoodScale } from '@/componentes/MoodScale';
import { BlockChip } from '@/componentes/BlockChip';
import { AccordionSection } from '@/componentes/AccordionSection';
import { colors, spacing, typography, TAB_BAR_CLEARANCE } from '@/tema';
import { useTranslation } from '@/i18n';
import { useSesionStore, useTagsActivos } from '@/stores/SesionStore';
import { useRegistroDeHoy, useRegistroStore } from '@/stores/RegistroStore';
import { bloquesActivos, claveTraduccionBloque, claveTraduccionEtiqueta } from '@/datos/catalogoBloques';
import { Clima, CLIMAS, DatosRegistro, ErrorValidacion, NivelAnimo } from '@/dominio';

const ICONOS_CLIMA: Record<Clima, string> = {
  SOLEADO: '☀️',
  NUBLADO: '☁️',
  LLUVIA: '🌧️',
  FRIO: '❄️',
  CALOR: '🔥',
};

const MENSAJES_ERROR: Partial<Record<ErrorValidacion, string>> = {
  HORAS_SUENO_FUERA_DE_RANGO: 'today.errorSleepRange',
  MINUTOS_EJERCICIO_FUERA_DE_RANGO: 'today.errorExerciseRange',
};

/** "7,5" o "7.5" → 7.5 · vacío → null · texto inválido → NaN (lo rechaza la validación). */
const aNumero = (texto: string): number | null => {
  const limpio = texto.trim().replace(',', '.');
  return limpio === '' ? null : Number(limpio);
};

/**
 * Formulario de carga del día (CU-09) y su edición (CU-11). El único dato
 * obligatorio es el ánimo; sueño, ejercicio, clima y canción se muestran
 * siempre como opcionales.
 */
export const RegistroScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const usuario = useSesionStore((s) => s.usuario);
  const tagsActivos = useTagsActivos();
  const registroDeHoy = useRegistroDeHoy();
  const guardar = useRegistroStore((s) => s.guardar);

  const bloques = useMemo(() => bloquesActivos(usuario?.bloquesActivos ?? []), [usuario]);

  const [nivelAnimo, setNivelAnimo] = useState<NivelAnimo | null>(registroDeHoy?.nivelAnimo ?? null);
  const [destacado, setDestacado] = useState(registroDeHoy?.destacado ?? false);
  const [texto, setTexto] = useState(registroDeHoy?.texto ?? '');
  const [etiquetas, setEtiquetas] = useState<Set<string>>(new Set(registroDeHoy?.etiquetas ?? []));
  const [valoresTags, setValoresTags] = useState<Record<string, boolean | string>>(
    registroDeHoy?.valoresTags ?? {}
  );
  const [climas, setClimas] = useState<Set<Clima>>(new Set(registroDeHoy?.climas ?? []));
  const [horasSueno, setHorasSueno] = useState(registroDeHoy?.horasSueno?.toString() ?? '');
  const [minutosEjercicio, setMinutosEjercicio] = useState(
    registroDeHoy?.minutosEjercicio?.toString() ?? ''
  );
  const [cancion, setCancion] = useState(registroDeHoy?.cancion?.titulo ?? '');
  const [guardando, setGuardando] = useState(false);

  const alternar = <T,>(set: React.Dispatch<React.SetStateAction<Set<T>>>, valor: T) =>
    set((previo) => {
      const siguiente = new Set(previo);
      if (siguiente.has(valor)) siguiente.delete(valor);
      else siguiente.add(valor);
      return siguiente;
    });

  const handleGuardar = async () => {
    const datos: DatosRegistro = {
      nivelAnimo,
      destacado,
      texto: texto.trim(),
      etiquetas: Array.from(etiquetas),
      valoresTags,
      climas: CLIMAS.filter((c) => climas.has(c)),
      horasSueno: aNumero(horasSueno),
      minutosEjercicio: aNumero(minutosEjercicio),
      // Provisorio hasta la iteración 5: el título se escribe a mano. Después
      // se elige de la búsqueda en Spotify y se completa el resto de los datos.
      cancion: cancion.trim()
        ? { spotifyId: '', titulo: cancion.trim(), artista: '', portadaUrl: null }
        : null,
    };

    setGuardando(true);
    const errores = await guardar(datos);
    setGuardando(false);

    if (errores.length > 0) {
      const mensaje = errores.map((e) => MENSAJES_ERROR[e]).find(Boolean);
      if (mensaje) Alert.alert(t('today.errorTitle'), t(mensaje));
      return;
    }

    Alert.alert(t('today.savedPopupTitle'), t('today.savedPopupBody'), [
      { text: t('today.savedPopupCta'), onPress: () => navigation.navigate('Inicio') },
    ]);
  };

  return (
    <ScreenContainer scroll contentStyle={styles.content}>
      <Text style={[typography.displayM, styles.header]}>{t('today.title')}</Text>
      {registroDeHoy && (
        <Text style={[typography.caption, styles.alreadyLogged]}>{t('today.alreadyLogged')}</Text>
      )}

      <Card style={styles.card}>
        <Text style={[typography.subtitle, styles.cardTitle]}>{t('today.moodQuestion')}</Text>
        <View style={styles.moodWrapper}>
          <MoodScale value={nivelAnimo} onChange={setNivelAnimo} />
        </View>
        <Pressable onPress={() => setDestacado((d) => !d)} style={styles.favoriteToggle}>
          <Text style={[typography.bodyMedium, destacado ? styles.favoriteOn : styles.favoriteOff]}>
            {destacado ? t('today.favoriteToggleOn') : t('today.favoriteToggle')}
          </Text>
        </Pressable>
      </Card>

      <Card style={styles.card}>
        <TextInput
          value={texto}
          onChangeText={setTexto}
          placeholder={t('today.notePlaceholder')}
          placeholderTextColor={colors.textTertiary}
          multiline
          style={styles.noteInput}
        />
      </Card>

      {bloques.length > 0 && (
        <Card style={styles.card}>
          <Text style={[typography.subtitle, styles.cardTitle]}>{t('today.tagsTitle')}</Text>
          {bloques.map((bloque, i) => (
            <AccordionSection
              key={bloque.clave}
              title={t(claveTraduccionBloque(bloque.clave))}
              icon={bloque.icono}
              defaultOpen={i === 0}
            >
              <View style={styles.chipsRow}>
                {bloque.etiquetas.map((etiqueta) => (
                  <BlockChip
                    key={etiqueta.clave}
                    label={t(claveTraduccionEtiqueta(etiqueta.clave))}
                    selected={etiquetas.has(etiqueta.clave)}
                    onPress={() => alternar(setEtiquetas, etiqueta.clave)}
                  />
                ))}
              </View>
            </AccordionSection>
          ))}
        </Card>
      )}

      <Card style={styles.card}>
        <Text style={[typography.subtitle, styles.cardTitle]}>☁️ {t('today.weatherLabel')}</Text>
        <View style={[styles.chipsRow, styles.fieldBody]}>
          {CLIMAS.map((clima) => (
            <BlockChip
              key={clima}
              icon={ICONOS_CLIMA[clima]}
              label={t(`weather.${clima}`)}
              selected={climas.has(clima)}
              onPress={() => alternar(setClimas, clima)}
            />
          ))}
        </View>
      </Card>

      <View style={styles.numbersRow}>
        <Card style={styles.numberCard}>
          <Text style={[typography.subtitle, styles.cardTitle]}>💤 {t('today.sleepLabel')}</Text>
          <TextInput
            value={horasSueno}
            onChangeText={setHorasSueno}
            keyboardType="decimal-pad"
            placeholder="8"
            placeholderTextColor={colors.textTertiary}
            style={[styles.textInput, styles.fieldBody]}
          />
        </Card>
        <Card style={styles.numberCard}>
          <Text style={[typography.subtitle, styles.cardTitle]}>⚡️ {t('today.exerciseLabel')}</Text>
          <TextInput
            value={minutosEjercicio}
            onChangeText={setMinutosEjercicio}
            keyboardType="number-pad"
            placeholder="30"
            placeholderTextColor={colors.textTertiary}
            style={[styles.textInput, styles.fieldBody]}
          />
        </Card>
      </View>

      <Card style={styles.card}>
        <Text style={[typography.subtitle, styles.cardTitle]}>🎧 {t('today.songLabel')}</Text>
        <TextInput
          value={cancion}
          onChangeText={setCancion}
          placeholder={t('today.songPlaceholder')}
          placeholderTextColor={colors.textTertiary}
          style={[styles.textInput, styles.fieldBody]}
        />
      </Card>

      {tagsActivos.length > 0 && (
        <Card style={styles.card}>
          <Text style={[typography.subtitle, styles.cardTitle]}>{t('today.customTagsTitle')}</Text>
          <View style={[styles.chipsRow, styles.fieldBody]}>
            {tagsActivos.map((tag) =>
              tag.tipo === 'SI_NO' ? (
                <BlockChip
                  key={tag.id}
                  label={tag.nombre}
                  selected={valoresTags[tag.id] === true}
                  onPress={() => setValoresTags((v) => ({ ...v, [tag.id]: v[tag.id] !== true }))}
                />
              ) : (
                <View key={tag.id} style={styles.customTextField}>
                  <Text style={[typography.caption, styles.categoryLabel]}>{tag.nombre}</Text>
                  <TextInput
                    value={(valoresTags[tag.id] as string) ?? ''}
                    onChangeText={(valor) => setValoresTags((v) => ({ ...v, [tag.id]: valor }))}
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
        label={t('today.saveEntry')}
        onPress={handleGuardar}
        disabled={!nivelAnimo || guardando}
        style={styles.saveButton}
      />
      {!nivelAnimo && (
        <Text style={[typography.caption, styles.requiredHint]}>{t('today.moodRequired')}</Text>
      )}
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
  fieldBody: {
    marginTop: spacing.sm,
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
  categoryLabel: {
    color: colors.textTertiary,
    marginBottom: spacing.xs,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  numbersRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  numberCard: {
    flex: 1,
    marginTop: spacing.lg,
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
  requiredHint: {
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
