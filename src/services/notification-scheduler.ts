/**
 * Service de Scheduler pour les notifications automatiques
 * Déclenche les messages aux heures configurées
 * ✨ Optimisé contre les fuites mémoire
 */

import { dailyNotificationSchedule, notificationLimits } from './notification-schedule-config';

interface NotificationHistory {
  timestamp: number;
  type: string;
  success: boolean;
}

class NotificationScheduler {
  private notificationHistory: NotificationHistory[] = [];
  private schedulerInterval: NodeJS.Timeout | null = null;
  private isRunning = false;
  private debugMode = false;
  private maxHistorySize = 500; // ← Limite pour éviter trop de mémoire

  constructor(debugMode = false) {
    this.debugMode = debugMode;
    this.loadHistoryFromStorage();
    // ✨ Auto-cleanup si trop vieux
    this.pruneOldHistory();
  }

  /**
   * ✨ Nettoyer l'historique ancien
   */
  private pruneOldHistory(): void {
    const maxAge = 48 * 60 * 60 * 1000; // 48h
    const cutoff = Date.now() - maxAge;
    
    this.notificationHistory = this.notificationHistory
      .filter(n => n.timestamp > cutoff)
      .slice(-this.maxHistorySize); // Garder les N derniers
    
    this.saveHistoryToStorage();
  }

  /**
   * Démarrer le scheduler - vérifie l'heure toutes les minutes
   */
  public start(): void {
    if (this.isRunning) {
      console.warn('[NotificationScheduler] ⚠️ Déjà en cours d\'exécution - skip restart');
      return;
    }

    this.isRunning = true;
    console.log('[NotificationScheduler] ✅ Démarrage du scheduler');

    // ✨ Important: Nettoyer avant de relancer
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
    }

    // Vérifier l'heure toutes les minutes
    this.schedulerInterval = setInterval(() => {
      this.checkAndDispatchNotifications();
    }, 60000); // 60 secondes

    // Vérification immédiate au démarrage
    this.checkAndDispatchNotifications();
  }

  /**
   * Arrêter le scheduler
   */
  public stop(): void {
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
      this.schedulerInterval = null;
    }
    this.isRunning = false;
    console.log('[NotificationScheduler] ⛔ Scheduler arrêté');
  }

  /**
   * Vérifier et envoyer les notifications à l'heure prévue
   */
  private async checkAndDispatchNotifications(): Promise<void> {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    if (this.debugMode) {
      console.log(
        `[NotificationScheduler] Vérification: ${currentHour}:${String(currentMinute).padStart(2, '0')}`
      );
    }

    for (const config of dailyNotificationSchedule) {
      // Vérifier si c'est l'heure
      if (config.hour === currentHour && config.minute === currentMinute) {
        // Vérifier les limites
        if (this.canSendNotification(config.description)) {
          this.dispatchNotification(config);
        } else if (this.debugMode) {
          console.log(
            `[NotificationScheduler] ⏱️ Limite atteinte pour: ${config.description}`
          );
        }
      }
    }
  }

  /**
   * Envoyer une notification avec gestion des erreurs
   */
  private async dispatchNotification(config: any): Promise<void> {
    try {
      if (this.debugMode) {
        console.log(
          `[NotificationScheduler] 📤 Envoi: ${config.description} à ${config.hour}:${String(config.minute).padStart(2, '0')}`
        );
      }

      // Exécuter la fonction du message
      await config.messageFunction();

      // Enregistrer dans l'historique
      this.recordNotification(config.description, true);
    } catch (error) {
      console.error(
        `[NotificationScheduler] ❌ Erreur lors d'envoi de: ${config.description}`,
        error
      );
      this.recordNotification(config.description, false);
    }
  }

  /**
   * Vérifier si on peut envoyer une notification (respecter les limites)
   */
  private canSendNotification(notificationType: string): boolean {
    const now = Date.now();
    const recentNotifications = this.notificationHistory.filter(
      (n) => now - n.timestamp < 24 * 60 * 60 * 1000 // Dernières 24h
    );

    // Vérifier limite quotidienne
    if (recentNotifications.length >= notificationLimits.maxPerDay) {
      return false;
    }

    // Vérifier limite horaire
    const recentHourNotifications = recentNotifications.filter(
      (n) => now - n.timestamp < 60 * 60 * 1000 // Dernière heure
    );
    if (recentHourNotifications.length >= notificationLimits.maxPerHour) {
      return false;
    }

    // Vérifier intervalle minimum
    const lastNotification = recentNotifications[recentNotifications.length - 1];
    if (lastNotification && now - lastNotification.timestamp < notificationLimits.minIntervalMinutes * 60 * 1000) {
      return false;
    }

    return true;
  }

  /**
   * Enregistrer une notification dans l'historique
   */
  private recordNotification(type: string, success: boolean): void {
    this.notificationHistory.push({
      timestamp: Date.now(),
      type,
      success,
    });

    // Nettoyer l'historique (garder seulement 48h)
    const cutoffTime = Date.now() - 48 * 60 * 60 * 1000;
    this.notificationHistory = this.notificationHistory.filter(
      (n) => n.timestamp > cutoffTime
    );

    // ✨ Limiter la taille avant de sauvegarder
    if (this.notificationHistory.length > this.maxHistorySize) {
      this.notificationHistory = this.notificationHistory.slice(-this.maxHistorySize);
    }

    this.saveHistoryToStorage();
  }

  /**
   * ✨ Sauvegarder l'historique dans le localStorage avec error handling
   */
  private saveHistoryToStorage(): void {
    if (typeof window !== 'undefined') {
      try {
        // ✨ Check localStorage quota
        const testKey = '__storage_test__';
        localStorage.setItem(testKey, '1');
        localStorage.removeItem(testKey);
        
        // ✨ Safe JSON stringify avec limite
        const toSave = this.notificationHistory.slice(-100); // Garder max 100
        localStorage.setItem(
          'notification_scheduler_history',
          JSON.stringify(toSave)
        );
      } catch (e) {
        // ✨ Si c'est une erreur de quota, clear l'historique
        if (e instanceof DOMException && e.code === 22) {
          console.warn('[NotificationScheduler] ⚠️ Storage quota exceeded - clearing history');
          try {
            localStorage.removeItem('notification_scheduler_history');
          } catch (clearError) {
            console.error('[NotificationScheduler] ❌ Failed to clear storage');
          }
          this.notificationHistory = [];
        } else {
          console.warn('[NotificationScheduler] ⚠️ Cannot save history');
        }
      }
    }
  }

  /**
   * ✨ Charger l'historique depuis le localStorage avec validation
   */
  private loadHistoryFromStorage(): void {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('notification_scheduler_history');
        if (stored) {
          const parsed = JSON.parse(stored);
          // ✨ Valider que c'est un array
          if (Array.isArray(parsed)) {
            this.notificationHistory = parsed;
          } else {
            console.warn('[NotificationScheduler] ⚠️ Stored history is not an array');
            this.notificationHistory = [];
          }
        }
      } catch (e) {
        console.warn('[NotificationScheduler] ⚠️ Cannot load history - corrupted data');
        this.notificationHistory = [];
        // ✨ Clear corrupted data
        try {
          localStorage.removeItem('notification_scheduler_history');
        } catch (clearError) {
          // Ignore
        }
      }
    }
  }

  /**
   * Obtenir les statistiques d'envoi
   */
  public getStats(): {
    totalSent: number;
    successRate: number;
    nextScheduledNotifications: string[];
  } {
    const now = new Date();
    const todayNotifications = this.notificationHistory.filter(
      (n) => Date.now() - n.timestamp < 24 * 60 * 60 * 1000
    );

    const successCount = todayNotifications.filter((n) => n.success).length;
    const successRate =
      todayNotifications.length > 0
        ? Math.round((successCount / todayNotifications.length) * 100)
        : 0;

    // Trouver les prochaines notifications
    const nextScheduled = dailyNotificationSchedule
      .filter((config) => {
        const scheduleTime = config.hour * 60 + config.minute;
        const nowTime = now.getHours() * 60 + now.getMinutes();
        return scheduleTime > nowTime;
      })
      .map((config) => `${config.hour}:${String(config.minute).padStart(2, '0')} - ${config.description}`);

    return {
      totalSent: todayNotifications.length,
      successRate,
      nextScheduledNotifications: nextScheduled,
    };
  }

  /**
   * Forcer l'envoi d'une notification immédiatement (utile pour tester)
   */
  public async sendNow(type: 'love' | 'punch' | 'prayer' | 'promotion' | 'all'): Promise<void> {
    try {
      if (this.debugMode) {
        console.log(`[NotificationScheduler] 🧪 Test: envoi immédiat de ${type}`);
      }

      if (type === 'love' || type === 'all') {
        const { sendLoveMessage } = await import('./motivational-notifications');
        await sendLoveMessage();
      }
      if (type === 'punch' || type === 'all') {
        const { sendPunchMessage } = await import('./motivational-notifications');
        await sendPunchMessage();
      }
      if (type === 'prayer' || type === 'all') {
        const { sendDailyPrayer } = await import('./prayer-notifications');
        await sendDailyPrayer();
      }
      if (type === 'promotion' || type === 'all') {
        const { sendPromotionMessage } = await import('./motivational-notifications');
        await sendPromotionMessage();
      }
    } catch (error) {
      console.error('[NotificationScheduler] ❌ Erreur durante test:', error);
    }
  }
}

// Instance globale du scheduler
let schedulerInstance: NotificationScheduler | null = null;

/**
 * Obtenir ou créer l'instance du scheduler
 */
export function getNotificationScheduler(debugMode = false): NotificationScheduler {
  if (!schedulerInstance) {
    schedulerInstance = new NotificationScheduler(debugMode);
  }
  return schedulerInstance;
}

/**
 * Démarrer le scheduler global automatiquement à l'import
 */
export function initializeNotificationScheduler(debugMode = false): void {
  const scheduler = getNotificationScheduler(debugMode);
  scheduler.start();
}

// Exporter la classe pour les tests
export { NotificationScheduler };
