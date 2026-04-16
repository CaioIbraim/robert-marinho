import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';

export const useDashboard = () => {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const [ordens, motoristas, veiculos, faturamentos] = await Promise.all([
        supabase.from('ordens_servico').select('*', { count: 'exact', head: true }),
        supabase.from('motoristas').select('*', { count: 'exact', head: true }).eq('status', 'ativo'),
        supabase.from('veiculos').select('*', { count: 'exact', head: true }).eq('status', 'ativo'),
        supabase.from('ordens_servico').select('valor_faturamento, valor_custo_motorista').eq('status', 'concluido')
      ]);

      const faturamento = faturamentos.data?.reduce((acc, curr) => acc + (Number(curr.valor_faturamento) || 0), 0) || 0;
      const repasse = faturamentos.data?.reduce((acc, curr) => acc + (Number(curr.valor_custo_motorista) || 0), 0) || 0;
      const lucro = faturamento - repasse;

      return {
        ordens: ordens.count || 0,
        motoristas: motoristas.count || 0,
        veiculos: veiculos.count || 0,
        faturamento,
        repasse,
        lucro
      };
    },
    staleTime: 1000 * 60 * 5 // cache 5 min
  });
};