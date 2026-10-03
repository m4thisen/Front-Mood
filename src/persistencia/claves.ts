/**
 * Claves de almacenamiento local. Todo lo del usuario queda separado por su
 * id: si otra cuenta inicia sesión en el mismo teléfono, no ve estos datos.
 */
const PREFIJO = '@mood/v2';

export const CLAVES = {
  sesionActiva: `${PREFIJO}/sesion-activa`,
  usuario: (usuarioId: string) => `${PREFIJO}/usuarios/${usuarioId}/perfil`,
  tags: (usuarioId: string) => `${PREFIJO}/usuarios/${usuarioId}/tags`,
  registros: (usuarioId: string) => `${PREFIJO}/usuarios/${usuarioId}/registros`,
  coachmarkHoyVisto: `${PREFIJO}/coachmark-hoy-visto`,
} as const;
