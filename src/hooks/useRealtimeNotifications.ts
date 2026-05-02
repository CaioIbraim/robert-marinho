import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { showToast } from '../utils/swal';

export const useRealtimeNotifications = (onNewNotification?: () => void) => {
  const onNewNotificationRef = useRef(onNewNotification);
  
  useEffect(() => {
    onNewNotificationRef.current = onNewNotification;
  }, [onNewNotification]);

  useEffect(() => {
    let isActive = true;
    let pollInterval: ReturnType<typeof setInterval>;
    let channel: any = null;

    const playNotificationSound = () => {
      const isMuted = localStorage.getItem('rm_mute_notifications') === 'true';
      if (isMuted) return;
      try {
        const audioInstance = new Audio('/songs/1.mp3');
        audioInstance.volume = 0.8;
        audioInstance.play().catch(() => {});
      } catch (e) { }
    };

    const cleanup = () => {
      if (pollInterval) clearInterval(pollInterval);
      if (channel) {
        supabase.removeChannel(channel);
        channel = null;
      }
    };

    const setupRealtime = async () => {
      // Pequeno delay para garantir que a sessão foi restaurada
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !isActive) return;
      
      const { data: perfil } = await supabase
        .from('perfis')
        .select('role')
        .eq('id', user.id)
        .single();
        
      const role = perfil?.role?.toLowerCase();
      const shownNotifs = new Set<string>();

      cleanup(); 

      // Nome fixo e GLOBAL para o broadcast - Centralizado no SystemProvider
      channel = supabase.channel('global_notifications');

      channel
        .on(
          'broadcast',
          { event: 'new_notification' },
          (payload: any) => {
            if (!isActive) return;
            const newNotif = payload?.payload || payload;
            if (!newNotif || !newNotif.mensagem) return;

            const isTargetedToMe = newNotif.user_id === user.id;
            const isBroadcastForStaff = !newNotif.user_id && (role === 'admin' || role === 'operador');
            
            if (!isTargetedToMe && !isBroadcastForStaff) return;

            if (newNotif.id && shownNotifs.has(newNotif.id)) return;
            if (newNotif.id) shownNotifs.add(newNotif.id);

            showToast(newNotif.mensagem, (newNotif.tipo || 'info') as any);
            playNotificationSound();

            if (onNewNotificationRef.current) onNewNotificationRef.current();
            document.dispatchEvent(new CustomEvent('rm_updateData'));
          }
        )
        .subscribe();

      const fetchUnread = async () => {
        if (!isActive) return;
        try {
          const baseline = new Date();
          baseline.setMinutes(baseline.getMinutes() - 2);

          let query = supabase.from('notificacoes')
            .select('*')
            .eq('lida', false)
            .gt('created_at', baseline.toISOString());
            
          if (role !== 'admin' && role !== 'operador') {
            query = query.eq('user_id', user.id);
          } else {
            query = query.or(`user_id.eq.${user.id},user_id.is.null`);
          }

          const { data } = await query.order('created_at', { ascending: false });
          if (data && data.length > 0) {
            let hasNew = false;
            data.forEach((notif: any) => {
              if (!shownNotifs.has(notif.id)) {
                shownNotifs.add(notif.id);
                hasNew = true;
                showToast(notif.mensagem, (notif.tipo || 'info') as any);
                playNotificationSound();
              }
            });
            if (hasNew) {
              if (onNewNotificationRef.current) onNewNotificationRef.current();
              document.dispatchEvent(new CustomEvent('rm_updateData'));
            }
          }
        } catch (err) {}
      };

      fetchUnread();
      pollInterval = setInterval(fetchUnread, 12000);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        setupRealtime();
      } else if (event === 'SIGNED_OUT') {
        cleanup();
      }
    });

    setupRealtime();

    return () => {
      isActive = false;
      cleanup();
      subscription.unsubscribe();
    };
  }, []);
};
