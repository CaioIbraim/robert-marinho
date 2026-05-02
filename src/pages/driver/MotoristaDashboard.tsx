import { useState } from 'react';
import { 
  Menu, 
  Crown,
  Bell
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useNavigate } from 'react-router-dom';
import { useDriverData } from '../../hooks/useDriverData';
import { useSystem } from '../../context/SystemContext';

// Componentes
import { SidebarMotorista } from './components/SidebarMotorista';
import { CorridasAtribuidas } from './components/CorridasAtribuidas';
import { OperacaoAtual } from './components/OperacaoAtual';
import { HistoricoMotorista } from './components/HistoricoMotorista';
import { FinanceiroMotorista } from './components/FinanceiroMotorista';
import { PerfilMotorista } from './components/PerfilMotorista';
import { VeiculoMotoristaModule } from './components/VeiculoMotoristaModule';
import { ModalNotificacoes } from './components/ModalNotificacoes';
import { useOrdemServicoRealtime } from '../../hooks/useOrdemServicoRealtime';
import { Volume2, VolumeX } from 'lucide-react';

export default function MotoristaDashboard() {
  const { signOut } = useAuthStore();
  const navigate = useNavigate();
  const { soundEnabled, toggleSound } = useSystem();
  const [activeTab, setActiveTab] = useState<'viagens' | 'operacao' | 'historico' | 'ganhos' | 'perfil' | 'veiculo'>('viagens');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedOrdemId, setSelectedOrdemId] = useState<string | null>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const { motorista, orders, earnings, isLoading, perfil, refetch } = useDriverData();

  useOrdemServicoRealtime({
    channelId: 'motorista-portal',
    onUpdate: refetch,
    motoristaId: motorista?.id || undefined,
    requireFilter: true,
  });

  const handleSignOut = async () => {
    await signOut();
    navigate('/motorista/login');
  };

  const handleOpenOperacao = (ordemId: string) => {
    setSelectedOrdemId(ordemId);
    setActiveTab('operacao');
  };

  const activeOrder = orders.find(o => o.id === selectedOrdemId) || orders.find(o => o.status === 'em_andamento');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-6">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Crown className="w-6 h-6 text-primary" />
          </div>
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 animate-pulse">Sincronizando Portal Driver...</p>
      </div>
    );
  }

  if (!motorista) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-center p-8">
        <div className="w-24 h-24 bg-zinc-900 border border-white/5 rounded-[2.5rem] flex items-center justify-center mb-8 relative">
           <Crown className="w-10 h-10 text-zinc-800" />
           <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white border-4 border-zinc-950">
              <span className="text-[10px] font-black">!</span>
           </div>
        </div>
        <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-4 italic">Perfil não identificado</h1>
        <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest max-w-sm leading-relaxed">
          Seu acesso ainda não foi vinculado a um registro de motorista no sistema.
        </p>
        <button 
           onClick={handleSignOut}
           className="mt-12 px-8 py-4 bg-white text-zinc-950 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-primary hover:text-white transition-all shadow-2xl"
        >
          Voltar para o Início
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col lg:flex-row font-sans selection:bg-primary/30 selection:text-primary">
      {/* Sidebar para Desktop / Mobile drawer */}
      <SidebarMotorista 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        perfil={perfil}
        signOut={handleSignOut}
        hasOperacaoAtiva={!!orders.find(o => o.status === 'em_andamento')}
      />

      {/* Main Content Area */}
      <main className="flex-1 min-h-screen overflow-y-auto px-6 py-8 md:px-12 md:py-16 lg:ml-0">
        {/* Header Mobile / Topo context */}
        <header className="flex items-center justify-between mb-12">
           <div className="lg:hidden flex items-center gap-4">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-white border border-white/10"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center p-1 bg-white/5 border border-white/10">
                 <img src="/logo-ico.png" className="w-full h-full object-contain" alt="Logo" />
              </div>
           </div>

           <div className="hidden lg:block">
              <h1 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary mb-2 italic">Dashboard Operacional Robert Marinho</h1>
              <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">
                {activeTab === 'viagens' && "Minhas Viagens"}
                {activeTab === 'operacao' && "Em Operação"}
                {activeTab === 'historico' && "Registro de Atividades"}
                {activeTab === 'ganhos' && "Consolidado Financeiro"}
                {activeTab === 'perfil' && "Configurações de Perfil"}
              </h2>
           </div>

           <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsNotificationsOpen(true)}
                className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-zinc-500 border border-white/5 hover:text-primary transition-all relative group"
              >
                 <Bell className="w-5 h-5" />
                 <span className="absolute top-3 right-3 w-2 h-2 bg-primary rounded-full group-hover:scale-125 transition-transform border-2 border-zinc-950"></span>
              </button>
              <button 
                  onClick={toggleSound}
                  className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-zinc-500 border border-white/5 hover:text-primary transition-all relative group"
                  title={soundEnabled ? "Som Ativado" : "Som Mutado"}
               >
                  {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
               </button>
              <div className="hidden md:flex items-center gap-4 pl-4 border-l border-white/10">
                 <div className="text-right">
                    <p className="text-[10px] font-black text-white uppercase tracking-widest">{perfil?.full_name}</p>
                    <p className="text-[9px] font-bold text-primary uppercase tracking-[0.2em] italic">Platinum Driver</p>
                 </div>
              </div>
           </div>
        </header>

        {/* Content Tabs */}
        <div className="pb-20 lg:pb-0">
          {activeTab === 'viagens' && (
             <CorridasAtribuidas orders={orders} onOpenOperacao={handleOpenOperacao} />
          )}
          {activeTab === 'operacao' && (
            <OperacaoAtual 
              ordem={activeOrder} 
              onUpdate={refetch} 
            />
          )}
          {activeTab === 'historico' && (
            <HistoricoMotorista orders={orders} />
          )}
          {activeTab === 'ganhos' && (
            <FinanceiroMotorista earnings={earnings} />
          )}
          {activeTab === 'perfil' && (
            <PerfilMotorista motorista={motorista} perfil={perfil} onUpdate={refetch} />
          )}
          {activeTab === 'veiculo' && (
            <VeiculoMotoristaModule motorista={motorista} refetchMotorista={refetch} />
          )}
        </div>

        {/* Notificações Modal */}
        {isNotificationsOpen && (
          <ModalNotificacoes onClose={() => setIsNotificationsOpen(false)} />
        )}
      </main>

      {/* Overlay para fechar sidebar no mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[65] lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
}
