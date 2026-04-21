import { useState } from "react";
import { 
  MapPin, 
  Clock, 
  History, 
  FileText, 
  Users, 
  LogOut, 
  Plus, 
  Eye 
} from "lucide-react";

export default function PortalCliente() {
  const [activeTab, setActiveTab] = useState<"nova" | "andamento" | "historico" | "faturas" | "usuarios">("nova");

  // Dados simulados (depois virão do Supabase)
  const corridasAndamento = [
    { id: "RM-7842", destino: "Aeroporto Santos Dumont - Rio de Janeiro", horario: "14:30", status: "Em andamento", motorista: "João Mendes" }
  ];

  const historico = [
    { id: "RM-7839", data: "15/04/2026", origem: "Barra da Tijuca", destino: "Centro - RJ", valor: "R$ 185,00", status: "Concluída" },
    { id: "RM-7835", data: "14/04/2026", origem: "Leblon", destino: "Aeroporto Galeão", valor: "R$ 320,00", status: "Concluída" },
  ];

  const faturas = [
    { mes: "Abril 2026", valor: "R$ 4.820,00", status: "Paga", vencimento: "05/05/2026" },
    { mes: "Março 2026", valor: "R$ 3.950,00", status: "Paga", vencimento: "05/04/2026" },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-screen w-72 bg-zinc-900 border-r border-zinc-800 p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center">
            <span className="font-bold text-white">RM</span>
          </div>
          <div>
            <p className="font-semibold text-lg">Robert Marinho</p>
            <p className="text-xs text-zinc-500">Portal do Cliente</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          <button
            onClick={() => setActiveTab("nova")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition ${activeTab === "nova" ? "bg-red-600 text-white" : "hover:bg-zinc-800"}`}
          >
            <Plus className="w-5 h-5" />
            Solicitar Nova Corrida
          </button>

          <button
            onClick={() => setActiveTab("andamento")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition ${activeTab === "andamento" ? "bg-red-600 text-white" : "hover:bg-zinc-800"}`}
          >
            <MapPin className="w-5 h-5" />
            Em Andamento
          </button>

          <button
            onClick={() => setActiveTab("historico")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition ${activeTab === "historico" ? "bg-red-600 text-white" : "hover:bg-zinc-800"}`}
          >
            <History className="w-5 h-5" />
            Histórico de Corridas
          </button>

          <button
            onClick={() => setActiveTab("faturas")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition ${activeTab === "faturas" ? "bg-red-600 text-white" : "hover:bg-zinc-800"}`}
          >
            <FileText className="w-5 h-5" />
            Faturas e Recibos
          </button>

          <button
            onClick={() => setActiveTab("usuarios")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition ${activeTab === "usuarios" ? "bg-red-600 text-white" : "hover:bg-zinc-800"}`}
          >
            <Users className="w-5 h-5" />
            Gerenciar Usuários
          </button>
        </nav>

        <div className="mt-auto pt-6 border-t border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-zinc-700 rounded-full"></div>
            <div className="text-sm">
              <p className="font-medium">Empresa Exemplo Ltda</p>
              <p className="text-zinc-500 text-xs">Administrador</p>
            </div>
          </div>
          <button className="mt-6 w-full flex items-center justify-center gap-2 text-red-400 hover:text-red-500 transition py-3">
            <LogOut className="w-5 h-5" />
            Sair
          </button>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="ml-72 p-8">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold">
              {activeTab === "nova" && "Solicitar Nova Corrida"}
              {activeTab === "andamento" && "Corridas em Andamento"}
              {activeTab === "historico" && "Histórico de Corridas"}
              {activeTab === "faturas" && "Faturas e Recibos"}
              {activeTab === "usuarios" && "Gerenciar Usuários"}
            </h1>
            <p className="text-zinc-400 mt-1">
              Bem-vindo de volta, Empresa Exemplo
            </p>
          </div>

          <div className="text-right">
            <p className="text-sm text-zinc-500">Hoje, 17 de Abril de 2026</p>
          </div>
        </header>

        {/* ABA: NOVA CORRIDA */}
        {activeTab === "nova" && (
          <div className="max-w-2xl bg-zinc-900 rounded-3xl p-10 border border-zinc-800">
            <h2 className="text-2xl font-semibold mb-8">Nova Solicitação de Transporte Executivo</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm text-zinc-400 mb-2">Origem</label>
                <input type="text" className="w-full bg-zinc-950 border border-zinc-700 rounded-2xl px-6 py-4 focus:outline-none focus:border-red-600" placeholder="Ex: Av. das Américas, 5000 - Barra da Tijuca" />
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-2">Destino</label>
                <input type="text" className="w-full bg-zinc-950 border border-zinc-700 rounded-2xl px-6 py-4 focus:outline-none focus:border-red-600" placeholder="Ex: Aeroporto Santos Dumont" />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Data e Hora</label>
                  <input type="datetime-local" className="w-full bg-zinc-950 border border-zinc-700 rounded-2xl px-6 py-4 focus:outline-none focus:border-red-600" />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Tipo de Veículo</label>
                  <select className="w-full bg-zinc-950 border border-zinc-700 rounded-2xl px-6 py-4 focus:outline-none focus:border-red-600">
                    <option>Sedan Executivo</option>
                    <option>Van Executiva (até 6 pax)</option>
                    <option>Blindado (se necessário)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-2">Observações / Passageiros</label>
                <textarea className="w-full bg-zinc-950 border border-zinc-700 rounded-3xl px-6 py-4 h-28 focus:outline-none focus:border-red-600" placeholder="Ex: 2 passageiros - Dr. Carlos e Sra. Ana"></textarea>
              </div>

              <button className="w-full bg-red-600 hover:bg-red-700 py-5 rounded-2xl font-semibold text-lg transition mt-4">
                Solicitar Corrida Agora
              </button>
            </div>
          </div>
        )}

        {/* ABA: EM ANDAMENTO */}
        {activeTab === "andamento" && (
          <div>
            <h2 className="text-xl font-semibold mb-6">Corridas em Andamento</h2>
            {corridasAndamento.length > 0 ? (
              corridasAndamento.map((corrida) => (
                <div key={corrida.id} className="bg-zinc-900 border border-red-600/30 rounded-3xl p-8 mb-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-red-500 font-mono text-lg">{corrida.id}</p>
                      <p className="text-xl mt-2">{corrida.destino}</p>
                      <p className="text-zinc-400 mt-1 flex items-center gap-2">
                        <Clock className="w-4 h-4" /> Previsão: {corrida.horario}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="px-4 py-1.5 bg-red-600/20 text-red-400 text-sm rounded-full">Em andamento</span>
                    </div>
                  </div>
                  <div className="mt-6 pt-6 border-t border-zinc-800 flex items-center gap-4">
                    <div className="w-10 h-10 bg-zinc-700 rounded-full"></div>
                    <div>
                      <p>Motorista: <span className="font-medium">{corrida.motorista}</span></p>
                      <p className="text-sm text-green-400">• Rastreando em tempo real</p>
                    </div>
                    <button className="ml-auto flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 px-6 py-3 rounded-2xl">
                      <Eye className="w-5 h-5" /> Acompanhar no mapa
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-zinc-400">Nenhuma corrida em andamento no momento.</p>
            )}
          </div>
        )}

        {/* ABA: HISTÓRICO */}
        {activeTab === "historico" && (
          <div className="bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-800">
            <table className="w-full">
              <thead className="bg-zinc-950">
                <tr>
                  <th className="text-left p-6">ID</th>
                  <th className="text-left p-6">Data</th>
                  <th className="text-left p-6">Origem → Destino</th>
                  <th className="text-left p-6">Valor</th>
                  <th className="text-left p-6">Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {historico.map((item) => (
                  <tr key={item.id} className="hover:bg-zinc-950/50 transition">
                    <td className="p-6 font-mono">{item.id}</td>
                    <td className="p-6">{item.data}</td>
                    <td className="p-6">{item.origem} → {item.destino}</td>
                    <td className="p-6 font-medium">{item.valor}</td>
                    <td className="p-6">
                      <span className="px-4 py-1 bg-green-600/20 text-green-400 text-sm rounded-full">{item.status}</span>
                    </td>
                    <td className="p-6 text-right">
                      <button className="text-red-400 hover:text-red-500">Baixar recibo</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ABA: FATURAS */}
        {activeTab === "faturas" && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Suas Faturas</h2>
            {faturas.map((fatura, i) => (
              <div key={i} className="bg-zinc-900 rounded-3xl p-8 flex justify-between items-center border border-zinc-800">
                <div>
                  <p className="text-2xl font-semibold">{fatura.mes}</p>
                  <p className="text-zinc-400">Vencimento: {fatura.vencimento}</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold">{fatura.valor}</p>
                  <span className="text-green-400 text-sm">✓ Paga</span>
                </div>
                <button className="px-8 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-2xl">Baixar PDF</button>
              </div>
            ))}
          </div>
        )}

        {/* ABA: GERENCIAR USUÁRIOS */}
        {activeTab === "usuarios" && (
          <div className="bg-zinc-900 rounded-3xl p-10">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-semibold">Usuários da Empresa</h2>
              <button className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-2xl flex items-center gap-2">
                <Plus className="w-5 h-5" /> Adicionar Usuário
              </button>
            </div>
            <p className="text-zinc-400">Aqui você poderá gerenciar quem da sua equipe pode solicitar corridas.</p>
            {/* Implementação completa pode ser adicionada depois */}
          </div>
        )}
      </div>
    </div>
  );
}