/**
 * Cuenta de demostración con varias semanas de historial (Fase 5: "una
 * cuenta de demostración con varias semanas de historial, identificada como
 * datos de demostración"). Solo se ofrece en desarrollo.
 *
 * Los datos son pseudoaleatorios pero determinísticos (siempre los mismos) y
 * tienen correlaciones a propósito: los días con ejercicio o buen sueño
 * tienden a tener mejor ánimo, para que las estadísticas muestren algo.
 */
import { subDays } from 'date-fns';
import { Clima, NivelAnimo, RegistroDiario, TagPersonalizado, Usuario, zonaHorariaDelDispositivo } from '@/dominio';
import * as RegistroLocal from '@/persistencia/RegistroLocalRepository';
import * as UsuarioLocal from '@/persistencia/UsuarioLocalRepository';
import { toISODate } from '@/utils/fecha';

export const ID_USUARIO_DEMO = 'demo-0000-0000-0000-000000000001';
const DIAS = 60;

const azar = (n: number) => {
  const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};
const elegir = <T,>(lista: T[], n: number) => lista[Math.floor(azar(n) * lista.length)];

const TAG_MEDITE: TagPersonalizado = { id: 'demo-tag-medite', nombre: 'Medité', tipo: 'SI_NO', activo: true };

export async function cargarCuentaDemo(idioma: 'es' | 'en'): Promise<string> {
  const usuario: Usuario = {
    id: ID_USUARIO_DEMO,
    nombre: 'Demo',
    fechaNacimiento: '1999-05-14',
    genero: 'PREFIERO_NO_DECIR',
    idioma,
    horaRecordatorio: '21:30',
    frecuenciaIA: 1,
    zonaHoraria: zonaHorariaDelDispositivo(),
    bloquesActivos: ['emociones', 'gente', 'ejercicio', 'trabajo', 'descanso'],
    onboardingCompleto: true,
    analisisTexto: false,
  };
  await UsuarioLocal.guardar(usuario);
  await UsuarioLocal.guardarTags(usuario.id, [TAG_MEDITE]);

  const hoy = new Date();
  // Empieza en 1: el día de hoy queda libre para probar el registro.
  for (let i = 1; i <= DIAS; i += 1) {
    // Algunos días sin registrar (para que la racha tenga cortes), salvo la última semana.
    if (i > 7 && azar(i * 3.7) < 0.14) continue;
    const fecha = subDays(hoy, i);
    // Se puede cargar más de una vez: no pisa días que ya tienen registro.
    if (await RegistroLocal.obtenerPorFecha(usuario.id, toISODate(fecha))) continue;
    const hizoEjercicio = azar(i * 1.3) < 0.45;
    const horasSueno = Math.round((5 + azar(i * 2.1) * 4) * 2) / 2;
    const medito = azar(i * 5.9) < 0.3;

    const base = 2.4 + (hizoEjercicio ? 0.9 : 0) + (horasSueno >= 7 ? 0.6 : 0) + (medito ? 0.4 : 0);
    const nivel = Math.min(5, Math.max(1, Math.round(base + (azar(i * 7.3) - 0.5) * 2))) as NivelAnimo;

    const etiquetas = [
      hizoEjercicio ? elegir(['ejercicio.corri', 'ejercicio.gimnasio', 'ejercicio.camine', 'ejercicio.yoga'], i) : null,
      nivel >= 4 ? elegir(['emociones.alegria', 'emociones.calma'], i * 2) : elegir(['emociones.ansiedad', 'emociones.tristeza', 'emociones.enojo'], i * 2),
      azar(i * 4.4) < 0.5 ? elegir(['gente.saliConAmigos', 'gente.enFamilia', 'gente.estuveSolo'], i * 3) : null,
      azar(i * 6.1) < 0.6 ? elegir(['trabajo.reunionDificil', 'trabajo.saliATiempo', 'trabajo.logro', 'trabajo.horasExtras'], i * 4) : null,
      horasSueno >= 7.5 ? 'descanso.dormiBien' : horasSueno <= 5.5 ? 'descanso.dormiMal' : null,
    ].filter((e): e is string => e !== null);

    const climas: Clima[] = [elegir<Clima>(['SOLEADO', 'NUBLADO', 'LLUVIA', 'SOLEADO'], i * 8)];
    if (azar(i * 9.2) < 0.3) climas.push(elegir<Clima>(['FRIO', 'CALOR'], i * 9));

    const horaCarga = new Date(fecha);
    horaCarga.setHours(20 + Math.floor(azar(i * 2.9) * 3), Math.floor(azar(i * 3.3) * 60), 0, 0);

    const registro: RegistroDiario = {
      id: `demo-registro-${toISODate(fecha)}`,
      usuarioId: usuario.id,
      fecha: toISODate(fecha),
      nivelAnimo: nivel,
      destacado: azar(i * 11.1) < 0.08,
      texto: '',
      horasSueno,
      minutosEjercicio: hizoEjercicio ? 20 + Math.floor(azar(i * 12.7) * 7) * 10 : null,
      climas,
      etiquetas,
      valoresTags: medito ? { [TAG_MEDITE.id]: true } : {},
      cancion: null,
      horaCarga: horaCarga.toISOString(),
      actualizadoEn: horaCarga.toISOString(),
      sincronizado: true,
    };
    await RegistroLocal.guardar(registro);
  }

  await UsuarioLocal.guardarSesionActiva(usuario.id);
  return usuario.id;
}
