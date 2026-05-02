import React, { useState, useMemo } from 'react';
import { Search, Plus, UserPlus, Car, DollarSign, Filter, Send, Pencil, ChevronUp } from 'lucide-react';
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
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showNewVehicleRow, setShowNewVehicleRow] = useState(false);

  // Form states
  const [driverForm, setDriverForm] = useState({
    nome: '',
    cpf: '',
    telefone: '',
    tipo_vinculo: 'fixo' as 'fixo' | 'terceiro',
    veiculo_id: '',
    status: 'ativo',
    abrir_os: false
  });

  const [newVehicleForm, setNewVehicleForm] = useState({
    placa: '',
    modelo: ''
  });

  const [vehicleForm, setVehicleForm] = useState({
    placa: '',
    modelo: '',
    cor: '',
    capacidade: 4,
    status: 'ativo' as 'ativo' | 'inativo'
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

  const resetForms = () => {
    setDriverForm({ nome: '', cpf: '', telefone: '', tipo_vinculo: 'fixo', veiculo_id: '', status: 'ativo', abrir_os: false });
    setNewVehicleForm({ placa: '', modelo: '' });
    setVehicleForm({ placa: '', modelo: '', cor: '', capacidade: 4, status: 'ativo' });
    setTarifarioForm({ origem: '', destino: '', valor_venda: '', valor_custo: '' });
    setIsAdding(false);
    setIsEditing(false);
    setEditingId(null);
    setShowNewVehicleRow(false);
  };

  const handleEditItem = (item: any) => {
    setEditingId(item.id);
    setIsEditing(true);
    setIsAdding(true);
    setShowNewVehicleRow(false);
    
    if (activeTab === 'motoristas') {
      setDriverForm({
        nome: item.nome,
        cpf: item.cpf,
        telefone: item.telefone,
        tipo_vinculo: item.tipo_vinculo,
        veiculo_id: item.veiculo_id || '',
        status: item.status || 'ativo',
        abrir_os: false
      });
    } else if (activeTab === 'veiculos') {
      setVehicleForm({
        placa: item.placa,
        modelo: item.modelo,
        cor: item.cor || '',
        capacidade: item.capacidade || 4,
        status: item.status || 'ativo'
      });
    } else if (activeTab === 'tarifarios') {
      setTarifarioForm({
        origem: item.origem,
        destino: item.destino,
        valor_venda: String(item.valor_venda),
        valor_custo: String(item.valor_custo || '')
      });
    }
  };

  const handleCreateOrUpdateDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const { abrir_os, ...payload } = driverForm;
      
      let finalVeiculoId = payload.veiculo_id === '' ? null : payload.veiculo_id;

      // 🚗 Se for criar um novo veículo em anexo
      if (showNewVehicleRow && newVehicleForm.placa && newVehicleForm.modelo) {
        const createdVehicle = await veiculoService.create({
          placa: newVehicleForm.placa,
          modelo: newVehicleForm.modelo,
          status: 'ativo',
          capacidade: 4
        } as any);
        if (createdVehicle) finalVeiculoId = createdVehicle.id;
      }

      const sanitizedPayload = {
        ...payload,
        veiculo_id: finalVeiculoId,
        cpf: payload.cpf || `000${Math.floor(Math.random()*100000000)}`,
        cnh: (isEditing ? undefined : `000${Math.floor(Math.random()*100000000)}`) as any,
      };

      let result;
      if (isEditing && editingId) {
        await motoristaService.update(editingId, sanitizedPayload);
        showToast('Motorista atualizado!');
        result = { id: editingId, ...sanitizedPayload };
      } else {
        result = await motoristaService.create({ ...sanitizedPayload, cnh: sanitizedPayload.cnh || '000000' } as any);
        showToast('Motorista cadastrado!');
      }

      onRefresh();
      if (abrir_os && result) {
        onOpenQuickOS({ 
          motorista_id: result.id, 
          veiculo_id: finalVeiculoId 
        }); 
      }
      resetForms();
    } catch (err) {
      console.error(err);
      showToast('Erro ao salvar', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (isEditing && editingId) {
        await veiculoService.update(editingId, vehicleForm as any);
        showToast('Veículo atualizado!');
      } else {
        await veiculoService.create(vehicleForm as any);
        showToast('Veículo cadastrado!');
      }
      onRefresh();
      resetForms();
    } catch (err) {
      showToast('Erro ao salvar', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdateTarifario = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const payload = {
        ...tarifarioForm,
        valor_venda: Number(tarifarioForm.valor_venda),
        valor_custo: tarifarioForm.valor_custo === '' ? null : Number(tarifarioForm.valor_custo)
      };
      if (isEditing && editingId) {
        await tarifarioService.update(editingId, payload as any);
        showToast('Tarifário atualizado!');
      } else {
        await tarifarioService.create(payload as any);
        showToast('Tarifário cadastrado!');
      }
      onRefresh();
      resetForms();
    } catch (err) {
      showToast('Erro ao salvar', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative z-10 flex flex-col h-full bg-zinc-950 border-l border-white/10 w-[420px] shadow-2xl animate-in slide-in-from-right duration-300">
      {/* Header Tabs */}
      <div className="p-6 border-b border-white/5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-white italic uppercase tracking-tighter">
            {isEditing ? '⚡ Editar Registro' : '⚡ Gestão Rápida'}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose} className="rounded-full w-8 h-8 p-0 hover:bg-white/10">✕</Button>
        </div>

        <div className="flex gap-1 bg-zinc-900 p-1 rounded-2xl border border-white/5">
          {(['motoristas', 'veiculos', 'tarifarios'] as Tab[]).map((tab) => (
            <button
              key={tab}
              disabled={isEditing}
              onClick={() => { setActiveTab(tab); resetForms(); }}
              className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
                activeTab === tab ? 'bg-primary text-white shadow-lg' : 'text-zinc-500 hover:text-white disabled:opacity-30'
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
            onSubmit={activeTab === 'motoristas' ? handleCreateOrUpdateDriver : activeTab === 'veiculos' ? handleCreateOrUpdateVehicle : handleCreateOrUpdateTarifario}
            className="space-y-4 animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                {isEditing ? 'Atualize os campos' : 'Preencha os dados'}
              </span>
              <button type="button" onClick={resetForms} className="text-[9px] font-black uppercase text-zinc-600 hover:text-white">Cancelar</button>
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
                <div className="grid grid-cols-2 gap-2">
                  <input 
                    placeholder="CPF (Opcional)" 
                    className="quick-input w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-3 text-sm text-white"
                    value={driverForm.cpf}
                    onChange={e => setDriverForm({...driverForm, cpf: e.target.value})}
                  />
                  <input 
                    placeholder="Telefone" 
                    className="quick-input w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-3 text-sm text-white"
                    value={driverForm.telefone}
                    onChange={e => setDriverForm({...driverForm, telefone: e.target.value})}
                  />
                </div>

                <div className="flex gap-2">
                  <select 
                    className="quick-input flex-1 bg-zinc-900 border border-white/5 rounded-xl px-4 py-3 text-sm text-white"
                    value={driverForm.tipo_vinculo}
                    onChange={e => setDriverForm({...driverForm, tipo_vinculo: e.target.value as any})}
                  >
                    <option value="fixo">Fixo (Frota)</option>
                    <option value="terceiro">Terceiro (Parceiro)</option>
                  </select>
                  <select 
                    className="quick-input flex-1 bg-zinc-900 border border-white/5 rounded-xl px-4 py-3 text-sm text-white italic font-bold text-primary"
                    value={driverForm.status}
                    onChange={e => setDriverForm({...driverForm, status: e.target.value})}
                  >
                    <option value="ativo">Ativo</option>
                    <option value="inativo">Inativo</option>
                  </select>
                </div>

                {/* Veículo Selector / Creator */}
                <div className="space-y-2 pt-2 border-t border-white/5">
                   <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase text-zinc-500">Vínculo de Veículo</span>
                      {!isEditing && (
                        <button 
                          type="button" 
                          onClick={() => setShowNewVehicleRow(!showNewVehicleRow)}
                          className={`text-[9px] font-black uppercase flex items-center gap-1 transition-colors ${showNewVehicleRow ? 'text-primary' : 'text-zinc-500 hover:text-white'}`}
                        >
                          {showNewVehicleRow ? <ChevronUp size={12} /> : <Plus size={12} />}
                          {showNewVehicleRow ? 'Voltar para lista' : 'Novo Veículo'}
                        </button>
                      )}
                   </div>

                   {!showNewVehicleRow ? (
                      <select 
                        className="quick-input w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-3 text-sm text-white"
                        value={driverForm.veiculo_id}
                        onChange={e => setDriverForm({...driverForm, veiculo_id: e.target.value})}
                      >
                        <option value="">Selecionar da Frota (Opcional)</option>
                        {veiculos.map(v => <option key={v.id} value={v.id}>{v.placa} ({v.modelo})</option>)}
                      </select>
                   ) : (
                      <div className="p-3 bg-zinc-900 border border-primary/20 rounded-xl space-y-2 animate-in slide-in-from-top-2 duration-200">
                         <div className="grid grid-cols-2 gap-2">
                            <input 
                              required 
                              placeholder="Placa" 
                              className="quick-input w-full bg-zinc-950 border border-white/5 rounded-lg px-3 py-2 text-xs text-white"
                              value={newVehicleForm.placa}
                              onChange={e => setNewVehicleForm({...newVehicleForm, placa: e.target.value})}
                            />
                            <input 
                              required 
                              placeholder="Modelo" 
                              className="quick-input w-full bg-zinc-950 border border-white/5 rounded-lg px-3 py-2 text-xs text-white"
                              value={newVehicleForm.modelo}
                              onChange={e => setNewVehicleForm({...newVehicleForm, modelo: e.target.value})}
                            />
                         </div>
                         <p className="text-[8px] text-zinc-500 uppercase italic">O veículo será criado e vinculado automaticamente.</p>
                      </div>
                   )}
                </div>
                
                {!isEditing && (
                  <div className="flex items-center gap-2 p-3 bg-primary/5 border border-primary/10 rounded-xl mt-4">
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
                )}
              </div>
            )}

            {activeTab === 'veiculos' && (
              <div className="space-y-3">
                <input required placeholder="Placa" className="quick-input w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-3 text-sm text-white" value={vehicleForm.placa} onChange={e => setVehicleForm({...vehicleForm, placa: e.target.value})} />
                <input required placeholder="Modelo (ex: Corolla)" className="quick-input w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-3 text-sm text-white" value={vehicleForm.modelo} onChange={e => setVehicleForm({...vehicleForm, modelo: e.target.value})} />
                <div className="grid grid-cols-2 gap-2">
                  <input placeholder="Cor" className="quick-input w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-3 text-sm text-white" value={vehicleForm.cor} onChange={e => setVehicleForm({...vehicleForm, cor: e.target.value})} />
                  <select 
                    className="quick-input w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-3 text-sm text-white"
                    value={vehicleForm.status}
                    onChange={e => setVehicleForm({...vehicleForm, status: e.target.value as any})}
                  >
                    <option value="ativo">Ativo</option>
                    <option value="inativo">Inativo</option>
                  </select>
                </div>
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

            <Button type="submit" isLoading={loading} className="w-full h-12 rounded-2xl shadow-lg shadow-primary/20 transition-all active:scale-95">
              {isEditing ? 'Salvar Alterações' : 'Salvar Registro'}
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
                className="group p-4 bg-zinc-900/50 border border-white/5 rounded-2xl hover:border-primary/30 hover:bg-zinc-900 transition-all flex items-center justify-between cursor-pointer"
                onClick={() => handleEditItem(item)}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl border border-white/5 ${
                    activeTab === 'motoristas' ? ((item as Motorista).status === 'inativo' ? 'bg-zinc-800 text-zinc-600' : 'bg-blue-500/10 text-blue-500') :
                    activeTab === 'veiculos' ? ((item as Veiculo).status === 'inativo' ? 'bg-zinc-800 text-zinc-600' : 'bg-amber-500/10 text-amber-500') :
                    'bg-green-500/10 text-green-500'
                  }`}>
                    {activeTab === 'motoristas' ? <UserPlus size={16} /> : activeTab === 'veiculos' ? <Car size={16} /> : <DollarSign size={16} />}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-black text-white italic truncate max-w-[160px]">
                      {activeTab === 'motoristas' ? (item as Motorista).nome : 
                       activeTab === 'veiculos' ? (item as Veiculo).placa : 
                       `${(item as Tarifario).origem} → ${(item as Tarifario).destino}`}
                    </h4>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                      {activeTab === 'motoristas' ? (
                        <>
                          <span className={(item as Motorista).tipo_vinculo === 'terceiro' ? 'text-orange-500' : 'text-green-500'}>
                            {(item as Motorista).tipo_vinculo === 'terceiro' ? 'Terceiro' : 'Fixo'}
                          </span>
                          {(item as Motorista).status === 'inativo' && <span className="text-red-500">• Inativo</span>}
                        </>
                      ) : activeTab === 'veiculos' ? (
                        <>
                          <span>{(item as Veiculo).modelo}</span>
                          {(item as Veiculo).status === 'inativo' && <span className="text-red-500">• Inativo</span>}
                        </>
                      ) : (
                        `R$ ${(item as Tarifario).valor_venda.toLocaleString()}`
                      )}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                  {activeTab === 'motoristas' && (
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        onOpenQuickOS({ 
                          motorista_id: item.id,
                          veiculo_id: (item as Motorista).veiculo_id 
                        }); 
                      }}
                      className="p-2 bg-primary/10 text-primary rounded-xl hover:bg-primary hover:text-white"
                      title="Criar OS"
                    >
                      <Send size={14} />
                    </button>
                  )}
                  <div className="p-2 bg-zinc-800 text-zinc-400 rounded-xl">
                    <Pencil size={14} />
                  </div>
                </div>
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
