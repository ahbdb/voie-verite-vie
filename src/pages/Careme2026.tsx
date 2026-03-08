import { memo, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import Navigation from '@/components/Navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, ChevronRight, Flame, Heart, BookOpen, Users, Calendar, Share2, Printer, BarChart3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { useNotifications } from '@/hooks/useNotifications';
import { generateShareImage, shareImage } from '@/lib/share-utils';
import { getCaremeData } from '@/data/careme-2026-data';
import stainedGlass from '@/assets/stained-glass-cross.jpg';

const Careme2026 = memo(() => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const caremeData = getCaremeData(i18n.language);
  const { user } = useAuth();
  const { toast } = useToast();
  const { notifyCareme, notify } = useNotifications();
  const [selectedDay, setSelectedDay] = useState<any | null>(null);
  const [completedDates, setCompletedDates] = useState<string[]>([]);
  const [contentData, setContentData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [sharingProgress, setSharingProgress] = useState<{ current: number, total: number } | null>(null);
  const [subscription, setSubscription] = useState<any>(null);

  const allDays = contentData?.days || caremeData.fullProgram.flatMap((week: any) =>
    week.days.map((day: any) => ({ date: day.date, title: day.title || '', readings: day.readings || '', actions: day.actions, weekTitle: week.title }))
  );

  const weekGroups = contentData
    ? allDays.reduce((acc: any, day: any) => {
        const lastWeek = acc[acc.length - 1];
        if (lastWeek && lastWeek.title === day.weekTitle) { lastWeek.days.push(day); } else { acc.push({ title: day.weekTitle, days: [day], range: '' }); }
        return acc;
      }, [])
    : caremeData.fullProgram;

  const toIsoDate = (d: Date) => d.toISOString().slice(0, 10);
  const parseDateFromLabel = (label: string): Date | null => {
    const months: Record<string, number> = { janvier: 0, février: 1, fevrier: 1, mars: 2, avril: 3, mai: 4, juin: 5, juillet: 6, août: 7, aout: 7, septembre: 8, octobre: 9, novembre: 10, décembre: 11, decembre: 11 };
    const m = label.toLowerCase().match(/(\d{1,2})(?:er)?\s*(janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre)/i);
    if (!m) return null;
    const day = parseInt(m[1], 10);
    const month = months[m[2].toLowerCase() as keyof typeof months];
    if (Number.isNaN(day) || month === undefined) return null;
    return new Date(2026, month, day, 0, 0, 0, 0);
  };

  const isSunday = (d: any) => { const s = (d?.date || d?.title || '').toString().toLowerCase(); return s.startsWith('dimanche') || s.includes('dimanche'); };
  const isCompletedDate = (dateObj: Date | null) => dateObj ? completedDates.includes(toIsoDate(dateObj)) : false;
  const canMarkCompleted = (dateObj: Date | null) => dateObj !== null && dateObj !== undefined;

  const loadContent = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('page_content').select('*').eq('page_key', 'careme-2026').single();
      if (error) return;
      const content = data.content as { days?: any[] } | null;
      if (content?.days) setContentData(content);
    } catch (err) { console.error('❌ [Careme2026] Failed to load content:', err); }
  }, []);

  const loadUserProgress = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await (supabase as any).from('user_program_progress').select('date').eq('user_id', user.id).eq('program_key', 'careme-2026');
      if (error?.code === 'PGRST116' || error) return;
      setCompletedDates((data || []).map((r: any) => r.date));
    } catch (err) { console.warn('⚠️ Failed to load progress:', err); }
  }, [user]);

  const markCompleted = async (dateObj: Date | null) => {
    if (!user || !dateObj) return window.location.assign('/auth');
    if (!canMarkCompleted(dateObj)) { toast({ title: t('common.error'), variant: 'destructive' }); return; }
    const dateStr = toIsoDate(dateObj);
    setCompletedDates((s) => Array.from(new Set([...s, dateStr])));
    try {
      await (supabase as any).from('user_program_progress').upsert({ user_id: user.id, program_key: 'careme-2026', date: dateStr }, { onConflict: 'user_id,program_key,date' });
      toast({ title: t('careme.dayMarkedCompleted') });
      await notifyCareme(new Date().getDate(), `Jour complété! 🙏`);
    } catch (err) { toast({ title: t('common.error'), description: t('careme.saveError'), variant: 'destructive' }); }
  };

  const unmarkCompleted = async (dateObj: Date | null) => {
    if (!user || !dateObj) return;
    const dateStr = toIsoDate(dateObj);
    setCompletedDates((s) => s.filter(d => d !== dateStr));
    try { await (supabase as any).from('user_program_progress').delete().eq('user_id', user.id).eq('program_key', 'careme-2026').eq('date', dateStr); toast({ title: t('careme.dayRemoved') }); } catch (err) { console.error(err); }
  };

  const shareDay = async (day: any) => {
    if (!day) return;
    try {
      const dayNum = allDays.filter((d: any) => !isSunday(d)).findIndex((d: any) => d.date === day.date) + 1;
      const blob = await generateShareImage({ title: `${day.date}${day.title ? ' - ' + day.title : ''}`, reading: day.readings, text: day.actions?.soi ? `🪞 ${day.actions.soi}` : undefined, meditation: day.actions?.prochain ? `❤️ ${day.actions.prochain}` : undefined, prayer: day.actions?.dieu ? `🙏 ${day.actions.dieu}` : undefined, number: dayNum, type: 'day' });
      if (blob) { await shareImage(blob, `Careme-Jour-${String(dayNum).padStart(2, '0')}`); }
    } catch (error) { console.error('Erreur:', error); }
  };

  const shareAllDays = async () => {
    const nonSundayDays = allDays.filter((d: any) => !isSunday(d));
    if (nonSundayDays.length === 0) return;
    setSharingProgress({ current: 0, total: nonSundayDays.length });
    for (let idx = 0; idx < nonSundayDays.length; idx++) {
      const day = nonSundayDays[idx];
      try {
        setSharingProgress({ current: idx + 1, total: nonSundayDays.length });
        const actionsList = [day.actions?.soi ? `🪞 Soi: ${day.actions.soi}` : null, day.actions?.prochain ? `❤️ Prochain: ${day.actions.prochain}` : null, day.actions?.dieu ? `🙏 Dieu: ${day.actions.dieu}` : null].filter(Boolean).join('\n\n');
        const blob = await generateShareImage({ title: 'Actions pour aujourd\'hui', subtitle: `Jour ${idx + 1}/40 - ${day.date}`, text: actionsList, number: idx + 1, type: 'day' });
        if (blob) await shareImage(blob, `Careme-Actions-Jour-${String(idx + 1).padStart(2, '0')}`);
      } catch (error) { console.error(`❌ Erreur jour ${idx + 1}:`, error); }
      await new Promise(resolve => setTimeout(resolve, !/android|iphone|ipad/i.test(navigator.userAgent) ? 500 : 300));
    }
    setSharingProgress(null);
    toast({ title: `✝️ ${t('careme.allDaysShared')}` });
  };

  useEffect(() => {
    loadContent();
    loadUserProgress();
    if (!subscription) {
      const sub = supabase.channel('careme_2026_updates').on('postgres_changes', { event: '*', schema: 'public', table: 'page_content', filter: `page_key=eq.careme-2026` }, (payload: any) => {
        if (payload.new?.content?.days) setContentData(payload.new.content); else loadContent();
      }).subscribe();
      setSubscription(sub);
    }
    return () => { if (subscription) subscription.unsubscribe(); };
  }, [user, loadContent, loadUserProgress, subscription]);

  useEffect(() => {
    const handler = () => { if (document.visibilityState === 'visible') loadContent(); };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [loadContent]);

  const nonSundayDays = allDays.filter((d: any) => !isSunday(d));
  const completionRate = nonSundayDays.length > 0 ? Math.round((completedDates.length / nonSundayDays.length) * 100) : 0;
  const printPage = () => window.print();
  const shareProgram = async () => {
    try {
      if ((navigator as any).share) { await (navigator as any).share({ title: 'Carême 2026 — Voie-Vérité-Vie', text: '40 jours de prière, pénitence et partage', url: window.location.href }); }
      else { await navigator.clipboard.writeText(window.location.href); toast({ title: t('careme.linkCopied') }); }
    } catch (err) { console.error(err); }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {sharingProgress && (
        <div className="fixed top-0 left-0 right-0 bg-secondary text-secondary-foreground p-4 z-50 flex items-center gap-4">
          <div className="flex-1">
            <div className="flex justify-between text-sm mb-2"><span>{t('careme.sharingInProgress')}</span><span>{sharingProgress.current}/{sharingProgress.total}</span></div>
            <div className="w-full bg-secondary/50 rounded-full h-2"><div className="bg-cathedral-gold h-2 rounded-full transition-all duration-300" style={{ width: `${(sharingProgress.current / sharingProgress.total) * 100}%` }} /></div>
          </div>
        </div>
      )}

      {/* Cathedral Hero */}
      <header className="relative h-[45vh] min-h-[320px] flex items-center justify-center overflow-hidden">
        <img src={stainedGlass} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-[hsl(220,55%,5%,0.65)] via-[hsl(220,55%,5%,0.5)] to-[hsl(220,55%,5%,0.8)]" />
        <motion.div className="relative z-10 container mx-auto px-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-4">
            <Flame className="w-8 h-8 text-cathedral-gold" />
            <span className="text-sm font-semibold text-cathedral-gold/80 font-inter">{t('careme.undertakeJourney')}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-cinzel font-bold text-white mb-3">{t('careme.title')}</h1>
          <p className="text-base sm:text-lg text-white/60 max-w-2xl font-inter">{t('careme.subtitle')}</p>
        </motion.div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-8 md:py-12">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
          {[
            { value: nonSundayDays.length, label: t('careme.daysInProgram'), color: 'text-primary' },
            { value: completedDates.length, label: t('careme.daysCompleted'), color: 'text-stained-emerald' },
            { value: `${completionRate}%`, label: t('careme.progression'), color: 'text-stained-blue' },
            { value: 40, label: t('careme.daysRequired'), color: 'text-stained-amber' },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-border bg-card p-4">
              <div className={`text-2xl sm:text-3xl font-cinzel font-bold ${stat.color}`}>{stat.value}</div>
              <p className="text-xs sm:text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6 gap-1">
            <TabsTrigger value="overview" className="text-xs sm:text-sm">📅 {t('careme.overviewTab')}</TabsTrigger>
            <TabsTrigger value="calendar" className="text-xs sm:text-sm">📋 {t('careme.calendarTab')}</TabsTrigger>
            <button onClick={() => navigate('/chemin-de-croix')} className="flex gap-1 sm:gap-2 bg-secondary hover:bg-secondary/90 text-secondary-foreground rounded-md px-2 sm:px-3 py-1.5 text-xs sm:text-sm justify-center items-center transition-colors whitespace-nowrap">✝️ <span className="hidden sm:inline">{t('careme.stationsOfCross')}</span><span className="sm:hidden">{t('common.stationsOfCross')}</span></button>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="border-border">
                <CardHeader className="bg-muted/50">
                  <CardTitle className="flex items-center gap-2 text-lg"><Flame className="w-5 h-5 text-primary" />{t('careme.threePillars')}</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-3">
                  <div className="flex gap-3 items-start p-3 rounded-lg bg-primary/5">
                    <BookOpen className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div><p className="font-semibold text-sm">{t('careme.prayer')}</p><p className="text-xs text-muted-foreground">{t('careme.prayerDesc')}</p></div>
                  </div>
                  <div className="flex gap-3 items-start p-3 rounded-lg bg-accent/5">
                    <Heart className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                    <div><p className="font-semibold text-sm">{t('careme.penance')}</p><p className="text-xs text-muted-foreground">{t('careme.penanceDesc')}</p></div>
                  </div>
                  <div className="flex gap-3 items-start p-3 rounded-lg bg-stained-amber/5">
                    <Users className="w-5 h-5 text-stained-amber flex-shrink-0 mt-0.5" />
                    <div><p className="font-semibold text-sm">{t('careme.sharing')}</p><p className="text-xs text-muted-foreground">{t('careme.sharingDesc')}</p></div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardHeader className="bg-muted/50">
                  <CardTitle className="flex items-center gap-2 text-lg"><Calendar className="w-5 h-5 text-stained-blue" />{t('careme.dailyRhythm')}</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-2 text-sm">
                  {[
                    { time: '05:00', label: t('careme.introductionPrayer') },
                    { time: t('careme.allDay'), label: t('careme.soberFasting') },
                    { time: '18:00', label: t('careme.breakPrayer') },
                    { time: t('careme.evening'), label: t('careme.examConscience') },
                  ].map((item, i) => (
                    <div key={i} className="flex justify-between py-2 border-b border-border last:border-0">
                      <span className="text-muted-foreground">{item.time}</span>
                      <span className="font-medium">{item.label}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <Card className="border-border">
              <CardContent className="pt-6">
                <div className="flex justify-between mb-2"><span className="font-semibold text-sm">{t('careme.yourProgress')}</span><span className="text-sm font-bold text-primary">{completionRate}%</span></div>
                <div className="w-full bg-muted rounded-full h-3 overflow-hidden"><div className="h-3 rounded-full bg-gradient-to-r from-primary to-stained-amber transition-all duration-500" style={{ width: `${completionRate}%` }} /></div>
                <p className="text-xs text-muted-foreground mt-2">{completedDates.length} {t('careme.completedOf')} {nonSundayDays.length}</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calendar" className="space-y-6">
            <div className="flex flex-col gap-2 mb-4">
              <div className="flex gap-2">
                <Button size="sm" onClick={printPage} variant="outline" className="gap-2"><Printer className="w-4 h-4" /><span className="hidden sm:inline">{t('careme.print')}</span></Button>
                <Button size="sm" onClick={shareProgram} variant="outline" className="gap-2"><Share2 className="w-4 h-4" /><span className="hidden sm:inline">{t('careme.share')}</span></Button>
              </div>
              <Button size="sm" onClick={shareAllDays} className="bg-secondary hover:bg-secondary/90 text-secondary-foreground gap-2 w-full"><Share2 className="w-4 h-4" />{t('careme.shareAll40')}</Button>
            </div>

            <div className="space-y-4">
              {weekGroups.map((week: any, weekIdx: number) => (
                <Card key={weekIdx} className="border-border">
                  <CardHeader className="bg-muted/50 pb-3">
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-base sm:text-lg">{week.title}</CardTitle>
                      <span className="text-xs sm:text-sm text-muted-foreground">{week.range}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                      {week.days.map((day: any, dayIdx: number) => {
                        const dateObj = parseDateFromLabel(day.date);
                        const isCompleted = isCompletedDate(dateObj);
                        const isSun = isSunday(day);
                        return (
                          <button
                            key={dayIdx}
                            onClick={() => !isSun && setSelectedDay({ ...day, dateObj })}
                            disabled={isSun}
                            className={`p-3 rounded-lg text-left transition-all active:scale-95 ${isSun ? 'bg-muted border border-border cursor-default opacity-60' : 'bg-card border-2 border-border hover:border-primary/40 hover:shadow-subtle cursor-pointer'} ${isCompleted ? 'ring-2 ring-stained-emerald ring-offset-1' : ''}`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-sm truncate">{day.date}</div>
                                {day.title && <div className="text-xs text-primary line-clamp-1">{day.title}</div>}
                              </div>
                              {isCompleted && <Check className="w-4 h-4 text-stained-emerald flex-shrink-0 mt-0.5" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={!!selectedDay} onOpenChange={(open) => { if (!open) setSelectedDay(null); }}>
        <DialogContent id={selectedDay ? 'share-source' : undefined} className="max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-cinzel">{selectedDay?.date}</DialogTitle>
            {selectedDay?.title && <p className="text-sm text-muted-foreground mt-2">{selectedDay.title}</p>}
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedDay?.readings && (
              <div className="bg-muted p-3 rounded-lg"><p className="text-xs font-semibold text-muted-foreground mb-1">{t('careme.biblicalReadings')}</p><p className="text-sm">{selectedDay.readings}</p></div>
            )}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border-2 border-primary/20 p-4 bg-primary/5"><div className="flex items-center gap-2 mb-2"><BookOpen className="w-5 h-5 text-primary" /><h3 className="font-semibold text-sm">🪞 {t('careme.self')}</h3></div><p className="text-sm text-muted-foreground">{selectedDay?.actions?.soi}</p></div>
              <div className="rounded-lg border-2 border-accent/20 p-4 bg-accent/5"><div className="flex items-center gap-2 mb-2"><Users className="w-5 h-5 text-accent" /><h3 className="font-semibold text-sm">❤️ {t('careme.neighbor')}</h3></div><p className="text-sm text-muted-foreground">{selectedDay?.actions?.prochain}</p></div>
              <div className="rounded-lg border-2 border-stained-amber/20 p-4 bg-stained-amber/5"><div className="flex items-center gap-2 mb-2"><Heart className="w-5 h-5 text-stained-amber" /><h3 className="font-semibold text-sm">🙏 {t('careme.god')}</h3></div><p className="text-sm text-muted-foreground">{selectedDay?.actions?.dieu}</p></div>
            </div>
            {selectedDay?.dateObj && !isSunday(selectedDay) && (
              <div className="space-y-2 pt-4 border-t border-border">
                <div className="flex gap-2">
                  <Button onClick={() => shareDay(selectedDay)} className="flex-1 gap-2 bg-secondary hover:bg-secondary/90"><Share2 className="w-4 h-4" /><span className="hidden sm:inline">{t('careme.share')}</span></Button>
                  <Button className="flex-1 gap-2" onClick={() => isCompletedDate(selectedDay.dateObj) ? unmarkCompleted(selectedDay.dateObj) : markCompleted(selectedDay.dateObj)} variant={isCompletedDate(selectedDay.dateObj) ? 'default' : 'outline'} disabled={!isCompletedDate(selectedDay.dateObj) && !canMarkCompleted(selectedDay.dateObj)}><Check className="w-4 h-4" /><span className="hidden sm:inline">{isCompletedDate(selectedDay.dateObj) ? t('careme.completed') : t('careme.complete')}</span></Button>
                  <Button className="flex-1" onClick={() => setSelectedDay(null)} variant="outline">{t('careme.close')}</Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
});

export default Careme2026;
