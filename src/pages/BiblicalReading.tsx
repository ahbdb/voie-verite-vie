import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Calendar, BookOpen, CheckCircle, Brain, Library, Flame, Clock3, ListFilter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { QuizModal } from '@/components/QuizModal';
import { BibleBookSelector } from '@/components/BibleBookSelector';
import DayReadingViewer from '@/components/DayReadingViewer';
import { logger } from '@/lib/logger';
import { translateBookName } from '@/lib/bible-utils';

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
}

interface UserProgress {
  reading_id: string;
  completed: boolean;
}

const TOTAL_PROGRAM_DAYS = 358;

const BiblicalReading = () => {
  const { t, i18n } = useTranslation();
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedTestament, setSelectedTestament] = useState<'all' | 'old' | 'new'>('all');
  const [onlyUnread, setOnlyUnread] = useState(false);
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
        logger.error('Erreur chargement lectures', {}, error);
        const cached = localStorage.getItem('biblical_readings_cache');
        if (cached) {
          try {
            setAllReadings(JSON.parse(cached));
          } catch {
            setAllReadings([]);
          }
        }
      } else {
        setAllReadings(data || []);
        localStorage.setItem('biblical_readings_cache', JSON.stringify(data || []));
      }
    } catch (error) {
      logger.error('Erreur chargement lectures', {}, error instanceof Error ? error : new Error(String(error)));
      const cached = localStorage.getItem('biblical_readings_cache');
      if (cached) {
        try {
          setAllReadings(JSON.parse(cached));
        } catch {
          setAllReadings([]);
        }
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
      try {
        setAllReadings(JSON.parse(cached));
        setLoading(false);
      } catch {
        setLoading(true);
      }
    }

    void loadAllReadings();
    if (user) void loadUserProgress();
  }, [user, loadAllReadings, loadUserProgress]);

  const completedSet = useMemo(
    () => new Set(userProgress.filter((p) => p.completed).map((p) => p.reading_id)),
    [userProgress]
  );

  const isCompleted = useCallback((readingId: string) => completedSet.has(readingId), [completedSet]);

  const getLocale = () => {
    const lang = i18n.language?.split('-')[0] || 'fr';
    if (lang === 'it') return 'it-IT';
    if (lang === 'en') return 'en-US';
    return 'fr-FR';
  };

  const monthsOrder = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(getLocale(), { month: 'short' });
    const monthKeys = [
      { m: 11, y: 2025 },
      { m: 12, y: 2025 },
      { m: 1, y: 2026 },
      { m: 2, y: 2026 },
      { m: 3, y: 2026 },
      { m: 4, y: 2026 },
      { m: 5, y: 2026 },
      { m: 6, y: 2026 },
      { m: 7, y: 2026 },
      { m: 8, y: 2026 },
      { m: 9, y: 2026 },
      { m: 10, y: 2026 },
      { m: 11, y: 2026 },
    ];

    return monthKeys.map(({ m, y }) => {
      const label = fmt.format(new Date(y, m - 1, 1));
      return { key: `${m}-${y}`, name: `${label.charAt(0).toUpperCase() + label.slice(1)} ${y}` };
    });
  }, [i18n.language]);

  const monthStats = useMemo(() => {
    return monthsOrder.reduce<Record<string, { total: number; completed: number; ratio: number }>>((acc, month) => {
      const [m, y] = month.key.split('-').map(Number);
      const monthReadings = allReadings.filter((r) => r.month === m && r.year === y);
      const completed = monthReadings.filter((r) => completedSet.has(r.id)).length;
      const total = monthReadings.length;

      acc[month.key] = {
        total,
        completed,
        ratio: total > 0 ? Math.round((completed / total) * 100) : 0,
      };

      return acc;
    }, {});
  }, [monthsOrder, allReadings, completedSet]);

  const filteredReadings = useMemo(() => {
    let filtered = allReadings;

    if (selectedMonth !== 'all') {
      const [month, year] = selectedMonth.split('-').map(Number);
      filtered = filtered.filter((r) => r.month === month && r.year === year);
    }

    if (selectedTestament !== 'all') {
      const ntBooks = [
        'Matthieu',
        'Marc',
        'Luc',
        'Jean',
        'Actes',
        'Romains',
        'Corinthiens',
        'Galates',
        'Éphésiens',
        'Philippiens',
        'Colossiens',
        'Thessaloniciens',
        'Timothée',
        'Tite',
        'Philémon',
        'Hébreux',
        'Jacques',
        'Pierre',
        'Jude',
        'Apocalypse',
      ];

      filtered =
        selectedTestament === 'old'
          ? filtered.filter((r) => !ntBooks.some((nt) => r.books.includes(nt)))
          : filtered.filter((r) => ntBooks.some((nt) => r.books.includes(nt)));
    }

    if (onlyUnread) {
      filtered = filtered.filter((r) => !completedSet.has(r.id));
    }

    return filtered;
  }, [allReadings, selectedMonth, selectedTestament, onlyUnread, completedSet]);

  const completedCount = useMemo(() => userProgress.filter((p) => p.completed).length, [userProgress]);
  const progressPercentage = useMemo(
    () => Math.round((completedCount / TOTAL_PROGRAM_DAYS) * 100),
    [completedCount]
  );

  const todayReading = useMemo(() => {
    if (allReadings.length === 0) return null;
    const today = new Date();
    const todayIso = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString().slice(0, 10);
    const exact = allReadings.find((r) => r.date === todayIso);
    if (exact) return exact;
    return allReadings.find((r) => !isCompleted(r.id)) || allReadings[0];
  }, [allReadings, isCompleted]);

  const toggleReadingComplete = async (reading: Reading) => {
    if (!user) return navigate('/auth');

    const existing = userProgress.find((p) => p.reading_id === reading.id);
    const wasCompleted = existing?.completed;

    try {
      if (existing) {
        await supabase
          .from('user_reading_progress')
          .update({
            completed: !existing.completed,
            completed_at: !existing.completed ? new Date().toISOString() : null,
          })
          .eq('user_id', user.id)
          .eq('reading_id', reading.id);
      } else {
        await supabase.from('user_reading_progress').insert({
          user_id: user.id,
          reading_id: reading.id,
          completed: true,
          completed_at: new Date().toISOString(),
        });
      }

      await loadUserProgress();

      if (!wasCompleted) {
        setQuizReading(reading);
        setShowQuiz(true);
        toast({ title: t('biblicalReading.readingCompleted') });
      }
    } catch (error) {
      logger.error(
        'Erreur mise à jour progression',
        { readingId: reading.id, userId: user.id },
        error instanceof Error ? error : new Error(String(error))
      );
      toast({
        title: t('common.error'),
        description: t('biblicalReading.updateError'),
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (selectedDayReading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="pt-16 pb-8">
          <section className="py-4">
            <div className="container mx-auto px-4 max-w-4xl">
              <DayReadingViewer reading={selectedDayReading} onClose={() => setSelectedDayReading(null)} />
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
        <section className="border-b border-border/60 bg-card">
          <div className="container mx-auto px-4 max-w-6xl py-6 space-y-4">
            <div className="space-y-1">
              <h1 className="text-3xl md:text-4xl font-cinzel font-bold text-foreground">{t('biblicalReading.title')}</h1>
              <p className="text-sm text-muted-foreground">{t('biblicalReading.subtitle')}</p>
            </div>

            {todayReading && (
              <button
                type="button"
                onClick={() => setSelectedDayReading(todayReading)}
                className="w-full text-left rounded-xl border border-border bg-background p-4 hover:bg-muted/30 transition-colors"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-primary text-xs font-semibold uppercase tracking-wider">
                      <Flame className="w-4 h-4" />
                      Lecture du jour
                    </div>
                    <p className="text-base md:text-lg font-semibold text-foreground">
                      Jour {todayReading.day_number} · {translateBookName(todayReading.books, i18n.language)} {todayReading.chapters}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock3 className="w-3.5 h-3.5" />
                      {new Date(todayReading.date).toLocaleDateString(getLocale(), {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">Progression</div>
                    <div className="text-xl font-cinzel font-bold text-primary">{progressPercentage}%</div>
                  </div>
                </div>
                <div className="mt-3">
                  <Progress value={progressPercentage} className="h-2" />
                </div>
              </button>
            )}
          </div>
        </section>

        <section className="container mx-auto px-4 max-w-6xl py-6">
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
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {completedCount}/{TOTAL_PROGRAM_DAYS} {t('biblicalReading.completedLabel')}
                  </span>
                  <span className="font-cinzel font-bold text-primary">{progressPercentage}%</span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setSelectedMonth('all')}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      selectedMonth === 'all'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {t('biblicalReading.all')}
                  </button>
                  {monthsOrder.map((month) => {
                    const [m, y] = month.key.split('-').map(Number);
                    const hasReadings = allReadings.some((r) => r.month === m && r.year === y);
                    if (!hasReadings) return null;

                    return (
                      <button
                        key={month.key}
                        onClick={() => setSelectedMonth(month.key)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                          selectedMonth === month.key
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        {month.name}
                      </button>
                    );
                  })}
                </div>

                <div className="flex gap-1.5 flex-wrap">
                  {[
                    { key: 'all', label: t('biblicalReading.all') },
                    { key: 'old', label: t('biblicalReading.oldTestament') },
                    { key: 'new', label: t('biblicalReading.newTestament') },
                  ].map((f) => (
                    <button
                      key={f.key}
                      onClick={() => setSelectedTestament(f.key as 'all' | 'old' | 'new')}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        selectedTestament === f.key
                          ? 'bg-secondary text-secondary-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="divide-y divide-border border border-border rounded-xl overflow-hidden">
                {filteredReadings.map((reading) => {
                  const completed = isCompleted(reading.id);

                  return (
                    <div key={reading.id} className={`p-4 flex items-start gap-3 ${completed ? 'bg-muted/20' : 'bg-background'}`}>
                      <div className="w-12 flex-shrink-0 text-center">
                        <p className="text-lg font-cinzel font-bold text-primary leading-none">{reading.day_number}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {new Date(reading.date).toLocaleDateString(getLocale(), {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </p>
                      </div>

                      <div className="flex-1 min-w-0 space-y-1">
                        <button
                          className="text-left font-semibold text-sm text-foreground hover:text-primary transition-colors leading-snug"
                          onClick={() => setSelectedDayReading(reading)}
                        >
                          {translateBookName(reading.books, i18n.language)} {reading.chapters}
                        </button>
                        <p className="text-xs text-muted-foreground">
                          {reading.chapters_count}{' '}
                          {reading.chapters_count > 1
                            ? t('biblicalReading.chaptersPlural')
                            : t('biblicalReading.chapters')}
                        </p>
                        {reading.comment && <p className="text-xs italic text-muted-foreground/80 line-clamp-1">{reading.comment}</p>}
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        {completed && (
                          <button
                            onClick={() => {
                              setQuizReading(reading);
                              setShowQuiz(true);
                            }}
                            className="p-1.5 rounded-full hover:bg-muted transition-colors"
                            title="Quiz"
                          >
                            <Brain className="w-4 h-4 text-primary" />
                          </button>
                        )}

                        <button
                          onClick={() => toggleReadingComplete(reading)}
                          className={`p-1.5 rounded-full transition-colors ${
                            completed ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:bg-muted'
                          }`}
                          title={completed ? t('biblicalReading.completed') : t('biblicalReading.markAsRead')}
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
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
        <QuizModal
          reading={quizReading}
          isOpen={showQuiz}
          onClose={() => {
            setShowQuiz(false);
            setQuizReading(null);
          }}
        />
      )}
    </div>
  );
};

export default BiblicalReading;
