import React, { useState } from 'react';
import { Keyboard, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format, parseISO } from 'date-fns';
import { PasoOnboarding } from '@/componentes/PasoOnboarding';
import { Boton } from '@/componentes/Boton';
import { Chip } from '@/componentes/Chip';
import { Icono } from '@/componentes/Icono';
import { HojaInferior } from '@/componentes/HojaInferior';
import { colors, radius, spacing, typography } from '@/tema';
import { useTranslation } from '@/i18n';
import { useSesionStore } from '@/stores/SesionStore';
import { RootStackParamList } from '@/navegacion/tipos';
import { calcularEdad, Genero, GENEROS } from '@/dominio';
import { dateLocale, localeSelector, toISODate } from '@/utils/fecha';

type Props = NativeStackScreenProps<RootStackParamList, 'DatosBasicos'>;

/** Paso 1 del onboarding (CU-04): nombre, fecha de nacimiento y género. */
export const DatosBasicosScreen: React.FC<Props> = ({ navigation }) => {
  const { t, language } = useTranslation();
  const usuario = useSesionStore((s) => s.usuario);
  const actualizarPreferencias = useSesionStore((s) => s.actualizarPreferencias);
  const cerrarSesion = useSesionStore((s) => s.cerrarSesion);

  const [nombre, setNombre] = useState(usuario?.nombre ?? '');
  const [nacimiento, setNacimiento] = useState<Date | null>(
    usuario?.fechaNacimiento ? parseISO(usuario.fechaNacimiento) : null
  );
  const [borradorNacimiento, setBorradorNacimiento] = useState<Date>(nacimiento ?? new Date(2000, 0, 1, 12));
  const [eligiendoFecha, setEligiendoFecha] = useState(false);
  const [genero, setGenero] = useState<Genero>(usuario?.genero ?? 'PREFIERO_NO_DECIR');

  // CU-04, E1: no se puede avanzar sin nombre ni fecha de nacimiento.
  const completo = nombre.trim().length > 0 && nacimiento !== null;

  const continuar = async () => {
    await actualizarPreferencias({
      nombre: nombre.trim(),
      fechaNacimiento: nacimiento ? toISODate(nacimiento) : '',
      genero,
    });
    navigation.navigate('Bloques');
  };

  return (
    <PasoOnboarding
      paso={0}
      titulo={t('register.title')}
      subtitulo={t('register.subtitle')}
      onAtras={cerrarSesion}
      pie={<Boton titulo={t('common.continue')} onPress={continuar} deshabilitado={!completo} />}
    >
      <Text style={[typography.seccion, styles.etiqueta]}>{t('register.name')}</Text>
      <TextInput
        value={nombre}
        onChangeText={setNombre}
        placeholder={t('register.namePlaceholder')}
        placeholderTextColor={colors.textTertiary}
        style={[typography.bodyMedium, styles.campo]}
        autoCapitalize="words"
        returnKeyType="done"
      />

      <Text style={[typography.seccion, styles.etiqueta]}>{t('register.birthDate')}</Text>
      <Pressable
        onPress={() => {
          Keyboard.dismiss();
          setEligiendoFecha(true);
        }}
        style={({ pressed }) => [styles.campo, styles.campoFecha, pressed && styles.presionado]}
        accessibilityRole="button"
      >
        <Text style={[typography.bodyMedium, { color: nacimiento ? colors.textPrimary : colors.textTertiary }]}>
          {nacimiento
            ? format(nacimiento, "d 'de' MMMM 'de' yyyy", { locale: dateLocale(language) })
            : t('register.birthDatePlaceholder')}
        </Text>
        <Icono nombre="calendario" tamano={16} color={colors.textTertiary} />
      </Pressable>
      {nacimiento && (
        <Text style={[typography.footnote, styles.edad]}>
          {t('register.age').replace('{edad}', String(calcularEdad(toISODate(nacimiento))))}
        </Text>
      )}

      <Text style={[typography.seccion, styles.etiqueta]}>{t('register.gender')}</Text>
      <View style={styles.chips}>
        {GENEROS.map((g) => (
          <Chip key={g} etiqueta={t(`register.gender.${g}`)} seleccionado={genero === g} onPress={() => setGenero(g)} />
        ))}
      </View>

      <HojaInferior
        visible={eligiendoFecha}
        titulo={t('register.birthDate')}
        onCerrar={() => setEligiendoFecha(false)}
        pie={
          <Boton
            titulo={t('common.done')}
            onPress={() => {
              setNacimiento(borradorNacimiento);
              setEligiendoFecha(false);
            }}
          />
        }
      >
        <DateTimePicker
          value={borradorNacimiento}
          mode="date"
          display="spinner"
          style={{ height: 216 }}
          maximumDate={new Date()}
          onChange={(_e, fecha) => fecha && setBorradorNacimiento(fecha)}
          themeVariant="dark"
          locale={localeSelector(language)}
        />
      </HojaInferior>
    </PasoOnboarding>
  );
};

const styles = StyleSheet.create({
  etiqueta: {
    color: colors.textTertiary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  campo: {
    minHeight: 52,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    color: colors.textPrimary,
  },
  campoFecha: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  presionado: {
    opacity: 0.7,
  },
  edad: {
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
