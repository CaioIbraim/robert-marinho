import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';

export const useNotificacoesNaoLidas = () => {
  return useQuery({
    queryKey: ['notificacoes-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('notificacoes')
        .select('*', { count: 'exact', head: true })
        .eq('lida', false);

      if (error) throw error;

      return count;
    }
  });
};