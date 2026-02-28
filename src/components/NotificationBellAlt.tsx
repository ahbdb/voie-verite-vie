import { useEffect, useState } from 'react';
import { Bell, X, Check, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import {
  getUnreadNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  UserNotification,
} from '@/lib/broadcast-notification-service';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

export const NotificationBellAlt = () => {
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load initial notifications
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const [notifs, count] = await Promise.all([
          getUnreadNotifications(),
          getUnreadCount(),
        ]);
        setNotifications(notifs);
        setUnreadCount(count);
      } catch (err) {
        console.error('Error loading notifications:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadNotifications();
  }, []);

  // Setup realtime subscription
  useEffect(() => {
    const { data: { user } } = supabase.auth.getUser().then(result => result.data);
    if (!user) return;

    // Subscribe to new notifications
    const channel = supabase.channel(`notifications:${user.id}`);
    
    const subscription = channel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_notifications',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          const newNotification = payload.new as UserNotification;
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
          
          // Show system notification
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(newNotification.title, {
              body: newNotification.body || '',
              icon: newNotification.icon || '/logo-3v.png',
              badge: '/logo-3v.png',
              tag: `notification-${newNotification.id}`,
              requireInteraction: true,
            });
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  const handleMarkAsRead = async (notificationId: string) => {
    await markNotificationAsRead(notificationId);
    setNotifications(prev =>
      prev.map(n =>
        n.id === notificationId ? { ...n, is_read: true } : n
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const handleMarkAllAsRead = async () => {
    await markAllNotificationsAsRead();
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const handleDelete = async (notificationId: string) => {
    await deleteNotification(notificationId);
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'greeting':
        return '👋';
      case 'reminder':
        return '⏰';
      case 'announcement':
        return '📢';
      case 'update':
        return '✨';
      default:
        return '📬';
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </SheetTrigger>

      <SheetContent side="right" className="w-full sm:w-96 p-0 flex flex-col">
        <SheetHeader className="border-b p-4">
          <div className="flex items-center justify-between">
            <SheetTitle>🔔 Notifications</SheetTitle>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="text-xs"
              >
                Tout marquer comme lu
              </Button>
            )}
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">Chargement...</div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Pas de notifications</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map(notif => (
                <div
                  key={notif.id}
                  className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer border-l-4 ${
                    notif.is_read
                      ? 'border-gray-200 bg-white'
                      : 'border-blue-500 bg-blue-50'
                  }`}
                  onClick={() => !notif.is_read && handleMarkAsRead(notif.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {getNotificationIcon(notif.type)}
                        </span>
                        <h3 className="font-semibold text-sm text-gray-900 truncate">
                          {notif.title}
                        </h3>
                        {!notif.is_read && (
                          <span className="inline-flex h-2 w-2 bg-blue-500 rounded-full flex-shrink-0" />
                        )}
                      </div>
                      {notif.body && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {notif.body}
                        </p>
                      )}
                      <time className="text-xs text-gray-400 mt-2">
                        {formatNotificationTime(notif.created_at)}
                      </time>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(notif.id);
                      }}
                      className="flex-shrink-0 text-gray-400 hover:text-gray-600 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {!notif.is_read && (
                    <div className="mt-3 flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(notif.id);
                        }}
                        className="text-xs"
                      >
                        <Check className="w-3 h-3 mr-1" />
                        Marquer comme lu
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

const formatNotificationTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'À l\'instant';
  if (diffMins < 60) return `Il y a ${diffMins}m`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays < 7) return `Il y a ${diffDays}j`;
  
  return date.toLocaleDateString('fr-FR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};
