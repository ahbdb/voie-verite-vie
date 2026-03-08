import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Users, BookOpen } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import heroCathedral from '@/assets/hero-cathedral.jpg';
import logo3v from '@/assets/logo-3v.png';

function getTimeGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bonjour';
  if (h < 18) return 'Bon après-midi';
  return 'Bonsoir';
}

const prayers = [
  "Seigneur, guide mes pas sur ton chemin de lumière.",
  "Accorde-moi la sagesse de comprendre ta Parole.",
  "Que ton Esprit Saint m'accompagne en ce jour.",
  "Ouvre mon cœur à ta vérité, Seigneur.",
  "Bénis cette journée et ceux que j'aime.",
];

// Versets bibliques enrichis
const biblicalVerses = [
  { text: "Je suis le chemin, la vérité et la vie.", ref: "Jean 14:6" },
  { text: "Vous connaîtrez la vérité, et la vérité vous affranchira.", ref: "Jean 8:32" },
  { text: "Ne vous conformez pas au monde actuel.", ref: "Romains 12:2" },
  { text: "Car je connais les projets que j'ai formés sur vous, dit l'Éternel.", ref: "Jérémie 29:11" },
  { text: "L'Éternel est mon berger : je ne manquerai de rien.", ref: "Psaume 23:1" },
  { text: "Ta parole est une lampe à mes pieds, une lumière sur mon sentier.", ref: "Psaume 119:105" },
  { text: "Demeurez en moi, et je demeurerai en vous.", ref: "Jean 15:4" },
  { text: "Tout est possible à celui qui croit.", ref: "Marc 9:23" },
  { text: "Heureux les artisans de paix, car ils seront appelés fils de Dieu.", ref: "Matthieu 5:9" },
  { text: "L'amour est patient, l'amour est serviable.", ref: "1 Corinthiens 13:4" },
  { text: "Remets ton sort à l'Éternel, et il te soutiendra.", ref: "Psaume 55:23" },
  { text: "Fortifiez-vous et ayez du courage !", ref: "Josué 1:9" },
];

interface TodayReading {
  books: string;
  chapters: string;
  day_number: number;
}

const HeroSection = () => {
  const { user } = useAuth();
  const [currentVerse, setCurrentVerse] = useState(0);
  const [todayReading, setTodayReading] = useState<TodayReading | null>(null);

  const userName = useMemo(() => {
    const metaName = (user?.user_metadata as any)?.full_name as string | undefined;
    return metaName || user?.email?.split('@')[0] || '';
  }, [user]);

  const todayPrayer = useMemo(() => {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    return prayers[dayOfYear % prayers.length];
  }, []);

  // Fetch today's reading
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    (supabase as any)
      .from('biblical_readings')
      .select('books, chapters, day_number')
      .eq('date', today)
      .limit(1)
      .single()
      .then(({ data }: any) => {
        if (data) setTodayReading(data);
      });
  }, []);

  // Rotate verses faster (2.5s)
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentVerse((prev) => (prev + 1) % biblicalVerses.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  // Animated letters for title
  const titleWords = ["Voie,", "Vérité,", "Vie"];

  return (
    <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden">
      {/* Background */}
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

      {/* Content */}
      <div className="relative z-10 text-center px-4 sm:px-6 max-w-2xl mx-auto flex flex-col items-center pt-20">
        {/* Logo */}
        <motion.img
          src={logo3v}
          alt="Logo 3V"
          className="h-16 sm:h-20 w-auto mb-5 drop-shadow-2xl"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        />

        {/* Animated Title */}
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

        {/* Divider */}
        <motion.div
          className="w-16 h-[2px] bg-accent mb-5"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.5, delay: 0.9 }}
        />

        {/* Subtitle */}
        <motion.p
          className="text-[#ffffffcc] text-sm sm:text-base mb-5 max-w-md leading-relaxed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          Un sanctuaire spirituel pour la jeunesse catholique
        </motion.p>

        {/* Greeting box with prayer (logged-in users) */}
        {user && (
          <motion.div
            className="w-full max-w-md mb-6 rounded-xl border border-white/20 bg-white/10 px-5 py-4 text-left"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
          >
            <p className="text-white font-semibold text-base mb-1.5">
              {getTimeGreeting()}{userName ? `, ${userName}` : ''} 🙏
            </p>
            <p className="text-[#ffffffaa] text-sm italic leading-relaxed">
              « {todayPrayer} »
            </p>
            {todayReading && (
              <div className="mt-3 flex items-center gap-2 text-accent text-xs font-medium">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Lecture du jour : {todayReading.books} {todayReading.chapters} (Jour {todayReading.day_number})</span>
              </div>
            )}
          </motion.div>
        )}

        {/* CTA Buttons */}
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
              Rejoignez-nous
            </Link>
          </Button>
          <Button
            variant="outline"
            size="lg"
            asChild
            className="w-full sm:w-auto px-8 py-5 border-white/50 text-white bg-white/10 hover:bg-white/20 rounded-full"
          >
            <Link to="/about">
              En savoir plus
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </Button>
        </motion.div>

        {/* Rotating verses at bottom */}
        <motion.div
          className="w-full max-w-lg min-h-[3rem] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
        >
          <AnimatePresence mode="wait">
            <motion.p
              key={currentVerse}
              className="text-[#ffffffd0] text-xs sm:text-sm font-playfair italic text-center"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3 }}
            >
              « {biblicalVerses[currentVerse].text} »
              <span className="block text-accent text-[10px] sm:text-xs mt-0.5 not-italic">
                — {biblicalVerses[currentVerse].ref}
              </span>
            </motion.p>
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
