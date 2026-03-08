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
    <section className="relative h-[85vh] min-h-[500px] flex items-center justify-center overflow-hidden">
      {/* Full-screen background */}
      <motion.div
        className="absolute inset-0 z-0"
        initial={{ scale: 1.08 }}
        animate={{ scale: 1 }}
        transition={{ duration: 8, ease: 'easeOut' }}
      >
        <img
          src={heroCathedral}
          alt="Cathédrale illuminée"
          className="w-full h-full object-cover"
        />
      </motion.div>
      <div className="absolute inset-0 z-[1] bg-gradient-to-b from-black/60 via-black/40 to-black/70" />

      <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
        <motion.img
          src={logo3v}
          alt="Logo 3V"
          className="h-16 w-auto mx-auto mb-4 drop-shadow-2xl"
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        />

        {user && (
          <motion.p
            className="text-white/80 text-sm tracking-widest uppercase mb-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {getTimeGreeting()}{userName ? `, ${userName}` : ''}
          </motion.p>
        )}

        <motion.h1
          className="text-4xl sm:text-5xl md:text-7xl font-playfair font-bold text-white mb-4 drop-shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          Voie, Vérité, Vie
        </motion.h1>

        <motion.div
          className="w-16 h-0.5 bg-accent mx-auto mb-5"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        />

        {/* Rotating verse */}
        <div className="h-14 mb-6 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={currentVerse}
              className="text-white/90 text-base md:text-lg font-playfair italic max-w-xl"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4 }}
            >
              « {biblicalVerses[currentVerse].text} »
              <span className="block text-accent text-xs mt-1 not-italic font-inter">
                — {biblicalVerses[currentVerse].reference}
              </span>
            </motion.p>
          </AnimatePresence>
        </div>

        {/* CTA */}
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-3"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <Button
            size="lg"
            className="px-6 py-5 bg-white text-foreground hover:bg-white/90 shadow-xl"
            asChild
          >
            <Link to="/auth">
              <Users className="mr-2 w-4 h-4" />
              Rejoignez-nous
            </Link>
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="px-6 py-5 border-white/40 text-white hover:bg-white/10 backdrop-blur-sm"
            asChild
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
