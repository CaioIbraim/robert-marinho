import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { usePerfil } from './usePerfil';
import type { UserProfile } from '../types';

export const usePortalData = () => {
  const { data: perfil } = usePerfil();
  const userPerfil = perfil as UserProfile;

  const ordersQuery = useQuery({
    queryKey: ['portal-orders', userPerfil?.empresa_id],
    enabled: !!userPerfil?.empresa_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ordens_servico')
        .select(`
          *,
          motorista:motoristas(*),
          veiculo:veiculos(*)
        `)
        .eq('empresa_id', userPerfil.empresa_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  const financeiroQuery = useQuery({
    queryKey: ['portal-financeiro', userPerfil?.empresa_id],
    enabled: !!userPerfil?.empresa_id,
    queryFn: async () => {
      // Como a tabela financeiro liga com ordem_id, precisamos filtrar as ordens da empresa primeiro
      // Ou se a tabela financeiro tiver empresa_id direto (ideal)
      // Vamos tentar buscar via join ou assumir que existe empresa_id no financeiro se possível
      const { data, error } = await supabase
        .from('financeiro')
        .select(`
          *,
          ordem:ordens_servico(*)
        `)
        .eq('ordem.empresa_id', userPerfil.empresa_id)
        .order('data_vencimento', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  return {
    orders: ordersQuery.data || [],
    financeiro: financeiroQuery.data || [],
    isLoading: ordersQuery.isLoading || financeiroQuery.isLoading,
    perfil: userPerfil
  };
};
