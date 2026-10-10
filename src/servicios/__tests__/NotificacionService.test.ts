import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import * as Notifications from 'expo-notifications';
import { DIAS_PROGRAMADOS, PANTALLA_DEL_AVISO, programarRecordatorio, proximosAvisos } from '../NotificacionService';

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(async () => undefined),
  scheduleNotificationAsync: jest.fn(async () => 'id'),
  SchedulableTriggerInputTypes: { DATE: 'date' },
}));

const avisos = Notifications as jest.Mocked<typeof Notifications>;
const permiso = (status: string) => async () => ({ status }) as never;

beforeEach(() => {
  jest.clearAllMocks();
  avisos.getPermissionsAsync.mockImplementation(permiso('granted'));
  avisos.requestPermissionsAsync.mockImplementation(permiso('granted'));
});

describe('proximosAvisos', () => {
  const sabado15hs = new Date(2026, 9, 10, 15, 0);

  it('avisa los próximos días a la hora elegida, empezando hoy si todavía no pasó', () => {
    const momentos = proximosAvisos('21:30', sabado15hs, []);

    expect(momentos).toHaveLength(DIAS_PROGRAMADOS);
    expect(momentos[0]).toEqual(new Date(2026, 9, 10, 21, 30));
    expect(momentos[1]).toEqual(new Date(2026, 9, 11, 21, 30));
  });

  it('CU-13, flujo A: un día ya registrado no se avisa', () => {
    const momentos = proximosAvisos('21:30', sabado15hs, ['2026-10-10', '2026-10-12']);

    expect(momentos[0]).toEqual(new Date(2026, 9, 11, 21, 30));
    expect(momentos.map((m) => m.getDate())).not.toContain(12);
    expect(momentos).toHaveLength(DIAS_PROGRAMADOS - 2);
  });

  it('si la hora de hoy ya pasó, arranca mañana', () => {
    const momentos = proximosAvisos('09:00', sabado15hs, []);

    expect(momentos[0]).toEqual(new Date(2026, 9, 11, 9, 0));
  });
});

describe('programarRecordatorio', () => {
  it('reemplaza los avisos anteriores por los nuevos, que abren el formulario', async () => {
    expect(await programarRecordatorio('21:00', [])).toBe(true);

    expect(avisos.cancelAllScheduledNotificationsAsync).toHaveBeenCalledTimes(1);
    expect(avisos.scheduleNotificationAsync.mock.calls.length).toBeGreaterThanOrEqual(DIAS_PROGRAMADOS - 1);
    expect(avisos.scheduleNotificationAsync.mock.calls[0][0]).toMatchObject({
      content: { title: '¿Cómo estuvo tu día?', body: 'Tomate un minuto para registrarlo.', data: { pantalla: PANTALLA_DEL_AVISO } },
      trigger: { type: 'date' },
    });
  });

  it('sin permiso no programa nada y avisa con false (CU-04 E2)', async () => {
    avisos.requestPermissionsAsync.mockImplementation(permiso('denied'));

    expect(await programarRecordatorio('21:00')).toBe(false);
    expect(avisos.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('al abrir la app no se pide el permiso: solo se consulta', async () => {
    await programarRecordatorio('21:00', [], { pedirPermiso: false });

    expect(avisos.requestPermissionsAsync).not.toHaveBeenCalled();
    expect(avisos.getPermissionsAsync).toHaveBeenCalled();
  });

  it('dos reprogramaciones a la vez no se mezclan (no quedan avisos duplicados)', async () => {
    const orden: string[] = [];
    avisos.cancelAllScheduledNotificationsAsync.mockImplementation(async () => {
      orden.push('cancelar');
    });
    avisos.scheduleNotificationAsync.mockImplementation(async () => {
      orden.push('programar');
      await new Promise((r) => setTimeout(r, 0));
      return 'id';
    });

    await Promise.all([programarRecordatorio('21:00'), programarRecordatorio('22:00')]);

    // Cada una cancela y vuelve a programar entera antes de que empiece la otra.
    const segundoCancelar = orden.indexOf('cancelar', 1);
    expect(orden[0]).toBe('cancelar');
    expect(segundoCancelar).toBeGreaterThan(1);
    expect(orden.slice(1, segundoCancelar).every((paso) => paso === 'programar')).toBe(true);
    expect(orden.slice(segundoCancelar + 1).every((paso) => paso === 'programar')).toBe(true);
  });
});
