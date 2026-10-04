import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { format } from 'date-fns';
import { ScreenContainer } from '@/componentes/ScreenContainer';
import { EncabezadoPantalla } from '@/componentes/Encabezados';
import { CalendarioAnimo } from '@/componentes/CalendarioAnimo';
import { SoulOrb } from '@/componentes/SoulOrb';
import { Icono } from '@/componentes/Icono';
import { Boton } from '@/componentes/Boton';
import { CoachMark } from '@/componentes/CoachMark';
import { useAltoBarraInferior } from '@/componentes/TabBar';
import { colors, radius, spacing, typography } from '@/tema';
import { useTranslation } from '@/i18n';
import { useSesionStore } from '@/stores/SesionStore';
import { useIndicadoresProgreso, useRegistroStore } from '@/stores/RegistroStore';
import { coachmarkHoyVisto, marcarCoachmarkHoyVisto } from '@/persistencia/PreferenciasDispositivo';
import { dateLocale } from '@/utils/fecha';

const claveSaludo = (hora: number) =>
  hora < 12 ? 'home.greetingMorning' : hora < 20 ? 'home.greetingAfternoon' : 'home.greetingNight';

/**
 * Pantalla principal (CU-14 y CU-16): el Color del Alma con los indicadores
 * de constancia y el mapa de calor del mes. Todo se calcula sobre la base
 * local, así que funciona sin conexión.
 */
export const InicioScreen: React.FC = () => {
  const { t, language } = useTranslation();
  const navigation = useNavigation<any>();
  const altoBarra = useAltoBarraInferior();
  const nombre = useSesionStore((s) => s.usuario?.nombre ?? '');
  const registros = useRegistroStore((s) => s.registros);
  const { rachaActual, rachaMaxima, diasRegistrados, colorDelAlma } = useIndicadoresProgreso();

  const ahora = new Date();
  const [anio, setAnio] = useState(ahora.getFullYear());
  const [mes, setMes] = useState(ahora.getMonth());
  const [mostrarAyuda, setMostrarAyuda] = useState(false);

  useEffect(() => {
    coachmarkHoyVisto().then((visto) => setMostrarAyuda(!visto));
  }, []);

  const cerrarAyuda = () => {
    setMostrarAyuda(false);
    marcarCoachmarkHoyVisto();
  };

  const mesAnterior = () => {
    if (mes === 0) {
      setMes(11);
      setAnio((a) => a - 1);
    } else setMes((m) => m - 1);
  };
  const mesSiguiente = () => {
    if (mes === 11) {
      setMes(0);
      setAnio((a) => a + 1);
    } else setMes((m) => m + 1);
  };

  const dias = (n: number) => `${n} ${n === 1 ? t('common.day') : t('common.days')}`;
  const saludo = t(claveSaludo(ahora.getHours())).replace('{nombre}', nombre);

  return (
    <ScreenContainer
      scroll
      contentStyle={[styles.content, { paddingBottom: altoBarra + spacing.xl }]}
      pie={
        <CoachMark
          message={t('coach.todayStep')}
          visible={mostrarAyuda}
          onDismiss={cerrarAyuda}
          bottom={altoBarra + spacing.sm}
        />
      }
    >
      <EncabezadoPantalla
        antetitulo={format(ahora, "EEEE d 'de' MMMM", { locale: dateLocale(language) })}
        titulo={saludo}
      />

      <View style={styles.tarjeta}>
        <SoulOrb color={colorDelAlma} size={92} />
        <View style={styles.indicadores}>
          <Text style={[typography.seccion, styles.etiquetaAlma]}>{t('calendar.soulColor')}</Text>
          <View style={styles.racha}>
            <Icono nombre="racha" relleno tamano={18} color={rachaActual > 0 ? colors.gold : colors.textTertiary} />
            <Text style={[typography.title, styles.valorRacha]}>{dias(rachaActual)}</Text>
          </View>
          <View style={styles.miniDatos}>
            <MiniDato valor={rachaMaxima} etiqueta={t('home.bestStreak')} />
            <View style={styles.divisor} />
            <MiniDato valor={diasRegistrados} etiqueta={t('home.loggedDays')} />
          </View>
        </View>
      </View>

      <View style={[styles.tarjeta, styles.tarjetaCalendario]}>
        <CalendarioAnimo
          anio={anio}
          mes={mes}
          registros={registros}
          idioma={language}
          etiquetaMuyMal={t('mood.1')}
          etiquetaGenial={t('mood.5')}
          onSeleccionarDia={(fecha) => navigation.navigate('DetalleDia', { fecha })}
          onMesAnterior={mesAnterior}
          onMesSiguiente={mesSiguiente}
          onSeleccionarAnio={setAnio}
        />
      </View>

      {diasRegistrados === 0 && (
        <View style={styles.vacio}>
          <Text style={[typography.headline, styles.tituloVacio]}>{t('home.emptyTitle')}</Text>
          <Text style={[typography.footnote, styles.secundario]}>{t('home.emptyBody')}</Text>
          <Boton
            titulo={t('dayDetail.logToday')}
            icono="agregar"
            onPress={() => navigation.navigate('Registro')}
            style={styles.botonVacio}
          />
        </View>
      )}
    </ScreenContainer>
  );
};

const MiniDato: React.FC<{ valor: number; etiqueta: string }> = ({ valor, etiqueta }) => (
  <View>
    <Text style={[typography.numero, styles.valorMini]}>{valor}</Text>
    <Text style={[typography.micro, styles.etiquetaMini]}>{etiqueta}</Text>
  </View>
);

const styles = StyleSheet.create({
  content: {
    paddingTop: spacing.lg,
  },
  tarjeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  tarjetaCalendario: {
    flexDirection: 'column',
    alignItems: 'stretch',
    paddingHorizontal: spacing.md,
  },
  indicadores: {
    flex: 1,
  },
  etiquetaAlma: {
    color: colors.textTertiary,
    marginBottom: spacing.xs,
  },
  racha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  valorRacha: {
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  secundario: {
    color: colors.textSecondary,
    marginTop: 2,
  },
  miniDatos: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  divisor: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    backgroundColor: colors.separator,
  },
  valorMini: {
    color: colors.textPrimary,
  },
  etiquetaMini: {
    color: colors.textTertiary,
    marginTop: 1,
  },
  vacio: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  tituloVacio: {
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  botonVacio: {
    marginTop: spacing.lg,
    alignSelf: 'stretch',
  },
});
