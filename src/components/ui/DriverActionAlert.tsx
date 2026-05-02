import { CheckCircle2, Navigation, X } from 'lucide-react';
import type { DriverAlert } from '../../hooks/useDriverActionAlert';

interface DriverActionAlertProps {
  alert: DriverAlert;
  onDismiss: () => void;
}

const formatTime = (ts: string | null | undefined) => {
  if (!ts) return '--:--';
  const t = ts.includes('T') ? ts.split('T')[1] : ts;
  return t.slice(0, 5);
};

export const DriverActionAlert = ({ alert, onDismiss }: DriverActionAlertProps) => {
  const isCheckin = alert.type === 'checkin';
  const osId = alert.ordem?.numero_os || alert.ordem?.id?.slice(0, 8)?.toUpperCase() || '---';
  const motoristaName = alert.ordem?.motorista?.nome || alert.ordem?.motorista_id?.slice(0, 8) || 'Motorista';

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      {/* Pulsing glow ring */}
      <div
        className={`absolute inset-0 pointer-events-none flex items-center justify-center`}
        aria-hidden
      >
        <div
          className={`w-[600px] h-[600px] rounded-full blur-3xl opacity-20 animate-pulse ${
            isCheckin ? 'bg-blue-500' : 'bg-emerald-500'
          }`}
        />
      </div>

      <div
        className={`relative w-full max-w-md bg-zinc-900 border rounded-3xl p-8 shadow-2xl ${
          isCheckin
            ? 'border-blue-500/40 shadow-blue-500/10'
            : 'border-emerald-500/40 shadow-emerald-500/10'
        }`}
      >
        {/* Icon */}
        <div
          className={`w-20 h-20 rounded-[2rem] mx-auto mb-6 flex items-center justify-center shadow-xl ${
            isCheckin
              ? 'bg-blue-500/15 border border-blue-500/30 shadow-blue-500/20'
              : 'bg-emerald-500/15 border border-emerald-500/30 shadow-emerald-500/20'
          }`}
        >
          {isCheckin ? (
            <Navigation className={`w-10 h-10 text-blue-400`} />
          ) : (
            <CheckCircle2 className={`w-10 h-10 text-emerald-400`} />
          )}
        </div>

        {/* Content */}
        <div className="text-center mb-8">
          <p
            className={`text-[10px] font-black uppercase tracking-[0.4em] mb-2 ${
              isCheckin ? 'text-blue-400' : 'text-emerald-400'
            }`}
          >
            {isCheckin ? '🚦 Check-in Registrado' : '🏁 Viagem Finalizada'}
          </p>
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter leading-tight mb-1">
            {isCheckin ? 'Motorista Iniciou' : 'Motorista Finalizou'}
          </h2>
          <p className="text-zinc-400 text-sm font-medium">
            {motoristaName}
          </p>
        </div>

        {/* OS Details */}
        <div className="bg-zinc-800/60 border border-white/5 rounded-2xl p-5 mb-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">OS</span>
            <span className="text-white font-black text-sm">#{osId}</span>
          </div>
          {alert.ordem?.origem && (
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Trajeto</span>
              <span className="text-zinc-200 text-xs font-bold text-right max-w-[60%] truncate">
                {alert.ordem.origem} → {alert.ordem.destino}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">
              {isCheckin ? 'Check-in em' : 'Finalizado às'}
            </span>
            <span className={`text-sm font-black ${isCheckin ? 'text-blue-400' : 'text-emerald-400'}`}>
              {isCheckin
                ? formatTime(alert.ordem?.horario_inicio)
                : formatTime(alert.ordem?.horario_fim)}
            </span>
          </div>
        </div>

        {/* Confirm button */}
        <button
          onClick={onDismiss}
          className={`w-full py-5 rounded-2xl font-black uppercase tracking-[0.3em] text-[11px] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl ${
            isCheckin
              ? 'bg-blue-500 hover:bg-blue-400 text-white shadow-blue-500/30'
              : 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-emerald-500/30'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          Confirmar Visualização
        </button>

        {/* Close X */}
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-white/5 flex items-center justify-center text-zinc-500 hover:text-white transition-all"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
