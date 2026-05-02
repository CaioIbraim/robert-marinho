import { supabase } from '../lib/supabaseClient';
import type { OrdemServico } from '../types';
import type { OrdemServicoFormData } from '../schemas';
import { notificationService } from './notifications.service';

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
  const datePart = dateBase.includes('T') ? dateBase.split('T')[0] : dateBase;

  return `${datePart}T${actualTime}:00`;
};

// Remove campos inválidos
const sanitizePayload = (payload: any) => {
  const result = { ...payload };
  Object.keys(result).forEach((key) => {
    if (result[key] === '' || result[key] === undefined) {
      result[key] = null;
    }
  });
  return result;
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
        .order('updated_at', { ascending: false });

      if (!error) return data as OrdemServico[];

      const { data: fallbackData, error: fallbackError } = await supabase
        .from('ordens_servico')
        .select(`
          *,
          empresa:empresas(*),
          motorista:motoristas(*),
          veiculo:veiculos(*),
          paradas:ordem_servico_paradas(*)
        `)
        .order('updated_at', { ascending: false });

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

    const payload = sanitizePayload({
      ...data,
      empresa_id: data.empresa_id,
      motorista_id: data.motorista_id || null,
      veiculo_id: data.veiculo_id || null,
      tarifario_id: finalTarifarioId,
      numero_os: data.numero_os || null,
      data_execucao: data.data_execucao
        ? data.data_execucao.includes('T') ? data.data_execucao.slice(0, 19) : `${data.data_execucao}T00:00:00`
        : null,
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

    const { data: ordem, error } = await supabase
      .from('ordens_servico')
      .insert({
        ...payload,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    await supabase.from('recebimentos').insert({
      ordem_id: ordem.id,
      valor: payload.valor_faturamento,
      status: STATUS.PENDENTE,
    });

    const empresaTargetId = payload.empresa_id || 'broadcast';

    await notificationService.create({
      titulo: 'Nova Ordem Criada',
      mensagem: `Sua OS para ${data.destino} foi cadastrada com sucesso.`,
      tipo: 'success',
      user_id: empresaTargetId,
      link: '/portal/dashboard'
    });

    await notificationService.create({
      titulo: 'Nova Solicitação',
      mensagem: `Um novo pedido foi criado via portal do cliente para ${data.destino}.`,
      tipo: 'warning',
      user_id: 'broadcast',
      link: '/operador/ordens'
    });

    if (payload.motorista_id) {
       await notificationService.create({
         titulo: 'Nova Viagem Atribuída',
         mensagem: `Você foi escalado para uma nova OS em ${data.origem}.`,
         tipo: 'info',
         user_id: payload.motorista_id,
         link: '/motorista/dashboard'
       });
    }

    return ordem;
  },

  // =========================
  // UPDATE
  // =========================
  async update(id: string, data: Partial<OrdemServicoFormData>) {
    const oldOrdem = await this.getById(id).catch(() => null);
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
      .update({
        ...payload,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('rm_updateData'));
    }

    // 📩 NOTIFICAÇÃO GLOBAL VIA BROADCAST
    const broadcastChannel = supabase.channel('global_notifications');
    broadcastChannel.send({
      type: 'broadcast',
      event: 'os_updated',
      payload: { id, updated_at: new Date().toISOString() }
    });

    if (payload.valor_faturamento !== undefined) {
      await supabase
        .from('recebimentos')
        .update({ valor: payload.valor_faturamento })
        .eq('ordem_id', id);
    }

    if (oldOrdem) {
      const empresaTargetId = payload.empresa_id || oldOrdem.empresa_id || 'broadcast';

      if (payload.motorista_id && payload.motorista_id !== oldOrdem.motorista_id) {
         await notificationService.create({
           titulo: 'Nova Viagem Atribuída',
           mensagem: `Você foi escalado para uma nova OS. Verifique seu painel.`,
           tipo: 'info',
           user_id: payload.motorista_id,
           link: '/dashboard'
         });
         
         await notificationService.create({
           titulo: 'Motorista Confirmado',
           mensagem: `Um motorista foi designado para a sua viagem.`,
           tipo: 'success',
           user_id: empresaTargetId,
           link: '/portal/dashboard'
         });
      }

      if (payload.status && payload.status !== oldOrdem.status) {
         const labels: Record<string, string> = {
           pendente: 'Pendente',
           em_andamento: 'Em Andamento',
           concluido: 'Concluída',
           cancelado: 'Cancelada'
         };

          await notificationService.create({
            titulo: 'Status da Viagem',
            mensagem: `A sua solicitação mudou para: ${labels[payload.status] || payload.status}.`,
            tipo: 'info',
            user_id: empresaTargetId,
            link: '/portal/dashboard'
          });

          await notificationService.create({
            titulo: 'Atualização Operacional',
            mensagem: `O motorista alterou a OS #${oldOrdem.numero_os || id.slice(0, 8)} para: ${labels[payload.status] || payload.status}.`,
            tipo: 'info',
            user_id: 'broadcast',
            link: '/operador/ordens'
          });

         const motoristaNotifyId = payload.motorista_id || oldOrdem.motorista_id;
         if (motoristaNotifyId) {
            await notificationService.create({
              titulo: 'Atualização pela Base',
              mensagem: `O status da sua OS foi alterado para: ${labels[payload.status] || payload.status}.`,
              tipo: 'warning',
              user_id: motoristaNotifyId,
              link: '/dashboard'
            });
         }
      }
    }
  },

  // =========================
  // DELETE
  // =========================
  async delete(id: string) {
    // 1. Deletar dependências (Foreign Key constraint prevention)
    await supabase.from('recebimentos').delete().eq('ordem_id', id);
    await supabase.from('paradas_rota').delete().eq('ordem_id', id);
    await supabase.from('repasse_motorista').delete().eq('ordem_id', id);
    await supabase.from('ordem_servico_paradas').delete().eq('ordem_id', id);
    
    // 2. Deletar a OS
    const { error } = await supabase
      .from('ordens_servico')
      .delete()
      .eq('id', id);

    if (error) throw error;
    
    // Dispara evento local para sincronizar
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('rm_updateData'));
    }
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
      .from('repasse_motorista')
      .insert({
        ordem_id,
        valor,
        data_pagamento: toISO(data_pagamento),
        status: STATUS.PENDENTE,
      });

    if (error) throw error;
  },
};