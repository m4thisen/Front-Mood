import { describe, expect, it } from '@jest/globals';
import { Clima, NivelAnimo, TagPersonalizado, Usuario } from '@/dominio';
import { registro } from '@/__pruebas__/fabricas';
import { armarCsv, armarInformeHtml, TextosInforme } from '../InformeHistorial';
import { MINIMO_DIAS_HABITO } from '../MotorEstadistico';

const textos: TextosInforme = {
  animo: (n: NivelAnimo) => ['Muy mal', 'Mal', 'Neutral', 'Bien', 'Genial'][n - 1]!,
  clima: (c: Clima) => ({ SOLEADO: 'Soleado', NUBLADO: 'Nublado', LLUVIA: 'Lluvia', FRIO: 'Frío', CALOR: 'Calor' })[c],
  etiqueta: (clave: string) => ({ 'ejercicio.corri': 'Corrí', 'gente.saliConAmigos': 'Salí con amigos' })[clave] ?? clave,
  franja: () => 'noche',
};
const tags: TagPersonalizado[] = [
  { id: 'tag-1', nombre: 'Medité', tipo: 'SI_NO', activo: true },
  { id: 'tag-2', nombre: 'Con quién', tipo: 'TEXTO', activo: true },
];
const lucia = { nombre: 'Lucía' } as Usuario;

const registros = [
  registro('2026-10-12', 2, { texto: 'Dormí poco, "muy" mal.\nMañana sigo.', climas: ['LLUVIA'], horasSueno: 5.5 }),
  registro('2026-10-10', 4, {
    etiquetas: ['ejercicio.corri', 'gente.saliConAmigos'],
    valoresTags: { 'tag-1': true, 'tag-2': 'mamá' },
    cancion: { spotifyId: 'abc123', titulo: 'Gracias a la vida', artista: 'Mercedes Sosa', portadaUrl: null },
    destacado: true,
  }),
];

describe('InformeHistorial · CSV', () => {
  const csv = armarCsv(registros, tags, textos);
  const filas = csv.replace('﻿', '').trim().split('\r\n');

  it('empieza con la marca para que Excel lea las tildes, y va en orden de fecha', () => {
    expect(csv.startsWith('﻿')).toBe(true);
    expect(filas[1]!.startsWith('2026-10-10')).toBe(true);
    expect(filas[2]!.startsWith('2026-10-12')).toBe(true);
  });

  it('usa los nombres que ve la persona, no las claves internas', () => {
    expect(filas[1]).toContain('"Corrí; Salí con amigos"');
    expect(filas[1]).toContain('Bien');
    expect(filas[1]).toContain('"Medité; Con quién: mamá"');
    expect(filas[1]).toContain('https://open.spotify.com/track/abc123');
    expect(filas[2]).toContain('Lluvia');
    expect(csv).not.toContain('gente.saliConAmigos');
  });

  it('un texto con comillas, comas o saltos de línea queda en una sola celda', () => {
    expect(csv).toContain('"Dormí poco, ""muy"" mal.\nMañana sigo."');
  });
});

describe('InformeHistorial · informe para el PDF', () => {
  const informe = armarInformeHtml({ registros, usuario: lucia, tags, textos, hoy: new Date('2026-10-31T12:00:00') });

  it('dice de quién es, qué período cubre y que no es un diagnóstico', () => {
    expect(informe).toContain('Historial de Lucía');
    expect(informe).toContain('Del 10 de octubre de 2026 al 12 de octubre de 2026');
    expect(informe).toContain('No es un diagnóstico');
  });

  it('nunca mete el texto de la persona como código', () => {
    const conEtiquetas = armarInformeHtml({
      registros: [registro('2026-10-10', 3, { texto: '<script>alert(1)</script> & <b>hola</b>' })],
      usuario: { nombre: '<img src=x>' } as Usuario,
      tags,
      textos,
    });
    expect(conEtiquetas).not.toContain('<script>');
    expect(conEtiquetas).not.toContain('<img');
    expect(conEtiquetas).toContain('&lt;script&gt;alert(1)&lt;/script&gt; &amp; &lt;b&gt;hola&lt;/b&gt;');
  });

  it(`los hábitos solo aparecen con al menos ${MINIMO_DIAS_HABITO} días (RN-08)`, () => {
    expect(informe).toContain(`Todavía no hay hábitos con al menos ${MINIMO_DIAS_HABITO} días`);
    const muchos = Array.from({ length: 4 }, (_, i) => registro(`2026-10-0${i + 1}`, 5, { etiquetas: ['ejercicio.corri'] }));
    const conHabito = armarInformeHtml({ registros: [...muchos, registro('2026-10-09', 1)], usuario: lucia, tags, textos });
    expect(conHabito).toContain('<td>Corrí</td>');
  });

  it('cada día lleva lo que se registró: ánimo, sueño, clima, lo marcado, la canción y el texto', () => {
    expect(informe).toContain('Sábado 10 de octubre');
    expect(informe).toContain('Día destacado');
    expect(informe).toContain('Corrí, Salí con amigos, Medité, Con quién: mamá');
    expect(informe).toContain('Canción: Gracias a la vida — Mercedes Sosa');
    expect(informe).toContain('Sueño: 5,5 h · Clima: Lluvia');
    expect(informe).toContain('Dormí poco, &quot;muy&quot; mal.<br />Mañana sigo.');
  });

  it('sin registros no se rompe', () => {
    expect(armarInformeHtml({ registros: [], usuario: null, tags: [], textos })).toContain('No hay días registrados.');
  });
});
