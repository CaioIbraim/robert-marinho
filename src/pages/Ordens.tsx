import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import type { SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Search, Pencil, Trash2, X } from 'lucide-react';
import { ordemServicoSchema } from '../schemas';
import type { OrdemServicoFormData } from '../schemas';
import { ordemService } from '../services/ordens.service';
import { empresaService } from '../services/empresas.service';
import { motoristaService } from '../services/motoristas.service';
import { veiculoService } from '../services/veiculos.service';
import type { OrdemServico, Empresa, Motorista, Veiculo } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const Ordens = () => {
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [motoristas, setMotoristas] = useState<Motorista[]>([]);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm<OrdemServicoFormData>({
    resolver: zodResolver(ordemServicoSchema) as any,
  });

  const loadData = async () => {
    try {
      const [ordensData, empresasData, motoristasData, veiculosData] = await Promise.all([
        ordemService.getAll(),
        empresaService.getAll(),
        motoristaService.getAll(),
        veiculoService.getAll(),
      ]);
      setOrdens(ordensData);
      setEmpresas(empresasData);
      setMotoristas(motoristasData);
      setVeiculos(veiculosData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onSubmit: SubmitHandler<OrdemServicoFormData> = async (data) => {
    try {
      if (editingId) {
        await ordemService.update(editingId, data);
      } else {
        await ordemService.create(data);
      }
      setIsModalOpen(false);
      reset();
      setEditingId(null);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (ordem: OrdemServico) => {
    setEditingId(ordem.id);
    reset({
      empresa_id: ordem.empresa_id,
      motorista_id: ordem.motorista_id,
      veiculo_id: ordem.veiculo_id,
      origem: ordem.origem,
      destino: ordem.destino,
      valor_total: ordem.valor_total,
      status: ordem.status,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Deseja realmente excluir esta ordem de serviço?')) {
      try {
        await ordemService.delete(id);
        loadData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente': return 'text-yellow-500 bg-yellow-500/10';
      case 'em_transito': return 'text-blue-500 bg-blue-500/10';
      case 'concluida': return 'text-green-500 bg-green-500/10';
      case 'cancelada': return 'text-red-500 bg-red-500/10';
      default: return 'text-text-muted bg-border/50';
    }
  };

  const filteredOrdens = ordens.filter(o => 
    o.origem.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.destino.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.empresa?.razao_social.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Ordens de Serviço</h1>
          <p className="text-text-muted">Gerencie os transportes e fretes.</p>
        </div>
        <Button onClick={() => { setEditingId(null); reset(); setIsModalOpen(true); }} className="flex gap-2">
          <Plus size={20} /> Nova Ordem
        </Button>
      </div>

      <Card className="!p-0 overflow-visible">
        <div className="p-4 border-b border-border flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
            <input
              type="text"
              placeholder="Buscar por origem, destino ou empresa..."
              className="w-full bg-background border border-border rounded-md pl-10 pr-4 py-2 text-sm input-focus"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface border-b border-border text-text-muted uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4">Data / Empresa</th>
                <th className="px-6 py-4">Trajeto (Origem - Destino)</th>
                <th className="px-6 py-4">Motorista / Veículo</th>
                <th className="px-6 py-4">Valor</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-4 text-center">Carregando...</td></tr>
              ) : filteredOrdens.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-4 text-center">Nenhuma ordem encontrada.</td></tr>
              ) : filteredOrdens.map((ordem) => (
                <tr key={ordem.id} className="hover:bg-border/20 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-xs text-text-muted">{format(new Date(ordem.created_at), 'dd MMM yyyy, HH:mm', { locale: ptBR })}</span>
                      <span className="font-medium text-white">{ordem.empresa?.razao_social}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-text-muted">
                      <span className="text-white font-medium">{ordem.origem}</span>
                      <span className="text-primary">→</span>
                      <span className="text-white font-medium">{ordem.destino}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-white">{ordem.motorista?.nome}</span>
                      <span className="text-xs text-text-muted font-bold uppercase">{ordem.veiculo?.placa} - {ordem.veiculo?.modelo}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-white">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ordem.valor_total)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] uppercase font-bold ${getStatusColor(ordem.status)}`}>
                      {ordem.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleEdit(ordem)} className="p-1.5 text-text-muted hover:text-primary transition-colors">
                        <Pencil size={18} />
                      </button>
                      <button onClick={() => handleDelete(ordem.id)} className="p-1.5 text-text-muted hover:text-red-500 transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface border border-border rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">
                {editingId ? 'Editar Ordem de Serviço' : 'Nova Ordem de Serviço'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-text-muted hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Seleção de Entidades */}
                <div className="space-y-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-text-muted">Empresa Cliente</label>
                    <select 
                      {...register('empresa_id')}
                      className="w-full bg-background border border-border rounded-md px-4 py-2 text-sm input-focus text-white"
                    >
                      <option value="">Selecione uma empresa</option>
                      {empresas.map(e => <option key={e.id} value={e.id}>{e.razao_social}</option>)}
                    </select>
                    {errors.empresa_id && <span className="text-xs text-red-500">{errors.empresa_id.message}</span>}
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-text-muted">Motorista responsável</label>
                    <select 
                      {...register('motorista_id')}
                      className="w-full bg-background border border-border rounded-md px-4 py-2 text-sm input-focus text-white"
                    >
                      <option value="">Selecione um motorista</option>
                      {motoristas.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
                    </select>
                    {errors.motorista_id && <span className="text-xs text-red-500">{errors.motorista_id.message}</span>}
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-text-muted">Veículo utilizado</label>
                    <select 
                      {...register('veiculo_id')}
                      className="w-full bg-background border border-border rounded-md px-4 py-2 text-sm input-focus text-white"
                    >
                      <option value="">Selecione um veículo</option>
                      {veiculos.map(v => <option key={v.id} value={v.id}>{v.placa} - {v.modelo}</option>)}
                    </select>
                    {errors.veiculo_id && <span className="text-xs text-red-500">{errors.veiculo_id.message}</span>}
                  </div>
                </div>

                {/* Detalhes da Rota */}
                <div className="space-y-4">
                  <Input
                    label="Origem (Cidade/UF)"
                    placeholder="Ex: São Paulo - SP"
                    error={errors.origem?.message}
                    {...register('origem')}
                  />
                  <Input
                    label="Destino (Cidade/UF)"
                    placeholder="Ex: Rio de Janeiro - RJ"
                    error={errors.destino?.message}
                    {...register('destino')}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Valor do Frete (R$)"
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      error={errors.valor_total?.message}
                      {...register('valor_total')}
                    />
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium text-text-muted">Status</label>
                      <select 
                        {...register('status')}
                        className="w-full bg-background border border-border rounded-md px-4 py-2 text-sm input-focus text-white"
                      >
                        <option value="pendente">Pendente</option>
                        <option value="em_transito">Em Trânsito</option>
                        <option value="concluida">Concluída</option>
                        <option value="cancelada">Cancelada</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end mt-8 pt-4 border-t border-border">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingId ? 'Salvar Alterações' : 'Criar Ordem de Serviço'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
