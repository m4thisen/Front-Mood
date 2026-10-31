import { describe, expect, it } from '@jest/globals';
import es from '../es';
import en from '../en';
import { traducir } from '..';

const marcas = (texto: string) => (texto.match(/\{\w+\}/g) ?? []).sort();

describe('diccionarios de idioma', () => {
  it('español e inglés tienen exactamente las mismas claves: ningún texto queda en un solo idioma', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(es).sort());
  });

  it('cada texto lleva las mismas marcas en los dos idiomas ({dias}, {nombre}…)', () => {
    const distintas = Object.keys(es).filter((clave) => JSON.stringify(marcas(es[clave]!)) !== JSON.stringify(marcas(en[clave] ?? '')));
    expect(distintas).toEqual([]);
  });

  it('ningún texto está vacío', () => {
    expect(Object.entries({ ...es }).filter(([, v]) => !v.trim())).toEqual([]);
    expect(Object.entries({ ...en }).filter(([, v]) => !v.trim())).toEqual([]);
  });

  it('traducir completa las marcas y, si falta la clave, no rompe', () => {
    expect(traducir('en', 'howYouAre.seenOnDays', { dias: 6 })).toBe('Seen on 6 days');
    expect(traducir('es', 'howYouAre.seenOnDays', { dias: 6 })).toBe('Visto en 6 días');
    expect(traducir('en', 'clave.inexistente')).toBe('clave.inexistente');
  });
});
