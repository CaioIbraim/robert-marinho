import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Search, Pencil, Trash2, Download, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { empresaSchema } from '../schemas';
import type { EmpresaFormData } from '../schemas';
import { empresaService } from '../services/empresas.service';
import type { Empresa } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { exportToExcel, exportToPDF } from '../utils/export';
import { useLoadingStore } from '../stores/useLoadingStore';
import { showToast, showConfirm } from '../utils/swal';

export const Empresas = () => {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [isPageLoading, setIsPageLoading] = useState(true);
  
  const { setGlobalLoading } = useLoadingStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<EmpresaFormData>({
    resolver: zodResolver(empresaSchema),
  });

  const loadEmpresas = async () => {
    try {
      const data = await empresaService.getAll();
      setEmpresas(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsPageLoading(false);
    }
  };

  useEffect(() => {
    loadEmpresas();
  }, []);

  const onSubmit = async (data: EmpresaFormData) => {
    try {
      setGlobalLoading(true);
      if (editingId) {
        await empresaService.update(editingId, data);
        showToast('Empresa atualizada!');
      } else {
        await empresaService.create(data);
        showToast('Empresa cadastrada!');
      }
      setIsModalOpen(false);
      reset();
      setEditingId(null);
      loadEmpresas();
    } catch (err) {
      console.error(err);
      showToast('Erro ao salvar empresa', 'error');
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleEdit = (empresa: Empresa) => {
    setEditingId(empresa.id);
    reset({
      razao_social: empresa.razao_social,
      cnpj: empresa.cnpj,
      email: empresa.email,
      telefone: empresa.telefone,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    const result = await showConfirm('Excluir Empresa', 'Deseja realmente excluir esta empresa?');
    if (result.isConfirmed) {
      try {
        setGlobalLoading(true);
        await empresaService.delete(id);
        showToast('Empresa excluída');
        loadEmpresas();
      } catch (err) {
        console.error(err);
        showToast('Erro ao excluir empresa', 'error');
      } finally {
        setGlobalLoading(false);
      }
    }
  };

  const filteredEmpresas = empresas.filter(e => 
    e.razao_social.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.cnpj.includes(searchTerm)
  );

  const totalPages = Math.ceil(filteredEmpresas.length / itemsPerPage);
  const paginatedEmpresas = filteredEmpresas.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleExportExcel = () => {
    const data = filteredEmpresas.map(e => ({
      ID: e.id,
      RazaoSocial: e.razao_social,
      CNPJ: e.cnpj,
      Email: e.email,
      Telefone: e.telefone
    }));
    exportToExcel(data, 'empresas');
  };

  const handleExportPDF = () => {
    const columns = [
      { header: 'Razão Social', dataKey: 'razao_social' },
      { header: 'CNPJ', dataKey: 'cnpj' },
      { header: 'E-mail', dataKey: 'email' },
      { header: 'Telefone', dataKey: 'telefone' }
    ];
    exportToPDF(filteredEmpresas, columns, 'empresas', 'Relatório de Empresas');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Empresas</h1>
          <p className="text-text-muted">Gerencie as empresas parceiras e clientes.</p>
        </div>
        <Button onClick={() => { 
          setEditingId(null); 
          reset({ razao_social: '', cnpj: '', email: '', telefone: '', nome_fantasia: '', status: 'ativo' }); 
          setIsModalOpen(true); 
        }} className="flex gap-2">
          <Plus size={20} /> Nova Empresa
        </Button>
      </div>

      <Card className="!p-0 overflow-visible">
        <div className="p-4 border-b border-border flex flex-col sm:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
            <input
              type="text"
              placeholder="Buscar por razão social ou CNPJ..."
              className="w-full bg-background border border-border rounded-md pl-10 pr-4 py-2 text-sm input-focus"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
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
                <th className="px-6 py-4">Razão Social</th>
                <th className="px-6 py-4">CNPJ</th>
                <th className="px-6 py-4">E-mail</th>
                <th className="px-6 py-4">Telefone</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isPageLoading ? (
                <tr><td colSpan={5} className="px-6 py-4 text-center">Carregando...</td></tr>
              ) : paginatedEmpresas.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-4 text-center">Nenhuma empresa encontrada.</td></tr>
              ) : paginatedEmpresas.map((empresa) => (
                <tr key={empresa.id} className="hover:bg-border/20 transition-colors group">
                  <td className="px-6 py-4 font-medium text-white">{empresa.razao_social}</td>
                  <td className="px-6 py-4 text-text-muted">{empresa.cnpj}</td>
                  <td className="px-6 py-4 text-text-muted">{empresa.email}</td>
                  <td className="px-6 py-4 text-text-muted">{empresa.telefone}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleEdit(empresa)} className="p-1.5 text-text-muted hover:text-primary transition-colors">
                        <Pencil size={18} />
                      </button>
                      <button onClick={() => handleDelete(empresa.id)} className="p-1.5 text-text-muted hover:text-red-500 transition-colors">
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
               Página {currentPage} de {totalPages} (Total: {filteredEmpresas.length})
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
                {editingId ? 'Editar Empresa' : 'Nova Empresa'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-text-muted hover:text-white transition-colors"
              >
               close
              </button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <Input
                label="Razão Social"
                placeholder="Ex: Logística Brasil LTDA"
                error={errors.razao_social?.message}
                {...register('razao_social')}
              />
              <Input
                label="CNPJ"
                placeholder="00.000.000/0000-00"
                error={errors.cnpj?.message}
                {...register('cnpj')}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="E-mail"
                  type="email"
                  placeholder="contato@empresa.com"
                  error={errors.email?.message}
                  {...register('email')}
                />
                <Input
                  label="Telefone"
                  placeholder="(00) 00000-0000"
                  error={errors.telefone?.message}
                  {...register('telefone')}
                />
              </div>

              <div className="flex gap-3 justify-end mt-8 pt-4 border-t border-border">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingId ? 'Salvar Alterações' : 'Criar Empresa'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
