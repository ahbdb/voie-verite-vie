import { useState, useEffect } from 'react';
import { Bell, X, Check, BookOpen, Calendar, MessageCircle, Info, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useBroadcastNotifications } from '@/hooks/useBroadcastNotifications';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface UserNotification {
  id: string;
  title: string;
  body: string;
  type: string;
  icon: string | null;
  data: Record<string, any> | null;
  is_read: boolean;
  viewed_at: string | null;
  created_at: string;
}

const typeIcons: Record<string, React.ReactNode> = {
  greeting: <MessageCircle className="w-4 h-4 text-yellow-500" />,
  reminder: <AlertCircle className="w-4 h-4 text-orange-500" />,
  announcement: <Info className="w-4 h-4 text-blue-500" />,
  update: <BookOpen className="w-4 h-4 text-green-500" />,
  reading: <BookOpen className="w-4 h-4 text-primary" />,
  activity: <Calendar className="w-4 h-4 text-blue-500" />,
  prayer: <MessageCircle className="w-4 h-4 text-purple-500" />,
  info: <Info className="w-4 h-4 text-muted-foreground" />,
};

export const NotificationBell = () => {
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Initialize broadcast notifications listener
  useBroadcastNotifications();

  const unreadCount = notifications.filter(n => !n.is_read).length;

  useEffect(() => {
    if (user) {
      loadNotifications();
      
      // Subscribe to realtime notifications from broadcast system
      const channel = supabase
        .channel(`user_notifications:${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'user_notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const newNotification = payload.new as UserNotification;
            setNotifications(prev => [newNotification, ...prev]);
            
            // Show browser notification if enabled
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification(newNotification.title, {
                body: newNotification.body,
                icon: newNotification.icon || '/logo.png',
              });
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'user_notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const updatedNotification = payload.new as UserNotification;
            setNotifications(prev =>
              prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
            );
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const loadNotifications = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      if (data) {
        setNotifications(data as UserNotification[]);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase.rpc('mark_notification_read', {
        p_notification_id: id
      });
      
      if (error) throw error;
      
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true, viewed_at: new Date().toISOString() } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    
    try {
      const unreadIds = notifications
        .filter(n => !n.is_read)
        .map(n => n.id);
      
      for (const id of unreadIds) {
        await markAsRead(id);
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const { error } = await supabase
        .from('user_notifications')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleNotificationClick = (notification: UserNotification) => {
    markAsRead(notification.id);
    
    // Handle action link from data
    if (notification.data?.action_url) {
      navigate(notification.data.action_url);
      setIsOpen(false);
    }
  };

  if (!user) return null;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              variant="destructive"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-primary/5 to-transparent">
          <h3 className="font-semibold text-base">Notifications</h3>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs h-7"
              onClick={markAllAsRead}
            >
              <Check className="w-3 h-3 mr-1" />
              Tout lire
            </Button>
          )}
        </div>
        
        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="p-6 text-center text-muted-foreground text-sm">
              <div className="animate-spin">
                <Bell className="w-6 h-6 mx-auto opacity-50" />
              </div>
              <p className="mt-2">Chargement...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground text-sm">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Aucune notification</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-muted/60 cursor-pointer transition-all border-l-4 group ${
                    !notification.is_read 
                      ? 'bg-primary/8 border-l-primary' 
                      : 'border-l-transparent hover:border-l-muted'
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {typeIcons[notification.type] || typeIcons.info}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-semibold ${
                          !notification.is_read ? 'text-foreground' : 'text-muted-foreground'
                        }`}>
                          {notification.title}
                        </p>
                        {!notification.is_read && (
                          <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-1.5"></div>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {notification.body}
                      </p>
                      <p className="text-xs text-muted-foreground/70 mt-2">
                        {formatDistanceToNow(new Date(notification.created_at), {
                          addSuffix: true,
                          locale: fr,
                        })}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
