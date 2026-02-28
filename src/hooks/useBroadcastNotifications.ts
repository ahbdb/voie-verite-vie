import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

/**
 * Hook pour gérer les notifications persistantes du système de broadcast
 * Se connecte aux nouvelles notifications et les affiche en temps réel
 */
export const useBroadcastNotifications = () => {
  const { user } = useAuth();
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    // S'abonner aux nouvelles notifications de broadcast
    const channel = (supabase as any)
      .channel(`broadcast:${user.id}:${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_notifications',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload: any) => {
          const notification = payload.new as any;
          
          // Afficher une notification système (Web Push)
          if ('Notification' in window && Notification.permission === 'granted') {
            try {
              const options: any = {
                body: notification.body,
                icon: notification.icon || '/logo-3v.png',
                badge: '/logo-3v.png',
                tag: notification.id,
                requireInteraction: true, // Reste visible jusqu'à l'action
              };
              
              // Ajouter la vibration si supportée (propriété non-standard)
              if ('vibrate' in navigator) {
                options.vibrate = [200, 100, 200];
              }
              
              new Notification(notification.title, options);
            } catch (error) {
              console.error('Erreur lors de l\'affichage de la notification:', error);
            }
          }
          
          // Afficher un toast si la notification est une salutation du matin
          if (notification.type === 'greeting') {
            toast.success(notification.title, {
              description: notification.body,
              duration: 5000,
            });
          } else if (notification.type === 'reminder') {
            toast.info(notification.title, {
              description: notification.body,
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
 * Service pour envoyer les notifications de broadcast aux utilisateurs
 */
export const broadcastNotificationService = {
  /**
   * Envoyer une notification à tous les utilisateurs
   */
  async sendToAll(
    title: string,
    body: string,
    type: 'greeting' | 'reminder' | 'announcement' | 'update' = 'announcement',
    icon?: string
  ) {
    try {
      const user = await supabase.auth.getUser();
      
      const { data, error } = await (supabase as any)
        .from('broadcast_notifications')
        .insert({
          title,
          body,
          type,
          icon: icon || null,
          target_role: null, // null = tous les utilisateurs
          created_by: user.data.user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Envoyer la notification
      const { error: sendError } = await (supabase as any).rpc(
        'send_broadcast_notification',
        { p_broadcast_id: data.id }
      );

      if (sendError) throw sendError;

      console.log('✓ Notification envoyée à tous les utilisateurs');
      return data;
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la notification:', error);
      throw error;
    }
  },

  /**
   * Envoyer une notification à une catégorie d'utilisateurs (admins, users)
   */
  async sendToRole(
    title: string,
    body: string,
    role: 'admin' | 'user',
    type: 'greeting' | 'reminder' | 'announcement' | 'update' = 'announcement',
    icon?: string
  ) {
    try {
      const user = await supabase.auth.getUser();
      
      const { data, error } = await (supabase as any)
        .from('broadcast_notifications')
        .insert({
          title,
          body,
          type,
          icon: icon || null,
          target_role: role,
          created_by: user.data.user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Envoyer la notification
      const { error: sendError } = await (supabase as any).rpc(
        'send_broadcast_notification',
        { p_broadcast_id: data.id }
      );

      if (sendError) throw sendError;

      console.log(`✓ Notification envoyée aux ${role}s`);
      return data;
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la notification:', error);
      throw error;
    }
  },

  /**
   * Exemples de notifications quotidiennes
   */
  async sendDailyGreeting() {
    const hour = new Date().getHours();
    let greeting = '';

    if (hour < 12) {
      greeting = 'Bonjour! 🌅 Commence la journée avec confiance et paix.';
    } else if (hour < 18) {
      greeting = 'Bonne après-midi! 🌤️ Continue à avancer avec courage.';
    } else {
      greeting = 'Bonsoir! 🌙 Que cette soirée soit remplie de sérénité.';
    }

    return this.sendToAll(
      '👋 Salutation du jour',
      greeting,
      'greeting',
      '🙏'
    );
  },

  /**
   * Envoyer une notification de rappel
   */
  async sendReminder(title: string, message: string, icon?: string) {
    return this.sendToAll(title, message, 'reminder', icon || '🔔');
  },

  /**
   * Envoyer une annonce
   */
  async sendAnnouncement(title: string, message: string, icon?: string) {
    return this.sendToAll(title, message, 'announcement', icon || '📢');
  },

  /**
   * Envoyer une mise à jour
   */
  async sendUpdate(title: string, message: string, icon?: string) {
    return this.sendToAll(title, message, 'update', icon || '✨');
  },
};

/**
 * Fonction pour tester les notifications
 */
export const testNotificationSystem = async () => {
  try {
    // Tester l'envoi d'une notification
    await broadcastNotificationService.sendToAll(
      '🧪 Test Notification',
      'Ceci est un message de test du système de notifications persistantes.',
      'announcement',
      '🔔'
    );
    return { success: true, message: 'Notification de test envoyée!' };
  } catch (error) {
    console.error('Erreur test notification:', error);
    return { success: false, message: 'Erreur lors de l\'envoi du test' };
  }
};
