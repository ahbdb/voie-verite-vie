import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Send, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface BroadcastNotification {
  id: string;
  title: string;
  body: string;
  type: string;
  target_role: string;
  is_sent: boolean;
  sent_at: string | null;
  created_at: string;
}

export const AdminNotifications = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [notifications, setNotifications] = useState<BroadcastNotification[]>([]);

  // Form state
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [nType, setNType] = useState('announcement');
  const [targetRole, setTargetRole] = useState('all');
  const [scheduleTime, setScheduleTime] = useState('');

  // Charger les notifications au montage
  useEffect(() => {
    loadNotifications();
  }, []);

  const notificationTypes = [
    { value: 'greeting', label: '👋 Salutation (Bonjour)' },
    { value: 'reminder', label: '🔔 Rappel' },
    { value: 'announcement', label: '📢 Annonce' },
    { value: 'update', label: '✨ Mise à jour' },
  ];

  const targetRoles = [
    { value: 'all', label: 'Tous les utilisateurs' },
    { value: 'user', label: 'Utilisateurs normaux' },
    { value: 'admin', label: 'Administrateurs' },
  ];

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !body.trim()) {
      toast.error('Veuillez remplir le titre et le message');
      return;
    }

    setIsSending(true);

    try {
      // Create broadcast notification
      const { data: broadcastData, error: broadcastError } = await (supabase as any)
        .from('broadcast_notifications')
        .insert({
          title,
          body,
          type: nType,
          target_role: targetRole === 'all' ? null : targetRole,
          created_by: user?.id,
          scheduled_at: scheduleTime ? new Date(scheduleTime).toISOString() : null,
        })
        .select()
        .single();

      if (broadcastError) throw broadcastError;

      // Send the broadcast notification to all users
      const { error: sendError } = await (supabase as any).rpc(
        'send_broadcast_notification',
        {
          p_broadcast_id: broadcastData.id,
        }
      );

      if (sendError) throw sendError;

      toast.success(`✓ Notification envoyée à ${targetRole === 'all' ? 'tous les utilisateurs' : `les ${targetRole}s`}!`);
      
      // Reset form
      setTitle('');
      setBody('');
      setNType('announcement');
      setTargetRole('all');
      setScheduleTime('');

      // Reload notifications list
      loadNotifications();
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error('Erreur lors de l\'envoi de la notification');
    } finally {
      setIsSending(false);
    }
  };

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await (supabase as any)
        .from('broadcast_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
      toast.error('Erreur lors du chargement des notifications');
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour envoyer une notification immédiatement
  const sendNotificationNow = async (notifId: string) => {
    try {
      const { error } = await (supabase as any).rpc('send_broadcast_notification', {
        p_broadcast_id: notifId,
      });

      if (error) throw error;

      toast.success('Notification envoyée maintenant!');
      loadNotifications();
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error('Erreur lors de l\'envoi');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">📬 Gestion des Notifications</h1>
        <p className="text-muted-foreground mt-2">
          Envoyez des notifications persévérantes à tous les utilisateurs
        </p>
      </div>

      <Tabs defaultValue="send" className="space-y-4">
        <TabsList>
          <TabsTrigger value="send">Envoyer une notification</TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
        </TabsList>

        <TabsContent value="send" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Nouvelle notification</CardTitle>
              <CardDescription>
                Créez et envoyez une notification à tous les utilisateurs. Les notifications resteront visibles jusqu'à ce qu'elles soient lues.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSendNotification} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Type de notification</label>
                    <Select value={nType} onValueChange={setNType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {notificationTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Destinataires</label>
                    <Select value={targetRole} onValueChange={setTargetRole}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {targetRoles.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Titre</label>
                  <Input
                    placeholder="ex: Bonjour à tous!"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Message</label>
                  <Textarea
                    placeholder="Entrez votre message. Il restera visible jusqu'à ce que l'utilisateur le voie."
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={4}
                  />
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Les notifications s'afficheront dans la cloche des utilisateurs. Elles resteront visibles jusqu'à ce qu'elles soient marquées comme lues.
                  </AlertDescription>
                </Alert>

                <Button
                  type="submit"
                  disabled={isSending}
                  className="w-full"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Envoyer la notification
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historique des notifications</CardTitle>
              <CardDescription>
                Consultez les notifications déjà envoyées
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : notifications.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Aucune notification envoyée
                </p>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className="border rounded-lg p-4 bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{notif.title}</h3>
                            {notif.is_sent ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : null}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {notif.body}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span>Type: {notif.type}</span>
                            <span>
                              Destinataires: {notif.target_role === null ? 'Tous' : notif.target_role}
                            </span>
                            {notif.sent_at && (
                              <span>
                                Envoyée: {new Date(notif.sent_at).toLocaleString('fr-FR')}
                              </span>
                            )}
                          </div>
                        </div>
                        {!notif.is_sent && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => sendNotificationNow(notif.id)}
                          >
                            Envoyer
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminNotifications;
