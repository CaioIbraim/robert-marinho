import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import type { SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Search, Pencil, Trash2, Download, FileText, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { veiculoSchema } from '../../schemas';
import type { VeiculoFormData } from '../../schemas';
import { veiculoService } from '../../services/veiculos.service';
import type { Veiculo } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { exportToExcel, exportToPDF } from '../../utils/export';
import { useLoadingStore } from '../../stores/useLoadingStore';
import { showToast, showConfirm } from '../../utils/swal';

export const Veiculos = () => {
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [isPageLoading, setIsPageLoading] = useState(true);
  
  const { setGlobalLoading } = useLoadingStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<VeiculoFormData>({
    resolver: zodResolver(veiculoSchema) as any,
  });

  const loadVeiculos = async () => {
    try {
      const data = await veiculoService.getAll();
      setVeiculos(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsPageLoading(false);
    }
  };

  useEffect(() => {
    loadVeiculos();
  }, []);

  const onSubmit: SubmitHandler<VeiculoFormData> = async (data) => {
    try {
      setGlobalLoading(true);
      if (editingId) {
        await veiculoService.update(editingId, data);
        showToast('Veículo atualizado!');
      } else {
        await veiculoService.create(data);
        showToast('Veículo cadastrado!');
      }
      setIsModalOpen(false);
      reset();
      setEditingId(null);
      loadVeiculos();
    } catch (err) {
      console.error(err);
      showToast('Erro ao salvar veículo', 'error');
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleEdit = (veiculo: Veiculo) => {
    setEditingId(veiculo.id);
    reset({
      placa: veiculo.placa,
      modelo: veiculo.modelo,
      capacidade: veiculo.capacidade,
      meta_faturamento: veiculo.meta_faturamento,
      status: veiculo.status,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    const result = await showConfirm('Excluir Veículo', 'Deseja realmente excluir este veículo?');
    if (result.isConfirmed) {
      try {
        setGlobalLoading(true);
        await veiculoService.delete(id);
        showToast('Veículo excluído');
        loadVeiculos();
      } catch (err) {
        console.error(err);
        showToast('Erro ao excluir veículo', 'error');
      } finally {
        setGlobalLoading(false);
      }
    }
  };

  const filteredVeiculos = veiculos.filter(v => 
    ((v.placa?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (v.modelo?.toLowerCase() || '').includes(searchTerm.toLowerCase())) &&
    (statusFilter === '' || v.status === statusFilter)
  );

  const totalPages = Math.ceil(filteredVeiculos.length / itemsPerPage);
  const paginatedVeiculos = filteredVeiculos.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleExportExcel = () => {
    const data = filteredVeiculos.map(v => ({
      ID: v.id,
      Placa: v.placa,
      Modelo: v.modelo,
      Capacidade: v.capacidade,
      Status: v.status
    }));
    exportToExcel(data, 'veiculos');
  };

  const handleExportPDF = () => {
    const columns = [
      { header: 'Placa', dataKey: 'placa' },
      { header: 'Modelo', dataKey: 'modelo' },
      { header: 'Capacidade', dataKey: 'capacidade' },
      { header: 'Status', dataKey: 'status' }
    ];
    exportToPDF(filteredVeiculos, columns, 'veiculos', 'Relatório de Veículos');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Veículos</h1>
          <p className="text-text-muted">Gerencie a frota de veículos.</p>
        </div>
        <Button onClick={() => { 
          setEditingId(null); 
          reset({ placa: '', modelo: '', capacidade: undefined, status: 'ativo' }); 
          setIsModalOpen(true); 
        }} className="flex gap-2">
          <Plus size={20} /> Novo Veículo
        </Button>
      </div>

      <Card className="!p-0 overflow-visible">
        <div className="p-4 border-b border-border flex flex-col sm:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
            <input
              type="text"
              placeholder="Buscar por placa ou modelo..."
              className="w-full bg-background border border-border rounded-md pl-10 pr-4 py-2 text-sm input-focus"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
             <div className="relative w-full sm:w-40">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                <select 
                  className="w-full bg-background border border-border rounded-md pl-9 pr-4 py-2 text-sm input-focus text-white appearance-none"
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                >
                  <option value="">Status</option>
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                </select>
             </div>
             
             <button onClick={handleExportExcel} className="p-2 bg-surface border border-border rounded-md hover:border-green-500 hover:text-green-500 text-text-muted transition-colors tooltip-trigger" title="Exportar para Excel">
                <Download size={18} />
             </button>
             <button onClick={handleExportPDF} className="p-2 bg-surface border border-border rounded-md hover:border-red-500 hover:text-red-500 text-text-muted transition-colors tooltip-trigger" title="Exportar para PDF">
               <FileText size={18} />
             </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface border-b border-border text-text-muted uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4">Placa</th>
                <th className="px-6 py-4">Modelo</th>
                <th className="px-6 py-4">Capacidade (kg)</th>
                <th className="px-6 py-4">Faturamento / Meta</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isPageLoading ? (
                <tr><td colSpan={5} className="px-6 py-4 text-center">Carregando...</td></tr>
              ) : paginatedVeiculos.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-4 text-center">Nenhum veículo encontrado.</td></tr>
              ) : paginatedVeiculos.map((veiculo) => (
                <tr key={veiculo.id} className="hover:bg-border/20 transition-colors group">
                  <td className="px-6 py-4 font-bold text-primary uppercase">{veiculo.placa}</td>
                  <td className="px-6 py-4 font-medium text-white">{veiculo.modelo}</td>
                  <td className="px-6 py-4 text-text-muted">{veiculo.capacidade || 'N/A'}</td>
                  <td className="px-6 py-4">
                    {veiculo.meta_faturamento ? (
                      <div className="space-y-1 min-w-[120px]">
                        <div className="flex justify-between text-xs text-text-muted">
                          <span>R$ {(veiculo.faturamento_real || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</span>
                          <span>/ R$ {veiculo.meta_faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</span>
                        </div>
                        <div className="w-full bg-border rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full bg-primary transition-all"
                            style={{ width: `${Math.min(100, ((veiculo.faturamento_real || 0) / veiculo.meta_faturamento) * 100)}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <span className="text-text-muted text-xs">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] uppercase font-bold ${veiculo.status === 'ativo' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                      {veiculo.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleEdit(veiculo)} className="p-1.5 text-text-muted hover:text-primary transition-colors">
                        <Pencil size={18} />
                      </button>
                      <button onClick={() => handleDelete(veiculo.id)} className="p-1.5 text-text-muted hover:text-red-500 transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-border flex items-center justify-between">
             <span className="text-sm text-text-muted">
               Página {currentPage} de {totalPages} (Total: {filteredVeiculos.length})
             </span>
             <div className="flex gap-2">
               <button 
                 onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                 disabled={currentPage === 1}
                 className="p-1.5 rounded-md border border-border text-text disabled:opacity-50 hover:bg-border/50 transition-colors"
               >
                 <ChevronLeft size={18} />
               </button>
               <button 
                 onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                 disabled={currentPage === totalPages}
                 className="p-1.5 rounded-md border border-border text-text disabled:opacity-50 hover:bg-border/50 transition-colors"
               >
                 <ChevronRight size={18} />
               </button>
             </div>
          </div>
        )}
      </Card>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface border border-border rounded-xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">
                {editingId ? 'Editar Veículo' : 'Novo Veículo'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-text-muted hover:text-white transition-colors"
              >
               close
              </button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Placa"
                  placeholder="ABC-1234"
                  error={errors.placa?.message}
                  {...register('placa')}
                />
                <Input
                  label="Modelo"
                  placeholder="Ex: FH 540"
                  error={errors.modelo?.message}
                  {...register('modelo')}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Capacidade (kg)"
                  type="number"
                  placeholder="Ex: 10000"
                  error={errors.capacidade?.message}
                  {...register('capacidade')}
                />
                <Input
                  label="Meta de Faturamento Mensal (R$)"
                  type="number"
                  placeholder="Ex: 15000"
                  error={errors.meta_faturamento?.message}
                  {...register('meta_faturamento')}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-text-muted">Status</label>
                <select 
                  {...register('status')}
                  className="w-full bg-background border border-border rounded-md px-4 py-2 text-sm input-focus text-white"
                >
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                </select>
              </div>

              <div className="flex gap-3 justify-end mt-8 pt-4 border-t border-border">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingId ? 'Salvar Alterações' : 'Criar Veículo'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
