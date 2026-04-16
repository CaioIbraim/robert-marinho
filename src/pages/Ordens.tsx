import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import type { SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Search, Pencil, Trash2, Download, FileText, ChevronLeft, ChevronRight, Filter, RefreshCw } from 'lucide-react';
import { ordemServicoSchema } from '../schemas';
import { supabase } from '../lib/supabaseClient';
import type { OrdemServicoFormData } from '../schemas';
import { ordemService } from '../services/ordens.service';
import { empresaService } from '../services/empresas.service';
import { motoristaService } from '../services/motoristas.service';
import { veiculoService } from '../services/veiculos.service';
import { notificationService } from '../services/notifications.service';
import { useLoadingStore } from '../stores/useLoadingStore';
import { showToast, showConfirm } from '../utils/swal';
import type { OrdemServico, Empresa, Motorista, Veiculo } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { exportToExcel, exportToPDF, generatePaymentReceipt } from '../utils/export';

export const Ordens = () => {
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [motoristas, setMotoristas] = useState<Motorista[]>([]);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [ordemToConfirm, setOrdemToConfirm] = useState<string | null>(null);
  const [confirmData, setConfirmData] = useState({ forma_pagamento: 'pix', data_pagamento: new Date().toISOString().split('T')[0] });

  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusOrdemTarget, setStatusOrdemTarget] = useState<OrdemServico | null>(null);
  const [newStatus, setNewStatus] = useState<string>('');

  const { setGlobalLoading } = useLoadingStore();

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
      setIsPageLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onSubmit: SubmitHandler<OrdemServicoFormData> = async (data) => {
    try {
      setGlobalLoading(true);
      if (editingId) {
        const oldOrdem = ordens.find(o => o.id === editingId);
        await ordemService.update(editingId, data);
        
        // Notificação de alteração de status
        if (oldOrdem?.status !== data.status) {
          const statusMap: Record<string, string> = {
            'pendente': 'Pendente',
            'em_andamento': 'Em Andamento',
            'concluido': 'Concluída',
            'cancelado': 'Cancelada'
          };

          await notificationService.create({
            titulo: `OS ${statusMap[data.status as string]}`,
            mensagem: `A OS para ${data.destino} foi alterada para o status: ${statusMap[data.status as string]}.`,
            tipo: data.status === 'concluido' ? 'success' : data.status === 'cancelado' ? 'error' : 'info',
            link: '/ordens'
          });

          if (data.status === 'concluido') {
            setOrdemToConfirm(editingId);
          }
        }
        showToast('Ordem atualizada com sucesso!');
      } else {
        await ordemService.create(data);
        await notificationService.create({
          titulo: 'Nova Ordem Criada',
          mensagem: `Uma nova OS para ${data.destino} foi criada com sucesso.`,
          tipo: 'success',
          link: '/ordens'
        });
        showToast('Nova ordem criada!');
      }
      setIsModalOpen(false);
      reset({
        empresa_id: '',
        motorista_id: '',
        veiculo_id: '',
        origem: '',
        destino: '',
        valor_total: 0,
        status: 'pendente',
      });
      setEditingId(null);
      loadData();
    } catch (err) {
      console.error(err);
      showToast('Erro ao salvar ordem', 'error');
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (ordemToConfirm) {
      setGlobalLoading(true);
      await supabase.from('recebimentos').update({
        status: 'pago',
        forma_pagamento: confirmData.forma_pagamento,
        data_pagamento: confirmData.data_pagamento
      }).eq('ordem_id', ordemToConfirm);
      
      await notificationService.create({
        titulo: 'Pagamento Confirmado',
        mensagem: `O recebimento da OS vinculada foi confirmado via ${confirmData.forma_pagamento.toUpperCase()}.`,
        tipo: 'success',
        link: '/financeiro'
      });

      setOrdemToConfirm(null);
      setGlobalLoading(false);
      showToast('Recebimento confirmado!');
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

  const handleOpenStatusModal = (ordem: OrdemServico) => {
    setStatusOrdemTarget(ordem);
    setNewStatus(ordem.status);
    setStatusModalOpen(true);
  };

  const handleQuickStatusChange = async () => {
    if (!statusOrdemTarget) return;

    try {
      setGlobalLoading(true);
      await ordemService.update(statusOrdemTarget.id, { status: newStatus as any });

      if (statusOrdemTarget.status !== newStatus) {
        const statusMap: Record<string, string> = {
          'pendente': 'Pendente',
          'em_andamento': 'Em Andamento',
          'concluido': 'Concluída',
          'cancelado': 'Cancelada'
        };

        await notificationService.create({
          titulo: `Status Atualizado (${statusMap[newStatus]})`,
          mensagem: `A OS para ${statusOrdemTarget.destino} foi atualizada rapidamente para ${statusMap[newStatus]}.`,
          tipo: newStatus === 'concluido' ? 'success' : newStatus === 'cancelado' ? 'error' : 'info',
          link: '/ordens'
        });

        if (newStatus === 'concluido') {
          setOrdemToConfirm(statusOrdemTarget.id);
        }
      }
      
      showToast('Status atualizado!');
      setStatusModalOpen(false);
      setStatusOrdemTarget(null);
      loadData();
    } catch (error) {
      console.error(error);
      showToast('Erro ao atualizar status', 'error');
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const result = await showConfirm('Tem certeza?', 'Deseja realmente excluir esta ordem de serviço?');
    if (result.isConfirmed) {
      try {
        setGlobalLoading(true);
        const ordemToDelete = ordens.find(o => o.id === id);
        await ordemService.delete(id);
        
        await notificationService.create({
          titulo: 'Ordem de Serviço Excluída',
          mensagem: `A OS para ${ordemToDelete?.destino || 'Desconhecido'} foi removida do sistema.`,
          tipo: 'error'
        });

        showToast('Ordem excluída!');
        loadData();
      } catch (err) {
        console.error(err);
        showToast('Erro ao excluir', 'error');
      } finally {
        setGlobalLoading(false);
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
    (o.origem.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.destino.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.empresa?.razao_social.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (statusFilter === '' || o.status === statusFilter)
  );

  const totalPages = Math.ceil(filteredOrdens.length / itemsPerPage);
  const paginatedOrdens = filteredOrdens.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleExportExcel = () => {
    const data = filteredOrdens.map(o => ({
      ID: o.id,
      Data: format(new Date(o.created_at), 'dd/MM/yyyy HH:mm'),
      Empresa: o.empresa?.razao_social,
      Origem: o.origem,
      Destino: o.destino,
      Motorista: o.motorista?.nome,
      Veiculo: o.veiculo?.placa,
      Valor: o.valor_total,
      Status: o.status
    }));
    exportToExcel(data, 'ordens_servico');
  };

  const handleExportPDF = () => {
    const columns = [
      { header: 'Data', dataKey: 'data' },
      { header: 'Empresa', dataKey: 'empresa' },
      { header: 'Origem', dataKey: 'origem' },
      { header: 'Destino', dataKey: 'destino' },
      { header: 'Status', dataKey: 'status' }
    ];
    const data = filteredOrdens.map(o => ({
      data: format(new Date(o.created_at), 'dd/MM/yyyy'),
      empresa: o.empresa?.razao_social || '',
      origem: o.origem,
      destino: o.destino,
      status: o.status
    }));
    exportToPDF(data, columns, 'ordens_servico', 'Relatório de Ordens de Serviço');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Ordens de Serviço</h1>
          <p className="text-text-muted">Gerencie os transportes e fretes.</p>
        </div>
        <Button onClick={() => { 
          setEditingId(null); 
          reset({
            empresa_id: '',
            motorista_id: '',
            veiculo_id: '',
            origem: '',
            destino: '',
            valor_total: 0,
            status: 'pendente',
          }); 
          setIsModalOpen(true); 
        }} className="flex gap-2">
          <Plus size={20} /> Nova Ordem
        </Button>
      </div>

      <Card className="!p-0 overflow-visible">
        <div className="p-4 border-b border-border flex flex-col sm:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
            <input
              type="text"
              placeholder="Buscar por origem, destino ou empresa..."
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
                  <option value="pendente">Pendente</option>
                  <option value="em_andamento">Em Andamento</option>
                  <option value="concluido">Concluída</option>
                  <option value="cancelado">Cancelada</option>
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
                <th className="px-6 py-4">Data / Empresa</th>
                <th className="px-6 py-4">Trajeto (Origem - Destino)</th>
                <th className="px-6 py-4">Motorista / Veículo</th>
                <th className="px-6 py-4">Valor</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isPageLoading ? (
                <tr><td colSpan={6} className="px-6 py-4 text-center">Carregando...</td></tr>
              ) : paginatedOrdens.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-4 text-center">Nenhuma ordem encontrada.</td></tr>
              ) : paginatedOrdens.map((ordem) => (
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
                      <button onClick={() => handleEdit(ordem)} className="p-1.5 text-text-muted hover:text-primary transition-colors tooltip-trigger" title="Editar">
                        <Pencil size={18} />
                      </button>
                      <button onClick={() => handleOpenStatusModal(ordem)} className="p-1.5 text-text-muted hover:text-orange-500 transition-colors tooltip-trigger" title="Alterar Status Rápido">
                        <RefreshCw size={18} />
                      </button>
                      <button onClick={() => handleDelete(ordem.id)} className="p-1.5 text-text-muted hover:text-red-500 transition-colors tooltip-trigger" title="Excluir">
                        <Trash2 size={18} />
                      </button>
                      {ordem.status === 'concluido' && (
                        <button onClick={() => generatePaymentReceipt(ordem, ordem.empresa)} className="p-1.5 text-text-muted hover:text-blue-500 transition-colors tooltip-trigger" title="Gerar Recibo">
                          <FileText size={18} />
                        </button>
                      )}
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
               Página {currentPage} de {totalPages} (Total: {filteredOrdens.length})
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
          <div className="bg-surface border border-border rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">
                {editingId ? 'Editar Ordem de Serviço' : 'Nova Ordem de Serviço'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-text-muted hover:text-white transition-colors"
              >
               close
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
                        <option value="em_andamento">Em Andamento</option>
                        <option value="concluido">Concluída</option>
                        <option value="cancelado">Cancelada</option>
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

      {/* Modal de Confirmação de Recebimento Automático */}
      {ordemToConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface border border-border rounded-xl w-full max-w-sm shadow-2xl p-6 animate-in zoom-in">
            <h3 className="text-lg font-bold text-white mb-2">Ordem Concluída!</h3>
            <p className="text-sm text-text-muted mb-4">Deseja registrar o recebimento desse frete agora mesmo?</p>
            
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm text-text-muted">Forma de Pagamento</label>
                <select 
                  className="w-full bg-background border border-border rounded-md px-4 py-2 text-sm text-white"
                  value={confirmData.forma_pagamento}
                  onChange={(e) => setConfirmData({...confirmData, forma_pagamento: e.target.value})}
                >
                  <option value="pix">PIX</option>
                  <option value="boleto">Boleto</option>
                  <option value="transferencia">Transferência</option>
                  <option value="dinheiro">Dinheiro Físico</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm text-text-muted">Data do Pagamento</label>
                <input 
                  type="date"
                  className="w-full bg-background border border-border rounded-md px-4 py-2 text-sm text-white"
                  value={confirmData.data_pagamento}
                  onChange={(e) => setConfirmData({...confirmData, data_pagamento: e.target.value})}
                />
              </div>

              <div className="flex gap-3 justify-end mt-6">
                <Button type="button" variant="ghost" onClick={() => setOrdemToConfirm(null)}>Mais tarde</Button>
                <Button type="button" onClick={handleConfirmPayment} className="bg-green-600 hover:bg-green-700">Confirmar Recebimento</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Quick Status Change */}
      {statusModalOpen && statusOrdemTarget && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
           <div className="bg-surface border border-border rounded-xl w-full max-w-sm shadow-2xl p-6 animate-in zoom-in">
              <h3 className="text-lg font-bold text-white mb-2">Alterar Status</h3>
              <p className="text-sm text-text-muted mb-4">
                Ordem: {statusOrdemTarget.origem} → {statusOrdemTarget.destino}
              </p>
              
              <div className="flex flex-col gap-2 mb-6">
                <label className="text-sm text-text-muted">Novo Status</label>
                <select 
                  className="w-full bg-background border border-border rounded-md px-4 py-2 text-sm text-white"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                >
                  <option value="pendente">Pendente</option>
                  <option value="em_andamento">Em Andamento</option>
                  <option value="concluido">Concluída</option>
                  <option value="cancelado">Cancelada</option>
                </select>
              </div>

              <div className="flex gap-3 justify-end">
                <Button type="button" variant="ghost" onClick={() => setStatusModalOpen(false)}>Cancelar</Button>
                <Button type="button" onClick={handleQuickStatusChange} className="bg-primary hover:opacity-90">Salvar Status</Button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
