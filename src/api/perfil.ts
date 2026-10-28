/**
 * Forma en que el servidor manda el perfil y los tags (GET /usuarios/me y
 * GET /tags), y su traducción a las entidades de la app.
 */
import { FrecuenciaIA, Genero, Idioma, TagPersonalizado, TipoTag, Usuario } from '@/dominio';

export interface PerfilApi {
  id: string;
  email: string;
  nombre: string | null;
  /** yyyy-mm-dd */
  fechaNacimiento: string | null;
  genero: Genero | null;
  idioma: Idioma;
  /** HH:mm */
  horaRecordatorio: string;
  frecuenciaIa: FrecuenciaIA;
  zonaHoraria: string;
  onboardingCompleto: boolean;
  bloques: string[];
  /** Permiso para que Claude lea el texto libre. */
  analisisTexto: boolean;
}

export interface TagApi {
  id: string;
  nombre: string;
  tipo: TipoTag;
  activo: boolean;
}

/**
 * Cuerpo de PATCH /usuarios/me. El permiso para analizar el texto no va acá:
 * se manda solo cuando la persona lo cambia (PermisoTextoApi).
 */
export interface CambiosPerfilApi {
  nombre?: string;
  fechaNacimiento?: string;
  genero: Genero;
  idioma: Idioma;
  horaRecordatorio: string;
  frecuenciaIa: FrecuenciaIA;
  zonaHoraria: string;
  bloques: string[];
  onboardingCompleto?: true;
}

/** PATCH /usuarios/me con el permiso, y nada más. */
export interface PermisoTextoApi {
  analisisTexto: boolean;
}

/**
 * El perfil completo tal como está en el dispositivo. Lo que todavía no se
 * completó no se manda: el servidor no acepta un nombre vacío, y el
 * onboarding solo se puede marcar como completo, nunca desmarcar.
 */
export function aCambiosPerfil(usuario: Usuario): CambiosPerfilApi {
  return {
    ...(usuario.nombre.trim() ? { nombre: usuario.nombre.trim() } : {}),
    ...(usuario.fechaNacimiento ? { fechaNacimiento: usuario.fechaNacimiento } : {}),
    genero: usuario.genero,
    idioma: usuario.idioma,
    horaRecordatorio: usuario.horaRecordatorio,
    frecuenciaIa: usuario.frecuenciaIA,
    zonaHoraria: usuario.zonaHoraria,
    bloques: usuario.bloquesActivos,
    ...(usuario.onboardingCompleto ? { onboardingCompleto: true as const } : {}),
  };
}

/** Lo que todavía no se completó en el onboarding llega vacío del servidor. */
export function aUsuario(perfil: PerfilApi): Usuario {
  return {
    id: perfil.id,
    nombre: perfil.nombre ?? '',
    fechaNacimiento: perfil.fechaNacimiento ?? '',
    genero: perfil.genero ?? 'PREFIERO_NO_DECIR',
    idioma: perfil.idioma,
    horaRecordatorio: perfil.horaRecordatorio,
    frecuenciaIA: perfil.frecuenciaIa,
    zonaHoraria: perfil.zonaHoraria,
    bloquesActivos: perfil.bloques,
    onboardingCompleto: perfil.onboardingCompleto,
    analisisTexto: perfil.analisisTexto,
  };
}

export function aTag({ id, nombre, tipo, activo }: TagApi): TagPersonalizado {
  return { id, nombre, tipo, activo };
}
