import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { playAttentionTone, sendVisibleNotification } from '@/lib/notification-service';

export type AppNotificationType =
  | 'greeting'
  | 'reminder'
  | 'announcement'
  | 'update'
  | 'reading'
  | 'activity'
  | 'prayer'
  | 'info'
  | 'call';

export const useBroadcastNotifications = () => {
  const { user } = useAuth();
  const ringIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    const stopRinging = () => {
      if (ringIntervalRef.current) {
        window.clearInterval(ringIntervalRef.current);
        ringIntervalRef.current = null;
      }
    };

    const channel = supabase
      .channel(`notifications-toast:${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const n = payload.new as {
            id: string;
            title: string;
            message: string;
            type: AppNotificationType;
            link: string | null;
          };

          if (n.type === 'call') {
            // Ring continuously (every 3s) for 30s max
            void playAttentionTone();
            let ringCount = 0;
            ringIntervalRef.current = window.setInterval(() => {
              ringCount++;
              if (ringCount >= 10) { stopRinging(); return; }
              void playAttentionTone();
            }, 3000);

            void sendVisibleNotification({
              title: n.title,
              body: n.message,
              tag: `call-${n.id}`,
              action: 'call',
              silent: false,
              data: { url: n.link || '/' },
            });

            toast(n.title, {
              description: n.message,
              duration: 15000,
              action: n.link ? {
                label: 'Rejoindre',
                onClick: () => {
                  stopRinging();
                  window.location.href = n.link!;
                },
              } : undefined,
              onDismiss: stopRinging,
            });
            return;
          }

          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(n.title, { body: n.message, icon: '/logo-3v.png' });
          }

          if (n.type === 'greeting' || n.type === 'reminder') {
            toast(n.title, { description: n.message, duration: 5000 });
          }
        }
      )
      .subscribe();

    return () => {
      stopRinging();
      supabase.removeChannel(channel);
    };
  }, [user?.id]);
};

export const broadcastNotificationService = {
  async sendToAll(
    title: string,
    message: string,
    type: AppNotificationType = 'announcement',
    _icon?: string,
    link: string | null = null
  ) {
    const { data: profiles, error: pe } = await supabase.from('profiles').select('id');
    if (pe) throw pe;
    if (!profiles || profiles.length === 0) return { inserted: 0 };

    const payload = profiles.map((p) => ({
      user_id: p.id,
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
    const { data: roleRows, error: re } = await supabase
      .from('user_roles')
      .select('user_id, role')
      .in('role', roleFilter as any);
    if (re) throw re;
    if (!roleRows || roleRows.length === 0) return { inserted: 0 };

    const uniqueIds = [...new Set(roleRows.map((e) => e.user_id))];
    const payload = uniqueIds.map((uid) => ({
      user_id: uid,
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
    return { success: false, message: "Erreur lors de l'envoi du test" };
  }
};
