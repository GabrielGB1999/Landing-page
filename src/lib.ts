export type Role = 'student' | 'teacher';

const PING_TIMEOUT_MS = 6000;
const PING_ATTEMPTS = 3;

// Solo la subred de docentes obtiene acceso ampliado; cualquier otra IP, o ninguna, es alumno.
export function roleForIp(ip?: string): Role {
  return ip && /^192\.168\.11\.\d{1,3}$/.test(ip) ? 'teacher' : 'student';
}

export async function pingOnce(ip: string): Promise<boolean> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), PING_TIMEOUT_MS);
  try {
    await fetch(`http://${ip}`, { mode: 'no-cors', cache: 'no-store', signal: controller.signal });
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timeoutId);
  }
}

// Un solo fallo no basta: se reintenta antes de declarar el servicio caído.
export async function ping(ip: string): Promise<boolean> {
  for (let i = 0; i < PING_ATTEMPTS; i++) {
    if (await pingOnce(ip)) return true;
    if (i < PING_ATTEMPTS - 1) await new Promise(r => setTimeout(r, 500));
  }
  return false;
}

const STEP: Record<string, (cols: number) => number> = {
  ArrowLeft: () => -1,
  ArrowRight: () => 1,
  ArrowUp: cols => -cols,
  ArrowDown: cols => cols,
};

// Índice de la tarjeta destino al pulsar una flecha en una grilla de `cols` columnas; null si no es flecha.
export function arrowTarget(key: string, index: number, count: number, cols: number): number | null {
  const step = STEP[key];
  if (!step || count === 0) return null;
  if (index < 0) return 0;
  const next = index + step(cols);
  return next >= 0 && next < count ? next : index;
}
