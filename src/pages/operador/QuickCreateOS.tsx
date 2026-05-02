import { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { ordemService } from '../../services/ordens.service';
import { showToast } from '../../utils/swal';

export const QuickCreateOS = ({ empresas, motoristas, veiculos, onSuccess, initialData }: any) => {
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    empresa_id: initialData?.empresa_id || '',
    motorista_id: initialData?.motorista_id || '',
    veiculo_id: initialData?.veiculo_id || '',
    data_execucao: initialData?.data_execucao || '',
    horario_inicio: '',
    origem: '',
    destino: '',
    passageiro: '',
    valor_faturamento: '',
    valor_custo_motorista: '',
    data_repasse: '',
    horario_fim: '',
    hora_execucao: '',
  });

  const motoristaSelecionado = motoristas.find((m: any) => m.id === form.motorista_id);
  const isTerceiro = motoristaSelecionado?.tipo_vinculo === 'terceiro';

  const handleChange = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const buildDateTime = (date: string, time?: string, defaultTime?: string) => {
    if (!date) return null;
    if (!time) {
      return defaultTime ? `${date}T${defaultTime}` : null;
    }
    return `${date}T${time}:00`;
  };

  const isValid = form.empresa_id && form.origem && form.destino && form.data_execucao;

  const handleSubmit = async () => {
    try {
      if (!isValid) {
        showToast('Preencha os campos obrigatórios', 'error');
        return;
      }

      setLoading(true);

      const payload = {
        empresa_id: form.empresa_id,
        motorista_id: form.motorista_id || null,
        veiculo_id: form.veiculo_id || null,
        origem: form.origem,
        destino: form.destino,
        passageiro: form.passageiro,
        data_execucao: buildDateTime(form.data_execucao, form.hora_execucao, "00:00:00") as string,
        horario_inicio: buildDateTime(form.data_execucao, form.horario_inicio),
        horario_fim: buildDateTime(form.data_execucao, form.horario_fim),
        valor_faturamento: Number(form.valor_faturamento || 0),
        valor_custo_motorista: Number(form.valor_custo_motorista || 0),
        status: "pendente" as const,
      };

      const novaOS = await ordemService.create(payload);

      // 💰 REGRA: parceiro
      if (isTerceiro && form.valor_custo_motorista && form.data_repasse) {
        await ordemService.registrarRepasse({
          ordem_id: novaOS.id,
          valor: Number(form.valor_custo_motorista),
          data_pagamento: form.data_repasse,
        });
      }

      showToast('Ordem criada com sucesso!');

      setForm({
        empresa_id: '',
        motorista_id: '',
        veiculo_id: '',
        data_execucao: '',
        horario_inicio: '',
        origem: '',
        destino: '',
        passageiro: '',
        valor_faturamento: '',
        valor_custo_motorista: '',
        data_repasse: '',
        horario_fim: '',
        hora_execucao: '',
      });

      onSuccess?.();

    } catch (err) {
      console.error(err);
      showToast('Erro ao criar ordem', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface border border-border rounded-xl p-5 space-y-5">

      {/* HEADER */}
      <div>
        <h3 className="text-white font-bold text-lg">⚡ Cadastro Rápido</h3>
        <p className="text-xs text-text-muted">Crie uma OS em poucos segundos</p>
      </div>

      {/* BLOCO 1 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">

        <div className="flex flex-col gap-1">
          <label className="text-xs text-text-muted">Empresa *</label>
          <select
            className="input-focus bg-background border border-border rounded-md px-3 py-2 text-sm"
            value={form.empresa_id}
            onChange={(e) => handleChange('empresa_id', e.target.value)}
          >
            <option value="">Selecione</option>
            {empresas.map((e: any) => (
              <option key={e.id} value={e.id}>{e.razao_social}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-text-muted">Motorista</label>
          <select
            className="input-focus bg-background border border-border rounded-md px-3 py-2 text-sm"
            value={form.motorista_id}
            onChange={(e) => handleChange('motorista_id', e.target.value)}
          >
            <option value="">Selecione</option>
            {motoristas.map((m: any) => (
              <option key={m.id} value={m.id}>
                {m.nome} {m.tipo_vinculo === 'terceiro' && '(Terceiro)'}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-text-muted">Veículo</label>
          <select
            className="input-focus bg-background border border-border rounded-md px-3 py-2 text-sm"
            value={form.veiculo_id}
            onChange={(e) => handleChange('veiculo_id', e.target.value)}
          >
            <option value="">Selecione</option>
            {veiculos.map((v: any) => (
              <option key={v.id} value={v.id}>{v.placa}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-text-muted font-bold uppercase tracking-widest text-[9px]">Data *</label>
          <input
            type="date"
            className="input-focus bg-background border border-border rounded-md px-3 py-2 text-sm"
            value={form.data_execucao}
            onChange={(e) => handleChange('data_execucao', e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-text-muted font-bold uppercase tracking-widest text-[9px]">Hora Agendada</label>
          <input
            type="time"
            className="input-focus bg-background border border-border rounded-md px-3 py-2 text-sm"
            value={form.hora_execucao}
            onChange={(e) => handleChange('hora_execucao', e.target.value)}
          />
        </div>
      </div>

      {/* BLOCO 2 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">

        <div className="flex flex-col gap-1 md:col-span-2">
          <label className="text-xs text-text-muted">Origem *</label>
          <input
            className="input-focus bg-background border border-border rounded-md px-3 py-2 text-sm"
            placeholder="Digite o endereço"
            value={form.origem}
            onChange={(e) => handleChange('origem', e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1 md:col-span-2">
          <label className="text-xs text-text-muted">Destino *</label>
          <input
            className="input-focus bg-background border border-border rounded-md px-3 py-2 text-sm"
            placeholder="Digite o endereço"
            value={form.destino}
            onChange={(e) => handleChange('destino', e.target.value)}
          />
        </div>

      </div>

      {/* BLOCO 3 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">

        <div className="flex flex-col gap-1">
          <label className="text-xs text-text-muted">Passageiro</label>
          <input
            className="input-focus bg-background border border-border rounded-md px-3 py-2 text-sm"
            value={form.passageiro}
            onChange={(e) => handleChange('passageiro', e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-text-muted">Valor (R$)</label>
          <input
            type="number"
            className="input-focus bg-background border border-border rounded-md px-3 py-2 text-sm"
            value={form.valor_faturamento}
            onChange={(e) => handleChange('valor_faturamento', e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-text-muted">Check-in</label>
          <input
            type="time"
            className="input-focus bg-background border border-border rounded-md px-3 py-2 text-sm"
            value={form.horario_inicio}
            onChange={(e) => handleChange('horario_inicio', e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-text-muted">Check-out</label>
          <input
            type="time"
            className="input-focus bg-background border border-border rounded-md px-3 py-2 text-sm"
            value={form.horario_fim}
            onChange={(e) => handleChange('horario_fim', e.target.value)}
          />
        </div>

      </div>

      {/* 💰 PARCEIRO */}
      {isTerceiro && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-border pt-4">

          <div className="flex flex-col gap-1">
            <label className="text-xs text-yellow-400 font-semibold">
              Valor Repasse (Motorista)
            </label>
            <input
              type="number"
              className="input-focus bg-background border border-yellow-500/30 rounded-md px-3 py-2 text-sm"
              value={form.valor_custo_motorista}
              onChange={(e) => handleChange('valor_custo_motorista', e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-yellow-400 font-semibold">
              Data Pagamento
            </label>
            <input
              type="date"
              className="input-focus bg-background border border-yellow-500/30 rounded-md px-3 py-2 text-sm"
              value={form.data_repasse}
              onChange={(e) => handleChange('data_repasse', e.target.value)}
            />
          </div>

        </div>
      )}

      {/* CTA */}
      <Button
        onClick={handleSubmit}
        disabled={!isValid || loading}
        isLoading={loading}
        className="w-full h-11"
      >
        Criar Ordem
      </Button>

    </div>
  );
};