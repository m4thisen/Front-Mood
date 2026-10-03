import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { isAfter, isSameMonth, isToday, startOfDay } from 'date-fns';
import { BotonIcono } from './Encabezados';
import { Icono } from './Icono';
import { Idioma, NIVELES_ANIMO, RegistroDiario } from '@/dominio';
import { colors, radius, spacing, typography } from '@/tema';
import { getMoodColor } from '@/tema/colors';
import { getMonthGrid, monthLabel, toISODate, weekdayLabels } from '@/utils/fecha';
import { hapticos } from '@/utils/hapticos';

interface Props {
  anio: number;
  /** 0 = enero. */
  mes: number;
  registros: Record<string, RegistroDiario>;
  idioma: Idioma;
  etiquetaMuyMal: string;
  etiquetaGenial: string;
  onSeleccionarDia: (fecha: string) => void;
  onMesAnterior: () => void;
  onMesSiguiente: () => void;
  onSeleccionarAnio: (anio: number) => void;
}

/**
 * Mapa de calor del mes (CU-14): cada día registrado se pinta del color de
 * su ánimo, de modo que el mes entero se lee de un vistazo. Los días
 * destacados llevan un punto dorado y hoy, un anillo.
 */
export const CalendarioAnimo: React.FC<Props> = ({
  anio,
  mes,
  registros,
  idioma,
  etiquetaMuyMal,
  etiquetaGenial,
  onSeleccionarDia,
  onMesAnterior,
  onMesSiguiente,
  onSeleccionarAnio,
}) => {
  const semanas = getMonthGrid(anio, mes);
  const fechaMes = new Date(anio, mes, 1);
  const diasSemana = weekdayLabels(idioma);
  const hoy = startOfDay(new Date());
  const [verAnios, setVerAnios] = useState(false);
  const anioActual = new Date().getFullYear();
  const anios = Array.from({ length: 6 }, (_, i) => anioActual - 5 + i);
  const titulo = monthLabel(anio, mes, idioma);

  return (
    <View>
      <View style={styles.cabecera}>
        <Pressable
          onPress={() => {
            hapticos.seleccion();
            setVerAnios((v) => !v);
          }}
          hitSlop={8}
          style={styles.botonMes}
          accessibilityRole="button"
        >
          <Text style={[typography.headline, styles.mes]}>{titulo.charAt(0).toUpperCase() + titulo.slice(1)}</Text>
          <Icono nombre="desplegar" tamano={12} color={colors.accentStrong} peso="bold" />
        </Pressable>
        <View style={styles.flechas}>
          <BotonIcono icono="atras" etiqueta="Mes anterior" onPress={onMesAnterior} tamano={32} />
          <BotonIcono icono="adelante" etiqueta="Mes siguiente" onPress={onMesSiguiente} tamano={32} />
        </View>
      </View>

      {verAnios && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.anios}>
          {anios.map((a) => (
            <Pressable
              key={a}
              onPress={() => {
                hapticos.seleccion();
                onSeleccionarAnio(a);
                setVerAnios(false);
              }}
              style={[styles.anio, a === anio && styles.anioActivo]}
            >
              <Text style={[typography.footnote, { color: a === anio ? colors.background : colors.textSecondary }]}>
                {a}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      <View style={styles.fila}>
        {diasSemana.map((d, i) => (
          <Text key={i} style={[typography.micro, styles.diaSemana]}>
            {d}
          </Text>
        ))}
      </View>

      {semanas.map((semana, si) => (
        <View key={si} style={styles.fila}>
          {semana.map((dia) => {
            const enMes = isSameMonth(dia, fechaMes);
            const fecha = toISODate(dia);
            const registro = enMes ? registros[fecha] : undefined;
            const esHoy = isToday(dia);
            const futuro = isAfter(dia, hoy);

            return (
              <Pressable
                key={fecha}
                onPress={() => {
                  hapticos.seleccion();
                  onSeleccionarDia(fecha);
                }}
                disabled={!enMes || futuro}
                accessibilityLabel={fecha}
                style={styles.celda}
              >
                {enMes && (
                  <View
                    style={[
                      styles.dia,
                      registro && { backgroundColor: getMoodColor(registro.nivelAnimo) },
                      esHoy && styles.hoy,
                    ]}
                  >
                    <Text
                      style={[
                        typography.footnote,
                        styles.numero,
                        registro && styles.numeroSobreColor,
                        futuro && styles.numeroFuturo,
                      ]}
                    >
                      {dia.getDate()}
                    </Text>
                    {registro?.destacado && <View style={styles.puntoDestacado} />}
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      ))}

      <View style={styles.leyenda}>
        <Text style={[typography.micro, styles.textoLeyenda]}>{etiquetaMuyMal}</Text>
        {NIVELES_ANIMO.map((nivel) => (
          <View key={nivel} style={[styles.puntoLeyenda, { backgroundColor: getMoodColor(nivel) }]} />
        ))}
        <Text style={[typography.micro, styles.textoLeyenda]}>{etiquetaGenial}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  botonMes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mes: {
    color: colors.textPrimary,
  },
  flechas: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  anios: {
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  anio: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.fill,
  },
  anioActivo: {
    backgroundColor: colors.accent,
  },
  fila: {
    flexDirection: 'row',
  },
  diaSemana: {
    flex: 1,
    textAlign: 'center',
    color: colors.textTertiary,
    marginBottom: spacing.sm,
  },
  celda: {
    flex: 1,
    aspectRatio: 1,
    padding: 3,
  },
  dia: {
    flex: 1,
    borderRadius: 10,
    backgroundColor: colors.fill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hoy: {
    borderWidth: 2,
    borderColor: colors.textPrimary,
  },
  numero: {
    color: colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  numeroSobreColor: {
    color: 'rgba(5, 11, 30, 0.78)',
    fontFamily: 'Manrope_700Bold',
  },
  numeroFuturo: {
    opacity: 0.35,
  },
  puntoDestacado: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.gold,
    borderWidth: 1,
    borderColor: 'rgba(5, 11, 30, 0.5)',
  },
  leyenda: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.md,
  },
  puntoLeyenda: {
    width: 10,
    height: 10,
    borderRadius: 3,
  },
  textoLeyenda: {
    color: colors.textTertiary,
    marginHorizontal: 2,
  },
});
