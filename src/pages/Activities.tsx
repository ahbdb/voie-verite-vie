import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import type { Tables } from '@/integrations/supabase/types';
import Navigation from '@/components/Navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, MapPin, Clock, Search, CheckCircle, CalendarRange, User } from 'lucide-react';
import ActivityRegistrationModal from '@/components/ActivityRegistrationModal';
import { supabase } from '@/integrations/supabase/client';
import activityConference from '@/assets/activity-conference.jpg';
import activityMeditation from '@/assets/activity-meditation.jpg';
import activityBibleStudy from '@/assets/activity-bible-study.jpg';
import activityCommunity from '@/assets/activity-community.jpg';
import activityCreative from '@/assets/activity-creative.jpg';

type Activity = Tables<'activities'> & { allow_registration?: boolean };

const defaultImages: Record<string, string> = {
  'conferences': activityConference,
  'bien-etre': activityMeditation,
  'etudes': activityBibleStudy,
  'projets': activityCommunity,
  'discussions': activityConference,
  'creativite': activityCreative,
  'culturel': activityCommunity,
  'general': activityCommunity,
};

const Activities = () => {
  const { t, i18n } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [activities, setActivities] = useState<Activity[]>([]);
  const [registrationCounts, setRegistrationCounts] = useState<Record<string, number>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => { loadActivities(); }, [user]);

  const loadActivities = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('activities').select('*').eq('is_published', true).order('date', { ascending: true });
    if (data && !error) {
      const visible = user ? data : data.filter(a => (a.category || '').toLowerCase() === 'principal');
      setActivities(visible);
      const counts: Record<string, number> = {};
      for (const activity of data) {
        const { count } = await supabase.from('activity_registrations').select('*', { count: 'exact', head: true }).eq('activity_name', activity.title);
        counts[activity.id] = count || 0;
      }
      setRegistrationCounts(counts);
    }
    setLoading(false);
  };

  const getActivityImage = (activity: Activity) => activity.image_url || defaultImages[activity.category] || activityConference;

  const getActivityTimeStatus = (activity: Activity) => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const startDate = new Date(activity.start_date || activity.date); startDate.setHours(0, 0, 0, 0);
    if (activity.end_date) {
      const endDate = new Date(activity.end_date); endDate.setHours(0, 0, 0, 0);
      if (endDate < today) return 'past';
      if (startDate <= today && endDate >= today) return 'ongoing';
    } else { if (startDate < today) return 'past'; }
    if (startDate.getTime() === today.getTime()) return 'today';
    return 'upcoming';
  };

  const upcomingActivities = activities.filter(a => getActivityTimeStatus(a) !== 'past');
  const pastActivities = activities.filter(a => getActivityTimeStatus(a) === 'past');
  const filteredUpcomingActivities = upcomingActivities.filter(a => a.title.toLowerCase().includes(searchTerm.toLowerCase()) || a.description.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredPastActivities = pastActivities.filter(a => a.title.toLowerCase().includes(searchTerm.toLowerCase()) || a.description.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleRegister = (activity: Activity) => { setSelectedActivity(activity); setIsModalOpen(true); };

  const formatDateRange = (activity: Activity) => {
    const locale = i18n.language === 'it' ? 'it-IT' : i18n.language === 'en' ? 'en-US' : 'fr-FR';
    const startDate = new Date(activity.start_date || activity.date).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
    if (activity.end_date) {
      return `${startDate} - ${new Date(activity.end_date).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })}`;
    }
    return startDate;
  };

  const formatTimeRange = (activity: Activity) => {
    if (activity.start_time && activity.end_time) return `${activity.start_time} - ${activity.end_time}`;
    return activity.start_time || activity.time;
  };

  const renderActivityCard = (activity: Activity, isPast = false) => {
    const timeStatus = getActivityTimeStatus(activity);
    return (
      <motion.div
        key={activity.id}
        className={`rounded-2xl overflow-hidden border border-border bg-card shadow-subtle hover:shadow-elegant transition-all duration-300 group ${isPast ? 'opacity-70' : ''}`}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <div className="h-48 relative overflow-hidden">
          <img src={getActivityImage(activity)} alt={activity.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-t from-[hsl(220,55%,5%,0.7)] via-transparent to-transparent" />
          <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2 text-white">
            {activity.end_date ? <CalendarRange className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
            <p className="text-sm font-medium">{formatDateRange(activity)}</p>
          </div>
          {timeStatus === 'today' && <Badge className="absolute top-4 right-4 bg-stained-emerald text-white"><Clock className="w-3 h-3 mr-1" /> {t('activities.todayBadge')}</Badge>}
          {timeStatus === 'ongoing' && <Badge className="absolute top-4 right-4 bg-stained-blue text-white"><Clock className="w-3 h-3 mr-1" /> {t('activities.ongoingBadge')}</Badge>}
          {isPast && <Badge variant="secondary" className="absolute top-4 right-4"><CheckCircle className="w-3 h-3 mr-1" /> {t('activities.finishedBadge')}</Badge>}
        </div>
        <div className="p-5">
          <h3 className="text-lg font-playfair font-semibold text-foreground mb-2">{activity.title}</h3>
          <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{activity.description}</p>
          <div className="space-y-1.5 mb-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-primary" />{formatTimeRange(activity)}</div>
            <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" />{activity.location}</div>
          </div>
          {(activity.allow_registration ?? true) && (
            <>
              <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
                <User className="w-4 h-4 text-primary" />
                <span>{registrationCounts[activity.id] || 0} {(registrationCounts[activity.id] || 0) > 1 ? t('activities.registeredPlural') : t('activities.registered')} {activity.max_participants > 0 && ` / ${activity.max_participants} ${t('activities.places')}`}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-primary">{activity.price ?? t('common.free')}</span>
                {!isPast ? (
                  <Button size="sm" onClick={() => handleRegister(activity)} disabled={activity.max_participants > 0 && (registrationCounts[activity.id] || 0) >= activity.max_participants} className="rounded-full">
                    {activity.max_participants > 0 && (registrationCounts[activity.id] || 0) >= activity.max_participants ? t('activities.full') : t('activities.register')}
                  </Button>
                ) : <Badge variant="outline">{t('activities.pastEvent')}</Badge>}
              </div>
            </>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-16">
        {/* Cathedral Hero */}
        <section className="relative h-[35vh] min-h-[260px] flex items-center justify-center overflow-hidden">
          <img src={activityCommunity} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-[hsl(220,55%,5%,0.7)] to-[hsl(220,55%,5%,0.8)]" />
          <motion.div className="relative z-10 text-center px-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl md:text-5xl font-cinzel font-bold text-white mb-3">{t('activities.title')}</h1>
            <p className="text-white/60 text-base font-inter">{t('activities.subtitle')}</p>
          </motion.div>
        </section>

        <section className="py-8">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="relative mb-8">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input placeholder={t('activities.searchPlaceholder')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 h-12 rounded-full" />
            </div>
            {loading ? (
              <div className="text-center py-16"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto" /><p className="text-muted-foreground mt-4">{t('activities.loadingActivities')}</p></div>
            ) : (
              <Tabs defaultValue="upcoming" className="w-full">
                <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
                  <TabsTrigger value="upcoming"><Calendar className="w-4 h-4 mr-2" />{t('activities.upcoming')} ({filteredUpcomingActivities.length})</TabsTrigger>
                  <TabsTrigger value="past"><CheckCircle className="w-4 h-4 mr-2" />{t('activities.past')} ({filteredPastActivities.length})</TabsTrigger>
                </TabsList>
                <TabsContent value="upcoming">
                  {filteredUpcomingActivities.length > 0 ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">{filteredUpcomingActivities.map(a => renderActivityCard(a, false))}</div>
                  ) : (
                    <div className="text-center py-16"><Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" /><h3 className="text-xl font-playfair font-semibold mb-2">{t('activities.noUpcoming')}</h3><p className="text-muted-foreground">{t('activities.newSoon')}</p></div>
                  )}
                </TabsContent>
                <TabsContent value="past">
                  {filteredPastActivities.length > 0 ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">{filteredPastActivities.map(a => renderActivityCard(a, true))}</div>
                  ) : (
                    <div className="text-center py-16"><CheckCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" /><h3 className="text-xl font-playfair font-semibold mb-2">{t('activities.noPast')}</h3><p className="text-muted-foreground">{t('activities.pastWillShow')}</p></div>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </div>
        </section>
        {!user && <div className="container mx-auto px-4 mt-6"><div className="max-w-6xl mx-auto text-center text-sm text-muted-foreground">{t('activities.loginToSee')}</div></div>}
      </main>
      <ActivityRegistrationModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setSelectedActivity(null); loadActivities(); }} activityName={selectedActivity?.title || ''} activityId={selectedActivity?.id} />
    </div>
  );
};

export default Activities;
