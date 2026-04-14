import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import type { SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Search, Pencil, Trash2, DollarSign, CheckCircle, Download, FileText, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { format } from 'date-fns';
import { exportToExcel, exportToPDF } from '../utils/export';
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
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentToForce, setPaymentToForce] = useState<any | null>(null);
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<RecebimentoFormData>({
    resolver: zodResolver(recebimentoSchema) as any,
  });

  const loadData = async () => {
    try {
      const [recRes, ordensRes] = await Promise.all([
        supabase.from('recebimentos').select('*, ordem:ordens_servico(*)').order('created_at', { ascending: false }),
        supabase.from('ordens_servico').select('id, numero_os, origem, destino, valor_total').in('status', ['pendente', 'em_andamento', 'concluido'])
      ]);
      setRecebimentos(recRes.data || []);
      setOrdens(ordensRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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
      const payload = {
        ...data,
        data_pagamento: data.data_pagamento ? data.data_pagamento : null
      };

      if (editingId) {
        await supabase.from('recebimentos').update(payload).eq('id', editingId);
      } else {
        await supabase.from('recebimentos').insert([payload]);
      }
      setIsModalOpen(false);
      reset({ valor: 0, data_pagamento: '', forma_pagamento: '', status: 'pendente', ordem_id: '' });
      setEditingId(null);
      setPaymentToForce(null);
      loadData();
    } catch (err) {
      console.error(err);
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
    if (window.confirm('Deseja excluir este recebimento?')) {
      await supabase.from('recebimentos').delete().eq('id', id);
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
    await supabase.from('recebimentos').update({ status: 'pago', data_pagamento: new Date().toISOString() }).eq('id', id);
    setPaymentToForce(null);
    loadData();
  };

  const handleForcePaymentConfirmation = async (completeOS: boolean) => {
     if (completeOS && paymentToForce.linkedOrdem) {
        await supabase.from('ordens_servico').update({ status: 'concluido' }).eq('id', paymentToForce.linkedOrdem.id);
     }
     
     if (paymentToForce.isFromSubmit) {
        await executeSubmit(paymentToForce.data);
     } else {
        await executeMarcarPago(paymentToForce.lancamento.id);
     }
  };

  const filtered = recebimentos.filter(r => 
    r.forma_pagamento?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.ordem?.origem?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.ordem?.numero_os?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExportExcel = () => {
    const data = filtered.map(r => ({
      ID: r.id,
      'OS Origem/Destino': r.ordem ? `${r.ordem.origem} → ${r.ordem.destino}` : '',
      Status: r.status,
      'Valor Recebido': r.valor,
      'Data Pagamento': r.data_pagamento,
      'Forma Pagamento': r.forma_pagamento
    }));
    exportToExcel(data, 'recebimentos_financeiros');
  };

  const handleExportPDF = () => {
    const columns = [
      { header: 'Ordem de Serviço', dataKey: 'os' },
      { header: 'Status', dataKey: 'status' },
      { header: 'Forma Pgto', dataKey: 'forma_pagamento' },
      { header: 'Valor R$', dataKey: 'valor' }
    ];
    const data = filtered.map(r => ({
      ...r,
      os: r.ordem ? `${r.ordem.origem} → ${r.ordem.destino}` : '-'
    }));
    exportToPDF(data, columns, 'recebimentos_financeiros', 'Relatório de Recebimentos');
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

      <Card className="!p-0 overflow-visible">
        <div className="p-4 border-b border-border flex flex-col sm:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
            <input
              type="text"
              placeholder="Buscar por OS, forma de pagamento ou origem..."
              className="w-full bg-background border border-border rounded-md pl-10 pr-4 py-2 text-sm input-focus"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
                <th className="px-6 py-4">Ordem de Serviço</th>
                <th className="px-6 py-4">Data Pagto.</th>
                <th className="px-6 py-4">Forma</th>
                <th className="px-6 py-4">Valor</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
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
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-text-muted">
                    {r.data_pagamento ? format(new Date(r.data_pagamento), 'dd/MM/yyyy') : '-'}
                  </td>
                  <td className="px-6 py-4 text-text-muted capitalize">
                    {r.forma_pagamento || '-'}
                  </td>
                  <td className="px-6 py-4 font-bold text-white">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(r.valor)}
                  </td>
                  <td className="px-6 py-4">
                     <span className={`inline-flex px-2 py-1 rounded-md text-[10px] uppercase font-bold ${
                        r.status === 'pago' ? 'bg-green-500/20 text-green-500' :
                        r.status === 'atrasado' ? 'bg-red-500/20 text-red-500' :
                        'bg-yellow-500/20 text-yellow-500'
                     }`}>
                      {r.status}
                    </span>
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
                        {o.numero_os || o.id.slice(0,6)}: {o.origem} → {o.destino} ({new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(o.valor_total)})
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

                <Input label="Data Pagamento / Previsão" type="date" error={errors.data_pagamento?.message} {...register('data_pagamento')} />
                
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
