import { supabase } from '../lib/supabaseClient';
import type { Empresa } from '../types';
import type { EmpresaFormData } from '../schemas';

export const empresaService = {
  async getAll() {
    const { data, error } = await supabase
      .from('empresas')
      .select('*')
      .order('razao_social', { ascending: true });
    
    if (error) throw error;
    return data as Empresa[];
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('empresas')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data as Empresa;
  },

  async create(data: EmpresaFormData) {
    const { error } = await supabase
      .from('empresas')
      .insert([data]);
    
    if (error) throw error;
  },

  async update(id: string, data: Partial<EmpresaFormData>) {
    const { error } = await supabase
      .from('empresas')
      .update(data)
      .eq('id', id);
    
    if (error) throw error;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('empresas')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};
