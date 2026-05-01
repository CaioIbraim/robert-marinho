import { useState, useEffect } from 'react';
import { notificationService } from '../../../services/notifications.service';
import { 
  Bell, 
  X, 
  Check, 
  Trash2, 
  Info, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'react-router-dom';

interface ModalNotificacoesProps {
  onClose: () => void;
}

export const ModalNotificacoes = ({ onClose }: ModalNotificacoesProps) => {
  const [notificacoes, setNotificacoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await notificationService.getAll();
      setNotificacoes(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleMarcarLida = async (id: string) => {
    await notificationService.markAsRead(id);
    loadData();
  };

  const handleMarcarTodasLidas = async () => {
    await notificationService.markAllAsRead();
    loadData();
  };

  const handleDelete = async (id: string) => {
    await notificationService.delete(id);
    loadData();
  };

  const getIcon = (tipo: string) => {
    switch (tipo) {
      case 'success': return <CheckCircle2 className="text-green-500" size={18} />;
      case 'warning': return <AlertTriangle className="text-yellow-500" size={18} />;
      case 'error': return <XCircle className="text-red-500" size={18} />;
      default: return <Info className="text-blue-500" size={18} />;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 lg:p-8 animate-fade-in">
      {/* Background Overlay */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose}></div>

      {/* Modal Container */}
      <div className="relative w-full max-w-2xl bg-zinc-950 border border-white/10 rounded-[40px] overflow-hidden shadow-2xl animate-scale-up">
        {/* Header */}
        <header className="p-8 md:p-10 border-b border-white/5 bg-zinc-900/50 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border border-primary/20">
              <Bell className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Central de Alertas</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Notificações em tempo real</span>
                <div className="w-1 h-1 bg-zinc-700 rounded-full"></div>
                <button onClick={handleMarcarTodasLidas} className="text-[10px] font-black uppercase tracking-[0.2em] text-primary hover:underline">Limpar unread</button>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-4 hover:bg-white/5 rounded-3xl transition-colors">
            <X className="w-6 h-6 text-zinc-500 hover:text-white" />
          </button>
        </header>

        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto p-6 md:p-10 custom-scrollbar space-y-4">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-6">
               <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
               <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Sincronizando Alertas...</p>
            </div>
          ) : notificacoes.length === 0 ? (
            <div className="py-20 text-center space-y-6 opacity-30">
               <ShieldCheck className="w-20 h-20 text-zinc-700 mx-auto" />
               <div>
                  <p className="text-xl font-black text-white uppercase italic">Zero Notificações</p>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-2">Você está em dia com todas as atualizações.</p>
               </div>
            </div>
          ) : (
            notificacoes.map((n) => (
              <div 
                key={n.id} 
                className={`group relative overflow-hidden transition-all duration-300 border border-white/5 rounded-3xl bg-zinc-900/30 hover:bg-zinc-900/50 hover:border-primary/30 ${!n.lida ? 'border-l-4 border-l-primary' : ''}`}
              >
                <div className="p-6 flex gap-5">
                  <div className={`mt-1 p-3 rounded-2xl ${!n.lida ? 'bg-primary/10 text-primary border border-primary/10' : 'bg-zinc-950 text-zinc-600 opacity-50'}`}>
                    {getIcon(n.tipo)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-4 mb-2">
                       <h3 className={`font-black uppercase tracking-tight text-lg ${!n.lida ? 'text-white italic' : 'text-zinc-500'}`}>
                        {n.titulo}
                      </h3>
                      <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600 whitespace-nowrap">
                        {format(new Date(n.created_at), "HH:mm • dd MMM", { locale: ptBR })}
                      </span>
                    </div>
                    
                    <p className={`text-sm leading-relaxed mb-6 font-medium ${!n.lida ? 'text-zinc-400' : 'text-zinc-600'}`}>
                      {n.mensagem}
                    </p>

                    <div className="flex items-center justify-between">
                      {n.link ? (
                        <Link 
                          to={n.link} 
                          onClick={onClose}
                          className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary hover:text-white transition-colors"
                        >
                          Ver Detalhes <ArrowRight size={14} />
                        </Link>
                      ) : <div />}

                      <div className="flex items-center gap-3">
                        {!n.lida && (
                          <button 
                            onClick={() => handleMarcarLida(n.id)} 
                            className="w-10 h-10 rounded-xl bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white transition-all flex items-center justify-center border border-green-500/20"
                          >
                            <Check size={16} />
                          </button>
                        )}
                        <button 
                          onClick={() => handleDelete(n.id)} 
                          className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center border border-red-500/20"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <footer className="p-8 border-t border-white/5 bg-zinc-900/30 text-center">
            <p className="text-[9px] font-black text-zinc-700 uppercase tracking-[0.4em]">Robert Marinho Operacional Premium</p>
        </footer>
      </div>
    </div>
  );
};
