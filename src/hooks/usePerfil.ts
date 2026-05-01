// hooks/usePerfil.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { useAuthStore } from '../stores/authStore';

export const usePerfil = () => {
  const user = useAuthStore((state) => state.user);

  const query = useQuery({
    queryKey: ['perfil', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('perfis')
        .select('*')
        .eq('id', user!.id)
        .maybeSingle();

      if (error) {
        console.error('usePerfil Error:', error);
        return null;
      }

      return data;
    }
  });

  return query;
};