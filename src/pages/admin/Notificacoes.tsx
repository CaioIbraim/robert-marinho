import { useState, useEffect } from 'react';
import { notificationService } from '../../services/notifications.service';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { 
  Bell, 
  Check, 
  Trash2, 
  Info, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  CheckCheck,
  ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'react-router-dom';

export const Notificacoes = () => {
  const [notificacoes, setNotificacoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const loadData = async () => {
    try {
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
      case 'success': return <CheckCircle2 className="text-green-500" size={20} />;
      case 'warning': return <AlertTriangle className="text-yellow-500" size={20} />;
      case 'error': return <XCircle className="text-red-500" size={20} />;
      default: return <Info className="text-blue-500" size={20} />;
    }
  };

  const filteredNotificacoes = filter === 'all' 
    ? notificacoes 
    : notificacoes.filter(n => !n.lida);

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <Bell size={24} />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              Central de Notificações
            </h1>
          </div>
          <p className="text-text-muted">Acompanhe as atividades e alertas em tempo real.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="bg-surface border border-border rounded-lg p-1 flex">
            <button 
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${filter === 'all' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-text-muted hover:text-white'}`}
            >
              Todas
            </button>
            <button 
              onClick={() => setFilter('unread')}
              className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${filter === 'unread' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-text-muted hover:text-white'}`}
            >
              Não lidas
            </button>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleMarcarTodasLidas} 
            className="flex gap-2 text-xs font-bold uppercase tracking-wider border border-border"
          >
            <CheckCheck size={14} />
            Lidas
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-4">
            <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-text-muted font-medium">Sincronizando notificações...</p>
          </div>
        ) : filteredNotificacoes.length === 0 ? (
          <Card className="flex flex-col items-center justify-center py-20 text-center">
            <div className="p-4 bg-border/30 rounded-full mb-4">
              <Bell size={40} className="text-text-muted opacity-50" />
            </div>
            <h3 className="text-xl font-bold text-white mb-1">Tudo limpo por aqui!</h3>
            <p className="text-text-muted max-w-xs">
              Você não tem {filter === 'unread' ? 'notificações não lidas' : 'nenhuma notificação'} no momento.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredNotificacoes.map((n) => (
              <div 
                key={n.id} 
                className={`group relative overflow-hidden transition-all duration-300 border border-border rounded-xl bg-surface/40 hover:bg-surface/60 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 ${!n.lida ? 'border-l-4 border-l-primary shadow-lg shadow-primary/5' : ''}`}
              >
                <div className="p-5 flex gap-4">
                  <div className={`mt-1 p-2.5 rounded-xl ${!n.lida ? 'bg-primary/10 text-primary' : 'bg-border/30 text-text-muted opacity-60'}`}>
                    {getIcon(n.tipo)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-4 mb-1">
                      <h3 className={`font-bold text-lg truncate ${!n.lida ? 'text-white' : 'text-text-muted/80'}`}>
                        {n.titulo}
                      </h3>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted/60 whitespace-nowrap">
                        {format(new Date(n.created_at), "HH:mm • dd MMM", { locale: ptBR })}
                      </span>
                    </div>
                    
                    <p className={`text-sm leading-relaxed mb-4 ${!n.lida ? 'text-text-muted' : 'text-text-muted/60'}`}>
                      {n.mensagem}
                    </p>

                    <div className="flex items-center justify-between">
                      {n.link ? (
                        <Link 
                          to={n.link} 
                          className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-primary hover:text-primary/80 transition-colors"
                        >
                          Ver Detalhes <ArrowRight size={14} />
                        </Link>
                      ) : (
                         <div />
                      )}

                      <div className="flex items-center gap-2">
                        {!n.lida && (
                          <button 
                            onClick={(e) => { e.preventDefault(); handleMarcarLida(n.id); }} 
                            className="p-2 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white transition-all duration-200"
                            title="Marcar como lida"
                          >
                            <Check size={16} />
                          </button>
                        )}
                        <button 
                          onClick={(e) => { e.preventDefault(); handleDelete(n.id); }} 
                          className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-200"
                          title="Excluir"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
