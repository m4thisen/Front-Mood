import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { SoulOrb } from '@/componentes/SoulOrb';
import { Boton } from '@/componentes/Boton';
import { Icono } from '@/componentes/Icono';
import { colors, radius, spacing, typography } from '@/tema';
import { moodScale } from '@/tema/colors';
import { useTranslation } from '@/i18n';
import { useSesionStore } from '@/stores/SesionStore';
import { RootStackParamList } from '@/navegacion/tipos';
import { hapticos } from '@/utils/hapticos';

type Props = NativeStackScreenProps<RootStackParamList, 'Bienvenida'>;

/**
 * Bienvenida (CU-01 y CU-02). Solo se entra con cuenta de Google: "Crear
 * cuenta" e "Iniciar sesión" usan el mismo endpoint (POST /auth/google) y
 * es el servidor el que decide si crea o si entra. El flujo con Google se
 * conecta en la iteración 1; mientras tanto ambos botones abren el
 * onboarding.
 */
export const BienvenidaScreen: React.FC<Props> = () => {
  const { t, language, setLanguage } = useTranslation();
  const iniciarSesion = useSesionStore((s) => s.iniciarSesion);
  const entrarConCuentaDemo = useSesionStore((s) => s.entrarConCuentaDemo);

  const ingresar = () => iniciarSesion(language);

  return (
    <SafeAreaView style={styles.pantalla}>
      <View style={styles.barra}>
        <View style={styles.idioma}>
          <Icono nombre="idioma" tamano={13} color={colors.textTertiary} />
          {(['es', 'en'] as const).map((idioma) => (
            <Pressable
              key={idioma}
              onPress={() => {
                hapticos.seleccion();
                setLanguage(idioma);
              }}
              style={[styles.opcionIdioma, language === idioma && styles.opcionIdiomaActiva]}
              accessibilityRole="button"
              accessibilityState={{ selected: language === idioma }}
            >
              <Text style={[typography.footnote, { color: language === idioma ? colors.textPrimary : colors.textTertiary }]}>
                {idioma.toUpperCase()}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.hero}>
        <Animated.View entering={FadeIn.duration(900)}>
          <SoulOrb color={moodScale[3].color} size={156} />
        </Animated.View>
        <Animated.Text entering={FadeInDown.delay(200).duration(600)} style={[typography.displayXL, styles.titulo]}>
          {t('appName')}
        </Animated.Text>
        <Animated.Text entering={FadeInDown.delay(320).duration(600)} style={[typography.body, styles.descripcion]}>
          {t('welcome.description')}
        </Animated.Text>
      </View>

      <Animated.View entering={FadeInDown.delay(450).duration(600)} style={styles.acciones}>
        <Boton titulo={t('welcome.register')} onPress={ingresar} />
        <Boton titulo={t('welcome.login')} variante="texto" onPress={ingresar} />
        {__DEV__ && (
          <Boton titulo="Cuenta demo (desarrollo)" variante="texto" onPress={() => entrarConCuentaDemo(language)} />
        )}
        <Text style={[typography.micro, styles.aviso]}>{t('welcome.disclaimer')}</Text>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: colors.background,
  },
  barra: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
  },
  idioma: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingLeft: spacing.sm,
    padding: 3,
    borderRadius: radius.pill,
    backgroundColor: colors.fill,
  },
  opcionIdioma: {
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  opcionIdiomaActiva: {
    backgroundColor: colors.surfaceElevatedAlt,
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  titulo: {
    color: colors.textPrimary,
    marginTop: spacing.xxl,
  },
  descripcion: {
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  acciones: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.sm,
  },
  aviso: {
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
