import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';


export const useOrdens = (page: number) => {
  const limit = 10;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  return useQuery({
    queryKey: ['ordens', page],
    queryFn: async () => {
      const { data } = await supabase
        .from('ordens_servico')
        .select('*')
        .range(from, to)
        .order('created_at', { ascending: false });

      return data;
    }
  });
};