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
    // Sanitização para evitar erro de timestamp vazio
    const sanitizedData = {
      ...data,
      horario_inicio: data.horario_inicio || null,
      horario_fim: data.horario_fim || null,
    };

    const { data: newOrdem, error } = await supabase
      .from('ordens_servico')
      .insert([sanitizedData])
      .select('id')
      .single();
    
    if (error) throw error;
    
    const { error: recError } = await supabase
      .from('recebimentos')
      .insert([{
        ordem_id: newOrdem.id,
        valor: data.valor_faturamento,
        status: 'pendente'
      }]);
      
    if (recError) throw recError;
  },

  async update(id: string, data: Partial<OrdemServicoFormData>) {
  const sanitizedData: Partial<OrdemServicoFormData> = {
    ...data,
    horario_inicio: data.horario_inicio || null,
    horario_fim: data.horario_fim || null,
  };

  const { error } = await supabase
    .from('ordens_servico')
    .update(sanitizedData)
    .eq('id', id);

  if (error) throw error;
},

  async delete(id: string) {
    const { error } = await supabase
      .from('ordens_servico')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};
