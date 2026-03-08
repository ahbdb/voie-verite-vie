import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { User, BookOpen, Heart, Activity, Mail, LogOut, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

interface UserProfile { id: string; email: string; full_name: string | null; created_at: string; }

const Profile = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ prayersCount: 0, favoritesCount: 0, readingDays: 0 });

  useEffect(() => {
    if (!authLoading) {
      if (!user) { navigate('/'); return; }
      loadUserData();
    }
  }, [user, authLoading, navigate]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user?.id).single();
      if (profileData) setProfile(profileData);
      const { count: prayersCount } = await supabase.from('prayer_requests').select('*', { count: 'exact', head: true }).eq('user_id', user?.id);
      setStats(s => ({ ...s, prayersCount: prayersCount || 0 }));
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally { setLoading(false); }
  };

  const handleLogout = async () => { await supabase.auth.signOut(); navigate('/'); };

  const formatDate = (date: string) => {
    const locale = i18n.language === 'it' ? 'it-IT' : i18n.language === 'en' ? 'en-US' : 'fr-FR';
    return new Date(date).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' });
  };

  if (authLoading || loading) {
    return (<div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-spin rounded-full h-10 w-10 border-2 border-cathedral-gold border-t-transparent"></div></div>);
  }
  if (!user || !profile) return null;

  const statItems = [
    { icon: Activity, value: stats.prayersCount, label: t('profile.prayerRequests'), color: 'text-cathedral-gold' },
    { icon: Heart, value: stats.favoritesCount, label: t('profile.savedPrayers'), color: 'text-stained-ruby' },
    { icon: BookOpen, value: stats.readingDays, label: t('profile.readingDays'), color: 'text-stained-blue' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4 max-w-2xl">
          {/* Header */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-cinzel font-bold text-foreground">{t('profile.title')}</h1>
              <p className="text-sm text-muted-foreground font-inter">{t('profile.subtitle')}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2 border-destructive/30 text-destructive hover:bg-destructive/10">
              <LogOut className="h-4 w-4" />{t('common.logout')}
            </Button>
          </motion.div>

          {/* Profile info - flat */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ delay: 0.1 }} className="mb-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-cathedral-gold/10 border border-cathedral-gold/30 flex items-center justify-center">
                <User className="w-8 h-8 text-cathedral-gold" />
              </div>
              <div>
                <h2 className="text-xl font-cinzel font-semibold text-foreground">{profile.full_name || t('profile.notProvided')}</h2>
                <p className="text-sm text-muted-foreground font-inter flex items-center gap-1"><Mail className="w-3 h-3" />{profile.email}</p>
                <p className="text-xs text-muted-foreground/60 font-inter flex items-center gap-1"><Clock className="w-3 h-3" />{t('profile.memberSince')} {formatDate(profile.created_at || '')}</p>
              </div>
            </div>
            <div className="cathedral-line w-full" />
          </motion.div>

          {/* Stats - flat row */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ delay: 0.2 }} className="grid grid-cols-3 gap-6 mb-10">
            {statItems.map((s, i) => (
              <div key={i} className="text-center">
                <s.icon className={`w-5 h-5 mx-auto mb-2 ${s.color}`} />
                <p className="text-2xl font-cinzel font-bold text-foreground">{s.value}</p>
                <p className="text-[10px] text-muted-foreground font-inter uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
          </motion.div>

          <div className="cathedral-line w-full mb-8" />

          {/* Tabs - flat sections */}
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-cinzel font-bold text-foreground mb-4 flex items-center gap-2">
                <Heart className="w-4 h-4 text-cathedral-gold" />{t('profile.savedPrayersTab')}
              </h3>
              <p className="text-sm text-muted-foreground/60 font-inter italic">{t('profile.noSavedPrayers')}</p>
            </div>
            <div className="cathedral-line w-full" />
            <div>
              <h3 className="text-lg font-cinzel font-bold text-foreground mb-4 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-cathedral-gold" />{t('profile.biblicalReadingTab')}
              </h3>
              <p className="text-sm text-muted-foreground/60 font-inter italic">{t('profile.noReadings')}</p>
            </div>
            <div className="cathedral-line w-full" />
            <div>
              <h3 className="text-lg font-cinzel font-bold text-foreground mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4 text-cathedral-gold" />{t('profile.recentActivity')}
              </h3>
              <p className="text-sm text-muted-foreground/60 font-inter">{t('profile.noActivity')}</p>
              <p className="text-xs text-muted-foreground/40 font-inter mt-1">{t('profile.startParticipating')}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
