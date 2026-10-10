import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Chip } from './Chip';
import { Boton } from './Boton';
import { Icono } from './Icono';
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
 * Crear, renombrar y eliminar tags personalizados (CU-08, RF-08). Se usa en
 * el onboarding y en Mi cuenta. Tocar un tag lo carga en el mismo campo para
 * cambiarle el nombre o eliminarlo; el tipo no se cambia, porque rompería los
 * valores ya cargados. Eliminar un tag lo desactiva: sus valores en días
 * anteriores se conservan (CU-08, flujo A).
 */
export const EditorTags: React.FC = () => {
  const { t } = useTranslation();
  const tags = useTagsActivos();
  const crearTag = useSesionStore((s) => s.crearTag);
  const renombrarTag = useSesionStore((s) => s.renombrarTag);
  const desactivarTag = useSesionStore((s) => s.desactivarTag);

  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState<TipoTag>('SI_NO');
  const [error, setError] = useState<ErrorTag | null>(null);
  const [editando, setEditando] = useState<TagPersonalizado | null>(null);

  const agregar = async () => {
    const resultado = await crearTag(nombre, tipo);
    setError(resultado);
    if (!resultado) setNombre('');
  };

  const empezarEdicion = (tag: TagPersonalizado) => {
    setEditando(tag);
    setNombre(tag.nombre);
    setError(null);
  };

  const terminarEdicion = () => {
    setEditando(null);
    setNombre('');
    setError(null);
  };

  const guardarNombre = async () => {
    if (!editando) return;
    const resultado = await renombrarTag(editando.id, nombre);
    setError(resultado);
    if (!resultado) terminarEdicion();
  };

  const confirmarEliminacion = (tag: TagPersonalizado) => {
    Alert.alert(tag.nombre, t('tags.deleteConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('tags.delete'),
        style: 'destructive',
        onPress: () => {
          void desactivarTag(tag.id);
          terminarEdicion();
        },
      },
    ]);
  };

  return (
    <View>
      {tags.length > 0 && (
        <View style={styles.chipsRow}>
          {tags.map((tag) => {
            const enEdicion = editando?.id === tag.id;
            return (
              <Pressable
                key={tag.id}
                onPress={() => (enEdicion ? terminarEdicion() : empezarEdicion(tag))}
                style={[styles.removableTag, enEdicion && styles.tagEnEdicion]}
                accessibilityRole="button"
                accessibilityHint="Cambiar el nombre o eliminar"
                accessibilityState={{ selected: enEdicion }}
              >
                <Icono nombre="tag" tamano={13} color={colors.textTertiary} />
                <Text style={[typography.footnote, styles.removableTagText]}>
                  {tag.nombre}
                  {tag.tipo === 'TEXTO' ? ` · ${t('tags.typeText')}` : ''}
                </Text>
                <Icono nombre="editar" tamano={11} color={enEdicion ? colors.accent : colors.textTertiary} />
              </Pressable>
            );
          })}
        </View>
      )}
      {tags.length > 0 && !editando && (
        <Text style={[typography.footnote, styles.pista]}>Tocá un tag para cambiarle el nombre o eliminarlo.</Text>
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
        style={[typography.bodyMedium, styles.tagInput]}
        returnKeyType="done"
        onSubmitEditing={() => nombre.trim() && (editando ? guardarNombre() : agregar())}
        submitBehavior="blurAndSubmit"
      />
      {error && <Text style={[typography.caption, styles.error]}>{t(MENSAJES_ERROR[error])}</Text>}
      {editando ? (
        <View style={styles.acciones}>
          <Boton
            titulo="Guardar nombre"
            icono="editar"
            onPress={guardarNombre}
            variante="secundario"
            deshabilitado={!nombre.trim()}
          />
          <Boton titulo="Eliminar tag" variante="peligro" onPress={() => confirmarEliminacion(editando)} />
          <Boton titulo={t('common.cancel')} variante="texto" onPress={terminarEdicion} />
        </View>
      ) : (
        <>
          <View style={styles.tagTypeRow}>
            <Chip etiqueta={t('tags.typeYesNo')} seleccionado={tipo === 'SI_NO'} onPress={() => setTipo('SI_NO')} />
            <Chip etiqueta={t('tags.typeText')} seleccionado={tipo === 'TEXTO'} onPress={() => setTipo('TEXTO')} />
          </View>
          <Text style={[typography.footnote, styles.pistaTipo]}>
            {t(tipo === 'SI_NO' ? 'tags.typeYesNoHint' : 'tags.typeTextHint')}
          </Text>
          <Boton
            titulo={t('account.addCustomTag')}
            icono="agregar"
            onPress={agregar}
            variante="secundario"
            deshabilitado={!nombre.trim()}
          />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  removableTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.fillStrong,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
  },
  removableTagText: {
    color: colors.textPrimary,
  },
  tagEnEdicion: {
    borderWidth: 1,
    borderColor: colors.accent,
  },
  pista: {
    color: colors.textTertiary,
    marginTop: -spacing.xs,
    marginBottom: spacing.md,
  },
  acciones: {
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  tagInput: {
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    minHeight: 52,
    paddingHorizontal: spacing.lg,
    color: colors.textPrimary,
  },
  error: {
    color: colors.danger,
    marginTop: spacing.xs,
  },
  tagTypeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  pistaTipo: {
    color: colors.textTertiary,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
});
