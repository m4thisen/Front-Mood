import React, { useMemo, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { format } from 'date-fns';
import { ScreenContainer } from '@/componentes/ScreenContainer';
import { EncabezadoPantalla, EncabezadoSeccion } from '@/componentes/Encabezados';
import { EscalaAnimo } from '@/componentes/EscalaAnimo';
import { Chip } from '@/componentes/Chip';
import { Boton } from '@/componentes/Boton';
import { Icono } from '@/componentes/Icono';
import { SelectorNumerico } from '@/componentes/SelectorNumerico';
import { CelebracionGuardado } from '@/componentes/CelebracionGuardado';
import { useAltoBarraInferior } from '@/componentes/TabBar';
import { iconoDeBloque, ICONOS_CLIMA } from '@/componentes/iconosDominio';
import { colors, radius, spacing, typography } from '@/tema';
import { useTranslation } from '@/i18n';
import { useSesionStore, useTagsActivos } from '@/stores/SesionStore';
import { useIndicadoresProgreso, useRegistroDeHoy, useRegistroStore } from '@/stores/RegistroStore';
import { bloquesActivos, claveTraduccionBloque, claveTraduccionEtiqueta } from '@/datos/catalogoBloques';
import {
  Clima,
  CLIMAS,
  DatosRegistro,
  ErrorValidacion,
  NivelAnimo,
  RANGO_HORAS_SUENO,
  RANGO_MINUTOS_EJERCICIO,
} from '@/dominio';
import { dateLocale } from '@/utils/fecha';

const MENSAJES_ERROR: Partial<Record<ErrorValidacion, string>> = {
  HORAS_SUENO_FUERA_DE_RANGO: 'today.errorSleepRange',
  MINUTOS_EJERCICIO_FUERA_DE_RANGO: 'today.errorExerciseRange',
};

/**
 * Formulario del día (CU-09) y su edición (CU-11). Pensado para completarse
 * en menos de un minuto: el ánimo es lo único obligatorio, lo que se marca
 * con un toque va primero y lo que hay que escribir va al final. El botón de
 * guardar queda siempre a mano, arriba de la barra.
 */
export const RegistroScreen: React.FC = () => {
  const { t, language } = useTranslation();
  const navigation = useNavigation<any>();
  const altoBarra = useAltoBarraInferior();
  const usuario = useSesionStore((s) => s.usuario);
  const tagsActivos = useTagsActivos();
  const registroDeHoy = useRegistroDeHoy();
  const guardar = useRegistroStore((s) => s.guardar);
  const { rachaActual } = useIndicadoresProgreso();

  const bloques = useMemo(() => bloquesActivos(usuario?.bloquesActivos ?? []), [usuario]);

  const [nivelAnimo, setNivelAnimo] = useState<NivelAnimo | null>(registroDeHoy?.nivelAnimo ?? null);
  const [destacado, setDestacado] = useState(registroDeHoy?.destacado ?? false);
  const [texto, setTexto] = useState(registroDeHoy?.texto ?? '');
  const [etiquetas, setEtiquetas] = useState<Set<string>>(new Set(registroDeHoy?.etiquetas ?? []));
  const [valoresTags, setValoresTags] = useState<Record<string, boolean | string>>(
    registroDeHoy?.valoresTags ?? {}
  );
  const [climas, setClimas] = useState<Set<Clima>>(new Set(registroDeHoy?.climas ?? []));
  const [horasSueno, setHorasSueno] = useState<number | null>(registroDeHoy?.horasSueno ?? null);
  const [minutosEjercicio, setMinutosEjercicio] = useState<number | null>(
    registroDeHoy?.minutosEjercicio ?? null
  );
  const [cancion, setCancion] = useState(registroDeHoy?.cancion?.titulo ?? '');
  const [guardando, setGuardando] = useState(false);
  const [celebrando, setCelebrando] = useState(false);

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
      horasSueno,
      minutosEjercicio,
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
    setCelebrando(true);
  };

  const terminarCelebracion = () => {
    setCelebrando(false);
    navigation.navigate('Inicio');
  };

  const fechaHoy = format(new Date(), "EEEE d 'de' MMMM", { locale: dateLocale(language) });

  const pie = (
    <View style={[styles.pie, { bottom: altoBarra }]} pointerEvents="box-none">
      <LinearGradient
        colors={['rgba(5,11,30,0)', 'rgba(5,11,30,0.9)', 'rgba(5,11,30,0.98)']}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <Boton
        titulo={registroDeHoy ? t('today.saveChanges') : t('today.saveEntry')}
        onPress={handleGuardar}
        deshabilitado={!nivelAnimo}
        cargando={guardando}
      />
    </View>
  );

  return (
    <ScreenContainer scroll contentStyle={[styles.content, { paddingBottom: altoBarra + 110 }]} pie={pie}>
      <EncabezadoPantalla antetitulo={fechaHoy} titulo={t('today.title')} />

      <View style={styles.tarjetaAnimo}>
        <Text style={[typography.headline, styles.pregunta]}>{t('today.moodQuestion')}</Text>
        <EscalaAnimo valor={nivelAnimo} onCambio={setNivelAnimo} />
        <Pressable
          onPress={() => setDestacado((d) => !d)}
          accessibilityRole="switch"
          accessibilityState={{ checked: destacado }}
          style={[styles.destacado, destacado && styles.destacadoActivo]}
        >
          <Icono nombre="destacado" relleno={destacado} tamano={15} color={destacado ? colors.gold : colors.textTertiary} />
          <Text style={[typography.footnote, { color: destacado ? colors.gold : colors.textSecondary }]}>
            {destacado ? t('today.favoriteToggleOn') : t('today.favoriteToggle')}
          </Text>
        </Pressable>
        {registroDeHoy && (
          <Text style={[typography.footnote, styles.yaRegistrado]}>{t('today.alreadyLogged')}</Text>
        )}
      </View>

      {bloques.length > 0 && (
        <>
          <EncabezadoSeccion titulo={t('today.tagsTitle')} />
          {bloques.map((bloque) => (
            <View key={bloque.clave} style={styles.bloque}>
              <View style={styles.cabeceraBloque}>
                <Icono nombre={iconoDeBloque(bloque.clave)} tamano={14} color={colors.textTertiary} />
                <Text style={[typography.footnote, styles.nombreBloque]}>{t(claveTraduccionBloque(bloque.clave))}</Text>
              </View>
              <View style={styles.chips}>
                {bloque.etiquetas.map((etiqueta) => (
                  <Chip
                    key={etiqueta.clave}
                    etiqueta={t(claveTraduccionEtiqueta(etiqueta.clave))}
                    seleccionado={etiquetas.has(etiqueta.clave)}
                    onPress={() => alternar(setEtiquetas, etiqueta.clave)}
                  />
                ))}
              </View>
            </View>
          ))}
        </>
      )}

      <EncabezadoSeccion titulo={t('today.contextTitle')} />
      <View style={styles.chips}>
        {CLIMAS.map((clima) => (
          <Chip
            key={clima}
            icono={ICONOS_CLIMA[clima]}
            etiqueta={t(`weather.${clima}`)}
            seleccionado={climas.has(clima)}
            onPress={() => alternar(setClimas, clima)}
          />
        ))}
      </View>
      <View style={styles.selectores}>
        <SelectorNumerico
          titulo={t('today.sleepShort')}
          icono="sueno"
          valor={horasSueno}
          onCambio={setHorasSueno}
          paso={0.5}
          inicial={7}
          min={RANGO_HORAS_SUENO.min}
          max={RANGO_HORAS_SUENO.max}
          unidad="h"
          vacio={t('common.optional')}
        />
        <SelectorNumerico
          titulo={t('today.exerciseShort')}
          icono="ejercicio"
          valor={minutosEjercicio}
          onCambio={setMinutosEjercicio}
          paso={15}
          inicial={30}
          min={RANGO_MINUTOS_EJERCICIO.min}
          max={RANGO_MINUTOS_EJERCICIO.max}
          unidad="min"
          vacio={t('common.optional')}
        />
      </View>
      <View style={styles.campo}>
        <Icono nombre="cancion" tamano={16} color={colors.textTertiary} />
        <TextInput
          value={cancion}
          onChangeText={setCancion}
          placeholder={t('today.songPlaceholder')}
          placeholderTextColor={colors.textTertiary}
          style={[typography.bodyMedium, styles.entrada]}
          returnKeyType="done"
        />
      </View>

      {tagsActivos.length > 0 && (
        <>
          <EncabezadoSeccion titulo={t('today.customTagsTitle')} />
          <View style={styles.chips}>
            {tagsActivos
              .filter((tag) => tag.tipo === 'SI_NO')
              .map((tag) => (
                <Chip
                  key={tag.id}
                  icono="tag"
                  etiqueta={tag.nombre}
                  seleccionado={valoresTags[tag.id] === true}
                  onPress={() => setValoresTags((v) => ({ ...v, [tag.id]: v[tag.id] !== true }))}
                />
              ))}
          </View>
          {tagsActivos
            .filter((tag) => tag.tipo === 'TEXTO')
            .map((tag) => (
              <View key={tag.id} style={styles.campo}>
                <Text style={[typography.footnote, styles.etiquetaCampo]}>{tag.nombre}</Text>
                <TextInput
                  value={(valoresTags[tag.id] as string) ?? ''}
                  onChangeText={(valor) => setValoresTags((v) => ({ ...v, [tag.id]: valor }))}
                  placeholderTextColor={colors.textTertiary}
                  style={[typography.bodyMedium, styles.entrada]}
                />
              </View>
            ))}
        </>
      )}

      <EncabezadoSeccion titulo={t('today.noteTitle')} />
      <TextInput
        value={texto}
        onChangeText={setTexto}
        placeholder={t('today.notePlaceholder')}
        placeholderTextColor={colors.textTertiary}
        multiline
        style={[typography.body, styles.nota]}
      />

      <Modal visible={celebrando} transparent animationType="none" statusBarTranslucent>
        {nivelAnimo && (
          <CelebracionGuardado
            nivel={nivelAnimo}
            titulo={t('today.savedPopupTitle')}
            racha={rachaActual}
            textoRacha={t('today.streakCelebration').replace('{dias}', String(rachaActual))}
            onTerminar={terminarCelebracion}
          />
        )}
      </Modal>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingTop: spacing.lg,
  },
  tarjetaAnimo: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  pregunta: {
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  destacado: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 6,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.fill,
  },
  destacadoActivo: {
    backgroundColor: colors.goldSoft,
  },
  yaRegistrado: {
    color: colors.accentStrong,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  bloque: {
    marginBottom: spacing.md,
  },
  cabeceraBloque: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  nombreBloque: {
    color: colors.textSecondary,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  selectores: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  campo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    minHeight: 50,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
  },
  etiquetaCampo: {
    color: colors.textTertiary,
  },
  entrada: {
    flex: 1,
    color: colors.textPrimary,
    paddingVertical: spacing.sm,
  },
  nota: {
    color: colors.textPrimary,
    minHeight: 110,
    textAlignVertical: 'top',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
  },
  pie: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
  },
});
