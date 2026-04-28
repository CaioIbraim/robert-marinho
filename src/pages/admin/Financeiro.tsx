import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import type { SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Search, Pencil, Trash2, DollarSign, CheckCircle, Download, FileText, AlertTriangle, RefreshCw, TrendingDown, TrendingUp } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { notificationService } from '../../services/notifications.service';
import { useLoadingStore } from '../../stores/useLoadingStore';
import { showToast, showConfirm } from '../../utils/swal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { FormDatePicker } from '../../components/ui/FormDatePicker';
import { formatDateBR } from '../../utils/date';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { exportToExcel, exportToPDF } from '../../utils/export';
import { z } from 'zod';

const recebimentoSchema = z.object({
  ordem_id: z.string().uuid('Selecione uma ordem de serviço'),
  valor: z.coerce.number().min(0.01, 'Valor deve ser positivo'),
  data_pagamento: z.string().optional().or(z.literal('')),
  forma_pagamento: z.string().optional(),
  status: z.enum(['pendente', 'pago', 'atrasado']).default('pendente'),
});

type RecebimentoFormData = z.infer<typeof recebimentoSchema>;

export const Financeiro = () => {
  const [recebimentos, setRecebimentos] = useState<any[]>([]);
  const [ordens, setOrdens] = useState<any[]>([]);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEmpresa, setFilterEmpresa] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDataInicio, setFilterDataInicio] = useState('');
  const [filterDataFim, setFilterDataFim] = useState('');
  const [paymentToForce, setPaymentToForce] = useState<any | null>(null);
  const [empresas, setEmpresas] = useState<any[]>([]);
  
  const { setGlobalLoading } = useLoadingStore();
  
  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<RecebimentoFormData>({
    resolver: zodResolver(recebimentoSchema) as any,
  });

  const loadData = async () => {
    try {
      const [recRes, ordensRes, empRes] = await Promise.all([
        supabase.from('recebimentos')
          .select(`
            *,
            ordem:ordens_servico(
              *,
              motorista:motoristas(*),
              empresa:empresas(*)
            )
          `)
          .order('created_at', { ascending: false }),
        supabase.from('ordens_servico')
          .select('id, numero_os, origem, destino, valor_faturamento')
          .in('status', ['pendente', 'em_andamento', 'concluido']),
        supabase.from('empresas').select('id, razao_social, nome_fantasia').order('nome_fantasia')
      ]);
      setRecebimentos(recRes.data || []);
      setOrdens(ordensRes.data || []);
      setEmpresas(empRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsPageLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Totalizadores
  const stats = recebimentos.reduce((acc, r) => {
    const valor = Number(r.valor || 0);
    const custo = Number(r.ordem?.valor_custo_motorista || 0);
    
    if (r.status === 'pago') {
      acc.totalRecebido += valor;
      acc.totalLucro += (valor - custo);
      acc.totalRepasse += custo;
    } else if (r.status === 'pendente') {
      acc.totalPendente += valor;
    }
    return acc;
  }, { totalRecebido: 0, totalPendente: 0, totalLucro: 0, totalRepasse: 0 });

  const onSubmit: SubmitHandler<RecebimentoFormData> = async (data) => {
    const linkedOrdem = ordens.find(o => o.id === data.ordem_id);
    if (data.status === 'pago' && linkedOrdem && linkedOrdem.status !== 'concluido' && !paymentToForce) {
       setPaymentToForce({ isFromSubmit: true, data, linkedOrdem });
       return;
    }
    executeSubmit(data);
  };

  const executeSubmit = async (data: RecebimentoFormData) => {
    try {
      setGlobalLoading(true);
      const payload = {
        ...data,
        data_pagamento: data.data_pagamento ? data.data_pagamento : null
      };

      if (editingId) {
        await supabase.from('recebimentos').update(payload).eq('id', editingId);
        
        if (data.status === 'pago') {
          await notificationService.create({
            titulo: 'Lançamento atualizado: PAGO',
            mensagem: `O recebimento de R$ ${data.valor} foi atualizado como PAGO.`,
            tipo: 'success',
            link: '/financeiro'
          });
        }
      } else {
        await supabase.from('recebimentos').insert([payload]);
        
        await notificationService.create({
          titulo: 'Novo Lançamento Financeiro',
          mensagem: `Um novo recebimento de R$ ${data.valor} foi registrado como ${data.status.toUpperCase()}.`,
          tipo: data.status === 'pago' ? 'success' : 'info',
          link: '/financeiro'
        });
      }
      showToast('Recebimento salvo com sucesso!');
      setIsModalOpen(false);
      reset({ valor: 0, data_pagamento: '', forma_pagamento: '', status: 'pendente', ordem_id: '' });
      setEditingId(null);
      setPaymentToForce(null);
      loadData();
    } catch (err) {
      console.error(err);
      showToast('Erro ao salvar recebimento', 'error');
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleEdit = (rec: any) => {
    setEditingId(rec.id);
    reset({
      valor: rec.valor,
      data_pagamento: rec.data_pagamento || '',
      forma_pagamento: rec.forma_pagamento || '',
      status: rec.status,
      ordem_id: rec.ordem_id
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    const result = await showConfirm('Excluir Recebimento', 'Deseja realmente excluir este lançamento?');
    if (result.isConfirmed) {
      setGlobalLoading(true);
      await supabase.from('recebimentos').delete().eq('id', id);
      setGlobalLoading(false);
      showToast('Lançamento excluído');
      loadData();
    }
  };

  const handleMarcarPago = async (id: string) => {
    const lancamento = recebimentos.find(r => r.id === id);
    if (lancamento?.ordem && lancamento.ordem.status !== 'concluido' && !paymentToForce) {
       setPaymentToForce({ isFromSubmit: false, lancamento, linkedOrdem: lancamento.ordem });
       return;
    }
    executeMarcarPago(id);
  };

  const executeMarcarPago = async (id: string) => {
    setGlobalLoading(true);
    const { data: currentRec } = await supabase.from('recebimentos').select('valor').eq('id', id).single();
    
    await supabase.from('recebimentos').update({ status: 'pago', data_pagamento: new Date().toISOString() }).eq('id', id);
    
    await notificationService.create({
      titulo: 'Recebimento Confirmado',
      mensagem: `A baixa do recebimento no valor de R$ ${currentRec?.valor || ''} foi realizada com sucesso.`,
      tipo: 'success',
      link: '/financeiro'
    });

    setGlobalLoading(false);
    showToast('Recebimento baixado!');
    setPaymentToForce(null);
    loadData();
  };

  const handleForcePaymentConfirmation = async (completeOS: boolean) => {
     try {
       setGlobalLoading(true);
       if (completeOS && paymentToForce.linkedOrdem) {
          await supabase.from('ordens_servico').update({ status: 'concluido' }).eq('id', paymentToForce.linkedOrdem.id);
       }
       
       if (paymentToForce.isFromSubmit) {
          await executeSubmit(paymentToForce.data);
       } else {
          await executeMarcarPago(paymentToForce.lancamento.id);
       }
     } finally {
       setGlobalLoading(false);
     }
  };

  const filtered = recebimentos.filter(r => {
    const matchesSearch = 
      (r.forma_pagamento?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
      (r.ordem?.origem?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (r.ordem?.empresa?.nome_fantasia?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (r.ordem?.empresa?.razao_social?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (r.ordem?.numero_os?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    const matchesEmpresa = filterEmpresa ? r.ordem?.empresa_id === filterEmpresa : true;
    const matchesStatus = filterStatus ? r.status === filterStatus : true;
    
    let matchesData = true;
    if (filterDataInicio || filterDataFim) {
      const dataPagamento = r.data_pagamento ? new Date(r.data_pagamento.split('T')[0]) : null;
      if (!dataPagamento && r.status === 'pendente') {
         // Se quer filtrar por data, mas está pendente e não tem data, ou não tem previsão?
         // Neste caso vamos considerar a data_pagamento, ou rejeitar se não tem data.
         matchesData = false;
      }
      if (dataPagamento) {
        if (filterDataInicio) {
          const dtInicio = new Date(filterDataInicio);
          if (dataPagamento < dtInicio) matchesData = false;
        }
        if (filterDataFim) {
           const dtFim = new Date(filterDataFim);
           if (dataPagamento > dtFim) matchesData = false;
        }
      }
    }

    return matchesSearch && matchesEmpresa && matchesStatus && matchesData;
  });

  const handleExportExcel = () => {
    const data = filtered.map(r => ({
      ID: r.id,
      'OS Origem/Destino': r.ordem ? `${r.ordem.origem} → ${r.ordem.destino}` : '',
      'Status Recebimento': r.status,
      'Valor Recebido (Bruto)': r.valor,
      'Repasse Motorista': r.ordem?.valor_custo_motorista || 0,
      'Lucro Líquido': r.valor - (r.ordem?.valor_custo_motorista || 0),
      'Data Pagamento': r.data_pagamento,
      'Forma Pagamento': r.forma_pagamento,
      'Empresa': r.ordem?.empresa?.nome_fantasia || r.ordem?.empresa?.razao_social || '---'
    }));
    exportToExcel(data, `financeiro_filtrado_${new Date().toISOString().split('T')[0]}`);
  };

  const handleExportPDF = () => {
    const columns = [
      { header: 'Ordem de Serviço', dataKey: 'os' },
      { header: 'Status', dataKey: 'status' },
      { header: 'Valor Bruto', dataKey: 'valor_bruto' },
      { header: 'Repasse', dataKey: 'repasse' },
      { header: 'Lucro', dataKey: 'lucro' }
    ];
    const data = filtered.map(r => ({
      ...r,
      os: r.ordem ? `${r.ordem.origem} → ${r.ordem.destino}` : '-',
      valor_bruto: `R$ ${Number(r.valor).toLocaleString('pt-BR')}`,
      repasse: `R$ ${Number(r.ordem?.valor_custo_motorista || 0).toLocaleString('pt-BR')}`,
      lucro: `R$ ${Number(r.valor - (r.ordem?.valor_custo_motorista || 0)).toLocaleString('pt-BR')}`
    }));
    exportToPDF(data, columns, 'recebimentos_financeiros', 'Relatório de Recebimentos e Lucratividade');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Recebimentos (Financeiro)</h1>
          <p className="text-text-muted">Gerencie os pagamentos atrelados às suas ordens.</p>
        </div>
        <Button onClick={() => { 
          setEditingId(null); 
          reset({ valor: 0, data_pagamento: '', forma_pagamento: '', status: 'pendente', ordem_id: '' }); 
          setIsModalOpen(true); 
        }} className="flex gap-2 bg-green-600 hover:bg-green-700">
          <Plus size={20} /> Lançar Recebimento
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="flex items-center gap-4 border-l-4 border-l-green-500">
          <div className="p-3 bg-green-500/10 text-green-500 rounded-full">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-xs text-text-muted uppercase font-bold tracking-wider">Total Recebido</p>
            <p className="text-xl font-bold text-white leading-tight">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalRecebido)}
            </p>
          </div>
        </Card>
        
        <Card className="flex items-center gap-4 border-l-4 border-l-yellow-500">
          <div className="p-3 bg-yellow-500/10 text-yellow-500 rounded-full">
            <RefreshCw size={24} />
          </div>
          <div>
            <p className="text-xs text-text-muted uppercase font-bold tracking-wider">A Receber (OS em Aberto)</p>
            <p className="text-xl font-bold text-white leading-tight">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalPendente)}
            </p>
          </div>
        </Card>

        <Card className="flex items-center gap-4 border-l-4 border-l-orange-500">
          <div className="p-3 bg-orange-500/10 text-orange-500 rounded-full">
            <TrendingDown size={24} />
          </div>
          <div>
            <p className="text-xs text-text-muted uppercase font-bold tracking-wider">Total em Repasse</p>
            <p className="text-xl font-bold text-white leading-tight">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalRepasse)}
            </p>
          </div>
        </Card>

        <Card className="flex items-center gap-4 border-l-4 border-l-primary">
          <div className="p-3 bg-primary/10 text-primary rounded-full">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-xs text-text-muted uppercase font-bold tracking-wider">Lucro Líquido Real</p>
            <p className="text-xl font-bold text-white leading-tight font-primary">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalLucro)}
            </p>
          </div>
        </Card>
      </div>

      <Card className="!p-0 overflow-visible">
        <div className="p-4 border-b border-border flex flex-col md:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
            <input
              type="text"
              placeholder="Buscar por OS, empresa, forma pgto ou origem..."
              className="w-full bg-background border border-border rounded-md pl-10 pr-4 py-2 text-sm input-focus"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <select
              className="bg-background border border-border rounded-md px-3 py-2 text-sm text-white"
              value={filterEmpresa}
              onChange={(e) => setFilterEmpresa(e.target.value)}
            >
              <option value="">Todas Empresas</option>
              {empresas.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.nome_fantasia || emp.razao_social}</option>
              ))}
            </select>

            <select
              className="bg-background border border-border rounded-md px-3 py-2 text-sm text-white"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">Todos Status</option>
              <option value="pendente">Pendente</option>
              <option value="pago">Pago</option>
              <option value="atrasado">Atrasado</option>
            </select>
            
            <div className="flex items-center gap-2">
               <input
                 type="date"
                 className="bg-background border border-border rounded-md px-2 py-2 text-sm text-white"
                 value={filterDataInicio}
                 onChange={(e) => setFilterDataInicio(e.target.value)}
                 title="Data Inicio"
               />
               <span className="text-text-muted text-sm">até</span>
               <input
                 type="date"
                 className="bg-background border border-border rounded-md px-2 py-2 text-sm text-white"
                 value={filterDataFim}
                 onChange={(e) => setFilterDataFim(e.target.value)}
                 title="Data Fim"
               />
            </div>
          </div>

          <div className="flex gap-2 w-full sm:w-auto md:ml-auto">
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
                <th className="px-6 py-4">Ordem de Serviço</th>
                <th className="px-6 py-4">Data Pagto.</th>
                <th className="px-6 py-4">Forma</th>
                <th className="px-6 py-4">Bruto</th>
                <th className="px-6 py-4">Repasse</th>
                <th className="px-6 py-4">Lucro</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isPageLoading ? (
                <tr><td colSpan={6} className="px-6 py-4 text-center">Carregando...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-4 text-center">Nenhum recebimento.</td></tr>
              ) : filtered.map((r) => (
                <tr key={r.id} className="hover:bg-border/20 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-green-500/10 text-green-500">
                        <DollarSign size={16} />
                      </div>
                      <div>
                        <p className="font-medium text-white">{r.ordem?.origem} → {r.ordem?.destino}</p>
                        <p className="text-xs text-text-muted">OS N°: {r.ordem?.numero_os || r.ordem?.id?.slice(0,8)}</p>
                        {r.ordem?.empresa && (
                          <p className="text-[10px] text-primary truncate max-w-[150px]" title={r.ordem.empresa.nome_fantasia || r.ordem.empresa.razao_social}>
                            {r.ordem.empresa.nome_fantasia || r.ordem.empresa.razao_social}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-text-muted">
                    {formatDateBR(r.data_pagamento) || '-'}
                  </td>
                  <td className="px-6 py-4 text-text-muted capitalize">
                    {r.forma_pagamento || '-'}
                  </td>
                  <td className="px-6 py-4 font-bold text-white">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(r.valor)}
                  </td>
                  <td className="px-6 py-4 text-orange-500 font-medium whitespace-nowrap">
                    {r.ordem?.valor_custo_motorista ? `- ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(r.ordem.valor_custo_motorista)}` : 'R$ 0,00'}
                  </td>
                  <td className="px-6 py-4 text-green-500 font-bold whitespace-nowrap">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(r.valor - (r.ordem?.valor_custo_motorista || 0))}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                       {r.status === 'pendente' && (
                        <button onClick={() => handleMarcarPago(r.id)} className="p-1.5 text-text-muted hover:text-green-500 transition-colors tooltip-trigger" title="Marcar como Pago">
                          <CheckCircle size={18} />
                        </button>
                      )}
                      <button onClick={() => handleEdit(r)} className="p-1.5 text-text-muted hover:text-primary transition-colors">
                        <Pencil size={18} />
                      </button>
                      <button onClick={() => handleDelete(r.id)} className="p-1.5 text-text-muted hover:text-red-500 transition-colors">
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

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface border border-border rounded-xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-border flex justify-between">
              <h2 className="text-xl font-bold text-white">{editingId ? 'Editar Recebimento' : 'Lançar Recebimento'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-text-muted hover:text-white">close</button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              
              <div className="flex flex-col gap-2 pt-2">
                <label className="text-sm text-text-muted">Ordem de Serviço Vinculada</label>
                <select {...register('ordem_id')} className="w-full bg-background border border-border rounded-md px-4 py-2 text-sm text-white">
                  <option value="">Selecione uma ordem correspondente</option>
                  {ordens.map(o => (
                     <option key={o.id} value={o.id}>
                        {o.numero_os || o.id.slice(0,6)}: {o.origem} → {o.destino} ({new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(o.valor_faturamento)})
                     </option>
                  ))}
                </select>
                {errors.ordem_id?.message && <p className="text-xs text-red-500">{errors.ordem_id.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input label="Valor Base R$" type="number" step="0.01" error={errors.valor?.message} {...register('valor')} />
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-text-muted">Status</label>
                  <select {...register('status')} className="w-full bg-background border border-border rounded-md px-4 py-2 text-sm text-white">
                    <option value="pendente">Pendente</option>
                    <option value="pago">Pago</option>
                    <option value="atrasado">Atrasado</option>
                  </select>
                </div>

                <FormDatePicker 
                  control={control} 
                  name="data_pagamento" 
                  label="Data Pagamento / Previsão" 
                  error={errors.data_pagamento?.message} 
                />
                
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-text-muted">Forma de Pgto</label>
                  <select {...register('forma_pagamento')} className="w-full bg-background border border-border rounded-md px-4 py-2 text-sm text-white">
                    <option value="">Selecione...</option>
                    <option value="pix">PIX</option>
                    <option value="boleto">Boleto Bancário</option>
                    <option value="transferencia">Transferência TED/DOC</option>
                    <option value="dinheiro">Dinheiro Físico</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 justify-end mt-8 border-t border-border pt-4">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                <Button type="submit">Salvar Recebimento</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Conflito de Regras de Negócio (Recebimento Antecipado) */}
      {paymentToForce && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
           <div className="bg-surface border border-border rounded-xl w-full max-w-md shadow-2xl p-6 animate-in zoom-in border-l-4 border-l-yellow-500">
              <div className="flex items-center gap-3 mb-4 text-yellow-500">
                <AlertTriangle size={24} />
                <h3 className="text-lg font-bold text-white">Atenção: Ordem Não Concluída!</h3>
              </div>
              <p className="text-sm text-text-muted mb-4">
                Você está tentando dar baixa financeira numa OS que ainda não consta como concluída no sistema. 
                Por regras de negócio, recebimentos devem refletir a finalização do frete.
              </p>
              
              <div className="flex flex-col gap-3">
                <Button type="button" onClick={() => handleForcePaymentConfirmation(true)} className="bg-green-600 hover:bg-green-700 w-full justify-center">
                  Sim, Receber e Concluir a OS agora
                </Button>
                <Button type="button" variant="ghost" onClick={() => handleForcePaymentConfirmation(false)} className="w-full justify-center border border-border">
                  Ignorar (Lançar Recebimento Antecipado)
                </Button>
                <Button type="button" variant="ghost" onClick={() => setPaymentToForce(null)} className="w-full justify-center text-red-500 hover:bg-red-500/10">
                  Cancelar Ação
                </Button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
