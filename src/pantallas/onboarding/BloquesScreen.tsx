import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PasoOnboarding } from '@/componentes/PasoOnboarding';
import { Boton } from '@/componentes/Boton';
import { Icono } from '@/componentes/Icono';
import { iconoDeBloque } from '@/componentes/iconosDominio';
import { colors, radius, spacing, typography } from '@/tema';
import { hapticos } from '@/utils/hapticos';
import { useTranslation } from '@/i18n';
import { useSesionStore } from '@/stores/SesionStore';
import { RootStackParamList } from '@/navegacion/tipos';
import { BLOQUES, claveTraduccionBloque, claveTraduccionEtiqueta } from '@/datos/catalogoBloques';

type Props = NativeStackScreenProps<RootStackParamList, 'Bloques'>;

/**
 * Paso 2 del onboarding: qué bloques de seguimiento aparecen en el registro
 * diario. Ninguno viene activo por defecto y se puede seguir sin elegir
 * ninguno (CU-04, flujo A): se cambian después desde Mi cuenta.
 */
export const BloquesScreen: React.FC<Props> = ({ navigation }) => {
  const { t } = useTranslation();
  const usuario = useSesionStore((s) => s.usuario);
  const actualizarPreferencias = useSesionStore((s) => s.actualizarPreferencias);
  const [elegidos, setElegidos] = useState<Set<string>>(new Set(usuario?.bloquesActivos ?? []));

  const alternar = (clave: string) => {
    hapticos.seleccion();
    setElegidos((previos) => {
      const siguientes = new Set(previos);
      if (siguientes.has(clave)) siguientes.delete(clave);
      else siguientes.add(clave);
      return siguientes;
    });
  };

  const continuar = async () => {
    await actualizarPreferencias({ bloquesActivos: Array.from(elegidos) });
    navigation.navigate('Tags');
  };

  return (
    <PasoOnboarding
      paso={1}
      titulo={t('steps.blocksTitle')}
      subtitulo={t('steps.blocksSubtitle')}
      onAtras={() => navigation.goBack()}
      pie={
        <Boton
          titulo={
            elegidos.size > 0
              ? t('steps.blocksContinue').replace('{n}', String(elegidos.size))
              : t('common.skip')
          }
          variante={elegidos.size > 0 ? 'primario' : 'secundario'}
          onPress={continuar}
        />
      }
    >
      <View style={styles.grilla}>
        {BLOQUES.map((bloque) => {
          const elegido = elegidos.has(bloque.clave);
          return (
            <Pressable
              key={bloque.clave}
              onPress={() => alternar(bloque.clave)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: elegido }}
              style={({ pressed }) => [styles.tarjeta, elegido && styles.tarjetaElegida, pressed && styles.presionada]}
            >
              <View style={styles.filaSuperior}>
                <View style={[styles.cuadroIcono, elegido && styles.cuadroIconoElegido]}>
                  <Icono
                    nombre={iconoDeBloque(bloque.clave)}
                    tamano={16}
                    relleno={elegido}
                    color={elegido ? colors.background : colors.textSecondary}
                  />
                </View>
                {elegido && <Icono nombre="check" tamano={14} color={colors.accentStrong} peso="bold" />}
              </View>
              <Text style={[typography.headline, styles.nombre]}>{t(claveTraduccionBloque(bloque.clave))}</Text>
              <Text style={[typography.micro, styles.ejemplos]} numberOfLines={2}>
                {bloque.etiquetas.map((e) => t(claveTraduccionEtiqueta(e.clave))).join(' · ')}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </PasoOnboarding>
  );
};

const styles = StyleSheet.create({
  grilla: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: spacing.md,
  },
  tarjeta: {
    width: '48%',
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tarjetaElegida: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
  },
  presionada: {
    opacity: 0.75,
  },
  filaSuperior: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  cuadroIcono: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: colors.fillStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cuadroIconoElegido: {
    backgroundColor: colors.accentStrong,
  },
  nombre: {
    color: colors.textPrimary,
  },
  ejemplos: {
    color: colors.textTertiary,
    marginTop: 4,
  },
});
