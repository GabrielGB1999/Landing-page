import { describe, expect, it, vi, afterEach } from 'vitest';
import { arrowTarget, ping, roleForIp } from './lib';

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('roleForIp', () => {
  it('da rol alumno a la red de alumnos, a IPs ajenas y ante IP inválida', () => {
    expect(roleForIp('192.168.10.5')).toBe('student');
    expect(roleForIp('10.0.0.5')).toBe('student');
    expect(roleForIp('192.168.110.5')).toBe('student');
    expect(roleForIp('')).toBe('student');
    expect(roleForIp(undefined)).toBe('student');
    expect(roleForIp("<!--# echo var='remote_addr' -->")).toBe('student');
  });
  it('da rol docente a la subred de docentes', () => {
    expect(roleForIp('192.168.11.5')).toBe('teacher');
  });
});

describe('ping', () => {
  it('reintenta y acierta si un intento funciona', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn().mockRejectedValueOnce(new Error('x')).mockRejectedValueOnce(new Error('x')).mockResolvedValue({});
    vi.stubGlobal('fetch', fetchMock);
    const p = ping('1.2.3.4:80');
    await vi.runAllTimersAsync();
    expect(await p).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
  it('da falso tras agotar los intentos', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('x')));
    const p = ping('1.2.3.4:80');
    await vi.runAllTimersAsync();
    expect(await p).toBe(false);
  });
});

describe('arrowTarget', () => {
  it('mueve por fila y columna sin salirse de la grilla', () => {
    // grilla 2x2: 0 1 / 2 3
    expect(arrowTarget('ArrowRight', 0, 4, 2)).toBe(1);
    expect(arrowTarget('ArrowDown', 1, 4, 2)).toBe(3);
    expect(arrowTarget('ArrowUp', 1, 4, 2)).toBe(1);
    expect(arrowTarget('ArrowLeft', 0, 4, 2)).toBe(0);
    expect(arrowTarget('ArrowDown', 0, 3, 2)).toBe(2);
    expect(arrowTarget('ArrowDown', 1, 3, 2)).toBe(1);
  });
  it('enfoca la primera tarjeta si no hay foco e ignora otras teclas', () => {
    expect(arrowTarget('ArrowDown', -1, 4, 2)).toBe(0);
    expect(arrowTarget('Enter', 0, 4, 2)).toBeNull();
    expect(arrowTarget('ArrowDown', -1, 0, 2)).toBeNull();
  });
});
