import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useBroadcastNotifications } from '@/hooks/useBroadcastNotifications';

/**
 * Composant pour initialiser les notifications persistantes au démarrage de l'app
 * S'assure que:
 * 1. Les permissions de notification sont configurées
 * 2. Les abonnements réaltime sont actifs
 * 3. Les notifications système (Web Push) sont activées
 */
export const NotificationInitializer = () => {
  const { user } = useAuth();

  // Active les récepteurs de notifications persistantes
  useBroadcastNotifications();

  useEffect(() => {
    // Initialiser les communications réaltime et permissions silencieusement
    initNotificationPermissions();
  }, [user?.id]);

  return null; // Ce composant ne rend rien
};

/**
 * Initialise les permissions de notification de manière silencieuse
 */
async function initNotificationPermissions() {
  try {
    // Vérifier si les notifications sont supportées
    if (!('Notification' in window)) {
      console.log('Les notifications ne sont pas supportées sur ce navigateur');
      return;
    }

    // Si pas encore demandé et supporté
    if (Notification.permission === 'default') {
      try {
        // Demander la permission
        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
          console.log('✓ Permissions de notification accordées');
          
          // Enregistrer le service worker pour les notifications
          if ('serviceWorker' in navigator) {
            try {
              await navigator.serviceWorker.register('/notification-sw.js');
              console.log('✓ Service Worker enregistré pour les notifications');
            } catch (error) {
              console.log('Service Worker déjà enregistré ou non disponible');
            }
          }
        } else if (permission === 'denied') {
          console.log('Notifications bloquées par l\'utilisateur');
        }
      } catch (error) {
        console.log('Impossible de demander la permission de notification:', error);
        // Continuer sans notifications - ce n'est pas critique
      }
    }
  } catch (error) {
    console.log('Erreur lors de l\'initialisation des notifications:', error);
    // Ne pas interrompre l'app - les notifications sont optionnelles
  }
}

export default NotificationInitializer;
