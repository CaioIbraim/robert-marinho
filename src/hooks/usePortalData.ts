import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { usePerfil } from './usePerfil';
import type { UserProfile } from '../types';

export const usePortalData = () => {
  const { data: perfil } = usePerfil();
  const userPerfil = perfil as UserProfile;

  // 1. Busca qual empresa está vinculada a este perfil (Pode ser via empresas.perfil_id ou clientes.perfil_id)
  const empresaQuery = useQuery({
    queryKey: ['portal-linked-empresa', userPerfil?.id],
    enabled: !!userPerfil?.id,
    queryFn: async () => {
      // Tenta achar se ele é o "dono/admin" da empresa
      const { data: directEmpresa } = await supabase
        .from('empresas')
        .select('id')
        .eq('perfil_id', userPerfil.id)
        .maybeSingle();

      if (directEmpresa) return directEmpresa;

      // Se não achou, tenta achar se ele é um "cliente/funcionário" vinculado a uma empresa
      const { data: viaCliente } = await supabase
        .from('clientes')
        .select('empresa_id')
        .eq('perfil_id', userPerfil.id)
        .maybeSingle();

      if (viaCliente) return { id: viaCliente.empresa_id };

      return null;
    }
  });

  const empresaId = empresaQuery.data?.id;

  const ordersQuery = useQuery({
    queryKey: ['portal-orders', empresaId],
    enabled: !!empresaId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ordens_servico')
        .select(`
          *,
          motorista:motoristas(*),
          veiculo:veiculos(*)
        `)
        .eq('empresa_id', empresaId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  const financeiroQuery = useQuery({
    queryKey: ['portal-financeiro', empresaId],
    enabled: !!empresaId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('financeiro')
        .select(`
          *,
          ordem:ordens_servico(*)
        `)
        .eq('ordem.empresa_id', empresaId)
        .order('data_vencimento', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  return {
    orders: ordersQuery.data || [],
    financeiro: financeiroQuery.data || [],
    isLoading: ordersQuery.isLoading || financeiroQuery.isLoading || empresaQuery.isLoading,
    perfil: userPerfil,
    empresaId,
    refetch: () => {
      ordersQuery.refetch();
      financeiroQuery.refetch();
    }
  };
};
