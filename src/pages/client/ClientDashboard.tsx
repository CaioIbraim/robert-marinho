import { useState } from "react";
import { 
  Bell,
  Loader2,
  Volume2,
  VolumeX
} from "lucide-react";
import { usePortalData } from "../../hooks/usePortalData";
import { useAuthStore } from "../../stores/authStore";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { showToast } from "../../utils/swal";

// Componentes
import { NovaSolicitacao } from "./components/NovaSolicitacao";
import { HistoricoCorridas } from "./components/HistoricoCorridas";
import { FinanceiroCliente } from "./components/FinanceiroCliente";
import { ConfigProfile } from "../config/ConfigProfile";
import { CorridasAndamento } from "./components/CorridasAndamento";
import { FavoritosCliente } from "./components/FavoritosCliente";
import { SidebarCliente } from "./components/SidebarCliente";
import { useOrdemServicoRealtime } from "../../hooks/useOrdemServicoRealtime";

type Tab = "nova" | "andamento" | "historico" | "faturas" | "equipe" | "perfil" | "favoritos";

export default function PortalCliente() {
  const [activeTab, setActiveTab] = useState<Tab>("nova");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { orders, financeiro, isLoading, perfil, refetch, empresaId } = usePortalData();
  const signOut = useAuthStore(state => state.signOut);

  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem('rm_client_sound') !== 'false';
  });

  const handleSoundToggle = () => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    localStorage.setItem('rm_client_sound', String(newState));
  };

  useOrdemServicoRealtime({
    channelId: 'cliente-portal',
    onUpdate: refetch,
    onDriverAction: ({ type, ordem }) => {
      let msg = '';
      if (type === 'assigned') {
        msg = `Um motorista (${ordem.motorista?.nome || 'Designado'}) foi alocado para a sua OS #${ordem.numero_os || ordem.id.slice(0, 8)}.`;
      } else if (type === 'checkin') {
        msg = `O motorista da OS #${ordem.numero_os || ordem.id.slice(0, 8)} iniciou a viagem (Check-in).`;
      }
      
      if (msg) {
        if (soundEnabled) {
          try {
            const audio = new Audio('/songs/1.mp3');
            audio.volume = 0.85;
            audio.play().catch(() => {});
          } catch {}
        }
        showToast(msg, 'info');
      }
    }
  });

  const [favorites, setFavorites] = useState<any[]>(() => {
    const saved = localStorage.getItem('rm_favorites');
    return saved ? JSON.parse(saved) : [];
  });

  const toggleFavorite = (corrida: any) => {
    const isFavById = favorites.some(f => f.id === corrida.id);
    
    if (isFavById) {
      // Remover
      const newFavs = favorites.filter(f => f.id !== corrida.id);
      setFavorites(newFavs);
      localStorage.setItem('rm_favorites', JSON.stringify(newFavs));
      return;
    }

    // Adicionar (Verificar duplicidades de trajeto exato)
    const alreadyHasRoute = favorites.some(f => f.origem === corrida.origem && f.destino === corrida.destino);
    if (alreadyHasRoute) {
      showToast('Você já possui esta rota exata (origem/destino) nos seus Favoritos!', 'error');
      return;
    }

    const newFavs = [...favorites, corrida];
    setFavorites(newFavs);
    localStorage.setItem('rm_favorites', JSON.stringify(newFavs));
  };

  const corridasAndamento = orders.filter(o => o.status === 'pendente' || o.status === 'em_andamento');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 flex flex-col lg:flex-row font-sans selection:bg-primary/50 overflow-x-hidden">
      
      {/* MOBILE HEADER */}
      <header className="lg:hidden h-20 bg-zinc-900/60 backdrop-blur-xl border-b border-white/5 px-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
           <img src="/logo.png" alt="Logo" className="h-8 brightness-0 invert" />
           <span className="w-px h-4 bg-white/10"></span>
           <p className="text-[8px] font-black uppercase tracking-[0.2em] text-primary italic">Vip Portal</p>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-white"
        >
          <div className="flex flex-col gap-1.5 items-end">
            <span className="w-6 h-0.5 bg-white rounded-full"></span>
            <span className="w-4 h-0.5 bg-primary rounded-full"></span>
            <span className="w-5 h-0.5 bg-white rounded-full"></span>
          </div>
        </button>
      </header>

      {/* OVERLAY MOBILE */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] lg:hidden animate-fade-in"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <SidebarCliente 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        perfil={perfil}
        signOut={signOut}
        hasAndamento={corridasAndamento.length > 0}
      />

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-6 md:p-12 lg:p-16 min-h-screen relative">
        <div className="max-w-6xl mx-auto space-y-8 lg:space-y-12">
          
          <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8">
            <div className="animate-fade-in-up w-full xl:w-auto">
               <div className="flex items-center gap-3 mb-3">
                  <span className="w-8 h-px bg-primary"></span>
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Exclusive Access</p>
               </div>
               <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-white leading-tight">
                 {activeTab === "nova" && "Nova Solicitação"}
                 {activeTab === "andamento" && "Em Andamento"}
                 {activeTab === "historico" && "Histórico"}
                 {activeTab === "faturas" && "Monitor Financeiro"}
                 {activeTab === "perfil" && "Configurações"}
                 {activeTab === "favoritos" && "Seus Favoritos"}
               </h2>
            </div>

            <div className="flex items-center gap-4 animate-fade-in">
              <div className="bg-zinc-900/50 border border-white/5 p-4 rounded-2xl flex items-center gap-4 backdrop-blur-xl">
                 <div className="w-10 h-10 rounded-xl bg-zinc-950 flex items-center justify-center text-zinc-500">
                    <Bell className="w-5 h-5" />
                 </div>
                 <div className="pr-4 border-r border-white/5">
                    <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-0.5">Status da Conta</p>
                    <p className="text-xs font-bold text-green-500 uppercase flex items-center gap-2 italic">
                       <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> Ativo
                    </p>
                 </div>
                 <div className="px-4 border-r border-white/5 flex flex-col items-center">
                    <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-0.5">Som Alerta</p>
                    <button 
                       onClick={handleSoundToggle}
                       className={`flex items-center gap-1 ${soundEnabled ? 'text-green-500' : 'text-zinc-500'}`}
                       title={soundEnabled ? "Desativar alertas sonoros" : "Ativar alertas sonoros"}
                    >
                       {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                    </button>
                 </div>
                 <div className="pl-4">
                    <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-0.5">Data atual</p>
                    <p className="text-xs font-bold text-white uppercase">{format(new Date(), "dd MMM, yy", { locale: ptBR })}</p>
                 </div>
              </div>
            </div>
          </header>

          <section className="animate-fade-in [animation-delay:200ms]">
            {activeTab === "nova" && <NovaSolicitacao empresaId={empresaId} onSuccess={() => { setActiveTab("andamento"); refetch(); }} />}
            
            {activeTab === "andamento" && (
              <CorridasAndamento orders={orders} favorites={favorites} toggleFavorite={toggleFavorite} />
            )}

            {activeTab === "historico" && <HistoricoCorridas orders={orders} />}
            
            {activeTab === "favoritos" && (
              <FavoritosCliente 
                favorites={favorites} 
                toggleFavorite={toggleFavorite} 
                onRepeat={(fav) => {
                  setActiveTab('nova');
                  localStorage.setItem('rm_repeat_trip', JSON.stringify({ 
                    origem: fav.origem, 
                    destino: fav.destino, 
                    passageiro: fav.passageiro 
                  }));
                }} 
              />
            )}
            
            {activeTab === "faturas" && <FinanceiroCliente financeiro={financeiro} />}
            {activeTab === "perfil" && <ConfigProfile />}
          </section>
        </div>

        {/* BACKGROUND AMBIENT GLOW */}
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[150px] -z-10 animate-pulse pointer-events-none"></div>
      </main>

      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 1s ease-out forwards;
        }
      `}</style>
    </div>
  );
}