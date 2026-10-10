import React, { useState } from 'react';
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
import { ErrorIngreso, useSesionStore } from '@/stores/SesionStore';
import { RootStackParamList } from '@/navegacion/tipos';
import { hapticos } from '@/utils/hapticos';

type Props = NativeStackScreenProps<RootStackParamList, 'Bienvenida'>;

type Accion = 'registro' | 'ingreso' | 'prueba';

const MENSAJES: Record<Exclude<ErrorIngreso, 'NO_SE_PUDO'>, string> = {
  SIN_CONEXION: 'No pudimos conectarnos. Revisá tu conexión y probá de nuevo.',
  DEMASIADOS_INTENTOS: 'Hubo demasiados intentos seguidos. Esperá un minuto y probá de nuevo.',
};

/**
 * Bienvenida (CU-01 y CU-02). Solo se entra con cuenta de Google: "Crear
 * cuenta" e "Iniciar sesión" usan el mismo endpoint (POST /auth/google) y
 * es el servidor el que decide si crea o si entra. En desarrollo también se
 * puede entrar con una cuenta de prueba o con la cuenta demo.
 */
export const BienvenidaScreen: React.FC<Props> = () => {
  const { t, language, setLanguage } = useTranslation();
  const iniciarSesion = useSesionStore((s) => s.iniciarSesion);
  const entrarConCuentaDemo = useSesionStore((s) => s.entrarConCuentaDemo);
  const sesionVencida = useSesionStore((s) => s.sesionVencida);
  const [enCurso, setEnCurso] = useState<Accion | null>(null);
  const [error, setError] = useState<ErrorIngreso | null>(null);

  const ingresar = async (accion: Accion) => {
    setError(null);
    setEnCurso(accion);
    const resultado = await iniciarSesion(language, accion === 'prueba');
    setEnCurso(null);
    if (resultado) {
      setError(resultado);
      hapticos.error();
    }
  };

  const aviso = error
    ? error === 'NO_SE_PUDO'
      ? t('welcome.googleError')
      : MENSAJES[error]
    : sesionVencida
      ? 'Tu sesión se cerró. Volvé a entrar para seguir.'
      : null;

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
        {aviso && (
          <Text style={[typography.footnote, styles.aviso, error && styles.error]} accessibilityLiveRegion="polite">
            {aviso}
          </Text>
        )}
        <Boton
          titulo={t('welcome.register')}
          onPress={() => ingresar('registro')}
          cargando={enCurso === 'registro'}
          deshabilitado={enCurso !== null}
        />
        <Boton
          titulo={t('welcome.login')}
          variante="texto"
          onPress={() => ingresar('ingreso')}
          cargando={enCurso === 'ingreso'}
          deshabilitado={enCurso !== null}
        />
        {__DEV__ && (
          <>
            <Boton
              titulo="Cuenta de prueba (desarrollo)"
              variante="texto"
              onPress={() => ingresar('prueba')}
              cargando={enCurso === 'prueba'}
              deshabilitado={enCurso !== null}
            />
            <Boton
              titulo="Cuenta demo (desarrollo)"
              variante="texto"
              onPress={() => entrarConCuentaDemo(language)}
              deshabilitado={enCurso !== null}
            />
          </>
        )}
        <Text style={[typography.micro, styles.descargo]}>{t('welcome.disclaimer')}</Text>
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
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  error: {
    color: colors.danger,
  },
  descargo: {
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
