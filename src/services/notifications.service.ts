import { supabase } from '../lib/supabaseClient';

export const notificationService = {
  /**
   * Cria uma notificação no banco e tenta disparar um broadcast via WebSocket
   */
  async create(data: {
    titulo: string;
    mensagem: string;
    tipo?: 'info' | 'success' | 'warning' | 'error';
    user_id?: string | 'broadcast';
    link?: string;
  }) {
    try {
      const targetUserId = data.user_id === 'broadcast' ? null : data.user_id;

      // 1. Persiste no banco de dados
      const { data: insertedData, error } = await supabase
        .from('notificacoes')
        .insert({
          titulo: data.titulo,
          mensagem: data.mensagem,
          tipo: data.tipo || 'info',
          user_id: targetUserId,
          link: data.link,
          lida: false
        })
        .select()
        .single();

      if (error) {
        // Se for erro de RLS (42501), apenas avisamos mas não travamos o fluxo principal
        if (error.code === '42501') {
          console.warn('RLS Policy prevent notification insert for this user.');
          return { data: null };
        }
        console.error('Error creating notification:', error);
        return { error };
      }

      // 2. Dispara Broadcast via WebSocket para ALERTA INSTANTÂNEO
      const broadcastChannel = supabase.channel('global_notifications');
      
      broadcastChannel.send({
        type: 'broadcast',
        event: 'new_notification',
        payload: insertedData
      });

      return { data: insertedData };
    } catch (err) {
      console.error('Notification Service Catch:', err);
      return { error: err };
    }
  },

  async getAll() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    
    const { data: perfil } = await supabase.from('perfis').select('role').eq('id', user.id).single();
    const role = perfil?.role;

    let query = supabase.from('notificacoes').select('*').order('created_at', { ascending: false });

    // Admins e Operadores vêm as suas e as de broadcast
    if (role === 'admin' || role === 'operador') {
      query = query.or(`user_id.eq.${user.id},user_id.is.null`);
    } else {
      query = query.eq('user_id', user.id);
    }

    const { data } = await query;
    return data;
  },

  async markAsRead(id: string) {
    return await supabase
      .from('notificacoes')
      .update({ lida: true })
      .eq('id', id);
  },

  async markAllAsRead(userId?: string) {
    let targetId = userId;
    if (!targetId) {
      const { data: { user } } = await supabase.auth.getUser();
      targetId = user?.id;
    }
    if (!targetId) return;

    const { data: perfil } = await supabase.from('perfis').select('role').eq('id', targetId).single();
    const role = perfil?.role;

    let query = supabase.from('notificacoes').update({ lida: true }).eq('lida', false);

    if (role === 'admin' || role === 'operador') {
      query = query.or(`user_id.eq.${targetId},user_id.is.null`);
    } else {
      query = query.eq('user_id', targetId);
    }

    return await query;
  },

  async delete(id: string) {
    return await supabase.from('notificacoes').delete().eq('id', id);
  },

  async getUnreadCount(userId: string, role?: string) {
    let query = supabase
      .from('notificacoes')
      .select('*', { count: 'exact', head: true })
      .eq('lida', false);

    if (role === 'admin' || role === 'operador') {
      query = query.or(`user_id.eq.${userId},user_id.is.null`);
    } else {
      query = query.eq('user_id', userId);
    }

    return await query;
  }
};
