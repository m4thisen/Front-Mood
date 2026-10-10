/**
 * Claves de AsyncStorage. Ahí solo quedan preferencias de interfaz de este
 * dispositivo; los datos del usuario viven en la base local (baseLocal).
 */
const PREFIJO = '@mood/v2';

export const CLAVES = {
  coachmarkHoyVisto: `${PREFIJO}/coachmark-hoy-visto`,
} as const;

/**
 * Hasta la iteración 1, el perfil, los tags y los registros se guardaban en
 * AsyncStorage con estas claves. Solo se usan para borrarlos.
 */
export const CLAVES_ANTERIORES = {
  sesionActiva: `${PREFIJO}/sesion-activa`,
  prefijoUsuarios: `${PREFIJO}/usuarios/`,
} as const;
