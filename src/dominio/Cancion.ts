/**
 * Canción del catálogo de Spotify. Se guarda dentro del registro como una
 * fotografía del momento: el historial no depende de que Spotify siga
 * disponible.
 */
export interface Cancion {
  spotifyId: string;
  titulo: string;
  artista: string;
  portadaUrl: string | null;
}

/** El enlace no se guarda: se deriva del identificador. */
export function enlaceSpotify(cancion: Cancion): string | null {
  return cancion.spotifyId ? `https://open.spotify.com/track/${cancion.spotifyId}` : null;
}
