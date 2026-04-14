import { supabase } from '../lib/supabaseClient';
import type { Veiculo } from '../types';
import type { VeiculoFormData } from '../schemas';

export const veiculoService = {
  async getAll() {
    const { data, error } = await supabase
      .from('veiculos')
      .select('*')
      .order('placa', { ascending: true });
    
    if (error) throw error;
    return data as Veiculo[];
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
    const { error } = await supabase
      .from('veiculos')
      .insert([data]);
    
    if (error) throw error;
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
