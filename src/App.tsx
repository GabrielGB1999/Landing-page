import { useState, useEffect, useRef, type RefObject, type MouseEvent } from 'react';
import { motion } from 'motion/react';

declare global {
  interface Window {
    CLIENT_IP?: string;
  }
}

type Role = 'student' | 'teacher';

interface Service {
  id: string;
  category: string;
  name: string;
  description: string;
  ip: string;
  roles: Role[];
}

const profiles: Record<Role, { name: string }> = {
  student: { name: 'Alumno' },
  teacher: { name: 'Docente (Autorizado)' },
};

const services: Service[] = [
  { id: 'SYS-01', category: 'MANTENIMIENTO', name: 'Atlas CMMS', description: 'Órdenes de trabajo, activos y mantenimiento preventivo.', ip: '192.168.10.100:3000', roles: ['student', 'teacher'] },
  { id: 'SYS-02', category: 'DOCUMENTACIÓN', name: 'Manuales Aeronáuticos', description: 'Biblioteca de manuales técnicos y referencias.', ip: '192.168.10.100:8096', roles: ['student', 'teacher'] },
  { id: 'SYS-03', category: 'ADMINISTRACIÓN', name: 'Listas de Alumnos', description: 'Listados y registro de alumnos del curso.', ip: '192.168.11.112:5748', roles: ['teacher'] },
  { id: 'SYS-04', category: 'PAÑOL', name: 'Solicitud de Herramientas', description: 'Pedidos y control de herramientas del taller.', ip: '192.168.10.100:6767', roles: ['teacher'] },
];

const ROUTE = 'M-60 760 C 300 700, 420 420, 760 430 S 1180 260, 1520 120';
const mono = 'font-mono';

async function ping(ip: string): Promise<boolean> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2500);
  try {
    await fetch(`http://${ip}`, { mode: 'no-cors', cache: 'no-store', signal: controller.signal });
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timeoutId);
  }
}

function useClock() {
  const [clock, setClock] = useState('');
  useEffect(() => {
    const tick = () => setClock(new Date().toISOString().slice(11, 19));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);
  return clock;
}

function Backdrop({ hdgRef }: { hdgRef: RefObject<HTMLSpanElement | null> }) {
  const radarRef = useRef<SVGGElement>(null);
  const routeRef = useRef<SVGPathElement>(null);
  const planeRef = useRef<SVGGElement>(null);

  useEffect(() => {
    const route = routeRef.current;
    const plane = planeRef.current;
    const radar = radarRef.current;
    if (!route || !plane || !radar) return;
    const L = route.getTotalLength();
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    const start = performance.now();

    const place = (t: number) => {
      const q = route.getPointAtLength(t * L);
      const q2 = route.getPointAtLength(Math.min(L, t * L + 1));
      const ang = (Math.atan2(q2.y - q.y, q2.x - q.x) * 180) / Math.PI;
      plane.setAttribute('transform', `translate(${q.x} ${q.y}) rotate(${ang}) scale(1.4)`);
      const el = hdgRef.current;
      if (el) {
        const v = String(Math.round(t * 60 + 30)).padStart(3, '0');
        if (el.textContent !== v) el.textContent = v;
      }
    };

    if (reduce) {
      place(0.55);
      return;
    }

    const frame = (now: number) => {
      const dt = now - start;
      radar.setAttribute('transform', `rotate(${((dt / 8000) % 1) * 360} 1120 250)`);
      route.style.strokeDashoffset = String(-((dt / 4000) % 1) * 120);
      const p = (dt / 16000) % 1;
      // easeInOutSine ping-pong-free loop, as in the reference design
      place(-(Math.cos(Math.PI * p) - 1) / 2);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [hdgRef]);

  return (
    <svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true">
      <defs>
        <linearGradient id="sweep" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#f2b44c" stopOpacity="0.16" />
          <stop offset="1" stopColor="#f2b44c" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g stroke="rgba(160,190,230,0.06)" fill="none">
        {[120, 240, 360, 480].map(r => <circle key={r} cx="1120" cy="250" r={r} />)}
        <line x1="1120" y1="-230" x2="1120" y2="730" />
        <line x1="640" y1="250" x2="1600" y2="250" />
      </g>
      <g ref={radarRef}>
        <path d="M1120 250 L1120 -230 A480 480 0 0 1 1460 -90 Z" fill="url(#sweep)" />
      </g>
      <path ref={routeRef} d={ROUTE} fill="none" stroke="rgba(242,180,76,0.35)" strokeWidth="1.2" strokeDasharray="4 8" />
      <g fill="#f2b44c">
        {[[980, 180, 0], [1260, 330, 450], [1050, 420, 900]].map(([cx, cy, d]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="2.5" className="blip" style={{ animationDelay: `${d}ms` }} />
        ))}
      </g>
      <g ref={planeRef} transform="translate(760 430) scale(1.4)">
        <path d="M14 0 L-8 -3 L-12 -12 L-15 -12 L-13 -2.5 L-20 -2 L-23 -6 L-25 -6 L-24 0 L-25 6 L-23 6 L-20 2 L-13 2.5 L-15 12 L-12 12 L-8 3 Z" fill="#e8ecf3" />
      </g>
    </svg>
  );
}

export default function App() {
  const [role, setRole] = useState<Role>('teacher');
  const [clientIp, setClientIp] = useState('LOCAL_DEV');
  const [offlineRoute, setOfflineRoute] = useState<Service | null>(null);
  const [liveStatuses, setLiveStatuses] = useState<Record<string, string>>({});
  const clock = useClock();
  const hdgRef = useRef<HTMLSpanElement>(null);

  // IP real inyectada por Nginx (SSI)
  useEffect(() => {
    const ip = window.CLIENT_IP;
    if (ip && !ip.includes('<!--')) {
      setClientIp(ip);
      setRole(ip.startsWith('192.168.10.') ? 'student' : 'teacher');
    }
  }, []);

  // Ping de red en vivo
  useEffect(() => {
    const check = (s: Service) =>
      ping(s.ip).then(ok => setLiveStatuses(prev => ({ ...prev, [s.id]: ok ? 'ONLINE' : 'OFFLINE' })));
    const checkAll = () => services.forEach(check);
    checkAll();
    const id = setInterval(checkAll, 30000);
    return () => clearInterval(id);
  }, []);

  const filteredServices = services.filter(s => s.roles.includes(role));

  if (offlineRoute) {
    return <MaintenanceScreen service={offlineRoute} onBack={() => setOfflineRoute(null)} />;
  }

  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col bg-[radial-gradient(120%_80%_at_70%_0%,#132038_0%,#070b14_60%)]">
      <Backdrop hdgRef={hdgRef} />

      <header className={`${mono} relative flex flex-wrap gap-x-8 gap-y-2 justify-between items-center px-6 md:px-12 py-7 text-xs tracking-[0.14em] text-muted`}>
        <div className="flex items-center gap-3 whitespace-nowrap">
          <span className="w-2 h-2 rounded-full bg-ok shadow-[0_0_10px_#5fd39a]" />
          HANGAR NET · 192.168.10.100
        </div>
        <div className="whitespace-nowrap">CLIENT {clientIp} · {profiles[role].name.toUpperCase()}</div>
        <div className="whitespace-nowrap">{clock} UTC</div>
      </header>

      <main className="relative flex-1 flex flex-col justify-center px-6 md:px-12 pt-6 pb-16 max-w-[1100px] w-full">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
          className="flex flex-col gap-[18px] mb-14"
        >
          <div className={`${mono} text-xs tracking-[0.24em] text-amber`}>ACCESO A SERVICIOS</div>
          <h1 className="m-0 font-light text-[clamp(40px,6vw,76px)] leading-[1.02] tracking-[-0.02em] text-balance">
            Centro de operaciones<br /><span className="text-muted">técnicas</span>
          </h1>
          <p className="m-0 max-w-[460px] text-base leading-relaxed text-muted">Seleccione un servicio para continuar.</p>
        </motion.div>

        <div className="grid gap-5 max-w-[820px] grid-cols-[repeat(auto-fit,minmax(min(100%,340px),1fr))]">
          {filteredServices.map((svc, i) => (
            <ServiceCard
              key={svc.id}
              service={svc}
              index={i}
              liveStatus={liveStatuses[svc.id] || 'CHECKING...'}
              onOfflineClick={() => setOfflineRoute(svc)}
            />
          ))}
        </div>
      </main>

      <footer className={`${mono} relative flex flex-wrap gap-8 whitespace-nowrap px-6 md:px-12 py-5 border-t border-[rgba(160,190,230,0.08)] text-[11px] tracking-[0.14em] text-dim`}>
        <span>HDG <span ref={hdgRef}>030</span>°</span>
        <span>RED INTERNA</span>
        <span>© {new Date().getFullYear()} DEPARTAMENTO TÉCNICO</span>
      </footer>
    </div>
  );
}

function ServiceCard({ service, index, liveStatus, onOfflineClick }: { service: Service; index: number; liveStatus: string; onOfflineClick: () => void }) {
  const isOnline = liveStatus === 'ONLINE';
  const isChecking = liveStatus === 'CHECKING...';
  const [host, port] = service.ip.split(':');

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (!isOnline) {
      e.preventDefault();
      if (!isChecking) onOfflineClick();
    }
  };

  const statusColor = isOnline ? 'bg-ok shadow-[0_0_8px_#5fd39a]' : isChecking ? 'bg-dim animate-pulse' : 'bg-danger shadow-[0_0_8px_#e5646b]';

  return (
    <motion.a
      href={`http://${service.ip}`}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 + index * 0.14, duration: 1, ease: 'easeOut' }}
      className={`flex flex-col gap-7 p-7 rounded-[14px] border bg-[rgba(19,32,56,0.55)] backdrop-blur-[10px] text-fg transition-[border-color,background,transform] duration-250 hover:-translate-y-[3px] ${
        isOnline
          ? 'border-[rgba(160,190,230,0.14)] hover:border-[rgba(242,180,76,0.6)] hover:bg-[rgba(28,44,74,0.7)]'
          : 'border-[rgba(229,100,107,0.3)] opacity-80'
      }`}
    >
      <div className={`${mono} flex justify-between items-center gap-3 text-[11px] tracking-[0.16em] text-muted whitespace-nowrap`}>
        <span>{service.id.slice(-2)} · {service.category}</span>
        <span className="flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full ${statusColor}`} />
          {liveStatus}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        <div className="text-[30px] font-medium tracking-[-0.01em] leading-tight">{service.name}</div>
        <div className="text-sm leading-normal text-muted">{service.description}</div>
      </div>
      <div className={`${mono} flex justify-between items-center gap-3 mt-auto pt-[18px] border-t border-[rgba(160,190,230,0.1)] text-[13px] whitespace-nowrap`}>
        <span className="text-muted">{host}:{port}</span>
        <span className={isOnline ? 'text-amber' : 'text-danger'}>{isOnline ? 'Entrar →' : isChecking ? '…' : 'Sin servicio'}</span>
      </div>
    </motion.a>
  );
}

function MaintenanceScreen({ service, onBack }: { service: Service; onBack: () => void }) {
  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 bg-[radial-gradient(120%_80%_at_70%_0%,#132038_0%,#070b14_60%)]">
      <div className="max-w-xl w-full p-8 md:p-10 rounded-[14px] border border-[rgba(229,100,107,0.35)] bg-[rgba(19,32,56,0.55)] backdrop-blur-[10px]">
        <div className={`${mono} text-xs tracking-[0.24em] text-danger mb-5`}>SERVICIO NO DISPONIBLE</div>
        <h1 className="m-0 mb-4 font-light text-4xl md:text-5xl tracking-[-0.02em]">Servicio en mantenimiento</h1>
        <div className={`${mono} text-[13px] text-amber pb-4 mb-6 border-b border-[rgba(160,190,230,0.1)] break-all`}>
          {service.name} · {service.ip}
        </div>
        <p className="m-0 mb-10 text-base leading-relaxed text-muted">
          El servicio actualmente está en mantenimiento. Si este mensaje persiste, contáctese con el jefe de área.
        </p>
        <button
          onClick={onBack}
          className={`${mono} px-6 py-3 rounded-lg border border-[rgba(160,190,230,0.2)] text-fg text-xs tracking-[0.14em] uppercase cursor-pointer hover:border-[rgba(242,180,76,0.6)] hover:text-amber transition-colors bg-transparent`}
        >
          ← Volver al inicio
        </button>
      </div>
    </div>
  );
}
