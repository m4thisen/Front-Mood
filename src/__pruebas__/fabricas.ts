import { NivelAnimo, RegistroDiario } from '@/dominio';

/** Registro mínimo para las pruebas: solo importan la fecha y el ánimo, salvo que se indique otra cosa. */
export function registro(
  fecha: string,
  nivelAnimo: NivelAnimo = 3,
  extra: Partial<RegistroDiario> = {}
): RegistroDiario {
  return {
    id: `id-${fecha}`,
    usuarioId: 'usuario-prueba',
    fecha,
    nivelAnimo,
    destacado: false,
    texto: '',
    horasSueno: null,
    minutosEjercicio: null,
    climas: [],
    etiquetas: [],
    valoresTags: {},
    cancion: null,
    horaCarga: `${fecha}T21:00:00.000-03:00`,
    actualizadoEn: `${fecha}T21:00:00.000-03:00`,
    sincronizado: false,
    ...extra,
  };
}
