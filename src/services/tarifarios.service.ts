import { supabase } from '../lib/supabaseClient';
import type { Tarifario } from '../types';

export const tarifarioService = {
  async getAll(): Promise<Tarifario[]> {
    try {
      const { data, error } = await supabase
        .from('tarifarios')
        .select('*')
        .order('origem', { ascending: true });

      if (error) {
        console.warn('Tabela tarifarios não disponível:', error.message);
        return [];
      }
      return data || [];
    } catch (e) {
      return [];
    }
  },

  async create(payload: Omit<Tarifario, 'id' | 'created_at'>): Promise<Tarifario> {
    const { data, error } = await supabase
      .from('tarifarios')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, payload: Partial<Tarifario>): Promise<Tarifario> {
    const { data, error } = await supabase
      .from('tarifarios')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('tarifarios').delete().eq('id', id);
    if (error) throw error;
  },
};
