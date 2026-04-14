import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';

export const useDashboard = () => {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const [ordens, motoristas, veiculos] = await Promise.all([
        supabase.from('ordens_servico').select('*', { count: 'exact', head: true }),
        supabase.from('motoristas').select('*', { count: 'exact', head: true }).eq('status', 'ativo'),
        supabase.from('veiculos').select('*', { count: 'exact', head: true }).eq('status', 'ativo')
      ]);

      return {
        ordens: ordens.count || 0,
        motoristas: motoristas.count || 0,
        veiculos: veiculos.count || 0
      };
    },
    staleTime: 1000 * 60 * 5 // cache 5 min
  });
};