import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export type AppNotificationType = 'greeting' | 'reminder' | 'announcement' | 'update' | 'reading' | 'activity' | 'prayer' | 'info';

/**
 * Écoute en temps réel les notifications de l'utilisateur
 */
export const useBroadcastNotifications = () => {
  const { user } = useAuth();
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`notifications-toast:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const notification = payload.new as {
            id: string;
            title: string;
            message: string;
            type: AppNotificationType;
          };

          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(notification.title, {
              body: notification.message,
              icon: '/logo-3v.png',
            });
          }

          if (notification.type === 'greeting' || notification.type === 'reminder') {
            toast(notification.title, {
              description: notification.message,
              duration: 5000,
            });
          }
        }
      )
      .subscribe();

    unsubscribeRef.current = () => {
      supabase.removeChannel(channel);
    };

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [user?.id]);
};

/**
 * Service d'envoi de notifications dans la table publique `notifications`
 */
export const broadcastNotificationService = {
  async sendToAll(
    title: string,
    message: string,
    type: AppNotificationType = 'announcement',
    _icon?: string,
    link: string | null = null
  ) {
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id');

    if (profilesError) throw profilesError;
    if (!profiles || profiles.length === 0) return { inserted: 0 };

    const payload = profiles.map((profile) => ({
      user_id: profile.id,
      title,
      message,
      type,
      link,
      is_read: false,
    }));

    const { error } = await supabase.from('notifications').insert(payload);
    if (error) throw error;

    return { inserted: payload.length };
  },

  async sendToRole(
    title: string,
    message: string,
    role: 'admin' | 'user',
    type: AppNotificationType = 'announcement',
    _icon?: string,
    link: string | null = null
  ) {
    const roleFilter = role === 'admin' ? ['admin', 'admin_principal'] : ['user'];

    const { data: roleRows, error: roleError } = await supabase
      .from('user_roles')
      .select('user_id, role')
      .in('role', roleFilter as any);

    if (roleError) throw roleError;
    if (!roleRows || roleRows.length === 0) return { inserted: 0 };

    const uniqueUserIds = [...new Set(roleRows.map((r) => r.user_id))];
    const payload = uniqueUserIds.map((userId) => ({
      user_id: userId,
      title,
      message,
      type,
      link,
      is_read: false,
    }));

    const { error } = await supabase.from('notifications').insert(payload);
    if (error) throw error;

    return { inserted: payload.length };
  },
};

export const testNotificationSystem = async () => {
  try {
    await broadcastNotificationService.sendToAll(
      '🧪 Test Notification',
      'Ceci est un test du système de notifications.',
      'announcement'
    );
    return { success: true, message: 'Notification de test envoyée !' };
  } catch (error) {
    console.error('Erreur test notification:', error);
    return { success: false, message: 'Erreur lors de l\'envoi du test' };
  }
};
