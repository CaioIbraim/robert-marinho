import { useState } from "react";
import { 
  MapPin, 
  History, 
  FileText, 
  Users, 
  LogOut, 
  Plus, 
  Eye,
  Loader2
} from "lucide-react";
import { usePortalData } from "../../hooks/usePortalData";
import { useAuthStore } from "../../stores/authStore";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function PortalCliente() {
  const [activeTab, setActiveTab] = useState<"nova" | "andamento" | "historico" | "faturas" | "usuarios">("nova");
  const { orders, financeiro, isLoading, perfil } = usePortalData();
  const signOut = useAuthStore(state => state.signOut);

  const corridasAndamento = orders.filter(o => o.status === 'em_andamento' || o.status === 'pendente');
  const historico = orders.filter(o => o.status === 'concluido' || o.status === 'cancelado');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-screen w-72 bg-zinc-900 border-r border-zinc-800 p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <span className="font-bold text-white uppercase tracking-tighter">RM</span>
          </div>
          <div>
            <p className="font-bold text-lg uppercase tracking-widest text-[11px]">Robert Marinho</p>
            <p className="text-[9px] uppercase tracking-[0.2em] text-zinc-500 font-bold">Portal do Cliente</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          <button
            onClick={() => setActiveTab("nova")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition text-xs font-bold uppercase tracking-widest ${activeTab === "nova" ? "bg-primary text-white" : "hover:bg-zinc-800 text-zinc-400"}`}
          >
            <Plus className="w-4 h-4" />
            Nova Solicitação
          </button>

          <button
            onClick={() => setActiveTab("andamento")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition text-xs font-bold uppercase tracking-widest ${activeTab === "andamento" ? "bg-primary text-white" : "hover:bg-zinc-800 text-zinc-400"}`}
          >
            <MapPin className="w-4 h-4" />
            Em Andamento
          </button>

          <button
            onClick={() => setActiveTab("historico")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition text-xs font-bold uppercase tracking-widest ${activeTab === "historico" ? "bg-primary text-white" : "hover:bg-zinc-800 text-zinc-400"}`}
          >
            <History className="w-4 h-4" />
            Histórico
          </button>

          <button
            onClick={() => setActiveTab("faturas")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition text-xs font-bold uppercase tracking-widest ${activeTab === "faturas" ? "bg-primary text-white" : "hover:bg-zinc-800 text-zinc-400"}`}
          >
            <FileText className="w-4 h-4" />
            Financeiro
          </button>

          <button
            onClick={() => setActiveTab("usuarios")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition text-xs font-bold uppercase tracking-widest ${activeTab === "usuarios" ? "bg-primary text-white" : "hover:bg-zinc-800 text-zinc-400"}`}
          >
            <Users className="w-4 h-4" />
            Equipe
          </button>
        </nav>

        <div className="mt-auto pt-6 border-t border-zinc-800">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 bg-zinc-800 border border-white/5 rounded-full flex items-center justify-center font-bold text-zinc-500 uppercase">
              {perfil?.full_name?.charAt(0) || 'U'}
            </div>
            <div className="text-sm">
              <p className="font-bold text-white text-[11px] uppercase tracking-wider truncate max-w-[140px]">{perfil?.full_name}</p>
              <p className="text-zinc-500 text-[9px] uppercase tracking-widest font-bold">{perfil?.role}</p>
            </div>
          </div>
          <button 
            onClick={() => signOut()}
            className="mt-6 w-full flex items-center justify-center gap-2 text-zinc-500 hover:text-primary transition py-3 text-[10px] font-bold uppercase tracking-[0.2em]"
          >
            <LogOut className="w-4 h-4" />
            Encerrar Sessão
          </button>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="ml-72 p-12">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tighter text-white">
              {activeTab === "nova" && "Nova Solicitação"}
              {activeTab === "andamento" && "Em Andamento"}
              {activeTab === "historico" && "Histórico"}
              {activeTab === "faturas" && "Financeiro"}
              {activeTab === "usuarios" && "Sua Equipe"}
            </h1>
            <p className="text-zinc-500 mt-2 text-sm uppercase tracking-widest font-medium">
              Painel de Controle de Mobilidade
            </p>
          </div>

          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-600">
              {format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          </div>
        </header>

        {/* ABA: NOVA CORRIDA */}
        {activeTab === "nova" && (
          <div className="max-w-3xl bg-zinc-900/50 rounded-[40px] p-12 border border-white/5 backdrop-blur-xl">
            <h2 className="text-2xl font-bold mb-8">Informações do Transporte</h2>
            
            <div className="grid gap-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 ml-1">Origem</label>
                  <input type="text" className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 focus:outline-none focus:border-primary transition-all" placeholder="Ponto de partida..." />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 ml-1">Destino</label>
                  <input type="text" className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 focus:outline-none focus:border-primary transition-all" placeholder="Destino final..." />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 ml-1">Data e Hora</label>
                  <input type="datetime-local" className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 focus:outline-none focus:border-primary transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 ml-1">Categoria</label>
                  <select className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 focus:outline-none focus:border-primary transition-all">
                    <option>Sedan Executivo</option>
                    <option>Van Corporativa</option>
                    <option>SUV Premium</option>
                    <option>Blindado Nível III-A</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 ml-1">Observações do Passageiro</label>
                <textarea className="w-full bg-zinc-950 border border-zinc-800 rounded-3xl px-6 py-4 h-32 focus:outline-none focus:border-primary transition-all resize-none" placeholder="Ex: Nome do passageiro, telefone, necessidade de mala extra..."></textarea>
              </div>

              <button className="w-full bg-primary hover:bg-red-700 py-6 rounded-2xl font-bold uppercase tracking-[0.3em] text-sm shadow-xl shadow-red-600/10 transition-all active:scale-95 mt-4">
                Confirmar Solicitação
              </button>
            </div>
          </div>
        )}

        {/* ABA: EM ANDAMENTO */}
        {activeTab === "andamento" && (
          <div className="grid gap-6">
            {corridasAndamento.length > 0 ? (
              corridasAndamento.map((corrida) => (
                <div key={corrida.id} className="bg-zinc-900/40 border border-white/5 rounded-[32px] p-10 group hover:border-primary/20 transition-all">
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-primary font-mono font-bold tracking-tighter">#{corrida.id.slice(0,8).toUpperCase()}</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-primary">{corrida.status.replace('_', ' ')}</span>
                      </div>
                      <h3 className="text-2xl font-bold text-white">{corrida.destino}</h3>
                      <p className="text-zinc-500 mt-1 flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4" /> Partida: {corrida.origem}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Horário Previsto</p>
                      <p className="text-xl font-bold text-white">{format(new Date(corrida.data_execucao), "HH:mm")}</p>
                    </div>
                  </div>
                  
                  <div className="pt-8 border-t border-white/5 flex items-center gap-4">
                    <div className="w-12 h-12 bg-zinc-800 rounded-2xl flex items-center justify-center">
                      <Users className="text-zinc-500" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Motorista Responsável</p>
                      <p className="text-white font-bold">{corrida.motorista?.nome || 'Buscando...'}</p>
                    </div>
                    <div className="ml-12">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Veículo</p>
                      <p className="text-white font-bold">{corrida.veiculo?.modelo || '--'} <span className="text-zinc-600 font-normal">({corrida.veiculo?.placa || '--'})</span></p>
                    </div>
                    <button className="ml-auto flex items-center gap-3 bg-white text-zinc-950 px-8 py-4 rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:bg-zinc-200 transition-all">
                      <Eye className="w-4 h-4" /> Rastrear
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-20 text-center bg-zinc-900/20 rounded-[40px] border border-dashed border-white/5">
                <p className="text-zinc-600 uppercase tracking-[0.3em] font-bold text-xs">Nenhuma atividade no momento</p>
              </div>
            )}
          </div>
        )}

        {/* ABA: HISTÓRICO */}
        {activeTab === "historico" && (
          <div className="bg-zinc-900/30 rounded-[40px] overflow-hidden border border-white/5">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-zinc-900/60 border-b border-white/5">
                    <th className="p-8 text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">Protocolo</th>
                    <th className="p-8 text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">Data</th>
                    <th className="p-8 text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">Itinerário</th>
                    <th className="p-8 text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">Valor Est.</th>
                    <th className="p-8 text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {historico.map((item) => (
                    <tr key={item.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-8 font-mono text-zinc-400">#{item.id.slice(0,6).toUpperCase()}</td>
                      <td className="p-8 text-zinc-300 font-medium">{format(new Date(item.created_at), "dd/MM/yyyy")}</td>
                      <td className="p-8">
                        <p className="text-white font-bold">{item.destino}</p>
                        <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mt-1">Origem: {item.origem}</p>
                      </td>
                      <td className="p-8 font-bold text-white">R$ {item.valor_faturamento.toLocaleString('pt-br', { minimumFractionDigits: 2 })}</td>
                      <td className="p-8">
                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${item.status === 'concluido' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="p-8">
                        <button className="text-zinc-500 hover:text-white transition-colors"><FileText className="w-5 h-5" /></button>
                      </td>
                    </tr>
                  ))}
                  {historico.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-20 text-center text-zinc-600 uppercase tracking-widest text-[10px] font-bold">Histórico vazio</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ABA: FATURAS */}
        {activeTab === "faturas" && (
          <div className="grid gap-6">
            {financeiro.length > 0 ? (
              financeiro.map((fatura: any, i) => (
                <div key={i} className="bg-zinc-900/40 rounded-[32px] p-10 border border-white/5 flex justify-between items-center group hover:bg-zinc-900/60 transition-all">
                  <div className="flex gap-8 items-center">
                    <div className="w-16 h-16 bg-zinc-800 rounded-3xl flex items-center justify-center text-zinc-500 group-hover:text-primary transition-colors">
                      <FileText className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="text-2xl font-black text-white">{format(new Date(fatura.data_vencimento), "MMMM yyyy", { locale: ptBR }).toUpperCase()}</p>
                      <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">Vencimento: {format(new Date(fatura.data_vencimento), "dd/MM/yyyy")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-12">
                    <div className="text-right">
                      <p className="text-3xl font-black text-white italic">R$ {fatura.valor.toLocaleString('pt-br', { minimumFractionDigits: 2 })}</p>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${fatura.status === 'pago' ? 'text-green-500' : 'text-yellow-500'}`}>
                        {fatura.status === 'pago' ? '✓ Quitado' : '• Pendente'}
                      </span>
                    </div>
                    <button className="bg-zinc-800 hover:bg-zinc-700 text-white px-8 py-4 rounded-2xl font-bold uppercase tracking-widest text-[10px] transition-all">
                      Download PDF
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-20 text-center bg-zinc-900/20 rounded-[40px] border border-dashed border-white/5">
                <p className="text-zinc-600 uppercase tracking-[0.3em] font-bold text-xs">Sem lançamentos financeiros</p>
              </div>
            )}
          </div>
        )}

        {/* ABA: EQUIPE */}
        {activeTab === "usuarios" && (
          <div className="bg-zinc-900/30 rounded-[40px] p-12 border border-white/5">
            <div className="flex justify-between items-center mb-12">
              <div>
                <h2 className="text-2xl font-bold text-white">Usuários Autorizados</h2>
                <p className="text-zinc-500 mt-1 text-sm">Controle quem pode solicitar serviços em nome da empresa.</p>
              </div>
              <button className="bg-primary hover:bg-red-700 text-white px-8 py-4 rounded-2xl font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-red-600/10 flex items-center gap-2">
                <Plus className="w-4 h-4" /> Novo Membro
              </button>
            </div>
            
            <div className="border border-dashed border-white/5 rounded-3xl p-12 text-center">
              <Users className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
              <p className="text-zinc-600 uppercase tracking-[0.2em] font-bold text-[10px]">Gerenciamento de equipe em implementação</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}