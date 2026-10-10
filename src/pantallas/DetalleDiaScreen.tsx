import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { format, parseISO } from 'date-fns';
import { ScreenContainer } from '@/componentes/ScreenContainer';
import { BotonIcono, EncabezadoSeccion } from '@/componentes/Encabezados';
import { CaraAnimo } from '@/componentes/CaraAnimo';
import { Icono } from '@/componentes/Icono';
import { Boton } from '@/componentes/Boton';
import { FilaLista, GrupoLista } from '@/componentes/Lista';
import { iconoDeEtiqueta, ICONOS_CLIMA } from '@/componentes/iconosDominio';
import { colors, radius, spacing, typography } from '@/tema';
import { useTranslation } from '@/i18n';
import { useRegistroStore } from '@/stores/RegistroStore';
import { useSesionStore } from '@/stores/SesionStore';
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

  const titulo = format(parseISO(fecha), "EEEE d 'de' MMMM", { locale: dateLocale(language) });

  const irAHoy = () => {
    navigation.goBack();
    navigation.navigate('Principal', { screen: 'Registro' });
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

  const filasContexto = registro
    ? [
        registro.climas.length > 0 && (
          <FilaLista
            key="clima"
            icono={ICONOS_CLIMA[registro.climas[0]]}
            colorIcono="#F5A524"
            titulo={t('dayDetail.weather')}
            valor={registro.climas.map((c) => t(`weather.${c}`)).join(', ')}
          />
        ),
        registro.horasSueno !== null && (
          <FilaLista
            key="sueno"
            icono="sueno"
            colorIcono="#7C6CF2"
            titulo={t('today.sleepShort')}
            valor={`${String(registro.horasSueno).replace('.', ',')} h`}
          />
        ),
        registro.minutosEjercicio !== null && (
          <FilaLista
            key="ejercicio"
            icono="ejercicio"
            colorIcono="#34C77B"
            titulo={t('today.exerciseShort')}
            valor={`${registro.minutosEjercicio} min`}
          />
        ),
        registro.cancion && (
          <FilaLista
            key="cancion"
            icono="cancion"
            colorIcono="#F2547D"
            titulo={t('today.songLabel')}
            valor={[registro.cancion.titulo, registro.cancion.artista].filter(Boolean).join(' — ')}
          />
        ),
      ].filter(Boolean)
    : [];

  return (
    <ScreenContainer scroll contentStyle={styles.content}>
      <View style={styles.cabecera}>
        <Text style={[typography.displayM, styles.titulo]}>{titulo.charAt(0).toUpperCase() + titulo.slice(1)}</Text>
        <BotonIcono icono="cerrar" etiqueta={t('common.close')} onPress={() => navigation.goBack()} />
      </View>

      {!registro ? (
        <View style={styles.vacio}>
          <Icono nombre="calendario" tamano={32} color={colors.textTertiary} />
          <Text style={[typography.bodyMedium, styles.textoVacio]}>{t('dayDetail.noEntry')}</Text>
          {editable && <Boton titulo={t('dayDetail.logToday')} icono="agregar" onPress={irAHoy} style={styles.accion} />}
        </View>
      ) : (
        <>
          <View style={styles.hero}>
            <CaraAnimo nivel={registro.nivelAnimo} tamano={64} />
            <View style={styles.heroTextos}>
              <Text style={[typography.title, styles.animo]}>{t(`mood.${registro.nivelAnimo}`)}</Text>
              <View style={styles.metaFila}>
                <Icono nombre="hora" tamano={12} color={colors.textTertiary} />
                <Text style={[typography.footnote, styles.meta]}>
                  {t('dayDetail.loggedAt').replace('{hora}', format(new Date(registro.horaCarga), 'HH:mm'))}
                </Text>
              </View>
              {registro.destacado && (
                <View style={styles.destacado}>
                  <Icono nombre="destacado" relleno tamano={12} color={colors.gold} />
                  <Text style={[typography.micro, styles.textoDestacado]}>{t('dayDetail.favorite')}</Text>
                </View>
              )}
            </View>
          </View>

          {registro.etiquetas.length + valoresTags.length > 0 && (
            <>
              <EncabezadoSeccion titulo={t('today.tagsTitle')} />
              <View style={styles.pastillas}>
                {registro.etiquetas.map((clave) => (
                  <View key={clave} style={styles.pastilla}>
                    <Icono nombre={iconoDeEtiqueta(clave)} tamano={13} color={colors.textTertiary} />
                    <Text style={[typography.footnote, styles.textoPastilla]}>{t(claveTraduccionEtiqueta(clave))}</Text>
                  </View>
                ))}
                {valoresTags.map((texto) => (
                  <View key={texto} style={styles.pastilla}>
                    <Icono nombre="tag" tamano={13} color={colors.textTertiary} />
                    <Text style={[typography.footnote, styles.textoPastilla]}>{texto}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {filasContexto.length > 0 && (
            <>
              <EncabezadoSeccion titulo={t('today.contextTitle')} />
              <GrupoLista>{filasContexto}</GrupoLista>
            </>
          )}

          {registro.texto ? (
            <>
              <EncabezadoSeccion titulo={t('dayDetail.note')} />
              <View style={styles.nota}>
                <Text style={[typography.body, styles.textoNota]}>{registro.texto}</Text>
              </View>
            </>
          ) : null}

          {editable ? (
            <Boton titulo={t('dayDetail.editToday')} icono="editar" variante="secundario" onPress={irAHoy} style={styles.accion} />
          ) : (
            <View style={styles.soloLectura}>
              <Icono nombre="candado" tamano={12} color={colors.textTertiary} />
              <Text style={[typography.footnote, styles.meta]}>{t('dayDetail.readOnly')}</Text>
            </View>
          )}
        </>
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  cabecera: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  titulo: {
    flex: 1,
    color: colors.textPrimary,
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    padding: spacing.lg,
  },
  heroTextos: {
    flex: 1,
  },
  animo: {
    color: colors.textPrimary,
  },
  metaFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  meta: {
    color: colors.textTertiary,
  },
  destacado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.goldSoft,
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
  },
  textoDestacado: {
    color: colors.gold,
  },
  pastillas: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  pastilla: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.fill,
  },
  textoPastilla: {
    color: colors.textPrimary,
  },
  nota: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    padding: spacing.lg,
  },
  textoNota: {
    color: colors.textPrimary,
  },
  accion: {
    marginTop: spacing.xl,
  },
  soloLectura: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.xl,
  },
  vacio: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
    gap: spacing.sm,
  },
  textoVacio: {
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
