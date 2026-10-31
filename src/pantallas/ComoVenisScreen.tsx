import React, { useCallback } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/native';
import { format, parseISO } from 'date-fns';
import { ScreenContainer } from '@/componentes/ScreenContainer';
import { EncabezadoPantalla, EncabezadoSeccion } from '@/componentes/Encabezados';
import { TarjetaDevolucion } from '@/componentes/TarjetaDevolucion';
import { PatronesDevolucion } from '@/componentes/PatronesDevolucion';
import { CancionesDevolucion } from '@/componentes/CancionesDevolucion';
import { TarjetaCuidado } from '@/componentes/TarjetaCuidado';
import { entrada } from '@/componentes/animaciones';
import { Icono, NombreIcono } from '@/componentes/Icono';
import { useAltoBarraInferior } from '@/componentes/TabBar';
import { colors, radius, spacing, typography } from '@/tema';
import { useTranslation } from '@/i18n';
import { Devolucion } from '@/dominio';
import { useDevolucionStore } from '@/stores/DevolucionStore';
import { useIndicadoresProgreso, useRegistroStore } from '@/stores/RegistroStore';
import { dateLocale, todayISO } from '@/utils/fecha';

/**
 * "Cómo venís" (CU-21): las devoluciones que escribe la IA. Primero se ve la
 * última guardada en el teléfono y, al abrir la pantalla, se pide al servidor
 * la vigente: si toca una nueva (CU-19), el servidor la genera.
 *
 * Si el texto de hoy tiene señales claras de riesgo, en lugar de la
 * devolución va el mensaje de cuidado, y nada más.
 */
export const ComoVenisScreen: React.FC = () => {
  const { t, language } = useTranslation();
  const altoBarra = useAltoBarraInferior();
  const rapida = useDevolucionStore((s) => s.rapida);
  const semanal = useDevolucionStore((s) => s.semanal);
  const cuidado = useDevolucionStore((s) => s.cuidado);
  const pedido = useDevolucionStore((s) => s.pedido);
  const actualizar = useDevolucionStore((s) => s.actualizar);
  const hoy = todayISO();
  const registroDeHoy = useRegistroStore((s) => s.registros[hoy] ?? null);
  const { colorDelAlma } = useIndicadoresProgreso();

  useFocusEffect(
    useCallback(() => {
      void actualizar();
    }, [actualizar])
  );

  const locale = dateLocale(language);
  const dia = (fecha: string) => format(parseISO(fecha), "EEEE d 'de' MMMM", { locale });
  const cuandoRapida = (d: Devolucion) => (d.hasta === hoy ? 'Hoy' : d.desde === d.hasta ? `Del ${dia(d.hasta)}` : `Del ${dia(d.desde)} al ${dia(d.hasta)}`);
  const cuandoSemanal = (d: Devolucion) =>
    `Del ${format(parseISO(d.desde), 'EEEE d', { locale })} al ${format(parseISO(d.hasta), "EEEE d 'de' MMMM", { locale })}`;

  // Hay un registro de hoy más nuevo que la devolución: la que se ve puede no ser la última.
  const actualizando = pedido === 'pidiendo' && !!registroDeHoy && rapida?.hasta !== hoy;

  return (
    <ScreenContainer scroll contentStyle={[styles.content, { paddingBottom: altoBarra + spacing.xl }]}>
      <EncabezadoPantalla
        titulo={t('howYouAre.title')}
        antetitulo={cuidado ? 'Hoy' : rapida?.hasta === hoy ? t('howYouAre.subtitle') : 'Tu última devolución'}
      />

      {cuidado ? (
        <Animated.View entering={entrada()}>
          <TarjetaCuidado cuidado={cuidado} />
        </Animated.View>
      ) : (
        <>
          {actualizando && rapida && <Aviso icono="ia" texto="Armando la devolución de hoy…" cargando arriba />}

          {rapida ? (
            // Con la clave, una devolución nueva entra de nuevo en lugar de cambiar de golpe.
            <Animated.View key={rapida.id} entering={entrada()}>
              <TarjetaDevolucion devolucion={rapida} cuando={cuandoRapida(rapida)} />
            </Animated.View>
          ) : (
            <SinDevolucion pedido={pedido} registroDeHoy={!!registroDeHoy} />
          )}

          {rapida && rapida.patrones.length > 0 && (
            <Animated.View key={`patrones-${rapida.id}`} entering={entrada(1)}>
              <EncabezadoSeccion titulo="Lo que te viene acompañando" />
              <PatronesDevolucion patrones={rapida.patrones} />
            </Animated.View>
          )}

          {rapida && rapida.canciones.length > 0 && (
            <Animated.View key={`canciones-${rapida.id}`} entering={entrada(2)}>
              <EncabezadoSeccion titulo={t('ai.playlistsTitle')} />
              <CancionesDevolucion canciones={rapida.canciones} colorBase={colorDelAlma ?? colors.accent} />
            </Animated.View>
          )}

          {semanal ? (
            <Animated.View key={semanal.id} entering={entrada(3)}>
              <EncabezadoSeccion titulo="Tu semana" />
              <TarjetaDevolucion devolucion={semanal} cuando={cuandoSemanal(semanal)} />
            </Animated.View>
          ) : (
            <Aviso icono="calendario" texto={t('howYouAre.weeklyNotice')} />
          )}

          {pedido === 'sinConexion' && (rapida || semanal) && (
            <Aviso icono="ia" texto="Sin conexión: estás viendo la última devolución que se guardó en el teléfono." />
          )}

          <View style={styles.privacidad}>
            <Icono nombre="candado" tamano={11} color={colors.textTertiary} />
            <Text style={[typography.micro, styles.textoPrivacidad]}>{t('ai.privacy')}</Text>
          </View>
        </>
      )}
    </ScreenContainer>
  );
};

/** Todavía no hay devolución rápida: por qué, y qué la destraba. */
const SinDevolucion: React.FC<{ pedido: string; registroDeHoy: boolean }> = ({ pedido, registroDeHoy }) => {
  let texto: string;
  if (pedido === 'pidiendo') texto = 'Armando tu devolución…';
  else if (!registroDeHoy) texto = 'Registrá cómo estuvo tu día y te armamos tu devolución.';
  else if (pedido === 'sinConexion') texto = 'Sin conexión: tu devolución llega cuando vuelvas a tener internet.';
  else if (pedido === 'error') texto = 'No pudimos armar tu devolución ahora. Probá de nuevo en un rato.';
  else texto = 'Todavía no hay una devolución para hoy.';
  return (
    <View style={styles.vacia}>
      {pedido === 'pidiendo' ? (
        <ActivityIndicator color={colors.accentStrong} />
      ) : (
        <Icono nombre="ia" tamano={22} color={colors.accentStrong} peso="semibold" />
      )}
      <Text style={[typography.body, styles.textoVacia]}>{texto}</Text>
    </View>
  );
};

const Aviso: React.FC<{ icono: NombreIcono; texto: string; cargando?: boolean; arriba?: boolean }> = ({ icono, texto, cargando, arriba }) => (
  <View style={[styles.aviso, arriba && styles.avisoArriba]}>
    {cargando ? <ActivityIndicator size="small" color={colors.textTertiary} /> : <Icono nombre={icono} tamano={16} color={colors.textTertiary} />}
    <Text style={[typography.footnote, styles.textoAviso]}>{texto}</Text>
  </View>
);

const styles = StyleSheet.create({
  content: {
    paddingTop: spacing.lg,
  },
  vacia: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
  },
  textoVacia: {
    color: colors.textSecondary,
    textAlign: 'center',
  },
  aviso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.fill,
  },
  avisoArriba: {
    marginTop: 0,
    marginBottom: spacing.md,
  },
  textoAviso: {
    flex: 1,
    color: colors.textSecondary,
  },
  privacidad: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: spacing.xl,
  },
  textoPrivacidad: {
    flex: 1,
    color: colors.textTertiary,
  },
});
