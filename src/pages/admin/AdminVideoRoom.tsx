import { useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import AdminPageWrapper from '@/components/admin/AdminPageWrapper';
import { useAdmin } from '@/hooks/useAdmin';
import { useAdminVideoRoom } from '@/hooks/useAdminVideoRoom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Link2,
  Mic,
  MicOff,
  PhoneOff,
  Radio,
  Video,
  VideoOff,
} from 'lucide-react';

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

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <Card className="overflow-hidden border-border/70">
      <CardContent className="p-0">
        <div className="aspect-video bg-muted">
          {stream ? (
            <video ref={videoRef} autoPlay playsInline muted={muted} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Flux vidéo indisponible
            </div>
          )}
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-border bg-card px-4 py-3">
          <div>
            <p className="font-medium text-foreground">{title}</p>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Video className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const AdminVideoRoom = () => {
  const navigate = useNavigate();
  const { roomId } = useParams();
  const { user, adminRole } = useAdmin();
  const hasVideoAccess = adminRole === 'admin' || adminRole === 'admin_principal';
  const displayName = user?.user_metadata?.full_name || user?.email || 'Administrateur';
  const {
    room,
    participants,
    remoteStreams,
    localStream,
    loading,
    mediaError,
    micEnabled,
    cameraEnabled,
    toggleMicrophone,
    toggleCamera,
    leaveRoom,
    endRoom,
  } = useAdminVideoRoom({
    roomId,
    userId: user?.id,
    displayName,
    enabled: Boolean(roomId && user?.id && hasVideoAccess),
  });

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Lien de la salle copié.');
    } catch (error) {
      console.error('[admin-video-room] Failed to copy link', error);
      toast.error('Copie du lien impossible.');
    }
  };

  const handleLeave = async () => {
    await leaveRoom();
    navigate('/admin/video');
  };

  const handleEndRoom = async () => {
    await endRoom();
    toast.success('Salle terminée.');
    navigate('/admin/video');
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
                  Cette salle vidéo est réservée aux comptes admin et admin principal.
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

        <main className="flex-1 container mx-auto px-4 py-8 pt-24 space-y-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <Button variant="ghost" onClick={() => navigate('/admin/video')} className="mb-3 px-0 hover:bg-transparent">
                <ArrowLeft className="h-4 w-4 mr-2" /> Retour aux salles
              </Button>
              <h1 className="text-3xl font-bold text-foreground">{room?.title || 'Salle vidéo admin'}</h1>
              <p className="mt-2 max-w-3xl text-muted-foreground">
                {room?.description || 'Réunion vidéo privée entre administrateurs.'}
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
              <Button variant="outline" onClick={toggleCamera}>
                {cameraEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                {cameraEnabled ? 'Caméra active' : 'Caméra coupée'}
              </Button>
              <Button variant="outline" onClick={() => void handleLeave()}>
                <PhoneOff className="h-4 w-4" /> Quitter
              </Button>
              <Button onClick={() => void handleEndRoom()}>
                <Radio className="h-4 w-4" /> Terminer la salle
              </Button>
            </div>
          </div>

          {mediaError && (
            <Alert variant="destructive">
              <Radio className="h-4 w-4" />
              <AlertTitle>Caméra / micro indisponibles</AlertTitle>
              <AlertDescription>{mediaError}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
            <section className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-2">
                <VideoPanel
                  stream={localStream}
                  title="Vous"
                  subtitle={cameraEnabled ? 'Caméra active' : 'Caméra coupée'}
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
                      En attente d'un autre administrateur dans la salle.
                    </CardContent>
                  </Card>
                )}
              </div>
            </section>

            <aside className="space-y-4">
              <Card className="border-border/70">
                <CardHeader>
                  <CardTitle>État de la salle</CardTitle>
                  <CardDescription>Présence temps réel des admins connectés.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary">
                    <Radio className="h-4 w-4" /> {room?.status === 'ended' ? 'Salle terminée' : 'Session active'}
                  </div>
                  <div className="rounded-lg border border-border bg-card p-4">
                    <p className="text-sm text-muted-foreground">Participants connectés</p>
                    <p className="mt-1 text-3xl font-bold text-foreground">{participants.length}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/70">
                <CardHeader>
                  <CardTitle>Participants</CardTitle>
                  <CardDescription>Admins actuellement présents dans la réunion.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {participants.map((participant) => (
                    <div
                      key={participant.user_id}
                      className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-3"
                    >
                      <div>
                        <p className="font-medium text-foreground">{participant.display_name || 'Administrateur'}</p>
                        <p className="text-xs text-muted-foreground">{participant.user_id === user?.id ? 'Vous' : 'Connecté'}</p>
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
            </aside>
          </div>
        </main>
      </div>
    </AdminPageWrapper>
  );
};

export default AdminVideoRoom;
