import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Icono } from './Icono';
import { colors, radius, spacing, typography } from '@/tema';
import { Cancion, LARGO_MAXIMO_CANCION } from '@/dominio';
import { MINIMO_LETRAS_BUSQUEDA } from '@/servicios/MusicaService';
import { hapticos } from '@/utils/hapticos';

interface Props {
  valor: Cancion | null;
  onCambio: (cancion: Cancion | null) => void;
  buscar: (consulta: string) => Promise<Cancion[]>;
  placeholder: string;
  /** Cuando aparecen los resultados: la pantalla los corre arriba del teclado, que si no los tapa. */
  alMostrarResultados?: (resultados: View) => void;
}

/** Cuánto se espera después de la última letra antes de buscar. */
const ESPERA_MS = 400;
const MAXIMO_RESULTADOS = 5;

type Estado = 'quieto' | 'buscando' | 'listo' | 'sinResultados' | 'sinBusqueda';

/**
 * La canción del día (CU-10): se escribe y se elige de lo que encuentra
 * Spotify. Si no se puede buscar (sin conexión, o Spotify no responde), se
 * guarda tal como se escribió: el registro nunca depende de Spotify.
 */
export const SelectorCancion: React.FC<Props> = ({ valor, onCambio, buscar, placeholder, alMostrarResultados }) => {
  const [texto, setTexto] = useState(valor && !valor.spotifyId ? valor.titulo : '');
  const [resultados, setResultados] = useState<Cancion[]>([]);
  const [estado, setEstado] = useState<Estado>('quieto');
  // Lo que ya estaba guardado no se busca solo: recién cuando escribe.
  const [escribio, setEscribio] = useState(false);
  // Solo vale la respuesta de la última búsqueda: las anteriores pueden llegar tarde.
  const ultima = useRef(0);
  const refResultados = useRef<View>(null);

  useEffect(() => {
    if (resultados.length === 0 || !alMostrarResultados) return;
    // Recién después de que se dibujan, para medir su alto real.
    const cuadro = requestAnimationFrame(() => refResultados.current && alMostrarResultados(refResultados.current));
    return () => cancelAnimationFrame(cuadro);
  }, [resultados, alMostrarResultados]);

  useEffect(() => {
    const consulta = texto.trim();
    const numero = ++ultima.current;
    if (!escribio || consulta.length < MINIMO_LETRAS_BUSQUEDA) {
      setResultados([]);
      setEstado('quieto');
      return;
    }
    const espera = setTimeout(() => {
      setEstado('buscando');
      buscar(consulta)
        .then((encontradas) => {
          if (numero !== ultima.current) return;
          setResultados(encontradas.slice(0, MAXIMO_RESULTADOS));
          setEstado(encontradas.length > 0 ? 'listo' : 'sinResultados');
        })
        .catch(() => {
          if (numero !== ultima.current) return;
          setResultados([]);
          setEstado('sinBusqueda');
        });
    }, ESPERA_MS);
    return () => clearTimeout(espera);
  }, [texto, escribio, buscar]);

  const escribir = (nuevo: string) => {
    setTexto(nuevo);
    setEscribio(true);
    // Mientras no elija una, queda lo escrito.
    onCambio(nuevo.trim() ? { spotifyId: '', titulo: nuevo.trim(), artista: '', portadaUrl: null } : null);
  };

  const elegir = (cancion: Cancion) => {
    hapticos.seleccion();
    ultima.current++;
    setTexto('');
    setResultados([]);
    setEstado('quieto');
    onCambio(cancion);
  };

  const quitar = () => {
    setTexto('');
    onCambio(null);
  };

  if (valor?.spotifyId) {
    return (
      <View style={[styles.campo, styles.elegida]}>
        <Portada url={valor.portadaUrl} />
        <View style={styles.datos}>
          <Text style={[typography.bodyMedium, styles.titulo]} numberOfLines={1}>
            {valor.titulo}
          </Text>
          <Text style={[typography.footnote, styles.artista]} numberOfLines={1}>
            {valor.artista}
          </Text>
        </View>
        <Pressable onPress={quitar} hitSlop={12} accessibilityRole="button" accessibilityLabel="Quitar la canción">
          <Icono nombre="cerrar" tamano={14} color={colors.textTertiary} peso="semibold" />
        </Pressable>
      </View>
    );
  }

  return (
    <View>
      <View style={styles.campo}>
        <Icono nombre="cancion" tamano={16} color={colors.textTertiary} />
        <TextInput
          value={texto}
          onChangeText={escribir}
          maxLength={LARGO_MAXIMO_CANCION}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          style={[typography.bodyMedium, styles.entrada]}
          returnKeyType="done"
          autoCorrect={false}
        />
        {estado === 'buscando' && <ActivityIndicator size="small" color={colors.textTertiary} />}
      </View>
      {resultados.length > 0 && (
        <View ref={refResultados} style={styles.resultados}>
          {resultados.map((cancion, i) => (
            <Pressable
              key={cancion.spotifyId}
              onPress={() => elegir(cancion)}
              style={({ pressed }) => [styles.resultado, i > 0 && styles.separador, pressed && styles.presionado]}
              accessibilityRole="button"
              accessibilityLabel={`${cancion.titulo}, de ${cancion.artista}`}
            >
              <Portada url={cancion.portadaUrl} />
              <View style={styles.datos}>
                <Text style={[typography.bodyMedium, styles.titulo]} numberOfLines={1}>
                  {cancion.titulo}
                </Text>
                <Text style={[typography.footnote, styles.artista]} numberOfLines={1}>
                  {cancion.artista}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}
      {estado === 'sinResultados' && (
        <Text style={[typography.footnote, styles.aviso]}>No la encontramos en Spotify: se guarda como la escribiste.</Text>
      )}
      {estado === 'sinBusqueda' && (
        <Text style={[typography.footnote, styles.aviso]}>Ahora no se puede buscar en Spotify: se guarda como la escribiste.</Text>
      )}
    </View>
  );
};

const Portada: React.FC<{ url: string | null }> = ({ url }) =>
  url ? (
    <Image source={{ uri: url }} style={styles.portada} accessibilityIgnoresInvertColors />
  ) : (
    <View style={[styles.portada, styles.sinPortada]}>
      <Icono nombre="cancion" tamano={14} color={colors.textTertiary} />
    </View>
  );

const styles = StyleSheet.create({
  campo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    minHeight: 50,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
  },
  elegida: {
    paddingVertical: spacing.sm,
  },
  entrada: {
    flex: 1,
    color: colors.textPrimary,
    paddingVertical: spacing.sm,
  },
  resultados: {
    marginTop: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    overflow: 'hidden',
  },
  resultado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  separador: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  presionado: {
    backgroundColor: colors.surfaceElevated,
  },
  portada: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
  },
  sinPortada: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceElevated,
  },
  datos: {
    flex: 1,
  },
  titulo: {
    color: colors.textPrimary,
  },
  artista: {
    color: colors.textSecondary,
  },
  aviso: {
    color: colors.textTertiary,
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
  },
});
