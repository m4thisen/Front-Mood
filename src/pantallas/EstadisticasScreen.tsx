import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ScreenContainer } from '@/componentes/ScreenContainer';
import { EncabezadoPantalla, EncabezadoSeccion } from '@/componentes/Encabezados';
import { CaraAnimo } from '@/componentes/CaraAnimo';
import { Icono, NombreIcono } from '@/componentes/Icono';
import { iconoDeEtiqueta } from '@/componentes/iconosDominio';
import { useAltoBarraInferior } from '@/componentes/TabBar';
import { colors, radius, spacing, typography } from '@/tema';
import { getMoodColor } from '@/tema/colors';
import { useTranslation } from '@/i18n';
import { useListaRegistros } from '@/stores/RegistroStore';
import { claveTraduccionEtiqueta } from '@/datos/catalogoBloques';
import { NIVELES_ANIMO, NivelAnimo } from '@/dominio';
import { weekdayName } from '@/utils/fecha';
import {
  animoConEtiqueta,
  distribucion,
  FranjaHoraria,
  franjaHoraria,
  frecuencias,
  mejorDiaSemana,
  promedio,
} from '@/servicios/MotorEstadistico';

const ICONOS_FRANJA: Record<FranjaHoraria, NombreIcono> = {
  MANANA: 'franjaManana',
  TARDE: 'franjaTarde',
  NOCHE: 'franjaNoche',
  MADRUGADA: 'franjaMadrugada',
};

const unDecimal = (n: number) => n.toFixed(1).replace('.', ',');

/**
 * Estadísticas (CU-17 y CU-18), calculadas en el dispositivo por el
 * MotorEstadistico. Cada número indica sobre cuántos días se calculó, y la
 * relación entre hábitos y ánimo se presenta como correlación, no causa.
 */
export const EstadisticasScreen: React.FC = () => {
  const { t, language } = useTranslation();
  const altoBarra = useAltoBarraInferior();
  const registros = useListaRegistros();

  const promedioAnimo = useMemo(() => promedio(registros), [registros]);
  const franja = useMemo(() => franjaHoraria(registros), [registros]);
  const masMarcadas = useMemo(() => frecuencias(registros, 6), [registros]);
  const porNivel = useMemo(() => distribucion(registros), [registros]);
  const mejorDia = useMemo(() => mejorDiaSemana(registros), [registros]);
  const segunHabito = useMemo(
    () =>
      masMarcadas
        .map((f) => ({ clave: f.clave, comparacion: animoConEtiqueta(registros, f.clave) }))
        .filter((x) => x.comparacion !== null)
        .map((x) => ({
          clave: x.clave,
          dias: x.comparacion!.dias,
          variacion: ((x.comparacion!.conEtiqueta - x.comparacion!.general) / x.comparacion!.general) * 100,
        }))
        .sort((a, b) => Math.abs(b.variacion) - Math.abs(a.variacion))
        .slice(0, 5),
    [masMarcadas, registros]
  );

  const total = registros.length;

  if (total === 0) {
    return (
      <ScreenContainer scroll contentStyle={styles.content}>
        <EncabezadoPantalla titulo={t('stats.title')} />
        <View style={styles.vacio}>
          <Icono nombre="estadisticas" tamano={32} color={colors.textTertiary} />
          <Text style={[typography.bodyMedium, styles.textoVacio]}>{t('stats.noData')}</Text>
        </View>
      </ScreenContainer>
    );
  }

  const maxNivel = Math.max(1, ...porNivel);
  const maxMarcada = Math.max(1, ...masMarcadas.map((m) => m.cantidad));

  return (
    <ScreenContainer scroll contentStyle={[styles.content, { paddingBottom: altoBarra + spacing.xl }]}>
      <EncabezadoPantalla
        titulo={t('stats.title')}
        antetitulo={t('stats.basedOn').replace('{dias}', String(total))}
      />

      <View style={styles.tiles}>
        <View style={styles.tile}>
          {promedioAnimo !== null && (
            <CaraAnimo nivel={Math.round(promedioAnimo) as NivelAnimo} tamano={26} />
          )}
          <Text style={[typography.statNumber, styles.valorTile]}>
            {promedioAnimo !== null ? unDecimal(promedioAnimo) : '—'}
          </Text>
          <Text style={[typography.micro, styles.etiquetaTile]}>{t('stats.average')}</Text>
        </View>
        <View style={styles.tile}>
          <Icono nombre="calendario" tamano={26} color={colors.accentStrong} />
          <Text style={[typography.headline, styles.valorTileTexto]} numberOfLines={1}>
            {mejorDia ? capitalizar(weekdayName(mejorDia.diaSemana, language)) : '—'}
          </Text>
          <Text style={[typography.micro, styles.etiquetaTile]}>{t('stats.bestWeekdayTitle')}</Text>
        </View>
        <View style={styles.tile}>
          {franja && <Icono nombre={ICONOS_FRANJA[franja]} tamano={26} color={colors.accentStrong} relleno />}
          <Text style={[typography.headline, styles.valorTileTexto]} numberOfLines={1}>
            {franja ? t(`stats.bucket.${franja}`) : '—'}
          </Text>
          <Text style={[typography.micro, styles.etiquetaTile]}>{t('stats.loggingTime')}</Text>
        </View>
      </View>

      <EncabezadoSeccion titulo={t('stats.distributionTitle')} />
      <View style={styles.tarjeta}>
        {[...NIVELES_ANIMO].reverse().map((nivel) => {
          const cantidad = porNivel[nivel - 1];
          const porcentaje = Math.round((cantidad / total) * 100);
          return (
            <View key={nivel} style={styles.filaBarra}>
              <CaraAnimo nivel={nivel} tamano={22} />
              <Text style={[typography.footnote, styles.etiquetaBarra]} numberOfLines={1}>
                {t(`mood.${nivel}`)}
              </Text>
              <View style={styles.pista}>
                {cantidad > 0 && (
                  <View
                    style={[
                      styles.barra,
                      { width: `${(cantidad / maxNivel) * 100}%`, backgroundColor: getMoodColor(nivel) },
                    ]}
                  />
                )}
              </View>
              <Text style={[typography.footnote, styles.valorBarra]}>{porcentaje}%</Text>
            </View>
          );
        })}
      </View>

      {masMarcadas.length > 0 && (
        <>
          <EncabezadoSeccion titulo={t('stats.topTags')} />
          <View style={styles.tarjeta}>
            {masMarcadas.map((m) => (
              <View key={m.clave} style={styles.filaBarra}>
                <Icono nombre={iconoDeEtiqueta(m.clave)} tamano={16} color={colors.textTertiary} />
                <Text style={[typography.footnote, styles.etiquetaBarra]} numberOfLines={1}>
                  {t(claveTraduccionEtiqueta(m.clave))}
                </Text>
                <View style={styles.pista}>
                  <View style={[styles.barra, { width: `${(m.cantidad / maxMarcada) * 100}%`, backgroundColor: colors.accent }]} />
                </View>
                <Text style={[typography.footnote, styles.valorBarra]}>{m.cantidad}</Text>
              </View>
            ))}
          </View>
        </>
      )}

      {segunHabito.length > 0 && (
        <>
          <EncabezadoSeccion titulo={t('stats.moodByHabit')} />
          <View style={styles.tarjeta}>
            {segunHabito.map((h) => {
              const sube = h.variacion >= 0;
              return (
                <View key={h.clave} style={styles.filaHabito}>
                  <Icono nombre={iconoDeEtiqueta(h.clave)} tamano={16} color={colors.textTertiary} />
                  <View style={styles.textosHabito}>
                    <Text style={[typography.bodyMedium, styles.nombreHabito]} numberOfLines={1}>
                      {t(claveTraduccionEtiqueta(h.clave))}
                    </Text>
                    <Text style={[typography.micro, styles.diasHabito]}>
                      {t('stats.overDays').replace('{dias}', String(h.dias))}
                    </Text>
                  </View>
                  <Icono
                    nombre={sube ? 'subida' : 'bajada'}
                    tamano={12}
                    color={sube ? colors.success : colors.danger}
                    peso="bold"
                  />
                  <Text style={[typography.numero, styles.variacion]}>
                    {sube ? '+' : '−'}
                    {Math.abs(Math.round(h.variacion))}%
                  </Text>
                </View>
              );
            })}
          </View>
          <Text style={[typography.micro, styles.nota]}>{t('stats.correlationNote')}</Text>
        </>
      )}
    </ScreenContainer>
  );
};

const capitalizar = (texto: string) => texto.charAt(0).toUpperCase() + texto.slice(1);

const styles = StyleSheet.create({
  content: {
    paddingTop: spacing.lg,
  },
  tiles: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tile: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    padding: spacing.md,
    gap: 6,
  },
  valorTile: {
    color: colors.textPrimary,
    fontSize: 26,
    lineHeight: 30,
  },
  valorTileTexto: {
    color: colors.textPrimary,
    marginTop: 4,
  },
  etiquetaTile: {
    color: colors.textTertiary,
  },
  tarjeta: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  filaBarra: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 40,
  },
  etiquetaBarra: {
    width: 88,
    color: colors.textSecondary,
  },
  pista: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.fill,
    overflow: 'hidden',
  },
  barra: {
    height: '100%',
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  valorBarra: {
    width: 40,
    textAlign: 'right',
    color: colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  filaHabito: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 52,
  },
  textosHabito: {
    flex: 1,
  },
  nombreHabito: {
    color: colors.textPrimary,
  },
  diasHabito: {
    color: colors.textTertiary,
    marginTop: 1,
  },
  variacion: {
    color: colors.textPrimary,
    minWidth: 48,
    textAlign: 'right',
  },
  nota: {
    color: colors.textTertiary,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xs,
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
