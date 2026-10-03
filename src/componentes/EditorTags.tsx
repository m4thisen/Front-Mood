import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { BlockChip } from './BlockChip';
import { GlowButton } from './GlowButton';
import { colors, radius, spacing, typography } from '@/tema';
import { useTranslation } from '@/i18n';
import { useSesionStore, useTagsActivos } from '@/stores/SesionStore';
import { ErrorTag, LARGO_MAXIMO_NOMBRE_TAG, TagPersonalizado, TipoTag } from '@/dominio';

const MENSAJES_ERROR: Record<ErrorTag, string> = {
  NOMBRE_VACIO: 'tags.errorEmpty',
  NOMBRE_REPETIDO: 'tags.errorRepeated',
  NOMBRE_MUY_LARGO: 'tags.errorTooLong',
};

/**
 * Crear y eliminar tags personalizados (CU-08). Se usa en el onboarding y en
 * Mi cuenta. Eliminar un tag lo desactiva: sus valores en días anteriores se
 * conservan (CU-08, flujo A).
 */
export const EditorTags: React.FC = () => {
  const { t } = useTranslation();
  const tags = useTagsActivos();
  const crearTag = useSesionStore((s) => s.crearTag);
  const desactivarTag = useSesionStore((s) => s.desactivarTag);

  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState<TipoTag>('SI_NO');
  const [error, setError] = useState<ErrorTag | null>(null);

  const agregar = async () => {
    const resultado = await crearTag(nombre, tipo);
    setError(resultado);
    if (!resultado) setNombre('');
  };

  const confirmarEliminacion = (tag: TagPersonalizado) => {
    Alert.alert(tag.nombre, t('tags.deleteConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('tags.delete'), style: 'destructive', onPress: () => desactivarTag(tag.id) },
    ]);
  };

  return (
    <View>
      {tags.length > 0 && (
        <View style={styles.chipsRow}>
          {tags.map((tag) => (
            <Pressable key={tag.id} onPress={() => confirmarEliminacion(tag)} style={styles.removableTag}>
              <Text style={[typography.bodyMedium, styles.removableTagText]}>
                {tag.nombre}
                {tag.tipo === 'TEXTO' ? ` · ${t('tags.typeText')}` : ''} ✕
              </Text>
            </Pressable>
          ))}
        </View>
      )}
      <TextInput
        value={nombre}
        onChangeText={(texto) => {
          setNombre(texto);
          setError(null);
        }}
        maxLength={LARGO_MAXIMO_NOMBRE_TAG}
        placeholder={t('account.newTagPlaceholder')}
        placeholderTextColor={colors.textTertiary}
        style={styles.tagInput}
      />
      {error && <Text style={[typography.caption, styles.error]}>{t(MENSAJES_ERROR[error])}</Text>}
      <View style={styles.tagTypeRow}>
        <BlockChip label={t('tags.typeYesNo')} selected={tipo === 'SI_NO'} onPress={() => setTipo('SI_NO')} />
        <BlockChip label={t('tags.typeText')} selected={tipo === 'TEXTO'} onPress={() => setTipo('TEXTO')} />
      </View>
      <GlowButton label={t('account.addCustomTag')} onPress={agregar} variant="secondary" />
    </View>
  );
};

const styles = StyleSheet.create({
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.sm,
  },
  removableTag: {
    backgroundColor: colors.surfaceElevatedAlt,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  removableTagText: {
    color: colors.textPrimary,
  },
  tagInput: {
    backgroundColor: colors.surfaceElevatedAlt,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    color: colors.textPrimary,
    fontFamily: 'Manrope_500Medium',
    fontSize: 14,
    marginTop: spacing.xs,
  },
  error: {
    color: colors.danger,
    marginTop: spacing.xs,
  },
  tagTypeRow: {
    flexDirection: 'row',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
});
