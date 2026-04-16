import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';

export const useDashboard = (filters?: {
  startDate?: string;
  endDate?: string;
  empresaId?: string;
  veiculoId?: string;
  motoristaId?: string;
}) => {
  return useQuery({
    queryKey: ['dashboard', filters],
    queryFn: async () => {
      let ordensQuery = supabase.from('ordens_servico').select('*', { count: 'exact', head: true });
      let motoristasQuery = supabase.from('motoristas').select('*', { count: 'exact', head: true }).eq('status', 'ativo');
      let veiculosQuery = supabase.from('veiculos').select('*', { count: 'exact', head: true }).eq('status', 'ativo');
      let faturamentosQuery = supabase.from('ordens_servico').select('valor_faturamento, valor_custo_motorista').eq('status', 'concluido');

      if (filters?.startDate) {
        ordensQuery = ordensQuery.gte('data_execucao', filters.startDate);
        faturamentosQuery = faturamentosQuery.gte('data_execucao', filters.startDate);
      }
      if (filters?.endDate) {
        ordensQuery = ordensQuery.lte('data_execucao', filters.endDate);
        faturamentosQuery = faturamentosQuery.lte('data_execucao', filters.endDate);
      }
      if (filters?.empresaId) {
        ordensQuery = ordensQuery.eq('empresa_id', filters.empresaId);
        faturamentosQuery = faturamentosQuery.eq('empresa_id', filters.empresaId);
      }
      if (filters?.veiculoId) {
        ordensQuery = ordensQuery.eq('veiculo_id', filters.veiculoId);
        faturamentosQuery = faturamentosQuery.eq('veiculo_id', filters.veiculoId);
      }
      if (filters?.motoristaId) {
        ordensQuery = ordensQuery.eq('motorista_id', filters.motoristaId);
        faturamentosQuery = faturamentosQuery.eq('motorista_id', filters.motoristaId);
      }

      const isFiltered = !!(filters?.startDate || filters?.endDate || filters?.empresaId || filters?.veiculoId || filters?.motoristaId);

      const [ordens, motoristas, veiculos, faturamentos] = await Promise.all([
        ordensQuery,
        isFiltered 
          ? supabase.from('ordens_servico').select('motorista_id', { count: 'exact', head: true }).not('motorista_id', 'is', null) 
          : motoristasQuery,
        isFiltered
          ? supabase.from('ordens_servico').select('veiculo_id', { count: 'exact', head: true }).not('veiculo_id', 'is', null)
          : veiculosQuery,
        faturamentosQuery
      ]);

      // Note: For distinct counts in Supabase/PostgREST, we'd ideally use a different approach,
      // but for simple dashboarding, these head counts of the orders table are a starting point.
      // Actually, let's keep it simple: if filtered, we show the OS count for that filter.
      // For motoristas/veiculos, we'll keep the general count unless they specifically want to filter the pool.

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
    staleTime: 1000 * 60 * 5
  });
};