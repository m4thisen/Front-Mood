import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenContainer } from '@/componentes/ScreenContainer';
import { EncabezadoPantalla, EncabezadoSeccion } from '@/componentes/Encabezados';
import { FilaLista, GrupoLista } from '@/componentes/Lista';
import { HojaInferior } from '@/componentes/HojaInferior';
import { EditorTags } from '@/componentes/EditorTags';
import { Chip } from '@/componentes/Chip';
import { Boton } from '@/componentes/Boton';
import { Icono } from '@/componentes/Icono';
import { iconoDeBloque } from '@/componentes/iconosDominio';
import { useAltoBarraInferior } from '@/componentes/TabBar';
import { colors, radius, spacing, typography } from '@/tema';
import { shade } from '@/utils/color';
import { hapticos } from '@/utils/hapticos';
import { useTranslation } from '@/i18n';
import { useSesionStore, useTagsActivos } from '@/stores/SesionStore';
import { useIndicadoresProgreso, useListaRegistros } from '@/stores/RegistroStore';
import { exportarCSV, exportarPDF } from '@/servicios/ExportService';
import { programarRecordatorio } from '@/servicios/NotificacionService';
import { BLOQUES, claveTraduccionBloque } from '@/datos/catalogoBloques';
import {
  calcularEdad,
  FRECUENCIAS_IA,
  FrecuenciaIA,
  formatearHora,
  HORA_RECORDATORIO_POR_DEFECTO,
  Idioma,
  partesHora,
} from '@/dominio';

type Hoja = 'recordatorio' | 'frecuencia' | 'bloques' | 'tags' | null;

const aFecha = (horaTexto: string): Date => {
  const { hora, minuto } = partesHora(horaTexto);
  const d = new Date();
  d.setHours(hora, minuto, 0, 0);
  return d;
};

/**
 * Mi cuenta (CU-03, CU-05 a CU-08, CU-22 y CU-23), al estilo de Ajustes de
 * iOS: listas agrupadas y cada preferencia se edita en una hoja inferior.
 */
export const CuentaScreen: React.FC = () => {
  const { t, language, setLanguage } = useTranslation();
  const altoBarra = useAltoBarraInferior();
  const usuario = useSesionStore((s) => s.usuario);
  const tags = useSesionStore((s) => s.tags);
  const tagsActivos = useTagsActivos();
  const actualizarPreferencias = useSesionStore((s) => s.actualizarPreferencias);
  const cerrarSesion = useSesionStore((s) => s.cerrarSesion);
  const registros = useListaRegistros();
  const { diasRegistrados, colorDelAlma } = useIndicadoresProgreso();

  const [hoja, setHoja] = useState<Hoja>(null);
  const horaRecordatorio = usuario?.horaRecordatorio ?? HORA_RECORDATORIO_POR_DEFECTO;
  const [horaBorrador, setHoraBorrador] = useState(aFecha(horaRecordatorio));

  const cambiarIdioma = (idioma: Idioma) => {
    hapticos.seleccion();
    setLanguage(idioma);
    actualizarPreferencias({ idioma });
  };

  const abrirRecordatorio = () => {
    setHoraBorrador(aFecha(horaRecordatorio));
    setHoja('recordatorio');
  };

  const guardarRecordatorio = async () => {
    const hora = formatearHora(horaBorrador.getHours(), horaBorrador.getMinutes());
    await actualizarPreferencias({ horaRecordatorio: hora });
    setHoja(null);
    const programado = await programarRecordatorio(hora, t('appName'), t('welcome.description'));
    if (!programado) Alert.alert(t('steps.notificationDeniedTitle'), t('steps.notificationDeniedBody'));
  };

  const elegirFrecuencia = (frecuenciaIA: FrecuenciaIA) => {
    hapticos.seleccion();
    actualizarPreferencias({ frecuenciaIA });
  };

  // CU-07: desactivar un bloque no borra lo ya registrado; si quedan todos
  // desactivados, se advierte que el registro queda reducido (excepción E1).
  const alternarBloque = (clave: string) => {
    const activos = usuario?.bloquesActivos ?? [];
    const siguiente = activos.includes(clave) ? activos.filter((c) => c !== clave) : [...activos, clave];
    if (siguiente.length === 0) {
      Alert.alert(t('account.blocks'), t('account.noBlocksWarning'), [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.continue'), onPress: () => actualizarPreferencias({ bloquesActivos: [] }) },
      ]);
      return;
    }
    actualizarPreferencias({ bloquesActivos: siguiente });
  };

  const exportar = async (formato: 'csv' | 'pdf') => {
    if (registros.length === 0) {
      Alert.alert(t('account.exportData'), t('account.exportEmpty'));
      return;
    }
    if (formato === 'csv') await exportarCSV(registros, tags);
    else await exportarPDF(registros, usuario, tags);
  };

  // CU-03: se pide confirmación y se avisa que los datos locales se conservan.
  const confirmarCierre = () => {
    Alert.alert(t('account.logout'), t('account.logoutConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('account.logout'), style: 'destructive', onPress: cerrarSesion },
    ]);
  };

  const frecuencia = usuario?.frecuenciaIA ?? 1;
  const textoFrecuencia = (f: FrecuenciaIA) =>
    f === 1 ? t('account.frequencyDaily') : t('account.frequencyEvery').replace('{dias}', String(f));
  const edad = usuario?.fechaNacimiento ? calcularEdad(usuario.fechaNacimiento) : null;
  const colorAvatar = colorDelAlma ?? colors.accent;

  return (
    <ScreenContainer scroll contentStyle={[styles.content, { paddingBottom: altoBarra + spacing.xl }]}>
      <EncabezadoPantalla titulo={t('account.title')} />

      <View style={styles.perfil}>
        <LinearGradient
          colors={[shade(colorAvatar, 0.3), colorAvatar, shade(colorAvatar, -0.35)]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={styles.avatar}
        >
          <Text style={styles.inicial}>{usuario?.nombre?.[0]?.toUpperCase() ?? '?'}</Text>
        </LinearGradient>
        <View style={styles.datosPerfil}>
          <Text style={[typography.title, styles.nombre]}>{usuario?.nombre}</Text>
          <Text style={[typography.footnote, styles.detallePerfil]}>
            {[edad !== null ? t('account.age').replace('{edad}', String(edad)) : null,
              t('account.loggedDays').replace('{dias}', String(diasRegistrados))]
              .filter(Boolean)
              .join(' · ')}
          </Text>
        </View>
      </View>

      <EncabezadoSeccion titulo={t('account.settings')} />
      <GrupoLista>
        <FilaLista
          icono="idioma"
          colorIcono="#5B8CFF"
          titulo={t('account.language')}
          accesorio={
            <View style={styles.segmentado}>
              {(['es', 'en'] as const).map((idioma) => (
                <Pressable
                  key={idioma}
                  onPress={() => cambiarIdioma(idioma)}
                  style={[styles.segmento, language === idioma && styles.segmentoActivo]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: language === idioma }}
                >
                  <Text
                    style={[typography.footnote, { color: language === idioma ? colors.textPrimary : colors.textTertiary }]}
                  >
                    {idioma.toUpperCase()}
                  </Text>
                </Pressable>
              ))}
            </View>
          }
        />
        <FilaLista
          icono="recordatorio"
          colorIcono="#F2547D"
          titulo={t('account.notificationTime')}
          valor={horaRecordatorio}
          onPress={abrirRecordatorio}
        />
        <FilaLista
          icono="ia"
          colorIcono="#7C6CF2"
          titulo={t('account.aiFrequencyRow')}
          valor={textoFrecuencia(frecuencia)}
          onPress={() => setHoja('frecuencia')}
        />
      </GrupoLista>

      <EncabezadoSeccion titulo={t('account.yourLog')} />
      <GrupoLista>
        <FilaLista
          icono="bloques"
          colorIcono="#34C77B"
          titulo={t('account.blocks')}
          valor={t('account.activeCount').replace('{n}', String(usuario?.bloquesActivos.length ?? 0))}
          onPress={() => setHoja('bloques')}
        />
        <FilaLista
          icono="tag"
          colorIcono="#F5A524"
          titulo={t('account.customTags')}
          valor={String(tagsActivos.length)}
          onPress={() => setHoja('tags')}
        />
      </GrupoLista>

      <EncabezadoSeccion titulo={t('account.exportData')} />
      <GrupoLista>
        <FilaLista icono="tabla" colorIcono="#2BB3A3" titulo={t('account.exportCsv')} onPress={() => exportar('csv')} />
        <FilaLista icono="documento" colorIcono="#2BB3A3" titulo={t('account.exportPdf')} onPress={() => exportar('pdf')} />
      </GrupoLista>
      <Text style={[typography.micro, styles.nota]}>{t('account.exportDataDesc')}</Text>

      <GrupoLista style={styles.grupoSalir}>
        <FilaLista icono="cerrarSesion" titulo={t('account.logout')} onPress={confirmarCierre} destructiva />
      </GrupoLista>

      <Text style={[typography.micro, styles.version]}>
        Mood {Constants.expoConfig?.version ?? ''}
      </Text>

      <HojaInferior
        visible={hoja === 'recordatorio'}
        titulo={t('account.notificationTime')}
        onCerrar={() => setHoja(null)}
        pie={<Boton titulo={t('account.saveNotificationTime')} onPress={guardarRecordatorio} />}
      >
        <DateTimePicker
          value={horaBorrador}
          mode="time"
          display="spinner"
          style={{ height: 216 }}
          onChange={(_e: DateTimePickerEvent, fecha?: Date) => fecha && setHoraBorrador(fecha)}
          themeVariant="dark"
          is24Hour
        />
      </HojaInferior>

      <HojaInferior visible={hoja === 'frecuencia'} titulo={t('account.aiFrequency')} onCerrar={() => setHoja(null)}>
        <Text style={[typography.footnote, styles.explicacion]}>{t('account.aiFrequencyDesc')}</Text>
        <GrupoLista sinIconos>
          {FRECUENCIAS_IA.map((f) => (
            <FilaLista
              key={f}
              titulo={textoFrecuencia(f)}
              onPress={() => elegirFrecuencia(f)}
              chevron={false}
              accesorio={f === frecuencia ? <Icono nombre="check" tamano={16} color={colors.accentStrong} peso="bold" /> : <View />}
            />
          ))}
        </GrupoLista>
      </HojaInferior>

      <HojaInferior visible={hoja === 'bloques'} titulo={t('account.blocks')} onCerrar={() => setHoja(null)}>
        <Text style={[typography.footnote, styles.explicacion]}>{t('account.blocksDesc')}</Text>
        <View style={styles.chips}>
          {BLOQUES.map((bloque) => (
            <Chip
              key={bloque.clave}
              icono={iconoDeBloque(bloque.clave)}
              etiqueta={t(claveTraduccionBloque(bloque.clave))}
              seleccionado={usuario?.bloquesActivos.includes(bloque.clave) ?? false}
              onPress={() => alternarBloque(bloque.clave)}
            />
          ))}
        </View>
      </HojaInferior>

      <HojaInferior visible={hoja === 'tags'} titulo={t('account.customTags')} onCerrar={() => setHoja(null)}>
        <EditorTags />
      </HojaInferior>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingTop: spacing.lg,
  },
  perfil: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    padding: spacing.lg,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inicial: {
    color: 'rgba(5, 11, 30, 0.8)',
    fontFamily: 'Fraunces_500Medium',
    fontSize: 26,
  },
  datosPerfil: {
    flex: 1,
  },
  nombre: {
    color: colors.textPrimary,
  },
  detallePerfil: {
    color: colors.textTertiary,
    marginTop: 2,
  },
  segmentado: {
    flexDirection: 'row',
    backgroundColor: colors.fill,
    borderRadius: radius.pill,
    padding: 2,
  },
  segmento: {
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  segmentoActivo: {
    backgroundColor: colors.surfaceElevatedAlt,
  },
  nota: {
    color: colors.textTertiary,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  grupoSalir: {
    marginTop: spacing.xl,
  },
  version: {
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  explicacion: {
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
});
