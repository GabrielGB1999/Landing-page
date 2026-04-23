import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  HardDrive, 
  MonitorPlay, 
  GitFork, 
  Cpu, 
  ShieldAlert, 
  Database, 
  ExternalLink, 
  Activity,
  Terminal,
  WifiHigh,
  Settings,
  AlertTriangle
} from 'lucide-react';

declare global {
  interface Window {
    CLIENT_IP?: string;
  }
}

const profiles = {
  student: { name: 'Alumno' },
  teacher: { name: 'Docente (Autorizado)' },
};

const services = [
  { id: 'SYS-01', name: 'Almacenamiento Local', ip: '192.168.1.10:8080', status: 'ONLINE', icon: HardDrive, roles: ['student', 'teacher'] },
  { id: 'SYS-02', name: 'Servidor Multimedia', ip: '192.168.1.11:32400', status: 'ONLINE', icon: MonitorPlay, roles: ['student', 'teacher'] },
  { id: 'SYS-03', name: 'Gestor de Código', ip: '192.168.1.12:3000', status: 'OFFLINE', icon: GitFork, roles: ['teacher'] },
  { id: 'SYS-04', name: 'Control Domótico', ip: '192.168.1.13:8123', status: 'ONLINE', icon: Cpu, roles: ['teacher'] },
  { id: 'SYS-05', name: 'Filtro de Red (DNS)', ip: '192.168.1.14:80', status: 'ONLINE', icon: ShieldAlert, roles: ['teacher'] },
  { id: 'SYS-06', name: 'Base de Datos', ip: '192.168.1.15:5432', status: 'ONLINE', icon: Database, roles: ['teacher'] },
  { id: 'SYS-07', name: 'Terminal Virtual', ip: '192.168.1.16:2222', status: 'ONLINE', icon: Terminal, roles: ['teacher'] },
  { id: 'SYS-08', name: 'Gestor de Red', ip: '192.168.1.1:443', status: 'ONLINE', icon: WifiHigh, roles: ['teacher'] },
];

export default function App() {
  const [role, setRole] = useState<'student' | 'teacher'>('teacher');
  const [clientIp, setClientIp] = useState<string>('LOCAL_DEV');
  const [offlineRoute, setOfflineRoute] = useState<any | null>(null);
  const [liveStatuses, setLiveStatuses] = useState<Record<string, string>>({});

  // Detección real de IP inyectada por Nginx
  useEffect(() => {
    const ip = window.CLIENT_IP;
    // Evitar que lea el string SSI crudo en el modo de desarrollo de AI Studio
    if (ip && !ip.includes('<!--')) {
      setClientIp(ip);
      // Lógica de ruteo: Si la IP está en la subred de alumnos (ej detectada):
      if (ip.startsWith('192.168.10.')) {
        setRole('student');
      } else {
        setRole('teacher');
      }
    }
  }, []);

  // Ping de red en vivo (Consultas reales vía HTTP no-cors)
  useEffect(() => {
    const pingServices = async () => {
      const initialStatus: Record<string, string> = {};
      services.forEach(s => initialStatus[s.id] = 'CHECKING...');
      setLiveStatuses(initialStatus);

      await Promise.all(
        services.map(async (s) => {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2500); // 2.5 seg max
            
            // Intento real de conectar al host y al puerto ignorando las políticas para solo leer conectividad
            await fetch(`http://${s.ip}`, { mode: 'no-cors', cache: 'no-store', signal: controller.signal });
            clearTimeout(timeoutId);
            setLiveStatuses(prev => ({ ...prev, [s.id]: 'ONLINE' }));
          } catch (error) {
            setLiveStatuses(prev => ({ ...prev, [s.id]: 'OFFLINE' }));
          }
        })
      );
    };

    pingServices();
    
    // Configurar sondeo periódico (cada 30s) en modo silencioso detrás de escenas
    const intervalId = setInterval(() => {
      services.forEach(async (s) => {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2500);
            await fetch(`http://${s.ip}`, { mode: 'no-cors', cache: 'no-store', signal: controller.signal });
            clearTimeout(timeoutId);
            setLiveStatuses(prev => ({ ...prev, [s.id]: 'ONLINE' }));
          } catch (error) {
            setLiveStatuses(prev => ({ ...prev, [s.id]: 'OFFLINE' }));
          }
      });
    }, 30000);

    return () => clearInterval(intervalId);
  }, []);

  const filteredServices = services.filter(s => s.roles.includes(role));

  if (offlineRoute) {
    return <MaintenanceScreen service={offlineRoute} onBack={() => setOfflineRoute(null)} />
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-primary text-text-light font-sans p-6 md:p-10 border-[12px] border-primary">
      
      {/* Top-right Status Box - Now uses Real Logic */}
      <div className="absolute top-0 right-0 p-4 border-l border-b border-accent-amber bg-primary z-20 hidden md:block">
        <div className="text-[10px] uppercase font-mono tracking-widest text-accent-amber flex items-center gap-2">
          Terminal Alpha-909 <Activity className="w-3 h-3" />
        </div>
        <div className="text-xs font-mono font-bold mt-1">CLIENT IP: {clientIp}</div>
        <div className="text-[10px] opacity-70 font-mono mt-0.5 uppercase tracking-widest text-accent-amber">PERFIL AUTORIZADO: {profiles[role].name}</div>
      </div>

      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end border-b-[6px] border-accent-red pb-6 mb-12 w-full max-w-7xl mx-auto relative z-10 pt-12 md:pt-0">
        <div className="flex flex-col">
           <h1 className="text-6xl md:text-8xl lg:text-9xl leading-none tracking-tighter m-0 uppercase font-[Impact,Haettenschweiler,'Arial_Narrow_Bold',sans-serif]">
             Hangar Server
           </h1>
           <p className="text-xl md:text-3xl font-light opacity-90 mt-2 font-['Helvetica_Neue',Helvetica,Arial,sans-serif]">
             servicios del servidor de la escuela
           </p>
        </div>
        
        <div className="flex flex-col items-start lg:items-end mt-8 lg:mt-0 font-mono">
           <div className="w-16 h-16 border-2 border-accent-amber flex items-center justify-center mb-2">
             <div className="w-10 h-1 border-t-2 border-accent-amber"></div>
           </div>
           <div className="text-[11px] uppercase tracking-[0.2em] opacity-60 flex flex-col items-start lg:items-end">
             <span>System Node: 192.168.1.1</span>
             <span>SYS.VERSION: v4.2.1-stable</span>
             <span>UPTIME: 99.98%</span>
           </div>
        </div>
      </header>

      <main className="flex-grow grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-7xl mx-auto z-10 relative">
         {filteredServices.map((svc, index) => (
            <ServiceCard 
              key={svc.id} 
              service={svc} 
              index={index} 
              liveStatus={liveStatuses[svc.id] || 'CHECKING...'}
              onOfflineClick={() => setOfflineRoute(svc)}
            />
         ))}
         
         {/* Preserved Setting Module, adapted to new aesthetic container rules */}
         <div className="hidden lg:flex border border-text-light/20 items-center justify-center p-6 text-text-light/50 relative hover:bg-text-light hover:text-primary transition-all duration-300 group">
            <Settings className="w-10 h-10 group-hover:rotate-90 transition-transform duration-700 opacity-50 group-hover:opacity-100" />
         </div>
      </main>

      <footer className="mt-12 flex flex-col md:flex-row gap-4 justify-between items-center text-[11px] font-mono uppercase tracking-widest pt-6 border-t border-text-light/10 w-full max-w-7xl mx-auto z-10 relative">
        <div className="flex gap-12 text-text-light/70">
          <span>© {new Date().getFullYear()} DEPARTAMENTO TÉCNICO</span>
          <span className="hidden md:inline">Load: 0.12 / 0.45 / 0.88</span>
        </div>
        <div className="text-accent-amber">
          Hangar Protocol v4.2
        </div>
      </footer>
    </div>
  )
}

function ServiceCard({ service, index, liveStatus, onOfflineClick }: { service: any, index: number, liveStatus: string, onOfflineClick: () => void }) {
  const isOnline = liveStatus === 'ONLINE';
  const isChecking = liveStatus === 'CHECKING...';

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!isOnline) {
      e.preventDefault(); // Bloquear la redirección HTTP real a la IP
      if (liveStatus === 'OFFLINE') {
        onOfflineClick();
      }
    }
  };

  const dotColorClass = isOnline ? 'bg-accent-amber shadow-[0_0_8px_rgba(240,165,0,0.6)]' : isChecking ? 'bg-text-light/50' : 'bg-accent-red shadow-[0_0_8px_rgba(214,40,40,0.6)]';
  const textColorClass = isOnline ? 'text-accent-amber' : isChecking ? 'text-text-light/50 animate-pulse' : 'text-accent-red';

  return (
    <motion.a
      href={`http://${service.ip}`}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05, duration: 0.3, ease: "easeOut" }}
      className={`group border ${isOnline ? 'border-text-light/20 hover:bg-text-light hover:text-primary cursor-pointer' : 'border-accent-red/30 bg-primary/90 opacity-90'} p-6 flex flex-col justify-between transition-all duration-300 relative min-h-[180px] text-text-light`}
      whileTap={isOnline ? { scale: 0.98 } : {}}
    >
      <div className={`absolute top-0 right-0 ${isOnline ? 'bg-accent-amber' : 'bg-accent-red'} text-primary text-[10px] font-mono px-2 py-1`}>
        {service.id}
      </div>
      
      <div>
        <div className="mb-2">
           <service.icon className={`w-8 h-8 mb-4 transition-opacity ${isOnline || isChecking ? 'opacity-80 group-hover:opacity-100' : 'opacity-40 text-accent-red'}`} strokeWidth={1.5} />
           <h2 className={`text-3xl md:text-4xl uppercase mb-1 font-[Impact,sans-serif] tracking-wide line-clamp-1 break-all ${isOnline ? 'text-current' : 'text-text-light/50'}`}>
             {service.name}
           </h2>
        </div>
        <div className="flex items-center gap-2">
           <span className={`text-sm font-light flex items-center gap-2 ${textColorClass} ${isOnline ? 'opacity-70 group-hover:opacity-100 transition-opacity' : 'font-bold'}`}>
              <span className={`w-2 h-2 rounded-sm ${dotColorClass}`} />
              {liveStatus}
           </span>
        </div>
      </div>

      <div className="flex justify-between items-end mt-8">
        <span className={`text-xs font-mono flex items-center gap-2 transition-opacity ${isOnline ? 'opacity-80 group-hover:opacity-100 text-current' : 'opacity-40 text-accent-red'}`}>
          {service.ip} {isOnline && <ExternalLink className="w-3 h-3 text-current" />}
        </span>
        <div className={`w-4 h-4 transition-colors ${isOnline ? 'bg-accent-red group-hover:bg-primary' : 'bg-accent-red opacity-50'}`}></div>
      </div>
    </motion.a>
  )
}

function MaintenanceScreen({ service, onBack }: { service: any, onBack: () => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-primary text-text-light font-sans p-6 md:p-10 border-[12px] border-primary">
       <div className="max-w-2xl border-4 border-accent-red bg-primary relative p-8 md:p-12 z-10 text-center md:text-left shadow-2xl">
          <div className="absolute top-0 right-0 bg-accent-red text-primary font-mono px-3 py-1 text-sm font-bold">SYSTEM ALERT</div>
          <AlertTriangle className="w-16 h-16 md:w-20 md:h-20 text-accent-red mb-8 mx-auto md:mx-0 animate-pulse" />
          <h1 className="text-4xl md:text-5xl uppercase mb-4 font-[Impact,sans-serif] tracking-wide text-text-light">
            Servicio en Mantenimiento
          </h1>
          <div className="font-mono text-lg md:text-xl mb-6 text-accent-amber border-b border-text-light/10 pb-4">
            TARGET: {service.name} [{service.ip}]
          </div>
          <p className="text-xl md:text-2xl font-light opacity-90 mb-12 font-['Helvetica_Neue',Helvetica,Arial,sans-serif] border-l-4 border-accent-red pl-4 text-left">
            El servicio actualmente esta en mantenimiento, si este mensaje persiste, contactese con el jefe de area.
          </p>
          <button 
            onClick={onBack}
            className="font-mono bg-text-light text-primary px-8 py-4 uppercase tracking-widest font-bold hover:bg-accent-amber transition-colors w-full md:w-auto text-sm"
            >
            &larr; Abortar y volver al inicio
          </button>
       </div>

       {/* Decorative elements */}
       <div className="absolute top-0 left-0 w-full h-full bg-[repeating-linear-gradient(45deg,transparent,transparent_40px,rgba(214,40,40,0.05)_40px,rgba(214,40,40,0.05)_80px)] pointer-events-none" />
       <div className="absolute top-10 right-10 text-accent-red/20 font-mono text-7xl md:text-9xl font-bold opacity-20 rotate-12">
         OFFLINE
       </div>
    </div>
  )
}

