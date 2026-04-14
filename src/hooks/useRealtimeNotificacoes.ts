// hooks/useRealtimeNotificacoes.ts

import { supabase } from '../lib/supabaseClient';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export const useRealtimeNotificacoes = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('notificacoes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notificacoes' },
        () => {
            queryClient.invalidateQueries({
                queryKey: ['notificacoes']
            });
            queryClient.invalidateQueries({
                queryKey: ['notificacoes-count']
            });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
};