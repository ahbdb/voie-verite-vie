import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import AdminPageWrapper from '@/components/admin/AdminPageWrapper';
import { useAdmin } from '@/hooks/useAdmin';
import { broadcastNotificationService } from '@/hooks/useBroadcastNotifications';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Radio, Video, Mic } from 'lucide-react';
import type { VideoParticipantRecord, VideoRoomRecord } from '@/hooks/useAdminVideoRoom';

const db = supabase as any;

const AdminVideo = () => {
  const navigate = useNavigate();
  const { user, adminRole } = useAdmin();
  const hasVideoAccess = adminRole === 'admin' || adminRole === 'admin_principal';
  const [rooms, setRooms] = useState<VideoRoomRecord[]>([]);
  const [participants, setParticipants] = useState<VideoParticipantRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    roomType: 'video' as 'video' | 'audio',
  });

  const activeParticipantsByRoom = useMemo(() => {
    return participants.reduce<Record<string, number>>((accumulator, participant) => {
      if (participant.is_active && !participant.left_at) {
        accumulator[participant.room_id] = (accumulator[participant.room_id] || 0) + 1;
      }
      return accumulator;
    }, {});
  }, [participants]);

  const loadRooms = async () => {
    try {
      const [{ data: roomsData, error: roomsError }, { data: participantsData, error: participantsError }] =
        await Promise.all([
          db.from('video_rooms').select('*').order('created_at', { ascending: false }),
          db.from('video_room_participants').select('*'),
        ]);

      if (roomsError) throw roomsError;
      if (participantsError) throw participantsError;

      setRooms((roomsData || []) as VideoRoomRecord[]);
      setParticipants((participantsData || []) as VideoParticipantRecord[]);
    } catch (error) {
      console.error('[admin-video] Failed to load rooms', error);
      toast.error('Impossible de charger les salles vidéo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!hasVideoAccess) {
      setLoading(false);
      return;
    }

    void loadRooms();

    const channel = db
      .channel('admin-video-lobby')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'video_rooms' }, () => {
        void loadRooms();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'video_room_participants' }, () => {
        void loadRooms();
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [hasVideoAccess]);

  const handleCreateRoom = async (event: FormEvent) => {
    event.preventDefault();

    if (!user?.id || !formData.title.trim()) {
      toast.error('Ajoute au moins un titre pour créer la salle.');
      return;
    }

    setCreating(true);

    try {
      const { data, error } = await db
        .from('video_rooms')
        .insert({
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          created_by: user.id,
          status: 'waiting',
          room_type: formData.roomType,
          updated_at: new Date().toISOString(),
        })
        .select('*')
        .single();

      if (error) throw error;

      const meetingPath = `/meeting/${data.id}`;

      try {
        await broadcastNotificationService.sendToAll(
          `📞 ${formData.title.trim()}`,
          `${displayName(user)} a lancé une réunion ${formData.roomType === 'audio' ? 'audio' : 'vidéo'}. Rejoins-la maintenant.`,
          'call',
          undefined,
          meetingPath
        );
      } catch (notificationError) {
        console.error('[admin-video] Failed to broadcast call notification', notificationError);
      }

      toast.success('Salle créée, appel envoyé.');
      setFormData({ title: '', description: '', roomType: 'video' });
      navigate(meetingPath);
    } catch (error) {
      console.error('[admin-video] Failed to create room', error);
      toast.error('La création de la salle a échoué.');
    } finally {
      setCreating(false);
    }
  };

  const handleCloseRoom = async (roomId: string) => {
    try {
      const { error } = await db
        .from('video_rooms')
        .update({ status: 'ended', ended_at: new Date().toISOString() })
        .eq('id', roomId);

      if (error) throw error;
      toast.success('Salle terminée.');
    } catch (error) {
      console.error('[admin-video] Failed to end room', error);
      toast.error("Impossible de terminer cette salle.");
    }
  };

  if (!hasVideoAccess) {
    return (
      <AdminPageWrapper>
        <div className="min-h-screen flex flex-col bg-background">
          <Navigation />
          <main className="flex-1 container mx-auto px-4 py-8 pt-24">
            <Card className="max-w-xl border-border/70">
              <CardHeader>
                <CardTitle>Accès restreint</CardTitle>
                <CardDescription>
                  Cette fonctionnalité vidéo est réservée aux comptes admin et admin principal.
                </CardDescription>
              </CardHeader>
            </Card>
          </main>
        </div>
      </AdminPageWrapper>
    );
  }

  return (
    <AdminPageWrapper>
      <div className="min-h-screen flex flex-col bg-background">
        <Navigation />

        <main className="flex-1 container mx-auto px-4 py-8 pt-24 space-y-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <Button variant="ghost" onClick={() => navigate('/admin')} className="mb-3 px-0 hover:bg-transparent">
                <ArrowLeft className="h-4 w-4 mr-2" /> Retour à l'administration
              </Button>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Video className="h-5 w-5" />
                </span>
                Salles maison ouvertes aux participants
              </h1>
              <p className="mt-2 max-w-2xl text-muted-foreground">
                Crée une réunion audio ou vidéo, déclenche l’appel, puis partage le lien public de participation.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
              Création réservée aux administrateurs connectés.
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <Card className="border-border/70">
              <CardHeader>
                <CardTitle>Créer une salle</CardTitle>
                <CardDescription>
                  Lance une conférence avec appel entrant, chat persistant et présence temps réel.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateRoom} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Titre</label>
                    <Input
                      value={formData.title}
                      onChange={(event) => setFormData((current) => ({ ...current, title: event.target.value }))}
                      placeholder="Réunion de coordination 3V"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Type de réunion</label>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        type="button"
                        variant={formData.roomType === 'video' ? 'default' : 'outline'}
                        onClick={() => setFormData((current) => ({ ...current, roomType: 'video' }))}
                      >
                        <Video className="h-4 w-4" /> Vidéo
                      </Button>
                      <Button
                        type="button"
                        variant={formData.roomType === 'audio' ? 'default' : 'outline'}
                        onClick={() => setFormData((current) => ({ ...current, roomType: 'audio' }))}
                      >
                        <Mic className="h-4 w-4" /> Audio
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Description</label>
                    <Textarea
                      value={formData.description}
                      onChange={(event) =>
                        setFormData((current) => ({ ...current, description: event.target.value }))
                      }
                      placeholder="Objectif, ordre du jour, consignes rapides..."
                    />
                  </div>
                  <Button type="submit" disabled={creating} className="w-full sm:w-auto">
                    <Plus className="h-4 w-4" />
                    {creating ? 'Création...' : 'Créer et appeler'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="border-border/70 bg-gradient-to-br from-card via-card to-muted/40">
              <CardHeader>
                <CardTitle>Ce module inclut</CardTitle>
                <CardDescription>Base 100% maison, gratuite et évolutive.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div className="rounded-lg border border-border bg-background/70 p-3">Réunions audio et vidéo</div>
                <div className="rounded-lg border border-border bg-background/70 p-3">Partage d’écran et salle ouverte aux participants</div>
                <div className="rounded-lg border border-border bg-background/70 p-3">Chat persistant, likes, emojis et présence temps réel</div>
                <Alert>
                  <Radio className="h-4 w-4" />
                  <AlertTitle>Important</AlertTitle>
                  <AlertDescription>
                    Les utilisateurs reçoivent maintenant un appel entrant via le système de notifications de l’application.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>

          <section className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-2xl font-semibold text-foreground">Salles existantes</h2>
              <Button variant="outline" onClick={() => void loadRooms()} disabled={loading}>
                Actualiser
              </Button>
            </div>

            {rooms.length === 0 && !loading ? (
              <Card>
                <CardContent className="pt-6 text-muted-foreground">
                  Aucune salle pour le moment. Crée la première réunion ci-dessus.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {rooms.map((room) => {
                  const activeCount = activeParticipantsByRoom[room.id] || 0;
                  const statusLabel = room.status === 'ended' ? 'Terminée' : room.status === 'live' ? 'En direct' : 'En attente';
                  const statusClassName =
                    room.status === 'ended'
                      ? 'bg-destructive/10 text-destructive'
                      : room.status === 'live'
                        ? 'bg-secondary/15 text-secondary'
                        : 'bg-primary/10 text-primary';

                  return (
                    <Card key={room.id} className="border-border/70">
                      <CardHeader className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <CardTitle className="text-xl">{room.title}</CardTitle>
                            <CardDescription className="mt-1">
                              {room.description || 'Aucune description fournie.'}
                            </CardDescription>
                          </div>
                          <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusClassName}`}>
                            {statusLabel}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-2">
                            <Radio className="h-4 w-4 text-primary" /> {activeCount} participant(s)
                          </span>
                          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                            {room.room_type === 'audio' ? 'Audio' : 'Vidéo'}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          <Button asChild>
                            <Link to={`/meeting/${room.id}`}>Ouvrir la salle</Link>
                          </Button>
                          {room.status !== 'ended' && (
                            <Button variant="outline" onClick={() => void handleCloseRoom(room.id)}>
                              Terminer
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </section>
        </main>
      </div>
    </AdminPageWrapper>
  );
};

const displayName = (user: { email?: string | null; user_metadata?: { full_name?: string } }) =>
  user.user_metadata?.full_name || user.email || 'Un administrateur';

export default AdminVideo;

