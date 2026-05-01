import { History, FileText, Star, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Swal from 'sweetalert2';
import { notificationService } from "../../../services/notifications.service";
import { showToast } from "../../../utils/swal";

interface HistoricoCorridasProps {
  orders: any[];
}

export const HistoricoCorridas = ({ orders }: HistoricoCorridasProps) => {
  const historico = orders.filter(o => o.status === 'concluido' || o.status === 'cancelado');

  const handleReview = async (item: any) => {
    const { value: text } = await Swal.fire({
      title: 'Avaliar Viagem',
      input: 'textarea',
      inputLabel: 'Como foi sua experiência?',
      inputPlaceholder: 'Escreva seu feedback aqui...',
      inputAttributes: {
        'aria-label': 'Escreva seu feedback aqui'
      },
      showCancelButton: true,
      confirmButtonText: 'Enviar Avaliação',
      cancelButtonText: 'Agora não',
      background: '#18181b', // zinc-900
      color: '#fff',
      confirmButtonColor: '#ef4444', // primary
    });

    if (text) {
      const success = await notificationService.create({
        titulo: `Avaliação de Viagem - OS #${item.id.slice(0,8).toUpperCase()}`,
        mensagem: `O cliente enviou um feedback: "${text}"\nReferente à viagem para ${item.destino}.`,
        tipo: 'success'
      });
      if (success) {
        showToast('Avaliação enviada com sucesso!', 'success');
      }
    }
  };

  const handleFavorite = (item: any) => {
    const saved = localStorage.getItem('rm_favorites');
    const favorites = saved ? JSON.parse(saved) : [];
    if (favorites.some((f: any) => f.id === item.id)) {
      showToast('Esta rota já está nos favoritos', 'info');
      return;
    }
    const newFavs = [...favorites, item];
    localStorage.setItem('rm_favorites', JSON.stringify(newFavs));
    showToast('Rota adicionada aos favoritos!', 'success');
  };

  return (
    <div className="bg-zinc-900/30 rounded-[40px] overflow-hidden border border-white/5 animate-fade-in">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-zinc-900/60 border-b border-white/5">
              <th className="p-4 md:p-8 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Protocolo</th>
              <th className="p-4 md:p-8 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Data</th>
              <th className="p-4 md:p-8 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Itinerário</th>
              <th className="p-4 md:p-8 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Valor</th>
              <th className="p-4 md:p-8 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Status</th>
              <th className="p-4 md:p-8 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {historico.map((item) => (
              <tr key={item.id} className="hover:bg-white/5 transition-colors group">
                <td className="p-4 md:p-8 font-mono text-zinc-400 text-[10px]">#{item.id.slice(0,8).toUpperCase()}</td>
                <td className="p-4 md:p-8 text-zinc-300 font-medium text-xs md:text-sm">
                   {format(new Date(item.data_execucao), "dd/MM/yyyy", { locale: ptBR })}
                   <p className="text-[10px] text-zinc-600 mt-0.5">{format(new Date(item.data_execucao), "HH:mm")}</p>
                </td>
                <td className="p-4 md:p-8">
                  <p className="text-white font-bold text-xs md:text-sm truncate max-w-[120px] md:max-w-[200px]">{item.destino}</p>
                  <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mt-1">De: {item.origem}</p>
                </td>
                <td className="p-4 md:p-8 font-black text-white text-xs md:text-md italic">R$ {item.valor_faturamento.toLocaleString('pt-br', { minimumFractionDigits: 2 })}</td>
                <td className="p-4 md:p-8">
                  <span className={`px-2 md:px-4 py-1.5 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-widest ${item.status === 'concluido' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                    {item.status}
                  </span>
                </td>
                <td className="p-4 md:p-8 text-right">
                  <div className="flex items-center justify-end gap-1 md:gap-3 lg:translate-x-4 lg:opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all">
                     <button onClick={() => handleReview(item)} title="Enviar Avaliação" className="p-2 text-zinc-500 hover:text-primary transition-colors">
                        <MessageSquare className="w-5 h-5" />
                     </button>
                     <button onClick={() => handleFavorite(item)} title="Salvar como Rota Favorita" className="p-2 text-zinc-500 hover:text-yellow-500 transition-colors">
                        <Star className="w-5 h-5" />
                     </button>
                     <button title="Ver Comprovante" className="p-2 text-zinc-500 hover:text-white transition-colors">
                        <FileText className="w-5 h-5" />
                     </button>
                  </div>
                </td>
              </tr>
            ))}
            {historico.length === 0 && (
              <tr>
                <td colSpan={6} className="p-20 text-center text-zinc-600 uppercase tracking-widest text-[10px] font-black italic">
                   <History className="w-8 h-8 mx-auto mb-4 opacity-20" />
                   Nenhuma viagem registrada no histórico corporativo.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
