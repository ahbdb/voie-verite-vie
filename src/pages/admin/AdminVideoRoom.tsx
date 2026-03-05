import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import { useAdmin } from '@/hooks/useAdmin';
import { useAuth } from '@/hooks/useAuth';
import {
  useAdminVideoRoom,
  type VideoMessageReactionRecord,
} from '@/hooks/useAdminVideoRoom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Link2,
  Mic,
  MicOff,
  MonitorUp,
  PhoneOff,
  Radio,
  Video,
  VideoOff,
} from 'lucide-react';

const QUICK_REACTIONS = ['👍', '❤️', '🙏', '😂'];

const VideoPanel = ({
  stream,
  title,
  subtitle,
  muted = false,
}: {
  stream: MediaStream | null;
  title: string;
  subtitle: string;
  muted?: boolean;
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hasVideo = Boolean(stream?.getVideoTracks().some((track) => track.readyState === 'live'));
  const hasAudio = Boolean(stream?.getAudioTracks().some((track) => track.readyState === 'live'));

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <Card className="overflow-hidden border-border/70 bg-card">
      <CardContent className="p-0">
        <div className="aspect-video bg-muted">
          {stream && hasVideo ? (
            <video ref={videoRef} autoPlay playsInline muted={muted} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-sm text-muted-foreground">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                {hasAudio ? <Mic className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
              </div>
              <div>
                <p className="font-medium text-foreground">{hasAudio ? 'Participant audio' : 'Flux vidéo indisponible'}</p>
                <p className="text-xs text-muted-foreground">{subtitle}</p>
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-border bg-card px-4 py-3">
          <div>
            <p className="font-medium text-foreground">{title}</p>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
            {hasAudio ? <Mic className="h-4 w-4" /> : <Video className="h-4 w-4" />}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const formatTime = (value: string) =>
  new Date(value).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });

const AdminVideoRoom = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { roomId } = useParams();
  const { user } = useAuth();
  const { adminRole } = useAdmin();
  const hasManagementAccess = adminRole === 'admin' || adminRole === 'admin_principal';
  const displayName = user?.user_metadata?.full_name || user?.email || 'Participant';
  const [draftMessage, setDraftMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const {
    room,
    roomType,
    participants,
    remoteStreams,
    messages,
    reactions,
    localStream,
    loading,
    mediaError,
    micEnabled,
    cameraEnabled,
    isScreenSharing,
    canShareScreen,
    toggleMicrophone,
    toggleCamera,
    startScreenShare,
    stopScreenShare,
    sendMessage,
    toggleReaction,
    leaveRoom,
    endRoom,
  } = useAdminVideoRoom({
    roomId,
    userId: user?.id,
    displayName,
    enabled: Boolean(roomId && user?.id),
    canManageRoom: hasManagementAccess,
  });

  const reactionsByMessage = useMemo(() => {
    return reactions.reduce<Record<string, Record<string, VideoMessageReactionRecord[]>>>((accumulator, reaction) => {
      accumulator[reaction.message_id] ||= {};
      accumulator[reaction.message_id][reaction.emoji] ||= [];
      accumulator[reaction.message_id][reaction.emoji].push(reaction);
      return accumulator;
    }, {});
  }, [reactions]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleCopyLink = async () => {
    try {
      const shareUrl = `${window.location.origin}/meeting/${roomId}`;
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Lien public de la réunion copié.');
    } catch (error) {
      console.error('[video-room] Failed to copy link', error);
      toast.error('Copie du lien impossible.');
    }
  };

  const handleLeave = async () => {
    await leaveRoom();
    navigate(hasManagementAccess ? '/admin/video' : '/');
  };

  const handleEndRoom = async () => {
    await endRoom();
    toast.success('Réunion terminée.');
    navigate('/admin/video');
  };

  const handleSubmitMessage = async (event: FormEvent) => {
    event.preventDefault();

    try {
      await sendMessage(draftMessage);
      setDraftMessage('');
    } catch (error) {
      console.error('[video-room] Failed to send message', error);
      toast.error('Message non envoyé.');
    }
  };

  const handleToggleScreenShare = async () => {
    try {
      if (isScreenSharing) {
        await stopScreenShare();
        toast.success('Partage d’écran arrêté.');
      } else {
        await startScreenShare();
        toast.success('Partage d’écran activé.');
      }
    } catch (error) {
      console.error('[video-room] Failed to toggle screen share', error);
      toast.error("Impossible d'activer le partage d’écran.");
    }
  };

  const headerBackTarget = location.pathname.startsWith('/admin') ? '/admin/video' : '/';
  const meetingLabel = roomType === 'audio' ? 'Réunion audio' : 'Réunion vidéo';

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navigation />
        <main className="container mx-auto flex flex-1 items-center justify-center px-4 py-24">
          <Card className="max-w-xl border-border/70">
            <CardHeader>
              <CardTitle>Connexion requise</CardTitle>
              <CardDescription>
                Connecte-toi pour rejoindre cette réunion et participer au chat temps réel.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link to="/auth">Se connecter</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (!loading && !room) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navigation />
        <main className="container mx-auto flex flex-1 items-center justify-center px-4 py-24">
          <Card className="max-w-xl border-border/70">
            <CardHeader>
              <CardTitle>Réunion indisponible</CardTitle>
              <CardDescription>
                Cette salle n’existe plus, n’est plus accessible, ou a déjà été terminée.
              </CardDescription>
            </CardHeader>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />

      <main className="container mx-auto flex-1 space-y-6 px-4 py-8 pt-24">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <Button variant="ghost" onClick={() => navigate(headerBackTarget)} className="mb-3 px-0 hover:bg-transparent">
              <ArrowLeft className="mr-2 h-4 w-4" /> Retour
            </Button>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold text-foreground">{room?.title || 'Réunion'}</h1>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                {meetingLabel}
              </span>
              {room?.status === 'live' && (
                <span className="rounded-full bg-secondary/15 px-3 py-1 text-xs font-medium text-secondary">
                  En direct
                </span>
              )}
            </div>
            <p className="mt-2 max-w-3xl text-muted-foreground">
              {room?.description || 'Salle temps réel avec audio, vidéo, partage d’écran et chat persistant.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={handleCopyLink}>
              <Link2 className="h-4 w-4" /> Copier le lien
            </Button>
            <Button variant="outline" onClick={toggleMicrophone}>
              {micEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
              {micEnabled ? 'Micro activé' : 'Micro coupé'}
            </Button>
            {roomType !== 'audio' && (
              <Button variant="outline" onClick={toggleCamera}>
                {cameraEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                {cameraEnabled ? 'Caméra active' : 'Caméra coupée'}
              </Button>
            )}
            {canShareScreen && (
              <Button variant="outline" onClick={() => void handleToggleScreenShare()}>
                <MonitorUp className="h-4 w-4" />
                {isScreenSharing ? 'Arrêter le partage' : 'Partager l’écran'}
              </Button>
            )}
            <Button variant="outline" onClick={() => void handleLeave()}>
              <PhoneOff className="h-4 w-4" /> Quitter
            </Button>
            {hasManagementAccess && (
              <Button onClick={() => void handleEndRoom()}>
                <Radio className="h-4 w-4" /> Terminer
              </Button>
            )}
          </div>
        </div>

        {mediaError && (
          <Alert>
            <Radio className="h-4 w-4" />
            <AlertTitle>Connexion média partielle</AlertTitle>
            <AlertDescription>{mediaError}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
          <section className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <VideoPanel
                stream={localStream}
                title="Vous"
                subtitle={
                  isScreenSharing
                    ? 'Partage d’écran en cours'
                    : roomType === 'audio'
                      ? micEnabled
                        ? 'Audio actif'
                        : 'Micro coupé'
                      : cameraEnabled
                        ? 'Caméra active'
                        : 'Caméra coupée'
                }
                muted
              />
              {remoteStreams.length > 0 ? (
                remoteStreams.map((remoteStream) => (
                  <VideoPanel
                    key={remoteStream.userId}
                    stream={remoteStream.stream}
                    title={remoteStream.displayName}
                    subtitle="Participant distant"
                  />
                ))
              ) : (
                <Card className="border-dashed border-border/70">
                  <CardContent className="flex aspect-video items-center justify-center p-6 text-center text-muted-foreground">
                    En attente d’autres participants dans la réunion.
                  </CardContent>
                </Card>
              )}
            </div>
          </section>

          <aside className="space-y-4">
            <Card className="border-border/70">
              <CardHeader>
                <CardTitle>État de la salle</CardTitle>
                <CardDescription>Présence, appel en direct et accès partageable.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary">
                  <Radio className="h-4 w-4" />
                  {room?.status === 'ended' ? 'Réunion terminée' : room?.status === 'live' ? 'Appel en direct' : 'Salle prête'}
                </div>
                <div className="rounded-lg border border-border bg-card p-4">
                  <p className="text-sm text-muted-foreground">Participants connectés</p>
                  <p className="mt-1 text-3xl font-bold text-foreground">{participants.length}</p>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="participants" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="participants">Présence</TabsTrigger>
                <TabsTrigger value="chat">Chat</TabsTrigger>
              </TabsList>

              <TabsContent value="participants">
                <Card className="border-border/70">
                  <CardHeader>
                    <CardTitle>Participants</CardTitle>
                    <CardDescription>Présence temps réel dans cette réunion.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {participants.map((participant) => (
                      <div
                        key={participant.user_id}
                        className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-3"
                      >
                        <div>
                          <p className="font-medium text-foreground">{participant.display_name || 'Participant'}</p>
                          <p className="text-xs text-muted-foreground">
                            {participant.user_id === user.id ? 'Vous' : `Connecté depuis ${formatTime(participant.joined_at)}`}
                          </p>
                        </div>
                        <span className="rounded-full bg-secondary/15 px-3 py-1 text-xs font-medium text-secondary">
                          En ligne
                        </span>
                      </div>
                    ))}

                    {!loading && participants.length === 0 && (
                      <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                        Aucun participant actif pour le moment.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="chat">
                <Card className="border-border/70">
                  <CardHeader>
                    <CardTitle>Chat de salle</CardTitle>
                    <CardDescription>Commentaires persistants, likes et emojis en direct.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ScrollArea className="h-[360px] rounded-lg border border-border bg-muted/30 p-3">
                      <div className="space-y-3 pr-3">
                        {messages.length === 0 ? (
                          <div className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
                            Aucun message pour l’instant. Lance la conversation ci-dessous.
                          </div>
                        ) : (
                          messages.map((message) => {
                            const groupedReactions = reactionsByMessage[message.id] || {};

                            return (
                              <div key={message.id} className="rounded-xl border border-border bg-card p-3 shadow-sm">
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="font-medium text-foreground">{message.display_name || 'Participant'}</p>
                                    <p className="text-xs text-muted-foreground">{formatTime(message.created_at)}</p>
                                  </div>
                                  {message.user_id === user.id && (
                                    <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-medium text-primary">
                                      Vous
                                    </span>
                                  )}
                                </div>
                                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                                  {message.content}
                                </p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {QUICK_REACTIONS.map((emoji) => {
                                    const count = groupedReactions[emoji]?.length || 0;
                                    const active = groupedReactions[emoji]?.some((reaction) => reaction.user_id === user.id);

                                    return (
                                      <Button
                                        key={`${message.id}-${emoji}`}
                                        type="button"
                                        variant={active ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => void toggleReaction(message.id, emoji)}
                                      >
                                        <span>{emoji}</span>
                                        <span>{count}</span>
                                      </Button>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })
                        )}
                        <div ref={messagesEndRef} />
                      </div>
                    </ScrollArea>

                    <form onSubmit={handleSubmitMessage} className="space-y-3">
                      <Textarea
                        value={draftMessage}
                        onChange={(event) => setDraftMessage(event.target.value)}
                        placeholder="Écris un commentaire pour la réunion..."
                        rows={3}
                      />
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap gap-2">
                          {QUICK_REACTIONS.map((emoji) => (
                            <Button
                              key={`draft-${emoji}`}
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setDraftMessage((current) => `${current}${emoji}`)}
                            >
                              {emoji}
                            </Button>
                          ))}
                        </div>
                        <Button type="submit" disabled={!draftMessage.trim()}>
                          Envoyer
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default AdminVideoRoom;
