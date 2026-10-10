import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ApiClient } from '@/api/ApiClient';
import { TagPersonalizado, Usuario } from '@/dominio';
import type { Pendientes } from '@/persistencia/UsuarioLocalRepository';
import { ServidorFalso, URL_FALSA } from '@/__pruebas__/servidorFalso';
import { DatosLocales, PreferenciasPendientes } from '../PreferenciasPendientes';

const ID = 'usuario-1';

const lucia: Usuario = {
  id: ID,
  nombre: '',
  fechaNacimiento: '',
  genero: 'PREFIERO_NO_DECIR',
  idioma: 'es',
  horaRecordatorio: '21:00',
  frecuenciaIA: 1,
  zonaHoraria: 'America/Argentina/Buenos_Aires',
  bloquesActivos: [],
  onboardingCompleto: false,
};

/** La base local del teléfono, en memoria. */
class TelefonoFalso implements DatosLocales {
  usuario: Usuario = { ...lucia };
  tags: TagPersonalizado[] = [];
  pendientes: Pendientes = { perfil: 0, tags: {} };

  obtener = async () => ({ ...this.usuario });
  obtenerTags = async () => this.tags.map((t) => ({ ...t }));
  obtenerPendientes = async () => structuredClone(this.pendientes);
  guardarPendientes = async (_id: string, p: Pendientes) => {
    this.pendientes = structuredClone(p);
  };
}

let servidor: ServidorFalso;
let telefono: TelefonoFalso;
let sesionDe: string;
let preferencias: PreferenciasPendientes;

beforeEach(() => {
  servidor = new ServidorFalso();
  telefono = new TelefonoFalso();
  sesionDe = ID;
  const { accessToken } = servidor.abrirSesion();
  const api = new ApiClient(
    URL_FALSA,
    { tokenAcceso: async () => accessToken, renovar: async () => null },
    servidor.fetch
  );
  preferencias = new PreferenciasPendientes(api, telefono, (id) => id === sesionDe);
});

async function cambiarPerfil(cambios: Partial<Usuario>) {
  telefono.usuario = { ...telefono.usuario, ...cambios };
  await preferencias.marcarPerfil(ID);
}

describe('PreferenciasPendientes · perfil (CU-04 a CU-07)', () => {
  it('manda el perfil completo y deja de estar pendiente', async () => {
    await cambiarPerfil({ nombre: 'Lucía', fechaNacimiento: '2002-05-14', bloquesActivos: ['estudios'] });

    await preferencias.enviar(ID);

    expect(servidor.perfil).toMatchObject({ nombre: 'Lucía', fechaNacimiento: '2002-05-14', bloques: ['estudios'] });
    expect(await preferencias.perfilPendiente(ID)).toBe(false);
  });

  it('lo que todavía no se completó no se manda (el servidor lo rechazaría)', async () => {
    await cambiarPerfil({ bloquesActivos: ['gente'] });

    await preferencias.enviar(ID);

    const enviado = servidor.pedidosA('/usuarios/me')[0].cuerpo;
    expect(enviado).not.toHaveProperty('nombre');
    expect(enviado).not.toHaveProperty('fechaNacimiento');
    expect(enviado).not.toHaveProperty('onboardingCompleto');
  });

  it('sin conexión queda pendiente, y se manda en el próximo intento', async () => {
    servidor.sinConexion = true;
    await cambiarPerfil({ nombre: 'Lucía' });

    await preferencias.enviar(ID);
    expect(await preferencias.perfilPendiente(ID)).toBe(true);

    servidor.sinConexion = false;
    await preferencias.enviar(ID);
    expect(servidor.perfil).toMatchObject({ nombre: 'Lucía' });
    expect(await preferencias.perfilPendiente(ID)).toBe(false);
  });

  it('un cambio hecho mientras se mandaba el anterior no se pierde', async () => {
    await cambiarPerfil({ frecuenciaIA: 3 });
    const soltar = servidor.frenarPedidos();
    const envio = preferencias.enviar(ID);
    while (servidor.pedidosA('/usuarios/me').length === 0) await new Promise((r) => setTimeout(r, 1));

    await cambiarPerfil({ frecuenciaIA: 7 });
    void preferencias.enviar(ID);
    soltar();
    await envio;

    expect(servidor.perfil).toMatchObject({ frecuenciaIa: 7 });
    expect(await preferencias.perfilPendiente(ID)).toBe(false);
  });

  it('si el servidor lo rechaza, se descarta: reintentar daría lo mismo', async () => {
    const aviso = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    servidor.fallas.set('PATCH /usuarios/me', { estado: 400, error: 'DATOS_INVALIDOS' });
    await cambiarPerfil({ nombre: 'Lucía' });

    await preferencias.enviar(ID);

    expect(await preferencias.perfilPendiente(ID)).toBe(false);
    expect(aviso).toHaveBeenCalled();
    aviso.mockRestore();
  });

  it('un error del servidor (5xx) deja el cambio pendiente', async () => {
    servidor.fallas.set('PATCH /usuarios/me', { estado: 503, error: 'ERROR_INTERNO' });
    await cambiarPerfil({ nombre: 'Lucía' });

    await preferencias.enviar(ID);

    expect(await preferencias.perfilPendiente(ID)).toBe(true);
  });

  it('nunca manda los datos de una persona con la sesión de otra', async () => {
    await cambiarPerfil({ nombre: 'Lucía' });
    sesionDe = 'otra-persona';

    await preferencias.enviar(ID);

    expect(servidor.pedidosA('/usuarios/me')).toHaveLength(0);
    expect(await preferencias.perfilPendiente(ID)).toBe(true);
  });
});

describe('PreferenciasPendientes · tags (CU-08)', () => {
  const guitarra: TagPersonalizado = { id: 'tag-1', nombre: 'Guitarra', tipo: 'SI_NO', activo: true };

  it('crea en el servidor el tag creado en el teléfono, con el mismo id', async () => {
    telefono.tags = [guitarra];
    await preferencias.marcarTag(ID, guitarra.id);

    await preferencias.enviar(ID);

    expect(servidor.tags.get('tag-1')).toMatchObject({ nombre: 'Guitarra', activo: true });
    expect(await preferencias.tagsPendientes(ID)).toEqual([]);
  });

  it('un tag creado y eliminado sin conexión llega al servidor ya desactivado', async () => {
    telefono.tags = [{ ...guitarra, activo: false }];
    await preferencias.marcarTag(ID, guitarra.id);
    await preferencias.marcarTag(ID, guitarra.id);

    await preferencias.enviar(ID);

    expect(servidor.tags.get('tag-1')).toMatchObject({ activo: false });
  });

  it('cambiarle el nombre a un tag que ya estaba en el servidor (RF-08)', async () => {
    telefono.tags = [guitarra];
    await preferencias.marcarTag(ID, guitarra.id);
    await preferencias.enviar(ID);

    telefono.tags = [{ ...guitarra, nombre: 'Práctica de guitarra' }];
    await preferencias.marcarTag(ID, guitarra.id);
    await preferencias.enviar(ID);

    expect(servidor.tags.get('tag-1')).toMatchObject({ nombre: 'Práctica de guitarra', tipo: 'SI_NO', activo: true });
    expect(servidor.tags.size).toBe(1);
  });

  it('reenviar un tag que ya estaba no lo duplica', async () => {
    telefono.tags = [guitarra];
    await preferencias.marcarTag(ID, guitarra.id);
    await preferencias.enviar(ID);
    await preferencias.marcarTag(ID, guitarra.id);

    await preferencias.enviar(ID);

    expect(servidor.tags.size).toBe(1);
    expect(servidor.pedidosA('/tags/tag-1')).toHaveLength(0);
  });

  it('eliminar y volver a crear un nombre sin conexión: llegan los dos, uno activo', async () => {
    const otraGuitarra = { ...guitarra, id: 'tag-2' };
    telefono.tags = [{ ...guitarra, activo: false }, otraGuitarra];
    await preferencias.marcarTag(ID, 'tag-1');
    await preferencias.marcarTag(ID, 'tag-2');

    await preferencias.enviar(ID);

    expect(servidor.tags.get('tag-1')).toMatchObject({ activo: false });
    expect(servidor.tags.get('tag-2')).toMatchObject({ activo: true });
    expect(await preferencias.tagsPendientes(ID)).toEqual([]);
  });

  it('sin conexión, los tags quedan pendientes', async () => {
    servidor.sinConexion = true;
    telefono.tags = [guitarra];
    await preferencias.marcarTag(ID, guitarra.id);

    await preferencias.enviar(ID);

    expect(await preferencias.tagsPendientes(ID)).toEqual(['tag-1']);
  });
});
