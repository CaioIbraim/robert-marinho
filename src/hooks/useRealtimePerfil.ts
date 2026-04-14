// hooks/useRealtimePerfil.ts
import { useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';

export const useRealtimePerfil = () => {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('perfil-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'perfis',
          filter: `id=eq.${user.id}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['perfil', user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);
};