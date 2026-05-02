import { 
  Briefcase, 
  MapPin, 
  History, 
  DollarSign, 
  Settings, 
  LogOut,
  Truck
} from "lucide-react";

interface SidebarMotoristaProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  perfil: any;
  signOut: () => void;
  hasOperacaoAtiva: boolean;
}

export const SidebarMotorista = ({ 
  activeTab, 
  setActiveTab, 
  isSidebarOpen, 
  setIsSidebarOpen, 
  perfil, 
  signOut,
  hasOperacaoAtiva 
}: SidebarMotoristaProps) => {
  const menuItems = [
    { id: "viagens", label: "Minhas Viagens", icon: Briefcase },
    { id: "operacao", label: "Em Operação", icon: MapPin },
    { id: "historico", label: "Histórico", icon: History },
    { id: "ganhos", label: "Ganhos", icon: DollarSign },
    { id: "veiculo", label: "Meu Veículo", icon: Truck },
  ];

  return (
    <aside className={`fixed lg:sticky left-0 top-0 h-screen w-80 bg-zinc-900/40 backdrop-blur-3xl border-r border-white/5 p-8 flex flex-col z-[70] transition-transform duration-500 lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="hidden lg:flex items-center gap-4 mb-16 px-2">
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
           <span className="text-white font-black italic">RM</span>
        </div>
        <div className="h-8 w-px bg-white/10 mx-2"></div>
        <div>
          <p className="text-[9px] uppercase tracking-[0.3em] text-primary font-black italic">Vip Driver</p>
          <p className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold">Portal Motorista</p>
        </div>
      </div>

      <nav className="flex-1 space-y-3">
        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-600 mb-6 lg:ml-2">Dashboard Operacional</p>
        {menuItems.map(item => (
          <button
            key={item.id}
            onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-[1.5rem] transition-all duration-300 text-[11px] font-black uppercase tracking-widest group ${activeTab === item.id ? "bg-primary text-white shadow-xl shadow-primary/20 scale-105" : "hover:bg-white/5 text-zinc-500 hover:text-white"}`}
          >
            <item.icon className="w-5 h-5 transition-transform group-hover:scale-110" />
            {item.label}
            {item.id === "operacao" && hasOperacaoAtiva && (
              <span className="ml-auto w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
            )}
          </button>
        ))}
      </nav>

      <div className="mt-auto pt-8 border-t border-white/5 space-y-6">
         <button 
           onClick={() => { setActiveTab("perfil"); setIsSidebarOpen(false); }}
           className={`w-full flex items-center gap-4 p-2 rounded-2xl transition-all ${activeTab === "perfil" ? "bg-white/5" : "hover:bg-white/5"}`}
         >
            <div className="relative group">
              <div className="w-12 h-12 bg-zinc-800 rounded-2xl overflow-hidden border border-white/10 flex items-center justify-center font-black text-zinc-400 group-hover:border-primary transition-colors">
                {perfil?.avatar_url ? (
                  <img src={perfil.avatar_url} className="w-full h-full object-cover" />
                ) : (
                  perfil?.full_name?.charAt(0) || 'D'
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-zinc-900 rounded-full shadow-lg"></div>
            </div>
            <div className="text-left min-w-0">
              <p className="font-bold text-white text-sm truncate">{perfil?.full_name}</p>
              <div className="flex items-center gap-1">
                <p className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold">Motorista Elite</p>
                <Settings className="w-2.5 h-2.5 text-zinc-600" />
              </div>
            </div>
         </button>

         <button 
           onClick={() => signOut()}
           className="w-full flex items-center justify-center gap-3 text-zinc-600 hover:text-primary transition-all py-4 text-[10px] font-black uppercase tracking-[0.3em] bg-zinc-950/50 rounded-2xl border border-white/5 hover:border-primary/20"
         >
           <LogOut className="w-4 h-4" />
           Sair do Portal
         </button>
      </div>
    </aside>
  );
};
