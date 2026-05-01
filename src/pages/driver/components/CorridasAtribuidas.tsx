import { Briefcase, ArrowRight, User, Building2, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CorridasAtribuidasProps {
  orders: any[];
  onOpenOperacao: (orderId: string) => void;
}

export const CorridasAtribuidas = ({ orders, onOpenOperacao }: CorridasAtribuidasProps) => {
  const ativas = orders.filter(o => o.status === 'pendente' || o.status === 'em_andamento');

  return (
    <div className="grid grid-cols-1 gap-6">
      {ativas.length > 0 ? (
        ativas.map((item) => (
          <div key={item.id} className="bg-zinc-900/40 border border-white/5 rounded-[40px] p-8 md:p-10 group hover:border-primary/20 transition-all backdrop-blur-xl relative overflow-hidden">
             <div className="relative z-10 flex flex-col md:flex-row justify-between gap-8">
                <div className="space-y-6 flex-1">
                   <div className="flex items-center gap-4">
                      <div className="px-3 py-1.5 bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest rounded-xl">
                        OS #{item.numero_os || item.id.slice(0,8).toUpperCase()}
                      </div>
                      <div className="flex items-center gap-2 text-zinc-500">
                         <Calendar className="w-3.5 h-3.5" />
                         <span className="text-[11px] font-bold uppercase tracking-widest">
                           {format(new Date(item.data_execucao), "dd 'de' MMMM", { locale: ptBR })}
                         </span>
                      </div>
                   </div>

                   <div className="space-y-2">
                      <h3 className="text-2xl md:text-3xl font-black text-white italic leading-tight">
                        {item.origem} <br />
                        <span className="text-primary text-xl not-italic">↓</span> <br />
                        {item.destino}
                      </h3>
                   </div>

                   <div className="flex flex-wrap gap-6 pt-4 border-t border-white/5">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-xl bg-zinc-950 flex items-center justify-center text-zinc-500 border border-white/5">
                            <User className="w-5 h-5" />
                         </div>
                         <div>
                            <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Passageiro</p>
                            <p className="text-white font-bold text-sm">{item.passageiro || 'Não informado'}</p>
                         </div>
                      </div>
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-xl bg-zinc-950 flex items-center justify-center text-zinc-500 border border-white/5">
                            <Building2 className="w-5 h-5" />
                         </div>
                         <div>
                            <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Empresa</p>
                            <p className="text-white font-bold text-sm">{item.empresa?.razao_social}</p>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="md:w-64 flex flex-col justify-between items-end gap-6">
                   <div className="text-right">
                      <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">Horário Previsto</p>
                      <p className="text-4xl font-black text-white italic">
                        {format(new Date(item.data_execucao), "HH:mm")}
                      </p>
                   </div>
                   
                   <button 
                     onClick={() => onOpenOperacao(item.id)}
                     className="w-full py-5 bg-white text-zinc-950 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-3 shadow-2xl shadow-black/40 group/btn"
                   >
                     Iniciar Operação <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                   </button>
                </div>
             </div>

             {/* Background glow when active */}
             {item.status === 'em_andamento' && (
               <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 blur-3xl rounded-full"></div>
             )}
          </div>
        ))
      ) : (
        <div className="py-32 text-center bg-zinc-900/20 rounded-[40px] border border-dashed border-white/5 backdrop-blur-sm">
           <Briefcase className="w-12 h-12 mx-auto mb-6 text-zinc-800" />
           <h3 className="text-white font-black uppercase tracking-tighter text-2xl italic">Tudo em dia</h3>
           <p className="text-zinc-600 uppercase tracking-[0.4em] font-black text-[10px] mt-2">Você não possui viagens atribuídas no momento</p>
        </div>
      )}
    </div>
  );
};
