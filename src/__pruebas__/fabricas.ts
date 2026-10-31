import { Devolucion, NivelAnimo, RegistroDiario } from '@/dominio';

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

/** Una devolución como la que manda el servidor. */
export function devolucion(tipo: 'rapida' | 'semanal', hasta: string, extra: Partial<Devolucion> = {}): Devolucion {
  return {
    id: `devolucion-${tipo}-${hasta}`,
    tipo,
    idioma: 'es',
    desde: hasta,
    hasta,
    generadaEn: `${hasta}T22:00:00.000Z`,
    titulo: 'Un día tranquilo',
    resumen: 'Hoy estuviste como siempre.',
    patrones: [{ marca: 'entreno', nombre: 'entrenar', texto: 'Los días que te movés solés estar mejor.', efecto: 0.5, dias: 6 }],
    manana: null,
    sugerencia: 'Date un rato para vos.',
    canciones: tipo === 'rapida' ? [{ spotifyId: 'abc123', titulo: 'Gracias a la vida', artista: 'Mercedes Sosa', portadaUrl: null }] : [],
    ...extra,
  };
}
