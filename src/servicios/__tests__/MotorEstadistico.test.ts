import { describe, expect, it } from '@jest/globals';
import {
  animoSegunHabito,
  distribucion,
  franjaHoraria,
  frecuencias,
  MINIMO_DIAS_HABITO,
  mejorDiaSemana,
  promedio,
} from '../MotorEstadistico';
import { registro } from '@/__pruebas__/fabricas';

describe('MotorEstadistico', () => {
  it('promedio es null sin registros y la media del ánimo con registros', () => {
    expect(promedio([])).toBeNull();
    expect(promedio([registro('2026-10-01', 2), registro('2026-10-02', 5)])).toBe(3.5);
  });

  it('distribucion cuenta los días por nivel', () => {
    const registros = [registro('2026-10-01', 1), registro('2026-10-02', 5), registro('2026-10-03', 5)];
    expect(distribucion(registros)).toEqual([1, 0, 0, 0, 2]);
  });

  describe('mejorDiaSemana', () => {
    it('necesita al menos 4 registros', () => {
      expect(mejorDiaSemana([registro('2026-10-04', 5), registro('2026-10-11', 5)])).toBeNull();
    });

    it('usa la fecha local: el domingo 4/10 cuenta como domingo y no como sábado', () => {
      // Con new Date('2026-10-04') en Argentina (UTC-3) el día se corría al sábado.
      const registros = [
        registro('2026-10-04', 5), // domingo
        registro('2026-10-11', 5), // domingo
        registro('2026-10-05', 2), // lunes
        registro('2026-10-12', 2), // lunes
      ];
      expect(mejorDiaSemana(registros)).toEqual({ diaSemana: 0, promedio: 5 });
    });

    it('ignora los días de la semana con un solo registro', () => {
      const registros = [
        registro('2026-10-03', 5), // sábado, único
        registro('2026-10-05', 3),
        registro('2026-10-12', 3),
        registro('2026-10-19', 4),
      ];
      expect(mejorDiaSemana(registros)?.diaSemana).toBe(1);
    });
  });

  it('franjaHoraria toma la franja más frecuente según la hora de carga', () => {
    const registros = [
      registro('2026-10-01', 3, { horaCarga: '2026-10-01T09:00:00.000-03:00' }),
      registro('2026-10-02', 3, { horaCarga: '2026-10-02T22:30:00.000-03:00' }),
      registro('2026-10-03', 3, { horaCarga: '2026-10-03T23:10:00.000-03:00' }),
    ];
    expect(franjaHoraria(registros)).toBe('NOCHE');
  });

  it('frecuencias ordena las etiquetas de más a menos marcadas', () => {
    const registros = [
      registro('2026-10-01', 3, { etiquetas: ['ejercicio.corri', 'gente.enFamilia'] }),
      registro('2026-10-02', 3, { etiquetas: ['ejercicio.corri'] }),
    ];
    expect(frecuencias(registros)).toEqual([
      { clave: 'ejercicio.corri', cantidad: 2 },
      { clave: 'gente.enFamilia', cantidad: 1 },
    ]);
  });

  describe('animoSegunHabito (CU-18)', () => {
    // Corrió 3 días (ánimo 5) y vio a la familia 2 días; el promedio general es 3,4.
    const registros = [
      registro('2026-10-01', 5, { etiquetas: ['ejercicio.corri', 'emociones.alegria'] }),
      registro('2026-10-02', 5, { etiquetas: ['ejercicio.corri', 'gente.enFamilia', 'emociones.alegria'] }),
      registro('2026-10-03', 5, { etiquetas: ['ejercicio.corri', 'emociones.alegria'] }),
      registro('2026-10-04', 1, { etiquetas: ['gente.enFamilia'] }),
      registro('2026-10-05', 1),
    ];

    it(`compara el ánimo de esos días con el general, y muestra sobre cuántos días`, () => {
      const [corri] = animoSegunHabito(registros);
      expect(corri).toMatchObject({ clave: 'ejercicio.corri', dias: 3, conHabito: 5, general: 3.4 });
      expect(corri!.variacion).toBeCloseTo(47.06, 1);
    });

    it(`RN-08: no muestra hábitos con menos de ${MINIMO_DIAS_HABITO} días`, () => {
      expect(animoSegunHabito(registros).map((h) => h.clave)).not.toContain('gente.enFamilia');
    });

    it('las emociones no cuentan como hábitos: describen el ánimo', () => {
      expect(animoSegunHabito(registros).map((h) => h.clave)).not.toContain('emociones.alegria');
    });

    it('sin registros no hay nada que comparar', () => {
      expect(animoSegunHabito([])).toEqual([]);
    });
  });
});
