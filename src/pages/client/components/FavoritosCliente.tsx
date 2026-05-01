import { Heart, Trash2 } from "lucide-react";

interface FavoritosClienteProps {
  favorites: any[];
  toggleFavorite: (order: any) => void;
  onRepeat: (fav: any) => void;
}

export const FavoritosCliente = ({ favorites, toggleFavorite, onRepeat }: FavoritosClienteProps) => {
  return (
    <div className="space-y-8">
      {favorites.length > 0 ? (
        <div className="grid gap-6">
          {favorites.map((fav) => (
            <div key={fav.id} className="bg-zinc-900/40 border border-white/5 rounded-3xl p-8 flex items-center justify-between group">
               <div className="flex items-center gap-8">
                  <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500">
                     <Heart className="w-6 h-6 fill-amber-500" />
                  </div>
                  <div>
                     <h4 className="text-white font-black uppercase italic">{fav.destino}</h4>
                     <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-1">Origem: {fav.origem}</p>
                  </div>
               </div>
               <div className="flex items-center gap-4">
                  <button 
                    onClick={() => onRepeat(fav)}
                    className="px-6 py-3 bg-white text-zinc-950 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all"
                  >
                    Repetir Agora
                  </button>
                  <button onClick={() => toggleFavorite(fav)} className="p-3 text-zinc-600 hover:text-red-500 transition-colors">
                     <Trash2 className="w-5 h-5" />
                  </button>
               </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-zinc-900/30 rounded-[40px] p-12 border border-white/5 text-center py-24">
          <Heart className="w-12 h-12 text-zinc-800 mx-auto mb-6" />
          <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-2 italic">Seus Favoritos</h3>
          <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.3em] max-w-sm mx-auto">Favorite suas rotas frequentes para agendar transportes em segundos</p>
        </div>
      )}
    </div>
  );
};
