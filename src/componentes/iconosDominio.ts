/**
 * Qué ícono representa a cada concepto del dominio. Vive en la capa visual:
 * las entidades y el catálogo no saben nada de íconos.
 */
import { Clima } from '@/dominio';
import { NombreIcono } from './Icono';

const ICONOS_BLOQUE: Record<string, NombreIcono> = {
  estudios: 'bloqueEstudios',
  descanso: 'bloqueDescanso',
  hobbies: 'bloqueHobbies',
  emociones: 'bloqueEmociones',
  trabajo: 'bloqueTrabajo',
  autocuidado: 'bloqueAutocuidado',
  salud: 'bloqueSalud',
  amor: 'bloqueAmor',
  tiempo: 'bloqueTiempo',
  gente: 'bloqueGente',
  ejercicio: 'bloqueEjercicio',
  comidas: 'bloqueComidas',
  eventos: 'bloqueEventos',
};

export const iconoDeBloque = (claveBloque: string): NombreIcono => ICONOS_BLOQUE[claveBloque] ?? 'tag';

/** Las claves de etiqueta empiezan con la del bloque: "ejercicio.corri". */
export const iconoDeEtiqueta = (claveEtiqueta: string): NombreIcono => iconoDeBloque(claveEtiqueta.split('.')[0]);

export const ICONOS_CLIMA: Record<Clima, NombreIcono> = {
  SOLEADO: 'climaSoleado',
  NUBLADO: 'climaNublado',
  LLUVIA: 'climaLluvia',
  FRIO: 'climaFrio',
  CALOR: 'climaCalor',
};

/**
 * Ícono de algo que suele acompañar a la persona (un patrón de la
 * devolución), según su marca: "et.descanso.dormiBien", "clima.LLUVIA",
 * "tag.<id>", "entreno"…
 */
export function iconoDeMarca(marca: string): NombreIcono {
  if (marca === 'entreno') return 'ejercicio';
  if (marca === 'sueno') return 'sueno';
  const [tipo, ...resto] = marca.split('.');
  const valor = resto.join('.');
  switch (tipo) {
    case 'et':
      return iconoDeEtiqueta(valor);
    case 'clima':
      return ICONOS_CLIMA[valor as Clima] ?? 'climaNublado';
    case 'tag':
      return 'tag';
    case 'dia':
      return 'calendario';
    case 'ev':
    case 'previa':
    case 'res':
      return 'bloqueEventos';
    default:
      return 'habito';
  }
}
