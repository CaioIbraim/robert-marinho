import { supabase } from '../lib/supabaseClient';
import type { Motorista } from '../types';
import type { MotoristaFormData } from '../schemas';

export const motoristaService = {
  async getAll() {
    const { data, error } = await supabase
      .from('motoristas')
      .select('*')
      .order('nome', { ascending: true });
    
    if (error) throw error;
    return data as Motorista[];
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('motoristas')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data as Motorista;
  },

  async create(data: MotoristaFormData) {
    const { data: inserted, error } = await supabase
      .from('motoristas')
      .insert([data])
      .select()
      .single();
    
    if (error) throw error;
    return inserted as Motorista;
  },

  async update(id: string, data: Partial<MotoristaFormData>) {
    const { error } = await supabase
      .from('motoristas')
      .update(data)
      .eq('id', id);
    
    if (error) throw error;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('motoristas')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};
