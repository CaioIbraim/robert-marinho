import { supabase } from '../lib/supabaseClient';
import type { OrdemServico } from '../types';
import type { OrdemServicoFormData } from '../schemas';

export const ordemService = {
  async getAll() {
    const { data, error } = await supabase
      .from('ordens_servico')
      .select(`
        *,
        empresa:empresas(*),
        motorista:motoristas(*),
        veiculo:veiculos(*)
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as OrdemServico[];
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
    const { data: newOrdem, error } = await supabase
      .from('ordens_servico')
      .insert([data])
      .select('id')
      .single();
    
    if (error) throw error;
    
    const { error: recError } = await supabase
      .from('recebimentos')
      .insert([{
        ordem_id: newOrdem.id,
        valor: data.valor_total,
        status: 'pendente'
      }]);
      
    if (recError) throw recError;
  },

  async update(id: string, data: Partial<OrdemServicoFormData>) {
    const { error } = await supabase
      .from('ordens_servico')
      .update(data)
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
