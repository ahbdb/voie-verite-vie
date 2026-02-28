/**
 * Service de gestion des notifications persistantes
 * Gère les notifications de broadcast (pour tous) et individuelles
 */

import { supabase } from './supabase';

export interface BroadcastNotification {
  id: string;
  title: string;
  body?: string;
  icon?: string;
  type: 'greeting' | 'reminder' | 'announcement' | 'update';
  target_role?: 'all' | 'user' | 'admin' | null;
  created_by: string;
  scheduled_at?: string;
  is_sent: boolean;
  sent_at?: string;
  created_at: string;
  updated_at: string;
}

export interface UserNotification {
  id: string;
  user_id: string;
  broadcast_notification_id?: string;
  title: string;
  body?: string;
  icon?: string;
  type: string;
  data?: Record<string, any>;
  is_read: boolean;
  viewed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationSettings {
  user_id: string;
  push_enabled: boolean;
  sound_enabled: boolean;
  vibration_enabled: boolean;
}

/**
 * Crée une notification de broadcast (pour tous ou une catégorie)
 */
export const createBroadcastNotification = async (
  title: string,
  body: string,
  options: {
    icon?: string;
    type?: 'greeting' | 'reminder' | 'announcement' | 'update';
    target_role?: 'all' | 'user' | 'admin' | null;
    scheduled_at?: string;
  } = {}
): Promise<BroadcastNotification | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('broadcast_notifications')
      .insert({
        title,
        body,
        icon: options.icon,
        type: options.type || 'announcement',
        target_role: options.target_role || 'all',
        created_by: user.id,
        scheduled_at: options.scheduled_at,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error creating broadcast notification:', err);
    return null;
  }
};

/**
 * Envoie une notification de broadcast à tous les utilisateurs
 * Crée des entrées dans user_notifications
 */
export const sendBroadcastNotification = async (
  broadcastId: string
): Promise<boolean> => {
  try {
    const { error } = await supabase.rpc('send_broadcast_notification', {
      p_broadcast_id: broadcastId,
    });

    if (error) throw error;
    
    // Afficher aussi une notification système
    await showSystemNotification(
      'Notification envoyée',
      'Votre notification a été envoyée à tous les utilisateurs'
    );

    return true;
  } catch (err) {
    console.error('Error sending broadcast notification:', err);
    return false;
  }
};

/**
 * Récupère toutes les notifications de l'utilisateur courant
 */
export const getUserNotifications = async (limit = 50): Promise<UserNotification[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('user_notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Error fetching user notifications:', err);
    return [];
  }
};

/**
 * Récupère les notifications non lues
 */
export const getUnreadNotifications = async (): Promise<UserNotification[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('user_notifications')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_read', false)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Error fetching unread notifications:', err);
    return [];
  }
};

/**
 * Compte les notifications non lues
 */
export const getUnreadCount = async (): Promise<number> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { count, error } = await supabase
      .from('user_notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (error) throw error;
    return count || 0;
  } catch (err) {
    console.error('Error getting unread count:', err);
    return 0;
  }
};

/**
 * Marque une notification comme lue
 */
export const markNotificationAsRead = async (notificationId: string): Promise<boolean> => {
  try {
    const { error } = await supabase.rpc('mark_notification_read', {
      p_notification_id: notificationId,
    });

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error marking notification as read:', err);
    return false;
  }
};

/**
 * Marque une notification comme visualisée (cliquée)
 */
export const markNotificationAsViewed = async (notificationId: string): Promise<boolean> => {
  try {
    const { error } = await supabase.rpc('mark_notification_viewed', {
      p_notification_id: notificationId,
    });

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error marking notification as viewed:', err);
    return false;
  }
};

/**
 * Efface une notification
 */
export const deleteNotification = async (notificationId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('user_notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error deleting notification:', err);
    return false;
  }
};

/**
 * Marque toutes les notifications comme lues
 */
export const markAllNotificationsAsRead = async (): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('user_notifications')
      .update({ is_read: true, viewed_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error marking all notifications as read:', err);
    return false;
  }
};

/**
 * S'abonne aux notifications en temps réel
 */
export const subscribeToNotifications = (callback: (notification: UserNotification) => void) => {
  const { data: { user } } = supabase.auth.getUser().then(result => result.data);
  
  if (!user) {
    console.error('Not authenticated');
    return () => {};
  }

  const subscription = supabase
    .from(`user_notifications:user_id=eq.${user.id}`)
    .on('*', (payload) => {
      if (payload.new) {
        callback(payload.new as UserNotification);
      }
    })
    .subscribe();

  return () => {
    supabase.removeSubscription(subscription);
  };
};

/**
 * S'abonne aux changements (nouveau, modifié, supprimé)
 */
export const subscribeToNotificationsChanges = (
  callback: (payload: {
    type: 'INSERT' | 'UPDATE' | 'DELETE';
    notification: UserNotification;
  }) => void
) => {
  const { data: { user } } = supabase.auth.getUser().then(result => result.data);
  
  if (!user) {
    console.error('Not authenticated');
    return () => {};
  }

  const channel = supabase.channel(`notifications:${user.id}`);

  const subscription = channel
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'user_notifications',
        filter: `user_id=eq.${user.id}`,
      },
      (payload) => {
        const type = payload.eventType.toUpperCase() as 'INSERT' | 'UPDATE' | 'DELETE';
        const notification = payload.new || payload.old;
        callback({
          type,
          notification: notification as UserNotification,
        });
      }
    )
    .subscribe();

  return () => {
    channel.unsubscribe();
  };
};

/**
 * Affiche une notification système (Web Push)
 */
export const showSystemNotification = async (
  title: string,
  options: {
    body?: string;
    icon?: string;
    badge?: string;
    tag?: string;
    requireInteraction?: boolean;
    sound?: boolean;
    vibrate?: number[];
  } = {}
) => {
  try {
    const settings = await getNotificationSettings();

    if (!settings.push_enabled) return;

    if ('serviceWorker' in navigator && 'PushManager' in window) {
      const registration = await navigator.serviceWorker.ready;
      if (registration.showNotification) {
        await registration.showNotification(title, {
          body: options.body || '',
          badge: options.badge || '/logo-3v.png',
          icon: options.icon || '/logo-3v.png',
          tag: options.tag || `notification-${Date.now()}`,
          silent: !settings.sound_enabled,
          requireInteraction: options.requireInteraction ?? true,
          vibrate: settings.vibration_enabled ? (options.vibrate || [200, 100, 200]) : undefined,
        });
      }
    } else if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body: options.body,
        badge: options.badge || '/logo-3v.png',
        icon: options.icon || '/logo-3v.png',
        tag: options.tag || `notification-${Date.now()}`,
      });
    }
  } catch (err) {
    console.log('System notification not available:', err);
  }
};

/**
 * Récupère les paramètres de notification de l'utilisateur
 */
export const getNotificationSettings = async (): Promise<NotificationSettings> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    // Return default settings if not found
    return (
      data || {
        user_id: user.id,
        push_enabled: true,
        sound_enabled: true,
        vibration_enabled: true,
      }
    );
  } catch (err) {
    console.error('Error getting notification settings:', err);
    return {
      user_id: '',
      push_enabled: true,
      sound_enabled: true,
      vibration_enabled: true,
    };
  }
};

/**
 * Mets à jour les paramètres de notification de l'utilisateur
 */
export const updateNotificationSettings = async (
  settings: Partial<NotificationSettings>
): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('notification_settings')
      .upsert({
        user_id: user.id,
        ...settings,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error updating notification settings:', err);
    return false;
  }
};

/**
 * Récupère les notifications de broadcast (pour l'admin)
 */
export const getBroadcastNotifications = async (limit = 50): Promise<BroadcastNotification[]> => {
  try {
    const { data, error } = await supabase
      .from('broadcast_notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Error fetching broadcast notifications:', err);
    return [];
  }
};
