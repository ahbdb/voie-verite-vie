import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Calendar, BookOpen, CheckCircle, Brain, Library } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { QuizModal } from '@/components/QuizModal';
import { BibleBookSelector } from '@/components/BibleBookSelector';
import DayReadingViewer from '@/components/DayReadingViewer';
import { logger } from '@/lib/logger';
import { translateBookName } from '@/lib/bible-utils';
import bibleAltar from '@/assets/bible-altar.jpg';

interface Reading {
  id: string;
  day_number: number;
  date: string;
  month: number;
  year?: number;
  books: string;
  chapters: string;
  chapters_count: number;
  type: string;
  comment: string | null;
  testament?: 'old' | 'new';
}

interface UserProgress {
  reading_id: string;
  completed: boolean;
  completed_at?: string | null;
}

const BiblicalReading = () => {
  const { t, i18n } = useTranslation();
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedTestament, setSelectedTestament] = useState('all');
  const [activeTab, setActiveTab] = useState('program');
  const [allReadings, setAllReadings] = useState<Reading[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [quizReading, setQuizReading] = useState<Reading | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [selectedDayReading, setSelectedDayReading] = useState<Reading | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const loadAllReadings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('biblical_readings')
        .select('id, day_number, date, month, year, books, chapters, chapters_count, type, comment')
        .order('day_number');
      
      if (error) {
        logger.error('Erreur Supabase: ', {}, error);
        const cached = localStorage.getItem('biblical_readings_cache');
        if (cached) {
          try { setAllReadings(JSON.parse(cached)); } catch (e) { setAllReadings([]); }
        }
      } else if (data) {
        setAllReadings(data);
        localStorage.setItem('biblical_readings_cache', JSON.stringify(data));
      }
    } catch (error) {
      logger.error('Erreur chargement lectures', {}, error instanceof Error ? error : new Error(String(error)));
      const cached = localStorage.getItem('biblical_readings_cache');
      if (cached) {
        try { setAllReadings(JSON.parse(cached)); } catch (e) { setAllReadings([]); }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const loadUserProgress = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('user_reading_progress')
      .select('reading_id, completed')
      .eq('user_id', user.id);
    setUserProgress(data || []);
  }, [user]);

  useEffect(() => {
    const cached = localStorage.getItem('biblical_readings_cache');
    if (cached) {
      try { setAllReadings(JSON.parse(cached)); setLoading(false); } catch (e) { setLoading(true); }
    } else { setLoading(true); }
    loadAllReadings();
    if (user) loadUserProgress();
  }, [user, loadAllReadings, loadUserProgress]);

  const toggleReadingComplete = async (reading: Reading) => {
    if (!user) return navigate('/auth');
    const existing = userProgress.find(p => p.reading_id === reading.id);
    const wasCompleted = existing?.completed;
    try {
      if (existing) {
        await supabase.from('user_reading_progress')
          .update({ completed: !existing.completed, completed_at: !existing.completed ? new Date().toISOString() : null })
          .eq('user_id', user.id).eq('reading_id', reading.id);
      } else {
        await supabase.from('user_reading_progress')
          .insert({ user_id: user.id, reading_id: reading.id, completed: true, completed_at: new Date().toISOString() });
      }
      await loadUserProgress();
      if (!wasCompleted) {
        setQuizReading(reading);
        setShowQuiz(true);
        toast({ title: t('biblicalReading.readingCompleted') });
      }
    } catch (error) {
      logger.error('Erreur lors de la mise à jour du statut de lecture', { readingId: reading.id, userId: user.id }, error instanceof Error ? error : new Error(String(error)));
      toast({ title: t('common.error'), description: t('biblicalReading.updateError'), variant: "destructive" });
    }
  };

  const openDayReading = (reading: Reading) => setSelectedDayReading(reading);
  const closeDayReading = () => setSelectedDayReading(null);
  const openQuizForReading = (reading: Reading) => { setQuizReading(reading); setShowQuiz(true); };

  const toggleGroupComplete = async (reading: Reading) => {
    if (!user) return navigate('/auth');
    try {
      const existing = userProgress.find(p => p.reading_id === reading.id);
      if (existing) {
        if (!existing.completed) {
          await supabase.from('user_reading_progress').update({ completed: true, completed_at: new Date().toISOString() }).eq('user_id', user.id).eq('reading_id', reading.id);
        }
      } else {
        await supabase.from('user_reading_progress').insert({ user_id: user.id, reading_id: reading.id, completed: true, completed_at: new Date().toISOString() });
      }
    } catch (error) {
      logger.error('Erreur lors de la mise à jour du statut de lecture', { readingId: reading.id, userId: user.id }, error instanceof Error ? error : new Error(String(error)));
      toast({ title: t('common.error'), description: t('biblicalReading.updateError'), variant: "destructive" });
    }
    await loadUserProgress();
    setQuizReading(reading);
    setShowQuiz(true);
    toast({ title: t('biblicalReading.readingMarkedCompleted') });
  };

  const filteredReadings = useMemo(() => {
    let filtered = allReadings;
    if (selectedMonth !== 'all') {
      const [month, year] = selectedMonth.split('-').map(Number);
      filtered = filtered.filter(r => r.month === month && r.year === year);
    }
    if (selectedTestament !== 'all') {
      const ntBooks = ['Matthieu', 'Marc', 'Luc', 'Jean', 'Actes', 'Romains', 'Corinthiens', 'Galates', 'Éphésiens', 'Philippiens', 'Colossiens', 'Thessaloniciens', 'Timothée', 'Tite', 'Philémon', 'Hébreux', 'Jacques', 'Pierre', 'Jude', 'Apocalypse'];
      filtered = selectedTestament === 'old'
        ? filtered.filter(r => !ntBooks.some(nt => r.books.includes(nt)))
        : filtered.filter(r => ntBooks.some(nt => r.books.includes(nt)));
    }
    return filtered;
  }, [allReadings, selectedMonth, selectedTestament]);

  const monthsOrder = useMemo(() => {
    const lang = i18n.language?.split('-')[0] || 'fr';
    const fmt = new Intl.DateTimeFormat(lang === 'it' ? 'it-IT' : lang === 'en' ? 'en-US' : 'fr-FR', { month: 'short' });
    const monthKeys = [
      { m: 11, y: 2025 }, { m: 12, y: 2025 },
      { m: 1, y: 2026 }, { m: 2, y: 2026 }, { m: 3, y: 2026 }, { m: 4, y: 2026 },
      { m: 5, y: 2026 }, { m: 6, y: 2026 }, { m: 7, y: 2026 }, { m: 8, y: 2026 },
      { m: 9, y: 2026 }, { m: 10, y: 2026 }, { m: 11, y: 2026 },
    ];
    return monthKeys.map(({ m, y }) => {
      const d = new Date(y, m - 1, 1);
      const label = fmt.format(d);
      return { key: `${m}-${y}`, name: `${label.charAt(0).toUpperCase() + label.slice(1)} ${y}` };
    });
  }, [i18n.language]);

  const completedCount = useMemo(() => userProgress.filter(p => p.completed).length, [userProgress]);
  const progressPercentage = useMemo(() => Math.round((completedCount / 358) * 100), [completedCount]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
      </div>
    </div>
  );

  if (selectedDayReading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="pt-16 pb-8">
          <section className="py-8">
            <div className="container mx-auto px-4 max-w-4xl">
              <DayReadingViewer reading={selectedDayReading} onClose={closeDayReading} />
            </div>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-16">
        {/* Cathedral Hero */}
        <section className="relative h-[45vh] min-h-[320px] flex items-center justify-center overflow-hidden">
          <img src={bibleAltar} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-[hsl(220,55%,5%,0.7)] via-[hsl(220,55%,5%,0.5)] to-[hsl(220,55%,5%,0.8)]" />
          <motion.div
            className="relative z-10 text-center px-4 max-w-3xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <BookOpen className="w-10 h-10 text-cathedral-gold mx-auto mb-4" />
            <h1 className="text-3xl md:text-5xl font-cinzel font-bold text-white mb-3">{t('biblicalReading.title')}</h1>
            <p className="text-white/60 text-sm md:text-base font-inter">{t('biblicalReading.subtitle')}</p>
          </motion.div>
        </section>

        <section className="py-6 md:py-10">
          <div className="container mx-auto px-4 max-w-6xl">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="program" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{t('biblicalReading.programTab')}</span>
                </TabsTrigger>
                <TabsTrigger value="books" className="flex items-center gap-2">
                  <Library className="w-4 h-4" />
                  <span>{t('biblicalReading.booksTab')}</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="program" className="space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: t('biblicalReading.progressLabel'), value: `${progressPercentage}%` },
                    { label: t('biblicalReading.completedLabel'), value: `${completedCount}/358` },
                    { label: t('biblicalReading.displayedLabel'), value: `${filteredReadings.length}` },
                    { label: t('biblicalReading.remainingLabel'), value: `${358 - completedCount}` },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-xl border border-border bg-card p-4">
                      <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
                      <p className="text-xl font-cinzel font-bold text-primary">{stat.value}</p>
                    </div>
                  ))}
                </div>

                {/* Month filter */}
                <div className="flex flex-wrap justify-center gap-2 md:gap-3">
                  <Button variant={selectedMonth === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setSelectedMonth('all')}>
                    {t('biblicalReading.all')}
                  </Button>
                  {monthsOrder.map((month) => {
                    const [m, y] = month.key.split('-').map(Number);
                    const monthReadings = allReadings.filter(r => r.month === m && r.year === y);
                    if (monthReadings.length === 0) return null;
                    const completedInMonth = monthReadings.filter(r => userProgress.some(p => p.reading_id === r.id && p.completed)).length;
                    const monthProgress = Math.round((completedInMonth / monthReadings.length) * 100);
                    return (
                      <div key={month.key} className="flex flex-col items-center gap-1">
                        <Button
                          variant={selectedMonth === month.key ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSelectedMonth(month.key)}
                          className="w-full"
                        >
                          {month.name} <Badge variant="secondary" className="ml-1 text-xs">{completedInMonth}/{monthReadings.length}</Badge>
                        </Button>
                        <Progress value={monthProgress} className="w-full h-1.5" />
                      </div>
                    );
                  })}
                </div>

                {/* Testament filter */}
                <Tabs value={selectedTestament} onValueChange={setSelectedTestament} className="mb-4">
                  <TabsList className="grid w-full max-w-xs mx-auto grid-cols-3">
                    <TabsTrigger value="all">{t('biblicalReading.all')}</TabsTrigger>
                    <TabsTrigger value="old">{t('biblicalReading.oldTestament')}</TabsTrigger>
                    <TabsTrigger value="new">{t('biblicalReading.newTestament')}</TabsTrigger>
                  </TabsList>
                </Tabs>

                {/* Reading cards */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredReadings.map((reading) => {
                    const isCompleted = userProgress.some(p => p.reading_id === reading.id && p.completed);
                    return (
                      <motion.div
                        key={reading.id}
                        className={`rounded-xl border bg-card p-5 transition-all hover:shadow-elegant ${isCompleted ? 'border-primary/30 bg-primary/5' : 'border-border'}`}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-primary" />
                            <span className="text-sm font-medium text-primary">{t('biblicalReading.day')} {reading.day_number}</span>
                          </div>
                          {isCompleted && (
                            <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => openQuizForReading(reading)}>
                              <Brain className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                        <h3 className="text-base font-playfair font-semibold text-foreground mb-2">
                          {new Date(reading.date).toLocaleDateString(i18n.language === 'it' ? 'it-IT' : i18n.language === 'en' ? 'en-US' : 'fr-FR', { day: 'numeric', month: 'long' })}
                        </h3>
                        <div className="space-y-2">
                          <Button
                            variant="ghost"
                            className="p-0 h-auto font-semibold text-primary hover:text-primary/80 justify-start w-full text-left break-words"
                            onClick={() => openDayReading(reading)}
                          >
                            {translateBookName(reading.books, i18n.language)} {reading.chapters.includes('-')
                              ? `${reading.chapters.split('-')[0]} ${t('biblicalReading.to', { defaultValue: 'à' })} ${reading.chapters.split('-')[1]}`
                              : reading.chapters}
                          </Button>
                          <p className="text-xs text-muted-foreground">
                            {reading.chapters_count} {reading.chapters_count > 1 ? t('biblicalReading.chaptersPlural') : t('biblicalReading.chapters')}
                          </p>
                          {reading.comment && (
                            <div className="bg-primary/5 rounded-lg p-3">
                              <p className="text-xs italic text-muted-foreground">{reading.comment}</p>
                            </div>
                          )}
                          <Button
                            size="sm"
                            variant={isCompleted ? "default" : "outline"}
                            className="w-full text-xs"
                            onClick={() => toggleReadingComplete(reading)}
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            {isCompleted ? t('biblicalReading.completed') : t('biblicalReading.markAsRead')}
                          </Button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </TabsContent>

              <TabsContent value="books" className="space-y-6">
                <div className="rounded-xl border border-border bg-card p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-playfair font-bold">{t('biblicalReading.exploreBooks')}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">{t('biblicalReading.exploreBooksDesc')}</p>
                  <BibleBookSelector />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </section>
      </main>

      <QuizModal isOpen={showQuiz} onClose={() => setShowQuiz(false)} reading={quizReading} />
    </div>
  );
};

export default BiblicalReading;
