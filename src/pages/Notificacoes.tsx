import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Card } from '../components/ui/Card';
import { Bell, Check, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const Notificacoes = () => {
  const [notificacoes, setNotificacoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const { data } = await supabase
        .from('notificacoes')
        .select('*')
        .order('created_at', { ascending: false });
      
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
    await supabase.from('notificacoes').update({ lida: true }).eq('id', id);
    loadData();
  };

  const handleMarcarTodasLidas = async () => {
    const ids = notificacoes.filter(n => !n.lida).map(n => n.id);
    if(ids.length > 0) {
      await supabase.from('notificacoes').update({ lida: true }).in('id', ids);
      loadData();
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from('notificacoes').delete().eq('id', id);
    loadData();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Bell size={24} />
            Central de Notificações
          </h1>
          <p className="text-text-muted">Acompanhe todos os alertas do sistema.</p>
        </div>
        <button onClick={handleMarcarTodasLidas} className="px-4 py-2 bg-surface border border-border text-text hover:border-primary rounded-md transition-colors text-sm font-medium">
          Marcar todas como lidas
        </button>
      </div>

      <Card className="!p-0">
        {loading ? (
          <div className="p-8 text-center text-text-muted">Carregando...</div>
        ) : notificacoes.length === 0 ? (
          <div className="p-8 text-center text-text-muted">Nenhuma notificação encontrada.</div>
        ) : (
          <div className="divide-y divide-border">
            {notificacoes.map((n) => (
              <div key={n.id} className={`p-4 flex flex-col sm:flex-row gap-4 justify-between transition-colors hover:bg-border/20 ${!n.lida ? 'bg-primary/5' : ''}`}>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {!n.lida && <span className="w-2 h-2 rounded-full bg-primary" />}
                    <h3 className={`font-semibold ${!n.lida ? 'text-white' : 'text-text-muted'}`}>{n.titulo}</h3>
                  </div>
                  <p className="text-sm text-text-muted">{n.mensagem}</p>
                  <p className="text-xs text-text-muted mt-2">
                    {format(new Date(n.created_at), "dd 'de' MMM, HH:mm", { locale: ptBR })}
                  </p>
                </div>
                <div className="flex sm:flex-col items-center gap-2 justify-center sm:justify-start">
                   {!n.lida && (
                      <button onClick={() => handleMarcarLida(n.id)} className="p-2 bg-surface border border-border rounded-md hover:border-green-500 hover:text-green-500 text-text-muted transition-colors tooltip-trigger" title="Marcar como lida">
                        <Check size={16} />
                      </button>
                   )}
                   <button onClick={() => handleDelete(n.id)} className="p-2 bg-surface border border-border rounded-md hover:border-red-500 hover:text-red-500 text-text-muted transition-colors tooltip-trigger" title="Excluir">
                     <Trash2 size={16} />
                   </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
