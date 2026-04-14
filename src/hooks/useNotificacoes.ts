// hooks/useNotificacoes.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';

export const useNotificacoes = () => {
  return useQuery({
    queryKey: ['notificacoes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notificacoes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      return data;
    }
  });
};