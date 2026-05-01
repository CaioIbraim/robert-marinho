import { MapPin, Users, Heart } from "lucide-react";
import { format } from "date-fns";

interface CorridasAndamentoProps {
  orders: any[];
  favorites: any[];
  toggleFavorite: (order: any) => void;
}

export const CorridasAndamento = ({ orders, favorites, toggleFavorite }: CorridasAndamentoProps) => {
  const corridasAndamento = orders.filter(o => o.status === 'pendente' || o.status === 'em_andamento');

  return (
    <div className="grid gap-8">
      {corridasAndamento.length > 0 ? (
        corridasAndamento.map((corrida) => (
          <div key={corrida.id} className="bg-zinc-900/40 border border-white/5 rounded-[40px] p-12 group hover:border-primary/20 transition-all backdrop-blur-xl shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8">
               <div className="bg-zinc-950/80 px-4 py-2 rounded-xl border border-white/5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                 Previsto para {format(new Date(corrida.data_execucao), "HH:mm")}
               </div>
            </div>
            
            <div className="flex flex-col md:flex-row gap-12">
               <div className="space-y-6 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-primary/10 border border-primary/20 text-primary text-[9px] font-black uppercase tracking-widest rounded-lg"># {corrida.id.slice(0,8).toUpperCase()}</span>
                    <span className="text-zinc-600 font-mono text-[10px]">{format(new Date(corrida.data_execucao), "dd/MM/yyyy")}</span>
                  </div>
                  <div className="space-y-4">
                     <div className="flex items-center gap-6 group/item">
                        <div className="w-1 bg-zinc-800 h-12 rounded-full relative">
                           <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-zinc-800 rounded-full border-2 border-zinc-900"></div>
                           <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-primary rounded-full border-2 border-zinc-900"></div>
                        </div>
                        <div>
                           <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">Trajeto Executivo</p>
                           <h3 className="text-2xl font-black text-white italic truncate max-w-md">{corrida.destino}</h3>
                           <p className="text-zinc-500 text-sm mt-1">Origem: {corrida.origem}</p>
                        </div>
                     </div>
                  </div>
               </div>

               <div className="md:w-80 space-y-6">
                  <div className="bg-zinc-950/50 rounded-2xl p-6 border border-white/5">
                     <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-4">Motorista & Veículo</p>
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center text-zinc-500">
                           <Users className="w-6 h-6" />
                        </div>
                        <div>
                           <p className="font-bold text-white text-sm">{corrida.motorista?.nome || 'Designando...'}</p>
                           <p className="text-[10px] text-zinc-600 uppercase font-black tracking-widest">{corrida.veiculo?.modelo || '--'}</p>
                        </div>
                     </div>
                  </div>
                  <button 
                    onClick={() => toggleFavorite(corrida)}
                    className={`w-full py-5 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] transition-all shadow-xl shadow-black/20 overflow-hidden relative group border ${favorites.some(f => f.id === corrida.id) ? 'bg-amber-500 text-white border-amber-400' : 'bg-white text-zinc-950 border-white hover:bg-primary hover:text-white hover:border-primary'}`}
                  >
                     <span className="relative z-10 flex items-center justify-center gap-3">
                       <Heart className={`w-4 h-4 ${favorites.some(f => f.id === corrida.id) ? 'fill-white' : ''}`} /> 
                       {favorites.some(f => f.id === corrida.id) ? 'Favoritado' : 'Favoritar Corrida'}
                     </span>
                  </button>
               </div>
            </div>
          </div>
        ))
      ) : (
        <div className="py-24 text-center bg-zinc-900/20 rounded-[40px] border border-dashed border-white/5 backdrop-blur-sm grayscale opacity-60">
          <MapPin className="w-12 h-12 mx-auto mb-6 text-zinc-800" />
          <p className="text-zinc-600 uppercase tracking-[0.4em] font-black text-[10px]">Sem operações ativas no momento</p>
        </div>
      )}
    </div>
  );
};
