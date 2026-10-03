import { describe, expect, it } from '@jest/globals';
import { colorDelAlma, diasRegistrados, rachaActual, rachaMaxima } from '../CalculadoraProgreso';
import { getMoodColor } from '@/tema/colors';
import { registro } from '@/__pruebas__/fabricas';

describe('CalculadoraProgreso', () => {
  describe('rachaActual (RN-04)', () => {
    it('vale 0 sin registros', () => {
      expect(rachaActual([], '2026-10-03')).toBe(0);
    });

    it('cuenta los días consecutivos hasta hoy cuando hoy ya está registrado', () => {
      const registros = [registro('2026-10-01'), registro('2026-10-02'), registro('2026-10-03')];
      expect(rachaActual(registros, '2026-10-03')).toBe(3);
    });

    it('cuenta hasta ayer si hoy todavía no se registró', () => {
      const registros = [registro('2026-10-01'), registro('2026-10-02')];
      expect(rachaActual(registros, '2026-10-03')).toBe(2);
    });

    it('se corta en el primer día sin registro', () => {
      const registros = [registro('2026-09-29'), registro('2026-10-02'), registro('2026-10-03')];
      expect(rachaActual(registros, '2026-10-03')).toBe(2);
    });

    it('vale 0 si no hay registro ni hoy ni ayer', () => {
      const registros = [registro('2026-09-30'), registro('2026-10-01')];
      expect(rachaActual(registros, '2026-10-03')).toBe(0);
    });

    it('atraviesa cambios de mes y de año', () => {
      const registros = [registro('2025-12-31'), registro('2026-01-01')];
      expect(rachaActual(registros, '2026-01-01')).toBe(2);
    });
  });

  describe('rachaMaxima', () => {
    it('vale 0 sin registros', () => {
      expect(rachaMaxima([])).toBe(0);
    });

    it('encuentra la racha más larga aunque no sea la actual', () => {
      const registros = [
        registro('2026-09-01'),
        registro('2026-09-02'),
        registro('2026-09-03'),
        registro('2026-09-04'),
        registro('2026-09-10'),
        registro('2026-09-11'),
      ];
      expect(rachaMaxima(registros)).toBe(4);
    });

    it('no depende del orden de los registros', () => {
      const registros = [registro('2026-09-03'), registro('2026-09-01'), registro('2026-09-02')];
      expect(rachaMaxima(registros)).toBe(3);
    });
  });

  it('diasRegistrados cuenta fechas distintas', () => {
    expect(diasRegistrados([registro('2026-10-01'), registro('2026-10-02')])).toBe(2);
  });

  describe('colorDelAlma (RN-05)', () => {
    it('es null sin registros', () => {
      expect(colorDelAlma([])).toBeNull();
    });

    it('con un solo nivel es el color de ese nivel', () => {
      const registros = [registro('2026-10-01', 5), registro('2026-10-02', 5)];
      expect(colorDelAlma(registros)?.toLowerCase()).toBe(getMoodColor(5).toLowerCase());
    });

    it('promedia los colores de todos los registros', () => {
      // #FF4757 (nivel 1) y #FFD32A (nivel 5) → canal a canal: (255+255)/2, (71+211)/2, (87+42)/2
      const registros = [registro('2026-10-01', 1), registro('2026-10-02', 5)];
      expect(colorDelAlma(registros)).toBe('#ff8d41');
    });
  });
});
