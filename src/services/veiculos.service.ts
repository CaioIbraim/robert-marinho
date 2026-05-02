import { supabase } from '../lib/supabaseClient';
import type { Veiculo } from '../types';
import type { VeiculoFormData } from '../schemas';

export const veiculoService = {
  async getAll() {
    const veiculosRes = await supabase.from('veiculos').select('*').order('placa', { ascending: true });
    if (veiculosRes.error) throw veiculosRes.error;

    // Busca faturamento de forma separada para não travar a lista se houver erro de coluna
    try {
      const { data: ordensData } = await supabase
        .from('ordens_servico')
        .select('veiculo_id, valor_faturamento')
        .eq('status', 'concluido');

      const fatMap: Record<string, number> = {};
      for (const o of ordensData || []) {
        fatMap[o.veiculo_id] = (fatMap[o.veiculo_id] || 0) + Number(o.valor_faturamento || 0);
      }

      return (veiculosRes.data || []).map((v) => ({
        ...v,
        faturamento_real: fatMap[v.id] || 0,
      })) as Veiculo[];
    } catch (e) {
      console.warn('Erro ao carregar faturamento dos veículos:', e);
      return (veiculosRes.data || []) as Veiculo[];
    }
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('veiculos')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data as Veiculo;
  },

  async create(data: VeiculoFormData) {
    const { data: inserted, error } = await supabase
      .from('veiculos')
      .insert([data])
      .select()
      .single();
    
    if (error) throw error;
    return inserted as Veiculo;
  },

  async update(id: string, data: Partial<VeiculoFormData>) {
    const { error } = await supabase
      .from('veiculos')
      .update(data)
      .eq('id', id);
    
    if (error) throw error;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('veiculos')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};
