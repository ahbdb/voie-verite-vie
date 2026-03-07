import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import HeroSection from '@/components/HeroSection';
import MissionSection from '@/components/MissionSection';
import ProgramSection from '@/components/ProgramSection';
import PostSignupCommunityModal from '@/components/PostSignupCommunityModal';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Phone, Video, Mic } from 'lucide-react';

const db = supabase as any;

interface ActiveRoom {
  id: string;
  title: string;
  room_type: string;
  status: string;
}

const ActiveCallBanner = () => {
  const { user } = useAuth();
  const [activeRooms, setActiveRooms] = useState<ActiveRoom[]>([]);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      const { data } = await db
        .from('video_rooms')
        .select('id, title, room_type, status')
        .in('status', ['waiting', 'live'])
        .order('created_at', { ascending: false })
        .limit(3);
      setActiveRooms((data || []) as ActiveRoom[]);
    };

    void load();

    const channel = db
      .channel('home-active-calls')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'video_rooms' }, () => void load())
      .subscribe();

    return () => { channel.unsubscribe(); };
  }, [user]);

  if (!user || activeRooms.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md animate-in slide-in-from-bottom-4">
      <div className="rounded-2xl border border-primary/30 bg-card shadow-2xl shadow-primary/10 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className="flex h-3 w-3 relative">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-primary" />
          </span>
          <span className="text-sm font-semibold text-foreground">Appel en cours</span>
        </div>
        {activeRooms.map((room) => (
          <div key={room.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/40 px-3 py-2">
            <div className="flex items-center gap-2">
              {room.room_type === 'audio' ? <Mic className="h-4 w-4 text-primary" /> : <Video className="h-4 w-4 text-primary" />}
              <span className="text-sm font-medium text-foreground truncate max-w-[180px]">{room.title}</span>
            </div>
            <Button size="sm" asChild className="shrink-0">
              <Link to={`/meeting/${room.id}`}>
                <Phone className="h-3.5 w-3.5 mr-1" /> Rejoindre
              </Link>
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

const Index = () => {
  const [postSignupOpen, setPostSignupOpen] = useState(false);
  const [postSignupName, setPostSignupName] = useState<string | null>(null);

  useEffect(() => {
    try {
      const shouldOpen = localStorage.getItem('post_signup_community_v1') === '1';
      const name = localStorage.getItem('post_signup_name_v1');
      if (shouldOpen) {
        setPostSignupName(name);
        setPostSignupOpen(true);
      }
    } catch {}
  }, []);

  const handlePostSignupOpenChange = (open: boolean) => {
    setPostSignupOpen(open);
    if (!open) {
      try {
        localStorage.removeItem('post_signup_community_v1');
        localStorage.removeItem('post_signup_name_v1');
      } catch {}
    }
  };

  return (
    <div className="min-h-screen">
      <Navigation />
      <main>
        <HeroSection />
        <MissionSection />
        <ProgramSection />
      </main>

      <ActiveCallBanner />

      <PostSignupCommunityModal
        open={postSignupOpen}
        onOpenChange={handlePostSignupOpenChange}
        fullName={postSignupName}
      />
    </div>
  );
};

export default Index;
