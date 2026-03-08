import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { ArrowRight, Users, BookOpen } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import bibleBooksData from '@/data/bible-books.json';
import { loadBibleChapter, type BibleVerse } from '@/lib/bible-content-loader';
import heroCathedral from '@/assets/hero-cathedral.jpg';
import logo3v from '@/assets/logo-3v.png';

function getTimeGreeting(t: (key: string) => string) {
  const h = new Date().getHours();
  if (h < 12) return t('hero.goodMorning');
  if (h < 18) return t('hero.goodAfternoon');
  return t('hero.goodEvening');
}

function getPersonalPrayer(fullName: string | null, t: (key: string, opts?: any) => string): string {
  const firstName = fullName?.split(' ')[0] || '';
  const name = firstName || t('common.member');
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const prayers = [
    t('prayers.prayer1', { name }),
    t('prayers.prayer2', { name }),
    t('prayers.prayer3', { name }),
    t('prayers.prayer4', { name }),
    t('prayers.prayer5', { name }),
    t('prayers.prayer6', { name }),
    t('prayers.prayer7', { name }),
  ];
  return prayers[dayOfYear % prayers.length];
}

const fallbackVerses = [
  { text: "Je suis le chemin, la vérité et la vie.", ref: "Jean 14:6" },
  { text: "Vous connaîtrez la vérité, et la vérité vous affranchira.", ref: "Jean 8:32" },
  { text: "Ta parole est une lampe à mes pieds, une lumière sur mon sentier.", ref: "Psaume 119:105" },
  { text: "Tout est possible à celui qui croit.", ref: "Marc 9:23" },
];

interface TodayReading {
  books: string;
  chapters: string;
  day_number: number;
}

interface DisplayVerse {
  text: string;
  ref: string;
}

function bookNameToFileName(frenchName: string): string | null {
  const book = (bibleBooksData.books as any[]).find(
    (b) => b.name.toLowerCase() === frenchName.trim().toLowerCase()
  );
  return book?.fileName || null;
}

function parseChapters(chapters: string): number[] {
  const result: number[] = [];
  for (const part of chapters.split(',')) {
    const trimmed = part.trim();
    if (trimmed.includes('-')) {
      const [start, end] = trimmed.split('-').map(Number);
      for (let i = start; i <= end; i++) result.push(i);
    } else {
      const n = Number(trimmed);
      if (!isNaN(n)) result.push(n);
    }
  }
  return result;
}

const HeroSection = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [currentVerse, setCurrentVerse] = useState(0);
  const [todayReading, setTodayReading] = useState<TodayReading | null>(null);
  const [verses, setVerses] = useState<DisplayVerse[]>(fallbackVerses);

  const userName = useMemo(() => {
    const metaName = (user?.user_metadata as any)?.full_name as string | undefined;
    return metaName || user?.email?.split('@')[0] || '';
  }, [user]);

  const todayPrayer = useMemo(() => {
    return getPersonalPrayer(userName || null, t);
  }, [userName, t]);

  const loadTodayVerses = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await (supabase as any)
        .from('biblical_readings')
        .select('books, chapters, day_number')
        .eq('date', today)
        .limit(1)
        .single();

      if (!data) return;
      setTodayReading(data);

      const fileName = bookNameToFileName(data.books);
      if (!fileName) return;

      const chapterNums = parseChapters(data.chapters);
      const allVerses: DisplayVerse[] = [];

      for (const chNum of chapterNums) {
        const chVerses = await loadBibleChapter(fileName, chNum);
        if (chVerses && chVerses.length > 0) {
          const step = Math.max(1, Math.floor(chVerses.length / 4));
          for (let i = 0; i < chVerses.length; i += step) {
            const v = chVerses[i];
            if (v.text && v.text.trim().length > 20 && v.text.trim().length < 200) {
              allVerses.push({
                text: v.text.trim(),
                ref: `${data.books} ${chNum}:${v.number}`,
              });
            }
          }
        }
      }

      if (allVerses.length > 0) {
        setVerses(allVerses);
      }
    } catch (e) {
      // Keep fallback verses
    }
  }, []);

  useEffect(() => {
    loadTodayVerses();
  }, [loadTodayVerses]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentVerse((prev) => (prev + 1) % verses.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [verses.length]);

  const titleWords = ["Voie,", "Vérité,", "Vie"];

  return (
    <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <motion.img
          src={heroCathedral}
          alt=""
          className="w-full h-full object-cover"
          initial={{ scale: 1.12 }}
          animate={{ scale: 1 }}
          transition={{ duration: 14, ease: 'easeOut' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />
      </div>

      <div className="relative z-10 text-center px-4 sm:px-6 max-w-2xl mx-auto flex flex-col items-center pt-20">
        <motion.img
          src={logo3v}
          alt="Logo 3V"
          className="h-32 sm:h-44 md:h-52 w-auto mb-6 drop-shadow-2xl"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        />

        <motion.h1
          className="text-4xl sm:text-5xl md:text-6xl font-playfair font-bold text-white mb-3 leading-tight drop-shadow-lg flex flex-wrap items-center justify-center gap-x-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {titleWords.map((word, i) => (
            <motion.span
              key={word}
              className={i === 2 ? "text-accent" : ""}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 + i * 0.2 }}
            >
              {word}
            </motion.span>
          ))}
        </motion.h1>

        <motion.div
          className="w-16 h-[2px] bg-accent mb-5"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.5, delay: 0.9 }}
        />

        <motion.p
          className="text-[#ffffffcc] text-sm sm:text-base mb-5 max-w-md leading-relaxed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          {t('hero.subtitle')}
        </motion.p>

        {user && (
          <motion.div
            className="w-full max-w-md mb-6 rounded-xl border border-white/20 bg-white/10 px-5 py-4 text-left"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
          >
            <p className="text-white font-semibold text-base mb-1.5">
              {getTimeGreeting(t)}{userName ? `, ${userName}` : ''} 🙏
            </p>
            <p className="text-[#ffffffaa] text-sm italic leading-relaxed">
              « {todayPrayer} »
            </p>
            {todayReading && (
              <Link
                to="/biblical-reading"
                className="mt-3 flex items-center gap-2 text-accent text-xs font-medium hover:underline"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>📖 {t('hero.readingOfDay', { books: todayReading.books, chapters: todayReading.chapters, day: todayReading.day_number })}</span>
              </Link>
            )}
          </motion.div>
        )}

        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full mb-6"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
        >
          <Button
            size="lg"
            asChild
            className="w-full sm:w-auto px-8 py-5 bg-primary text-primary-foreground font-semibold hover:bg-primary/90 shadow-xl rounded-full"
          >
            <Link to="/auth">
              <Users className="mr-2 w-5 h-5" />
              {t('common.joinUs')}
            </Link>
          </Button>
          <Button
            variant="outline"
            size="lg"
            asChild
            className="w-full sm:w-auto px-8 py-5 border-white/50 text-white bg-white/10 hover:bg-white/20 rounded-full"
          >
            <Link to="/about">
              {t('common.learnMore')}
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </Button>
        </motion.div>

        <motion.div
          className="w-full max-w-lg min-h-[3.5rem] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
        >
          <AnimatePresence mode="wait">
            <motion.p
              key={currentVerse}
              className="text-[#ffffffd0] text-xs sm:text-sm font-playfair italic text-center leading-relaxed"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
            >
              « {verses[currentVerse]?.text} »
              <span className="block text-accent text-[10px] sm:text-xs mt-0.5 not-italic font-medium">
                — {verses[currentVerse]?.ref}
              </span>
            </motion.p>
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
