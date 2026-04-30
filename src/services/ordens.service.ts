import { supabase } from '../lib/supabaseClient';
import type { OrdemServico } from '../types';
import type { OrdemServicoFormData } from '../schemas';

// =========================
// HELPERS
// =========================

// Garante ISO válido
const toISO = (value?: string) => {
  if (!value) return null;
  try {
    return new Date(value).toISOString();
  } catch {
    return null;
  }
};

// Combina data_execucao (timestamp) + hora separada
const combineDateTime = (dateTime?: string, time?: string) => {
  if (!time) return null;

  // Se 'time' já for um timestamp completo, extraímos apenas a hora dele para recombinar com a data
  const actualTime = time.includes('T') ? time.split('T')[1].slice(0, 5) : time.slice(0, 5);

  const dateBase = dateTime || new Date().toISOString().split('T')[0]; // Se não houver data, assume hoje (UTC mas split resolve pra maioria dos casos)
  // Melhoria: extrair data local caso dateTime seja nulo
  const datePart = dateBase.includes('T') ? dateBase.split('T')[0] : dateBase;

  // Retornamos o formato local YYYY-MM-DDTHH:mm:ss para evitar shift de timezone (UTC-3)
  // Já que o banco é 'timestamp without time zone'
  return `${datePart}T${actualTime}:00`;
};

// Remove campos inválidos
const sanitizePayload = (payload: any) => {
  Object.keys(payload).forEach((key) => {
    if (payload[key] === '' || payload[key] === undefined) {
      payload[key] = null;
    }
  });
  return payload;
};

// =========================
// STATUS
// =========================
const STATUS = {
  PENDENTE: 'pendente',
  EM_ANDAMENTO: 'em_andamento',
  CONCLUIDO: 'concluido',
  CANCELADO: 'cancelado',
} as const;

type StatusType = typeof STATUS[keyof typeof STATUS];

// =========================
// SERVICE
// =========================
export const ordemService = {

  // =========================
  // GET ALL
  // =========================
  async getAll() {
    try {
      const { data, error } = await supabase
        .from('ordens_servico')
        .select(`
          *,
          empresa:empresas(*),
          motorista:motoristas(*),
          veiculo:veiculos(*),
          tarifario:tarifarios(*),
          paradas:ordem_servico_paradas(*)
        `)
        .order('created_at', { ascending: false });

      if (!error) return data as OrdemServico[];

      // fallback
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('ordens_servico')
        .select(`
          *,
          empresa:empresas(*),
          motorista:motoristas(*),
          veiculo:veiculos(*),
          paradas:ordem_servico_paradas(*)
        `)
        .order('created_at', { ascending: false });

      if (fallbackError) throw fallbackError;
      return fallbackData as OrdemServico[];

    } catch (err) {
      console.error(err);
      throw err;
    }
  },

  // =========================
  // GET BY ID
  // =========================
  async getById(id: string) {
    const { data, error } = await supabase
      .from('ordens_servico')
      .select(`
        *,
        empresa:empresas(*),
        motorista:motoristas(*),
        veiculo:veiculos(*),
        paradas:ordem_servico_paradas(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as OrdemServico;
  },

  // =========================
  // CREATE
  // =========================
  async create(data: OrdemServicoFormData) {
    let finalTarifarioId = data.tarifario_id || null;

    // 🔥 REGRA 1: tarifário automático
    if (!finalTarifarioId && data.origem && data.destino) {
      const { data: existing } = await supabase
        .from('tarifarios')
        .select('id')
        .eq('origem', data.origem)
        .eq('destino', data.destino)
        .maybeSingle();

      if (existing) {
        finalTarifarioId = existing.id;
      } else {
        const { data: novo } = await supabase
          .from('tarifarios')
          .insert({
            origem: data.origem,
            destino: data.destino,
            valor_venda: Number(data.valor_faturamento || 0),
            valor_custo: Number(data.valor_custo_motorista || 0),
          })
          .select()
          .maybeSingle();

        if (novo) finalTarifarioId = novo.id;
      }
    }

    // 🔥 REGRA 2: normalização forte
    const payload = sanitizePayload({
      ...data,

      empresa_id: data.empresa_id,
      motorista_id: data.motorista_id || null,
      veiculo_id: data.veiculo_id || null,

      tarifario_id: finalTarifarioId,
      numero_os: data.numero_os || null,

      // ✅ Mantemos como está (local) ou garantimos formato ISO sem 'Z'
      data_execucao: data.data_execucao
        ? data.data_execucao.includes('T') ? data.data_execucao.slice(0, 19) : `${data.data_execucao}T00:00:00`
        : null,

      // ✅ derivado corretamente
      horario_inicio: data.horario_inicio
        ? combineDateTime(data.data_execucao, data.horario_inicio)
        : null,

      horario_fim: data.horario_fim
        ? combineDateTime(data.data_execucao, data.horario_fim)
        : null,

      valor_faturamento: Number(data.valor_faturamento || 0),
      valor_custo_motorista: Number(data.valor_custo_motorista || 0),

      status: (data.status || STATUS.PENDENTE) as StatusType,
    });

    // 🔥 REGRA 3: criar OS
    const { data: ordem, error } = await supabase
      .from('ordens_servico')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;

    // 🔥 REGRA 4: financeiro
    await supabase.from('recebimentos').insert({
      ordem_id: ordem.id,
      valor: payload.valor_faturamento,
      status: STATUS.PENDENTE,
    });

    // 🔥 REGRA 5: notificação
    await supabase.from('notificacoes').insert({
      titulo: 'Nova Ordem Criada',
      mensagem: `OS criada para ${data.destino}`,
      tipo: 'success',
    });

    return ordem;
  },

  // =========================
  // UPDATE
  // =========================
  async update(id: string, data: Partial<OrdemServicoFormData>) {
    const payload = sanitizePayload({ ...data });
    
    if (payload.data_execucao) {
      payload.data_execucao = payload.data_execucao.includes('T') 
        ? payload.data_execucao.slice(0, 19) 
        : `${payload.data_execucao}T00:00:00`;
    }

    if (payload.horario_inicio) {
      payload.horario_inicio = combineDateTime(payload.data_execucao, payload.horario_inicio);
    }

    if (payload.horario_fim) {
      payload.horario_fim = combineDateTime(payload.data_execucao, payload.horario_fim);
    }

    const { error } = await supabase
      .from('ordens_servico')
      .update(payload)
      .eq('id', id);

    if (error) throw error;

    if (payload.valor_faturamento !== undefined) {
      await supabase
        .from('recebimentos')
        .update({ valor: payload.valor_faturamento })
        .eq('ordem_id', id);
    }
  },

  // =========================
  // DELETE
  // =========================
  async delete(id: string) {
    const { error } = await supabase
      .from('ordens_servico')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // =========================
  // 💰 REPASSE MOTORISTA
  // =========================
  async registrarRepasse({
    ordem_id,
    valor,
    data_pagamento,
  }: {
    ordem_id: string;
    valor: number;
    data_pagamento: string;
  }) {
    const { error } = await supabase
      .from('repasse_motoristas')
      .insert({
        ordem_id,
        valor,
        data_pagamento: toISO(data_pagamento),
        status: STATUS.PENDENTE,
      });

    if (error) throw error;
  },
};