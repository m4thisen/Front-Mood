import { describe, expect, it } from '@jest/globals';
import { AlmacenSeguro } from '@/persistencia/AlmacenSeguro';
import { tokenSimulado } from '@/servicios/IdentidadSimulada';
import { LlaveroEnMemoria } from '@/__pruebas__/servidorFalso';
import { aUsuario, PerfilApi } from '../perfil';

const perfilNuevo: PerfilApi = {
  id: 'u-1',
  email: 'lucia@ejemplo.com',
  nombre: null,
  fechaNacimiento: null,
  genero: null,
  idioma: 'es',
  horaRecordatorio: '21:00',
  frecuenciaIa: 1,
  zonaHoraria: 'America/Argentina/Buenos_Aires',
  onboardingCompleto: false,
  bloques: [],
};

describe('perfil del servidor → Usuario', () => {
  it('una cuenta nueva llega vacía y queda lista para el onboarding', () => {
    expect(aUsuario(perfilNuevo)).toEqual({
      id: 'u-1',
      nombre: '',
      fechaNacimiento: '',
      genero: 'PREFIERO_NO_DECIR',
      idioma: 'es',
      horaRecordatorio: '21:00',
      frecuenciaIA: 1,
      zonaHoraria: 'America/Argentina/Buenos_Aires',
      bloquesActivos: [],
      onboardingCompleto: false,
    });
  });

  it('una cuenta existente conserva todo lo que eligió', () => {
    const usuario = aUsuario({
      ...perfilNuevo,
      nombre: 'Lucía',
      fechaNacimiento: '2002-05-14',
      genero: 'FEMENINO',
      frecuenciaIa: 7,
      bloques: ['estudios', 'gente'],
      onboardingCompleto: true,
    });

    expect(usuario).toMatchObject({
      nombre: 'Lucía',
      fechaNacimiento: '2002-05-14',
      genero: 'FEMENINO',
      frecuenciaIA: 7,
      bloquesActivos: ['estudios', 'gente'],
      onboardingCompleto: true,
    });
  });
});

describe('AlmacenSeguro', () => {
  it('guarda solo los dos tokens', async () => {
    const llavero = new LlaveroEnMemoria();
    const almacen = new AlmacenSeguro(llavero);

    await almacen.guardarTokens({ accessToken: 'a', refreshToken: 'r', esNuevo: true } as never);

    expect(JSON.parse([...llavero.datos.values()][0])).toEqual({ accessToken: 'a', refreshToken: 'r' });
  });

  it('si el contenido está dañado, es como no tener sesión', async () => {
    const llavero = new LlaveroEnMemoria();
    llavero.datos.set('mood.sesion', '{roto');

    expect(await new AlmacenSeguro(llavero).leerTokens()).toBeNull();
  });
});

describe('identidad simulada (solo desarrollo)', () => {
  it('arma el token que acepta el servidor en modo simulado', () => {
    expect(tokenSimulado(' Lucia@Ejemplo.com ')).toBe('simulado:lucia:lucia@ejemplo.com');
    expect(tokenSimulado('yo@ejemplo.com')).toBe('simulado:yo_:yo@ejemplo.com');
  });

  it('rechaza lo que no es un email', () => {
    expect(tokenSimulado('lucia')).toBeNull();
    expect(tokenSimulado('a:b@ejemplo.com')).toBeNull();
  });
});
