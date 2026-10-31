import React from 'react';
import { Image, Linking, Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Icono } from './Icono';
import { colors, radius, spacing, typography } from '@/tema';
import { shade } from '@/utils/color';
import { Cancion, enlaceSpotify } from '@/dominio';
import { useTranslation } from '@/i18n';

const TAMANO_PORTADA = 136;

/** La canción en Spotify; si el servidor no la pudo encontrar, la búsqueda de Spotify con su nombre. */
const enlace = (cancion: Cancion) =>
  enlaceSpotify(cancion) ?? `https://open.spotify.com/search/${encodeURIComponent(`${cancion.titulo} ${cancion.artista}`)}`;

/**
 * Música para tu momento (RF-24): las canciones que sugirió la IA, con la
 * portada de Spotify. Tocarlas las abre en Spotify.
 */
export const CancionesDevolucion: React.FC<{ canciones: Cancion[]; colorBase: string }> = ({ canciones, colorBase }) => {
  const { t } = useTranslation();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carrusel} style={styles.desborde}>
      {canciones.map((cancion, i) => (
        <Pressable
          key={`${cancion.titulo}-${cancion.artista}`}
          onPress={() => void Linking.openURL(enlace(cancion))}
          style={({ pressed }) => [styles.item, pressed && styles.presionado]}
          accessibilityRole="link"
          accessibilityLabel={t('song.openInSpotify').replace('{titulo}', cancion.titulo).replace('{artista}', cancion.artista)}
        >
          {cancion.portadaUrl ? (
            <Image source={{ uri: cancion.portadaUrl }} style={styles.portada} accessibilityIgnoresInvertColors />
          ) : (
            // Sin portada: un degradé con el Color del Alma, como antes.
            <LinearGradient
              colors={[shade(colorBase, 0.3 - i * 0.1), colorBase, shade(colorBase, -0.4)]}
              start={{ x: 0.1, y: 0 }}
              end={{ x: 0.9, y: 1 }}
              style={styles.portada}
            >
              <Icono nombre="musica" tamano={30} color="rgba(255,255,255,0.92)" peso="semibold" />
            </LinearGradient>
          )}
          <Text style={[typography.bodyMedium, styles.titulo]} numberOfLines={1}>
            {cancion.titulo}
          </Text>
          <Text style={[typography.footnote, styles.artista]} numberOfLines={1}>
            {cancion.artista}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  // El carrusel llega hasta los bordes de la pantalla, como en Apple Music.
  desborde: {
    marginHorizontal: -spacing.xl,
  },
  carrusel: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  item: {
    width: TAMANO_PORTADA,
  },
  presionado: {
    opacity: 0.7,
  },
  portada: {
    width: TAMANO_PORTADA,
    height: TAMANO_PORTADA,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  titulo: {
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  artista: {
    color: colors.textTertiary,
    marginTop: 1,
  },
});
