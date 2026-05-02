import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DollarSign, Save, Lock, CheckCircle, Calculator, Loader2, ChevronDown, FileSpreadsheet, History } from 'lucide-react';
import type { OrdemServico } from '../../types';
import { ExportColumnsModal } from './ExportColumnsModal';

type Recebimento = {
  id: string;
  valor: number;
  status: 'pendente' | 'pago' | 'atrasado';
  forma_pagamento: string | null;
  data_pagamento: string | null;
};

type OrdemComFinanceiro = OrdemServico & {
  recebimentos?: Recebimento[];
};

export function FechamentoFinanceiro() {
  const [selectedOrdem, setSelectedOrdem] = useState<OrdemComFinanceiro | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Dados editáveis
  const [form, setForm] = useState({
    km_inicial: '',
    km_final: '',
    valor_custo_pedagio: '',
    valor_custo_estacionamento: '',
    valor_custo_extra_terceiros: '',
    tempo_hora_parada: '', // em minutos
    valor_unitario_hora_parada: '',
    observacoes_financeiras: '',
    numero_nfe: '',
    conferida_financeiro: false,
  });

  // Busca ordens concluídas não conferidas
  const { data: ordens, isLoading, refetch } = useQuery({
    queryKey: ['fechamento-ordens'],
    queryFn: async () => {
      const { data } = await supabase
        .from('ordens_servico')
        .select(`
          *, 
          empresa:empresas(razao_social),
          motorista:motoristas(nome),
          veiculo:veiculos(placa, modelo)
        `)
        .eq('status', 'concluido')
        .order('data_execucao', { ascending: false });
      return (data as OrdemComFinanceiro[]) || [];
    }
  });

  const { data: logs } = useQuery({
    queryKey: ['fechamento-logs', selectedOrdem?.id],
    enabled: !!selectedOrdem,
    queryFn: async () => {
      const { data } = await supabase
        .from('logs_auditoria')
        .select('*')
        .eq('tabela_afetada', 'ordens_servico')
        .eq('object_id', selectedOrdem!.id)
        .order('created_at', { ascending: false });
      return data || [];
    }
  });

  const handleSelectOrdem = (ordem: OrdemComFinanceiro) => {
    setSelectedOrdem(ordem);
    setSaved(false);
    setForm({
      km_inicial: ordem.km_inicial?.toString() || '',
      km_final: ordem.km_final?.toString() || '',
      valor_custo_pedagio: ordem.valor_custo_pedagio?.toString() || '',
      valor_custo_estacionamento: ordem.valor_custo_estacionamento?.toString() || '',
      valor_custo_extra_terceiros: ordem.valor_custo_extra_terceiros?.toString() || '',
      tempo_hora_parada: '', // minutos
      valor_unitario_hora_parada: ordem.valor_unitario_hora_parada?.toString() || '',
      observacoes_financeiras: ordem.observacoes_financeiras || '',
      numero_nfe: ordem.numero_nfe || '',
      conferida_financeiro: ordem.conferida_financeiro || false,
    });
  };

  // Cálculos dinâmicos
  const kmTotal = form.km_inicial && form.km_final
    ? Math.max(0, Number(form.km_final) - Number(form.km_inicial))
    : null;

  const minutosParada = Number(form.tempo_hora_parada) || 0;
  const horasParada = minutosParada / 60;
  const valorTotalHoraParada = horasParada * (Number(form.valor_unitario_hora_parada) || 0);

  const totalCustos = (Number(form.valor_custo_pedagio) || 0) +
    (Number(form.valor_custo_estacionamento) || 0) +
    (Number(form.valor_custo_extra_terceiros) || 0) +
    valorTotalHoraParada;

  const lucroLiquido = selectedOrdem
    ? (selectedOrdem.valor_faturamento || 0) - totalCustos - (selectedOrdem.valor_custo_motorista || 0)
    : 0;

  const handleSave = async () => {
    if (!selectedOrdem) return;
    setIsSaving(true);

    // Formata HH:MM:SS para o campo interval do postgres
    const horas = Math.floor(minutosParada / 60);
    const mins = minutosParada % 60;
    const intervaloFormatado = `${String(horas).padStart(2, '0')}:${String(mins).padStart(2, '0')}:00`;

    await supabase.from('ordens_servico').update({
      km_inicial: form.km_inicial ? Number(form.km_inicial) : null,
      km_final: form.km_final ? Number(form.km_final) : null,
      km_total_rodado: kmTotal,
      valor_custo_pedagio: Number(form.valor_custo_pedagio) || 0,
      valor_custo_estacionamento: Number(form.valor_custo_estacionamento) || 0,
      valor_custo_extra_terceiros: Number(form.valor_custo_extra_terceiros) || 0,
      tempo_hora_parada: intervaloFormatado,
      valor_unitario_hora_parada: Number(form.valor_unitario_hora_parada) || 0,
      valor_total_hora_parada: valorTotalHoraParada,
      observacoes_financeiras: form.observacoes_financeiras,
      numero_nfe: form.numero_nfe,
      conferida_financeiro: form.conferida_financeiro,
    }).eq('id', selectedOrdem.id);

    setIsSaving(false);
    setSaved(true);
    refetch();
  };

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Fechamento Financeiro</h1>
          <p className="text-text-muted text-sm">Auditoria e conciliação pós-viagem das Ordens de Serviço concluídas.</p>
        </div>
        <button 
          onClick={() => setIsExportModalOpen(true)}
          className="bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30 px-4 py-2 rounded-xl flex items-center gap-2 text-[11px] font-black uppercase tracking-widest transition"
        >
          <FileSpreadsheet className="w-4 h-4" /> Exportar Planilha
        </button>
      </div>

      <div className="grid lg:grid-cols-5 gap-6 items-start">
        {/* Lista de Ordens */}
        <div className="lg:col-span-2 space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted px-1">
            Ordens Concluídas ({ordens?.length ?? 0})
          </p>
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin text-primary w-8 h-8" />
            </div>
          ) : (
            <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
              {ordens?.map(ordem => (
                <button
                  key={ordem.id}
                  onClick={() => handleSelectOrdem(ordem)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    selectedOrdem?.id === ordem.id
                      ? 'bg-primary/10 border-primary/50 text-white'
                      : 'bg-surface border-border hover:border-primary/30 text-text-muted'
                  }`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-white truncate">
                        {ordem.origem} → {ordem.destino}
                      </p>
                      <p className="text-xs text-text-muted mt-0.5">{ordem.empresa?.razao_social}</p>
                      <p className="text-xs text-text-muted">{format(parseISO(ordem.data_execucao), 'dd/MM/yyyy', { locale: ptBR })}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs font-bold text-green-400">{fmt(ordem.valor_faturamento)}</span>
                      {ordem.conferida_financeiro ? (
                        <span className="text-[9px] font-black bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">CONFERIDO</span>
                      ) : (
                        <span className="text-[9px] font-black bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">PENDENTE</span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Formulário de Fechamento */}
        <div className="lg:col-span-3">
          {!selectedOrdem ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-surface/30 border border-border rounded-2xl">
              <ChevronDown className="w-10 h-10 text-zinc-700 mb-3" />
              <p className="text-text-muted text-sm">Selecione uma ordem para iniciar o fechamento</p>
            </div>
          ) : (
            <div className="bg-surface border border-border rounded-2xl overflow-hidden">
              {/* Header OS */}
              <div className={`p-5 border-b border-border ${selectedOrdem.conferida_financeiro ? 'bg-green-500/5' : 'bg-primary/5'}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest">
                      OS #{selectedOrdem.numero_os || selectedOrdem.id.slice(0,8).toUpperCase()}
                    </p>
                    <h2 className="text-lg font-bold text-white mt-1">{selectedOrdem.origem} → {selectedOrdem.destino}</h2>
                    <p className="text-text-muted text-sm">{selectedOrdem.motorista?.nome} · {selectedOrdem.veiculo?.placa}</p>
                  </div>
                  {selectedOrdem.conferida_financeiro && (
                    <span className="flex items-center gap-1.5 text-green-500 text-[10px] font-black uppercase tracking-widest bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-full">
                      <Lock className="w-3 h-3" /> Conferido
                    </span>
                  )}
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* KM */}
                <section className="space-y-3">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-text-muted">Quilometragem</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs text-text-muted font-medium">KM Inicial</label>
                      <input type="number" value={form.km_inicial}
                        onChange={e => setForm(p => ({ ...p, km_inicial: e.target.value }))}
                        disabled={selectedOrdem.conferida_financeiro}
                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-white input-focus disabled:opacity-50" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-text-muted font-medium">KM Final</label>
                      <input type="number" value={form.km_final}
                        onChange={e => setForm(p => ({ ...p, km_final: e.target.value }))}
                        disabled={selectedOrdem.conferida_financeiro}
                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-white input-focus disabled:opacity-50" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-text-muted font-medium flex items-center gap-1.5">
                        <Calculator className="w-3 h-3" /> KM Total
                      </label>
                      <div className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm font-bold text-primary">
                        {kmTotal !== null ? `${kmTotal.toFixed(0)} km` : '—'}
                      </div>
                    </div>
                  </div>
                </section>

                {/* Custos */}
                <section className="space-y-3">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-text-muted">Custos da Operação</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { label: 'Pedágio (R$)', key: 'valor_custo_pedagio' as const },
                      { label: 'Estacionamento (R$)', key: 'valor_custo_estacionamento' as const },
                      { label: 'Extra Terceiros (R$)', key: 'valor_custo_extra_terceiros' as const },
                    ].map(f => (
                      <div key={f.key} className="space-y-1.5">
                        <label className="text-xs text-text-muted font-medium">{f.label}</label>
                        <input type="number" step="0.01" value={form[f.key]}
                          onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                          disabled={selectedOrdem.conferida_financeiro}
                          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-white input-focus disabled:opacity-50" />
                      </div>
                    ))}
                  </div>
                </section>

                {/* Horas de Parada */}
                <section className="space-y-3 p-4 bg-background rounded-xl border border-border">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-text-muted">Horas de Parada</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs text-text-muted font-medium">Tempo (minutos)</label>
                      <input type="number" value={form.tempo_hora_parada}
                        onChange={e => setForm(p => ({ ...p, tempo_hora_parada: e.target.value }))}
                        disabled={selectedOrdem.conferida_financeiro}
                        className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-white input-focus disabled:opacity-50" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-text-muted font-medium">Valor/Hora (R$)</label>
                      <input type="number" step="0.01" value={form.valor_unitario_hora_parada}
                        onChange={e => setForm(p => ({ ...p, valor_unitario_hora_parada: e.target.value }))}
                        disabled={selectedOrdem.conferida_financeiro}
                        className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-white input-focus disabled:opacity-50" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-text-muted font-medium flex items-center gap-1.5">
                        <Calculator className="w-3 h-3" /> Total Parada
                      </label>
                      <div className="bg-surface border border-border rounded-lg px-3 py-2 text-sm font-bold text-orange-400">
                        {fmt(valorTotalHoraParada)}
                      </div>
                    </div>
                  </div>
                </section>

                {/* NFe e Observações */}
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs text-text-muted font-medium">Número NF-e</label>
                    <input type="text" value={form.numero_nfe}
                      onChange={e => setForm(p => ({ ...p, numero_nfe: e.target.value }))}
                      disabled={selectedOrdem.conferida_financeiro}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-white input-focus disabled:opacity-50"
                      placeholder="000000000" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-text-muted font-medium">Observações Financeiras</label>
                    <input type="text" value={form.observacoes_financeiras}
                      onChange={e => setForm(p => ({ ...p, observacoes_financeiras: e.target.value }))}
                      disabled={selectedOrdem.conferida_financeiro}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-white input-focus disabled:opacity-50"
                      placeholder="Observações..." />
                  </div>
                </div>

                {/* Resumo */}
                <div className="bg-background rounded-xl border border-border p-4 space-y-2">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-3 flex items-center gap-2">
                    <DollarSign className="w-4 h-4" /> Resumo Financeiro
                  </h3>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted">Faturamento</span>
                    <span className="text-green-400 font-bold">{fmt(selectedOrdem.valor_faturamento)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted">Custo Motorista</span>
                    <span className="text-orange-400">- {fmt(selectedOrdem.valor_custo_motorista || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted">Custos Operacionais</span>
                    <span className="text-orange-400">- {fmt(totalCustos)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-black border-t border-border pt-2 mt-2">
                    <span className="text-white">Lucro Líquido</span>
                    <span className={lucroLiquido >= 0 ? 'text-green-400' : 'text-red-400'}>{fmt(lucroLiquido)}</span>
                  </div>
                </div>

                {/* Logs de Auditoria */}
                <div className="bg-background rounded-xl border border-border overflow-hidden">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-text-muted p-4 border-b border-border bg-surface/50 flex items-center gap-2">
                    <History className="w-4 h-4 text-primary" /> Logs de Alteração (Auditoria)
                  </h3>
                  <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
                    {logs && logs.length > 0 ? logs.map(log => (
                      <div key={log.id} className="text-sm border-b border-border/50 last:border-0 pb-3 last:pb-0">
                        <div className="flex justify-between items-start mb-1 text-xs">
                          <span className="font-bold text-zinc-300">{log.nome_usuario || 'Sistema'}</span>
                          <span className="text-zinc-500">{format(parseISO(log.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}</span>
                        </div>
                        <p className="text-xs text-zinc-400 break-words line-clamp-2">Ação: {log.tipo_acao}</p>
                      </div>
                    )) : (
                      <p className="text-xs text-zinc-500 italic text-center py-2">Nenhum log encontrado para esta OS.</p>
                    )}
                  </div>
                </div>

                {/* Conferência */}
                <label className={`flex items-center gap-3 cursor-pointer p-4 rounded-xl border transition-all ${
                  form.conferida_financeiro
                    ? 'bg-green-500/10 border-green-500/30 text-green-400'
                    : 'bg-background border-border text-text-muted hover:border-primary/50'
                } ${selectedOrdem.conferida_financeiro ? 'opacity-60 cursor-not-allowed' : ''}`}>
                  <input type="checkbox" checked={form.conferida_financeiro}
                    onChange={e => !selectedOrdem.conferida_financeiro && setForm(p => ({ ...p, conferida_financeiro: e.target.checked }))}
                    className="w-4 h-4 rounded accent-primary" />
                  <div>
                    <p className="text-sm font-bold">Marcar como conferida</p>
                    <p className="text-xs opacity-70">Ao conferir, a OS será travada para edições posteriores.</p>
                  </div>
                  {form.conferida_financeiro && <Lock className="w-4 h-4 ml-auto" />}
                </label>

                {/* Botão Salvar */}
                {!selectedOrdem.conferida_financeiro && (
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="w-full h-12 rounded-xl bg-primary hover:bg-red-700 text-white text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                    {isSaving ? 'Salvando...' : saved ? 'Salvo com sucesso!' : 'Salvar Fechamento'}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      <ExportColumnsModal 
        isOpen={isExportModalOpen} 
        onClose={() => setIsExportModalOpen(false)} 
        data={ordens || []} 
        defaultColumns={[
          { key: 'os', label: 'Nº OS', getValue: (o: any) => o.numero_os || o.id.slice(0, 8).toUpperCase() },
          { key: 'data', label: 'Data', getValue: (o: any) => format(parseISO(o.data_execucao), 'dd/MM/yyyy') },
          { key: 'empresa', label: 'Empresa', getValue: (o: any) => o.empresa?.razao_social || '' },
          { key: 'origem', label: 'Origem', getValue: (o: any) => o.origem },
          { key: 'destino', label: 'Destino', getValue: (o: any) => o.destino },
          { key: 'faturamento', label: 'Faturamento Receita', getValue: (o: any) => o.valor_faturamento || 0 },
          { key: 'custo_mot', label: 'Custo Motorista', getValue: (o: any) => o.valor_custo_motorista || 0 },
          { key: 'custos_ops', label: 'Outros Custos', getValue: (o: any) => (o.valor_custo_pedagio || 0) + (o.valor_custo_estacionamento || 0) + (o.valor_custo_extra_terceiros || 0) + (o.valor_total_hora_parada || 0) },
          { key: 'conferida', label: 'Conferida', getValue: (o: any) => o.conferida_financeiro ? 'SIM' : 'NÃO' }
        ]} 
      />
    </div>
  );
}
