import { supabase } from '../lib/supabaseClient';
import type { OrdemServico } from '../types';
import type { OrdemServicoFormData } from '../schemas';

export const ordemService = {
  async getAll() {
    // Tenta primeiro o select completo com todos os joins
    try {
      const { data, error } = await supabase
        .from('ordens_servico')
        .select(`
          *,
          empresa:empresas(*),
          motorista:motoristas(*),
          veiculo:veiculos(*),
          tarifario:tarifarios(*)
        `)
        .order('created_at', { ascending: false });
      
      if (!error) return data as OrdemServico[];
      
      // Se der erro de coluna (provavelmente tarifario), tenta sem o join de tarifario
      console.warn('Erro ao carregar OS com tarifários, tentando modo simplificado:', error);
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('ordens_servico')
        .select(`
          *,
          empresa:empresas(*),
          motorista:motoristas(*),
          veiculo:veiculos(*)
        `)
        .order('created_at', { ascending: false });

      if (fallbackError) throw fallbackError;
      return fallbackData as OrdemServico[];
    } catch (err) {
      console.error('Erro total ao buscar ordens:', err);
      throw err;
    }
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('ordens_servico')
      .select(`
        *,
        empresa:empresas(*),
        motorista:motoristas(*),
        veiculo:veiculos(*)
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data as OrdemServico;
  },

  async create(data: OrdemServicoFormData) {
    // Sanitização centralizada para evitar erros de sintaxe no Supabase ("" para campos que esperam UUID ou Timestamp)
    const payload = {
      ...data,
      horario_inicio: data.horario_inicio && data.horario_inicio !== "" ? data.horario_inicio : null,
      horario_fim: data.horario_fim && data.horario_fim !== "" ? data.horario_fim : null,
      tarifario_id: data.tarifario_id && data.tarifario_id !== "" ? data.tarifario_id : null,
      numero_os: data.numero_os && data.numero_os !== "" ? data.numero_os : null,
    };

    const { data: newOrdem, error } = await supabase
      .from('ordens_servico')
      .insert([payload])
      .select('id')
      .maybeSingle();
    
    if (error) throw error;
    if (!newOrdem) throw new Error('Falha ao obter ID da nova OS');
    
    // Tabela financeira é 'recebimentos'
    const { error: recError } = await supabase
      .from('recebimentos')
      .insert([{
        ordem_id: newOrdem.id,
        valor: data.valor_faturamento || 0,
        status: 'pendente'
      }]);
      
    if (recError) throw recError;
    return newOrdem;
  },

  async update(id: string, data: Partial<OrdemServicoFormData>) {
    // Só atualiza os campos que foram passados, removendo o risco de sobrescrever com null indesejado
    const payload: any = { ...data };
    
    // Tratamento específico: se for string vazia, vira null. Se for undefined, remove do payload.
    if (payload.horario_inicio === '') payload.horario_inicio = null;
    if (payload.horario_fim === '') payload.horario_fim = null;
    
    // Remove chaves explicitamente undefined para não zerar dados existentes
    Object.keys(payload).forEach(key => {
      if (payload[key] === undefined) {
        delete payload[key];
      }
    });

    const { error } = await supabase
      .from('ordens_servico')
      .update(payload)
      .eq('id', id);

    if (error) throw error;

    // Sincroniza valor faturamento se ele existir no payload
    if (payload.valor_faturamento !== undefined) {
      await supabase
        .from('recebimentos')
        .update({ valor: payload.valor_faturamento })
        .eq('ordem_id', id);
    }
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('ordens_servico')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};
