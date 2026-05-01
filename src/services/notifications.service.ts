import { supabase } from '../lib/supabaseClient';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface CreateNotificationDTO {
  user_id?: string;
  titulo: string;
  mensagem: string;
  tipo?: NotificationType;
  link?: string;
}

export const notificationService = {
  async getAll() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('notificacoes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async create(dto: CreateNotificationDTO) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.warn('NotificationService: Usuário não autenticado.');
        return null;
      }

      const { error } = await supabase
        .from('notificacoes')
        .insert([{
          titulo: dto.titulo,
          mensagem: dto.mensagem,
          tipo: dto.tipo || 'info',
          link: dto.link || null,
          user_id: user.id,
          lida: false
        }]);

      if (error) {
        console.error('NotificationService Insert Error:', error);
        // Não lançaremos erro para não travar a UI principal
        return null;
      }

      return true;
    } catch (err) {
      console.error('NotificationService Catch:', err);
      return null;
    }
  },

  async markAsRead(id: string) {
    const { error } = await supabase
      .from('notificacoes')
      .update({ lida: true })
      .eq('id', id);
    
    if (error) throw error;
  },

  async markAllAsRead() {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const { error } = await supabase
      .from('notificacoes')
      .update({ lida: true })
      .eq('user_id', userData.user.id)
      .eq('lida', false);
    
    if (error) throw error;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('notificacoes')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};
