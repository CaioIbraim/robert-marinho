import { History, Search, FileText, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface HistoricoMotoristaProps {
  orders: any[];
}

export const HistoricoMotorista = ({ orders }: HistoricoMotoristaProps) => {
  const concluidas = orders.filter(o => o.status === 'concluido' || o.status === 'cancelado')
    .sort((a,b) => new Date(b.data_execucao).getTime() - new Date(a.data_execucao).getTime());

  return (
    <div className="space-y-8 animate-fade-in">
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-zinc-900/40 p-8 rounded-[40px] border border-white/5">
          <div className="relative flex-1 max-w-md">
             <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
             <input 
               type="text"
               placeholder="Buscar no histórico..."
               className="w-full bg-zinc-950 border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-sm text-white focus:outline-none focus:border-primary transition-all"
             />
          </div>
          <div className="flex items-center gap-4">
             <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Filtrar por:</span>
             <select className="bg-zinc-950 border border-white/5 rounded-xl px-4 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-300 outline-none focus:border-primary transition-all">
                <option>Últimos 30 dias</option>
                <option>Todos</option>
             </select>
          </div>
       </div>

       <div className="grid grid-cols-1 gap-4">
          {concluidas.length > 0 ? (
             concluidas.map((item) => (
                <div key={item.id} className="bg-zinc-900/40 border border-white/5 rounded-[3rem] p-8 hover:bg-zinc-900/60 transition-all flex flex-col md:flex-row md:items-center justify-between gap-8 group">
                   <div className="flex items-center gap-6">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${item.status === 'concluido' ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                         <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div>
                         <div className="flex items-center gap-3 mb-1">
                            <span className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">
                               {format(new Date(item.data_execucao), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-zinc-700"></span>
                            <span className="text-primary text-[10px] font-black uppercase tracking-widest">OS #{item.numero_os || item.id.slice(0,8).toUpperCase()}</span>
                         </div>
                         <h3 className="text-white font-bold text-lg leading-tight">
                            {item.origem.split(',')[0]} → {item.destino.split(',')[0]}
                         </h3>
                         <p className="text-zinc-500 text-xs mt-1 font-bold">{item.empresa?.razao_social}</p>
                      </div>
                   </div>

                   <div className="flex items-center gap-12">
                      <div className="text-right hidden md:block">
                         <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Ganhos</p>
                         <p className="text-white font-black italic">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.valor_custo_motorista || 0)}
                         </p>
                      </div>
                      <div className="flex items-center gap-3">
                         <button className="w-12 h-12 bg-zinc-950 rounded-xl flex items-center justify-center text-zinc-600 hover:text-white hover:border-primary/50 border border-white/5 transition-all">
                            <FileText className="w-5 h-5" />
                         </button>
                      </div>
                   </div>
                </div>
             ))
          ) : (
             <div className="py-24 text-center bg-zinc-900/20 rounded-[40px] border border-dashed border-white/5">
                <History className="w-12 h-12 mx-auto mb-4 text-zinc-800" />
                <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest">Nenhuma corrida finalizada</p>
             </div>
          )}
       </div>
    </div>
  );
};
