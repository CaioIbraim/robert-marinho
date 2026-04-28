import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Search, Pencil, Trash2, MapPin, Tag, ChevronLeft, ChevronRight } from 'lucide-react';
import { tarifarioSchema, type TarifarioFormData } from '../../schemas';
import { tarifarioService } from '../../services/tarifarios.service';
import { useLoadingStore } from '../../stores/useLoadingStore';
import { showToast, showConfirm } from '../../utils/swal';
import type { Tarifario } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';

export const Tarifarios = () => {
  const [tarifarios, setTarifarios] = useState<Tarifario[]>([]);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  
  const { setGlobalLoading } = useLoadingStore();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<TarifarioFormData>({
    resolver: zodResolver(tarifarioSchema) as any,
  });

  const loadData = async () => {
    try {
      const data = await tarifarioService.getAll();
      setTarifarios(data || []);
    } catch (err) {
      console.error(err);
      showToast('Erro ao carregar tarifários', 'error');
    } finally {
      setIsPageLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onSubmit = async (data: TarifarioFormData) => {
    try {
      setGlobalLoading(true);
      if (editingId) {
        await tarifarioService.update(editingId, data);
        showToast('Tarifário atualizado!');
      } else {
        await tarifarioService.create(data);
        showToast('Novo tarifário cadastrado!');
      }
      setIsModalOpen(false);
      reset();
      setEditingId(null);
      loadData();
    } catch (err) {
      console.error(err);
      showToast('Erro ao salvar tarifário', 'error');
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleEdit = (tar: Tarifario) => {
    setEditingId(tar.id);
    reset({
      origem: tar.origem,
      destino: tar.destino,
      valor_venda: tar.valor_venda,
      valor_custo: tar.valor_custo || 0,
      descricao: tar.descricao || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    const confirmed = await showConfirm(
      'Excluir Tarifário?',
      'Esta ação não pode ser desfeita.'
    );
    if (confirmed) {
      try {
        setGlobalLoading(true);
        await tarifarioService.delete(id);
        showToast('Tarifário excluído!');
        loadData();
      } catch (err) {
        showToast('Erro ao excluir', 'error');
      } finally {
        setGlobalLoading(false);
      }
    }
  };

  const filtered = tarifarios.filter(t => 
    (t.origem?.toLowerCase().includes(searchTerm.toLowerCase()) || 
     t.destino?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (isPageLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Tag className="text-primary" /> Tabela de Tarifários
          </h1>
          <p className="text-text-muted text-sm mt-1">Gerencie os valores padrões para suas rotas recorrentes.</p>
        </div>
        <Button onClick={() => { setEditingId(null); reset(); setIsModalOpen(true); }} className="flex gap-2">
          <Plus size={20} /> Novo Tarifário
        </Button>
      </div>

      <Card className="!p-0">
        <div className="p-4 border-b border-border">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
            <input
              type="text"
              placeholder="Buscar por origem ou destino..."
              className="w-full bg-background border border-border rounded-md pl-10 pr-4 py-2 text-sm input-focus"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-border/30 text-text-muted text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Rota</th>
                <th className="px-6 py-4 font-semibold">Valor Venda</th>
                <th className="px-6 py-4 font-semibold">Custo Est.</th>
                <th className="px-6 py-4 font-semibold">Descrição</th>
                <th className="px-6 py-4 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-text-muted italic">Nenhum tarifário encontrado.</td>
                </tr>
              ) : (
                paginated.map((tar) => (
                  <tr key={tar.id} className="hover:bg-border/10 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-white font-bold text-sm flex items-center gap-1.5">
                          <MapPin size={12} className="text-primary" /> {tar.origem}
                        </span>
                        <span className="text-text-muted text-xs mt-1 ml-4 italic">para {tar.destino}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-emerald-500 font-black">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(tar.valor_venda)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-text-muted text-sm">
                        {tar.valor_custo ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(tar.valor_custo) : '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-text-muted max-w-[200px] truncate">
                      {tar.descricao || '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => handleEdit(tar)} className="p-2 text-text-muted hover:text-primary transition-colors hover:bg-primary/10 rounded-lg">
                          <Pencil size={18} />
                        </button>
                        <button onClick={() => handleDelete(tar.id)} className="p-2 text-text-muted hover:text-red-500 transition-colors hover:bg-red-500/10 rounded-lg">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-4 border-t border-border flex items-center justify-between">
             <span className="text-sm text-text-muted">Página {currentPage} de {totalPages}</span>
             <div className="flex gap-2">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1.5 rounded-md border border-border text-text disabled:opacity-50 hover:bg-border/50 transition-colors">
                  <ChevronLeft size={18} />
                </button>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-1.5 rounded-md border border-border text-text disabled:opacity-50 hover:bg-border/50 transition-colors">
                  <ChevronRight size={18} />
                </button>
             </div>
          </div>
        )}
      </Card>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface border border-border rounded-xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                {editingId ? <Pencil size={20} /> : <Plus size={20} />}
                {editingId ? 'Editar Tarifário' : 'Novo Tarifário'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-text-muted hover:text-white transition-colors">close</button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
               <Input label="Origem (Local de Saída)" placeholder="Ex: São Paulo - SP" error={errors.origem?.message} {...register('origem')} />
               <Input label="Destino (Local de Entrega)" placeholder="Ex: Curitiba - PR" error={errors.destino?.message} {...register('destino')} />
               
               <div className="grid grid-cols-2 gap-4">
                 <Input label="Valor de Venda (R$)" type="number" step="0.01" error={errors.valor_venda?.message} {...register('valor_venda')} />
                 <Input label="Custo Previsto (R$)" type="number" step="0.01" error={errors.valor_custo?.message} {...register('valor_custo')} />
               </div>

               <div className="flex flex-col gap-2">
                 <label className="text-sm font-medium text-text-muted">Observações / Detalhes</label>
                 <textarea 
                   {...register('descricao')}
                   className="w-full bg-background border border-border rounded-md px-4 py-2 text-sm input-focus text-white min-h-[100px]"
                   placeholder="Ex: Valor válido apenas para veículos tipo Van."
                 />
                 {errors.descricao && <span className="text-xs text-red-500">{errors.descricao.message}</span>}
               </div>

               <div className="flex gap-3 justify-end mt-8 pt-4 border-t border-border">
                 <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                 <Button type="submit">{editingId ? 'Salvar Alterações' : 'Cadastrar Tarifário'}</Button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
