import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Users } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import heroCathedral from '@/assets/hero-cathedral.jpg';
import logo3v from '@/assets/logo-3v.png';

function getTimeGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bonjour';
  if (h < 18) return 'Bon après-midi';
  return 'Bonsoir';
}

const biblicalVerses = [
  { text: "Je suis le chemin, la vérité et la vie.", reference: "Jean 14:6" },
  { text: "Vous connaîtrez la vérité, et la vérité vous affranchira.", reference: "Jean 8:32" },
  { text: "Ne vous conformez pas au monde actuel.", reference: "Romains 12:2" },
];

const HeroSection = () => {
  const { user } = useAuth();
  const [currentVerse, setCurrentVerse] = useState(0);

  const userName = useMemo(() => {
    const metaName = (user?.user_metadata as any)?.full_name as string | undefined;
    return metaName || user?.email?.split('@')[0] || '';
  }, [user]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentVerse((prev) => (prev + 1) % biblicalVerses.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background image with subtle zoom */}
      <div className="absolute inset-0 z-0">
        <motion.img
          src={heroCathedral}
          alt=""
          className="w-full h-full object-cover"
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 12, ease: 'easeOut' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-2xl mx-auto flex flex-col items-center">
        {/* Logo */}
        <motion.img
          src={logo3v}
          alt="Logo 3V"
          className="h-20 sm:h-24 w-auto mb-6 drop-shadow-2xl"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.1 }}
        />

        {/* Greeting for logged-in users */}
        {user && (
          <motion.p
            className="text-[#ffffffb3] text-sm tracking-widest uppercase mb-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {getTimeGreeting()}{userName ? `, ${userName}` : ''}
          </motion.p>
        )}

        {/* Title */}
        <motion.h1
          className="text-4xl sm:text-5xl md:text-6xl font-playfair font-bold text-white mb-3 leading-tight drop-shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
        >
          Voie, Vérité, Vie
        </motion.h1>

        {/* Divider */}
        <motion.div
          className="w-16 h-[2px] bg-accent mb-5"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        />

        {/* Subtitle */}
        <motion.p
          className="text-[#ffffffcc] text-sm sm:text-base mb-6 max-w-md leading-relaxed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Un sanctuaire spirituel pour la jeunesse catholique, fondé sur la Parole de Dieu
        </motion.p>

        {/* Rotating verse */}
        <div className="min-h-[3.5rem] mb-8 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={currentVerse}
              className="text-[#ffffffd9] text-sm md:text-base font-playfair italic max-w-lg"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35 }}
            >
              « {biblicalVerses[currentVerse].text} »
              <span className="block text-accent text-xs mt-1 not-italic">
                — {biblicalVerses[currentVerse].reference}
              </span>
            </motion.p>
          </AnimatePresence>
        </div>

        {/* CTA Buttons — using Link for reliable navigation */}
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
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
      </div>
    </section>
  );
};

export default HeroSection;
