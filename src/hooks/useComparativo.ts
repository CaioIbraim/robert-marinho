import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';

export const useComparativo = () => {
  return useQuery({
    queryKey: ['comparativo'],
    queryFn: async () => {
      const hoje = new Date();
      const ontem = new Date();
      ontem.setDate(hoje.getDate() - 1);

      const { data: hojeData } = await supabase
        .from('ordens_servico')
        .select('*')
        .gte('created_at', hoje.toISOString().split('T')[0]);

      const { data: ontemData } = await supabase
        .from('ordens_servico')
        .select('*')
        .gte('created_at', ontem.toISOString().split('T')[0])
        .lt('created_at', hoje.toISOString().split('T')[0]);

      return {
        hoje: hojeData?.length || 0,
        ontem: ontemData?.length || 0
      };
    }
  });
};