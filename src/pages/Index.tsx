import { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import HeroSection from '@/components/HeroSection';
import MissionSection from '@/components/MissionSection';
import ProgramSection from '@/components/ProgramSection';
import PostSignupCommunityModal from '@/components/PostSignupCommunityModal';

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
    } catch {
      // ignore
    }
  }, []);

  const handlePostSignupOpenChange = (open: boolean) => {
    setPostSignupOpen(open);
    if (!open) {
      try {
        localStorage.removeItem('post_signup_community_v1');
        localStorage.removeItem('post_signup_name_v1');
      } catch {
        // ignore
      }
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

      <PostSignupCommunityModal
        open={postSignupOpen}
        onOpenChange={handlePostSignupOpenChange}
        fullName={postSignupName}
      />
    </div>
  );
};

export default Index;
