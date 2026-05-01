import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { usePerfil } from './usePerfil';
import type { UserProfile } from '../types';

export const useDriverData = () => {
  const perfilQuery = usePerfil();
  const userPerfil = perfilQuery.data as UserProfile;

  // 1. Busca qual motorista está vinculado a este perfil
  const motoristaQuery = useQuery({
    queryKey: ['driver-linked-profile', userPerfil?.id],
    enabled: !!userPerfil?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('motoristas')
        .select('*')
        .eq('perfil_id', userPerfil.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    }
  });

  const motoristaId = motoristaQuery.data?.id;

  // 2. Busca ordens atribuídas ao motorista
  const ordersQuery = useQuery({
    queryKey: ['driver-orders', motoristaId],
    enabled: !!motoristaId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ordens_servico')
        .select(`
          *,
          empresa:empresas(*),
          veiculo:veiculos(*),
          paradas:ordem_servico_paradas(*)
        `)
        .eq('motorista_id', motoristaId)
        .order('data_execucao', { ascending: true });

      if (error) throw error;
      return data;
    }
  });

  // 3. Busca repasses (financeiro do motorista)
  const earningsQuery = useQuery({
    queryKey: ['driver-earnings', motoristaId],
    enabled: !!motoristaId,
    queryFn: async () => {
      // Tenta buscar usando o join correto para filtrar pelo motorista_id da ordem
      // Usamos !inner para garantir que o filtro na tabela relacionada funcione como um filtro no resultado principal
      const { data, error } = await supabase
        .from('repasse_motoristas')
        .select(`
          *,
          ordem:ordens_servico!inner(*)
        `)
        .eq('ordem.motorista_id', motoristaId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Erro ao buscar ganhos:", error);
        return [];
      }
      return data;
    }
  });

  return {
    motorista: motoristaQuery.data,
    orders: ordersQuery.data || [],
    earnings: earningsQuery.data || [],
    isLoading: motoristaQuery.isLoading || ordersQuery.isLoading || earningsQuery.isLoading || perfilQuery.isLoading,
    perfil: userPerfil,
    refetch: () => {
      perfilQuery.refetch();
      motoristaQuery.refetch();
      ordersQuery.refetch();
      earningsQuery.refetch();
    }
  };
};
