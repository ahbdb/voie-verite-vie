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
        if (cached) { try { setAllReadings(JSON.parse(cached)); } catch (e) { setAllReadings([]); } }
      } else if (data) {
        setAllReadings(data);
        localStorage.setItem('biblical_readings_cache', JSON.stringify(data));
      }
    } catch (error) {
      logger.error('Erreur chargement lectures', {}, error instanceof Error ? error : new Error(String(error)));
      const cached = localStorage.getItem('biblical_readings_cache');
      if (cached) { try { setAllReadings(JSON.parse(cached)); } catch (e) { setAllReadings([]); } }
    } finally { setLoading(false); }
  }, []);

  const loadUserProgress = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('user_reading_progress').select('reading_id, completed').eq('user_id', user.id);
    setUserProgress(data || []);
  }, [user]);

  useEffect(() => {
    const cached = localStorage.getItem('biblical_readings_cache');
    if (cached) { try { setAllReadings(JSON.parse(cached)); setLoading(false); } catch (e) { setLoading(true); } } else { setLoading(true); }
    loadAllReadings();
    if (user) loadUserProgress();
  }, [user, loadAllReadings, loadUserProgress]);

  const toggleReadingComplete = async (reading: Reading) => {
    if (!user) return navigate('/auth');
    const existing = userProgress.find(p => p.reading_id === reading.id);
    const wasCompleted = existing?.completed;
    try {
      if (existing) {
        await supabase.from('user_reading_progress').update({ completed: !existing.completed, completed_at: !existing.completed ? new Date().toISOString() : null }).eq('user_id', user.id).eq('reading_id', reading.id);
      } else {
        await supabase.from('user_reading_progress').insert({ user_id: user.id, reading_id: reading.id, completed: true, completed_at: new Date().toISOString() });
      }
      await loadUserProgress();
      if (!wasCompleted) { setQuizReading(reading); setShowQuiz(true); toast({ title: t('biblicalReading.readingCompleted') }); }
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
        if (!existing.completed) { await supabase.from('user_reading_progress').update({ completed: true, completed_at: new Date().toISOString() }).eq('user_id', user.id).eq('reading_id', reading.id); }
      } else {
        await supabase.from('user_reading_progress').insert({ user_id: user.id, reading_id: reading.id, completed: true, completed_at: new Date().toISOString() });
      }
    } catch (error) {
      logger.error('Erreur lors de la mise à jour du statut de lecture', { readingId: reading.id, userId: user.id }, error instanceof Error ? error : new Error(String(error)));
      toast({ title: t('common.error'), description: t('biblicalReading.updateError'), variant: "destructive" });
    }
    await loadUserProgress();
    setQuizReading(reading); setShowQuiz(true);
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
          <section className="py-4">
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
        {/* Hero – immersive image */}
        <section className="relative h-[40vh] min-h-[280px] flex items-end overflow-hidden">
          <img src={bibleAltar} alt="" className="absolute inset-0 w-full h-full object-cover animate-[kenburns_25s_ease-in-out_infinite_alternate]" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          <motion.div
            className="relative z-10 container mx-auto px-4 pb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <BookOpen className="w-8 h-8 text-cathedral-gold mb-3" />
            <h1 className="text-3xl md:text-5xl font-cinzel font-bold text-foreground mb-1">{t('biblicalReading.title')}</h1>
            <p className="text-muted-foreground text-sm md:text-base max-w-xl">{t('biblicalReading.subtitle')}</p>
          </motion.div>
        </section>

        <section className="container mx-auto px-4 max-w-6xl py-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="program" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" /><span>{t('biblicalReading.programTab')}</span>
              </TabsTrigger>
              <TabsTrigger value="books" className="flex items-center gap-2">
                <Library className="w-4 h-4" /><span>{t('biblicalReading.booksTab')}</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="program" className="space-y-6">
              {/* Progress bar – flat, no box */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">{completedCount}/358 {t('biblicalReading.completedLabel')}</span>
                  <span className="font-cinzel font-bold text-primary">{progressPercentage}%</span>
                </div>
                <Progress value={progressPercentage} className="h-2.5" />
              </div>

              {/* Month pills – flat row */}
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setSelectedMonth('all')}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${selectedMonth === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                >
                  {t('biblicalReading.all')}
                </button>
                {monthsOrder.map((month) => {
                  const [m, y] = month.key.split('-').map(Number);
                  const monthReadings = allReadings.filter(r => r.month === m && r.year === y);
                  if (monthReadings.length === 0) return null;
                  return (
                    <button
                      key={month.key}
                      onClick={() => setSelectedMonth(month.key)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${selectedMonth === month.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                    >
                      {month.name}
                    </button>
                  );
                })}
              </div>

              {/* Testament filter – flat pills */}
              <div className="flex gap-1.5">
                {[
                  { key: 'all', label: t('biblicalReading.all') },
                  { key: 'old', label: t('biblicalReading.oldTestament') },
                  { key: 'new', label: t('biblicalReading.newTestament') },
                ].map(f => (
                  <button
                    key={f.key}
                    onClick={() => setSelectedTestament(f.key)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${selectedTestament === f.key ? 'bg-cathedral-gold text-cathedral-navy' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Reading list – flat rows, NO cards-in-cards */}
              <div className="divide-y divide-border">
                {filteredReadings.map((reading, idx) => {
                  const isCompleted = userProgress.some(p => p.reading_id === reading.id && p.completed);
                  return (
                    <motion.div
                      key={reading.id}
                      className={`py-4 flex items-start gap-4 transition-colors ${isCompleted ? 'bg-primary/[0.03]' : ''}`}
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: Math.min(idx * 0.02, 0.3) }}
                    >
                      {/* Day number */}
                      <div className="flex flex-col items-center w-12 flex-shrink-0">
                        <span className="text-lg font-cinzel font-bold text-primary leading-none">{reading.day_number}</span>
                        <span className="text-[10px] text-muted-foreground mt-0.5">
                          {new Date(reading.date).toLocaleDateString(i18n.language === 'it' ? 'it-IT' : i18n.language === 'en' ? 'en-US' : 'fr-FR', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <button
                          className="text-left font-semibold text-sm text-foreground hover:text-primary transition-colors leading-snug"
                          onClick={() => openDayReading(reading)}
                        >
                          {translateBookName(reading.books, i18n.language)} {reading.chapters.includes('-')
                            ? `${reading.chapters.split('-')[0]} ${t('biblicalReading.to', { defaultValue: 'à' })} ${reading.chapters.split('-')[1]}`
                            : reading.chapters}
                        </button>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {reading.chapters_count} {reading.chapters_count > 1 ? t('biblicalReading.chaptersPlural') : t('biblicalReading.chapters')}
                        </p>
                        {reading.comment && (
                          <p className="text-xs italic text-muted-foreground/70 mt-1 line-clamp-1">{reading.comment}</p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {isCompleted && (
                          <button onClick={() => openQuizForReading(reading)} className="p-1.5 rounded-full hover:bg-muted transition-colors" title="Quiz">
                            <Brain className="w-4 h-4 text-cathedral-gold" />
                          </button>
                        )}
                        <button
                          onClick={() => toggleReadingComplete(reading)}
                          className={`p-1.5 rounded-full transition-colors ${isCompleted ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:bg-muted'}`}
                          title={isCompleted ? t('biblicalReading.completed') : t('biblicalReading.markAsRead')}
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="books" className="space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-cinzel font-bold">{t('biblicalReading.exploreBooks')}</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">{t('biblicalReading.exploreBooksDesc')}</p>
              <BibleBookSelector />
            </TabsContent>
          </Tabs>
        </section>
      </main>

      {showQuiz && quizReading && (
        <QuizModal reading={quizReading} isOpen={showQuiz} onClose={() => { setShowQuiz(false); setQuizReading(null); }} />
      )}
    </div>
  );
};

export default BiblicalReading;
