import { describe, expect, it } from '@jest/globals';
import {
  calcularEdad,
  DatosRegistro,
  esEditable,
  TagPersonalizado,
  validar,
  validarNombreTag,
} from '@/dominio';

const datos = (cambios: Partial<DatosRegistro> = {}): DatosRegistro => ({
  nivelAnimo: 4,
  destacado: false,
  texto: '',
  horasSueno: null,
  minutosEjercicio: null,
  climas: [],
  etiquetas: [],
  valoresTags: {},
  cancion: null,
  ...cambios,
});

describe('RegistroDiario', () => {
  it('RN-02: el ánimo es el único dato obligatorio', () => {
    expect(validar(datos())).toEqual([]);
    expect(validar(datos({ nivelAnimo: null }))).toEqual(['ANIMO_REQUERIDO']);
  });

  it('rechaza valores fuera de rango (CU-09, E2)', () => {
    expect(validar(datos({ horasSueno: 25 }))).toEqual(['HORAS_SUENO_FUERA_DE_RANGO']);
    expect(validar(datos({ horasSueno: NaN }))).toEqual(['HORAS_SUENO_FUERA_DE_RANGO']);
    expect(validar(datos({ minutosEjercicio: -5 }))).toEqual(['MINUTOS_EJERCICIO_FUERA_DE_RANGO']);
    expect(validar(datos({ horasSueno: 7.5, minutosEjercicio: 45 }))).toEqual([]);
  });

  it('RN-03: solo el registro de hoy es editable', () => {
    expect(esEditable({ fecha: '2026-10-03' }, '2026-10-03')).toBe(true);
    expect(esEditable({ fecha: '2026-10-02' }, '2026-10-03')).toBe(false);
    expect(esEditable({ fecha: '2026-10-04' }, '2026-10-03')).toBe(false);
  });
});

describe('Usuario', () => {
  it('calcula la edad a partir de la fecha de nacimiento', () => {
    expect(calcularEdad('2000-10-03', new Date(2026, 9, 3))).toBe(26);
    expect(calcularEdad('2000-10-04', new Date(2026, 9, 3))).toBe(25);
  });
});

describe('TagPersonalizado', () => {
  const existentes: TagPersonalizado[] = [
    { id: '1', nombre: 'Vendí un auto', tipo: 'SI_NO', activo: true },
    { id: '2', nombre: 'Meditación', tipo: 'SI_NO', activo: false },
  ];

  it('valida el nombre (CU-08, E1)', () => {
    expect(validarNombreTag('   ', existentes)).toBe('NOMBRE_VACIO');
    expect(validarNombreTag('vendí UN auto', existentes)).toBe('NOMBRE_REPETIDO');
    expect(validarNombreTag('x'.repeat(41), existentes)).toBe('NOMBRE_MUY_LARGO');
    expect(validarNombreTag('Fui al gimnasio', existentes)).toBeNull();
  });

  it('permite reutilizar el nombre de un tag desactivado', () => {
    expect(validarNombreTag('Meditación', existentes)).toBeNull();
  });
});
