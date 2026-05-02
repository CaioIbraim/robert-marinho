import React, { useState, useMemo } from 'react';
import { Search, Plus, UserPlus, Car, DollarSign, Filter, Send } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { motoristaService } from '../../services/motoristas.service';
import { veiculoService } from '../../services/veiculos.service';
import { tarifarioService } from '../../services/tarifarios.service';
import { showToast } from '../../utils/swal';
import type { Motorista, Veiculo, Tarifario } from '../../types';

interface QuickManagerProps {
  motoristas: Motorista[];
  veiculos: Veiculo[];
  tarifarios: Tarifario[];
  onRefresh: () => void;
  onOpenQuickOS: (data: any) => void;
  onClose: () => void;
}

type Tab = 'motoristas' | 'veiculos' | 'tarifarios';

export const QuickManager: React.FC<QuickManagerProps> = ({ 
  motoristas, 
  veiculos, 
  tarifarios, 
  onRefresh, 
  onOpenQuickOS,
  onClose 
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('motoristas');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form states
  const [driverForm, setDriverForm] = useState({
    nome: '',
    cpf: '',
    telefone: '',
    tipo_vinculo: 'fixo' as 'fixo' | 'terceiro',
    veiculo_id: '',
    abrir_os: false
  });

  const [vehicleForm, setVehicleForm] = useState({
    placa: '',
    modelo: '',
    cor: '',
    capacidade: 4
  });

  const [tarifarioForm, setTarifarioForm] = useState({
    origem: '',
    destino: '',
    valor_venda: '',
    valor_custo: ''
  });

  const filteredItems = useMemo(() => {
    const s = searchTerm.toLowerCase();
    if (activeTab === 'motoristas') {
      return motoristas.filter(m => m.nome.toLowerCase().includes(s) || m.cpf?.includes(s)).slice(0, 10);
    }
    if (activeTab === 'veiculos') {
      return veiculos.filter(v => v.placa.toLowerCase().includes(s) || v.modelo.toLowerCase().includes(s)).slice(0, 10);
    }
    return tarifarios.filter(t => t.origem.toLowerCase().includes(s) || t.destino.toLowerCase().includes(s)).slice(0, 10);
  }, [activeTab, searchTerm, motoristas, veiculos, tarifarios]);

  const handleCreateDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const { abrir_os, ...payload } = driverForm;
      
      // Simplificado para cadastro rápido
      const newMotorista = await motoristaService.create({
        ...payload,
        cpf: payload.cpf || `000${Math.floor(Math.random()*100000000)}`,
        cnh: `000${Math.floor(Math.random()*100000000)}`,
        status: 'ativo'
      } as any);

      showToast('Motorista cadastrado!');
      onRefresh();
      
      if (abrir_os && newMotorista) {
        onOpenQuickOS({ 
          motorista_id: newMotorista.id,
          veiculo_id: newMotorista.veiculo_id 
        }); 
      }

      setIsAdding(false);
      setDriverForm({ nome: '', cpf: '', telefone: '', tipo_vinculo: 'fixo', veiculo_id: '', abrir_os: false });
    } catch (err) {
      console.error(err);
      showToast('Erro ao cadastrar', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await veiculoService.create(vehicleForm as any);
      showToast('Veículo cadastrado!');
      onRefresh();
      setIsAdding(false);
      setVehicleForm({ placa: '', modelo: '', cor: '', capacidade: 4 });
    } catch (err) {
      showToast('Erro ao cadastrar', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTarifario = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await tarifarioService.create({
        ...tarifarioForm,
        valor_venda: Number(tarifarioForm.valor_venda),
        valor_custo: Number(tarifarioForm.valor_custo)
      } as any);
      showToast('Tarifário cadastrado!');
      onRefresh();
      setIsAdding(false);
      setTarifarioForm({ origem: '', destino: '', valor_venda: '', valor_custo: '' });
    } catch (err) {
      showToast('Erro ao cadastrar', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative z-10 flex flex-col h-full bg-zinc-950 border-l border-white/10 w-[400px] shadow-2xl animate-in slide-in-from-right duration-300">
      {/* Header Tabs */}
      <div className="p-6 border-b border-white/5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-white italic uppercase tracking-tighter">Gestão Rápida</h2>
          <Button variant="ghost" size="sm" onClick={onClose} className="rounded-full w-8 h-8 p-0">✕</Button>
        </div>

        <div className="flex gap-1 bg-zinc-900 p-1 rounded-2xl border border-white/5">
          {(['motoristas', 'veiculos', 'tarifarios'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setIsAdding(false); }}
              className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
                activeTab === tab ? 'bg-primary text-white shadow-lg' : 'text-zinc-500 hover:text-white'
              }`}
            >
              {tab.replace('s', '')}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        
        {/* Search & Add Toggle */}
        {!isAdding && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
              <input
                type="text"
                placeholder={`Pesquisar ${activeTab}...`}
                className="w-full bg-zinc-900 border border-white/5 rounded-2xl pl-10 pr-4 py-3 text-sm text-white focus:border-primary/50 transition-all outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <button 
              onClick={() => setIsAdding(true)}
              className="w-full py-4 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-2 text-zinc-500 hover:border-primary/50 hover:text-primary transition-all group"
            >
              <div className="p-2 bg-zinc-900 rounded-xl group-hover:bg-primary/10">
                <Plus size={20} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest">Novo {activeTab.replace('s', '')}</span>
            </button>
          </div>
        )}

        {/* Quick Forms */}
        {isAdding && (
          <form 
            onSubmit={activeTab === 'motoristas' ? handleCreateDriver : activeTab === 'veiculos' ? handleCreateVehicle : handleCreateTarifario}
            className="space-y-4 animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-primary">Preencha os dados</span>
              <button type="button" onClick={() => setIsAdding(false)} className="text-[9px] font-black uppercase text-zinc-600 hover:text-white">Cancelar</button>
            </div>

            {activeTab === 'motoristas' && (
              <div className="space-y-3">
                <input 
                  required
                  placeholder="Nome Completo" 
                  className="quick-input w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-3 text-sm text-white"
                  value={driverForm.nome}
                  onChange={e => setDriverForm({...driverForm, nome: e.target.value})}
                />
                <input 
                  placeholder="Telefone" 
                  className="quick-input w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-3 text-sm text-white"
                  value={driverForm.telefone}
                  onChange={e => setDriverForm({...driverForm, telefone: e.target.value})}
                />
                <select 
                  className="quick-input w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-3 text-sm text-white"
                  value={driverForm.veiculo_id}
                  onChange={e => setDriverForm({...driverForm, veiculo_id: e.target.value})}
                >
                  <option value="">Vincular Veículo (Opcional)</option>
                  {veiculos.map(v => <option key={v.id} value={v.id}>{v.placa} ({v.modelo})</option>)}
                </select>
                
                <div className="flex items-center gap-2 p-3 bg-primary/5 border border-primary/10 rounded-xl">
                  <input 
                    type="checkbox" 
                    id="abrir_os"
                    className="w-4 h-4 rounded border-white/10 bg-zinc-900 text-primary"
                    checked={driverForm.abrir_os}
                    onChange={e => setDriverForm({...driverForm, abrir_os: e.target.checked})}
                  />
                  <label htmlFor="abrir_os" className="text-[10px] font-black uppercase tracking-widest text-primary cursor-pointer">
                    Abrir OS após cadastrar
                  </label>
                </div>
              </div>
            )}

            {activeTab === 'veiculos' && (
              <div className="space-y-3">
                <input required placeholder="Placa" className="quick-input w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-3 text-sm text-white" value={vehicleForm.placa} onChange={e => setVehicleForm({...vehicleForm, placa: e.target.value})} />
                <input required placeholder="Modelo (ex: Corolla)" className="quick-input w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-3 text-sm text-white" value={vehicleForm.modelo} onChange={e => setVehicleForm({...vehicleForm, modelo: e.target.value})} />
                <input placeholder="Cor" className="quick-input w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-3 text-sm text-white" value={vehicleForm.cor} onChange={e => setVehicleForm({...vehicleForm, cor: e.target.value})} />
              </div>
            )}

            {activeTab === 'tarifarios' && (
              <div className="space-y-3">
                <input required placeholder="Origem" className="quick-input w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-3 text-sm text-white" value={tarifarioForm.origem} onChange={e => setTarifarioForm({...tarifarioForm, origem: e.target.value})} />
                <input required placeholder="Destino" className="quick-input w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-3 text-sm text-white" value={tarifarioForm.destino} onChange={e => setTarifarioForm({...tarifarioForm, destino: e.target.value})} />
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" placeholder="Venda R$" className="quick-input w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-3 text-sm text-white" value={tarifarioForm.valor_venda} onChange={e => setTarifarioForm({...tarifarioForm, valor_venda: e.target.value})} />
                  <input type="number" placeholder="Custo R$" className="quick-input w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-3 text-sm text-white" value={tarifarioForm.valor_custo} onChange={e => setTarifarioForm({...tarifarioForm, valor_custo: e.target.value})} />
                </div>
              </div>
            )}

            <Button type="submit" isLoading={loading} className="w-full h-12 rounded-2xl shadow-lg shadow-primary/20">
              Salvar Registro
            </Button>
          </form>
        )}

        {/* Quick Results List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">Recentes / Resultados</span>
            <div className="h-px bg-white/5 flex-1 ml-4"></div>
          </div>

          <div className="space-y-2">
            {filteredItems.map(item => (
              <div 
                key={item.id} 
                className="group p-4 bg-zinc-900/50 border border-white/5 rounded-2xl hover:border-primary/30 hover:bg-zinc-900 transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl border border-white/5 ${
                    activeTab === 'motoristas' ? 'bg-blue-500/10 text-blue-500' :
                    activeTab === 'veiculos' ? 'bg-amber-500/10 text-amber-500' :
                    'bg-green-500/10 text-green-500'
                  }`}>
                    {activeTab === 'motoristas' ? <UserPlus size={16} /> : activeTab === 'veiculos' ? <Car size={16} /> : <DollarSign size={16} />}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white italic truncate max-w-[180px]">
                      {activeTab === 'motoristas' ? (item as any).nome : 
                       activeTab === 'veiculos' ? (item as any).placa : 
                       `${(item as any).origem} → ${(item as any).destino}`}
                    </h4>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                      {activeTab === 'motoristas' ? (item as any).tipo_vinculo : 
                       activeTab === 'veiculos' ? (item as any).modelo : 
                       `R$ ${(item as any).valor_venda.toLocaleString()}`}
                    </p>
                  </div>
                </div>
                
                {activeTab === 'motoristas' && (
                  <button 
                  onClick={() => onOpenQuickOS({ motorista_id: item.id })}
                  className="p-2 bg-primary/10 text-primary rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-primary hover:text-white"
                  title="Criar OS para este motorista"
                  >
                    <Send size={14} />
                  </button>
                )}
              </div>
            ))}
            
            {filteredItems.length === 0 && (
              <div className="text-center py-10 opacity-20">
                <Filter className="w-10 h-10 mx-auto mb-2" />
                <p className="text-[10px] font-black uppercase tracking-widest">Nenhum resultado</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="p-6 border-t border-white/5 bg-zinc-900/10 text-center">
        <p className="text-[9px] font-black text-zinc-700 uppercase tracking-[0.4em]">Robert Marinho Operacional Premium</p>
      </div>
    </div>
  );
};
