// hooks/usePerfil.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { useAuthStore } from '../stores/authStore';

export const usePerfil = () => {
  const user = useAuthStore((state) => state.user);

  return useQuery({
    queryKey: ['perfil', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('perfis')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      return data;
    }
  });
};