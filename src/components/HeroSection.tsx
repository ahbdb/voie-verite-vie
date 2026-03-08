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
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      {/* Full-screen background with slow zoom */}
      <motion.div
        className="absolute inset-0 z-0"
        initial={{ scale: 1.15 }}
        animate={{ scale: 1 }}
        transition={{ duration: 12, ease: 'easeOut' }}
      >
        <img
          src={heroCathedral}
          alt="Cathédrale illuminée par la lumière divine"
          className="w-full h-full object-cover"
        />
      </motion.div>

      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-b from-black/60 via-black/40 to-black/70" />

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
        {/* Logo */}
        <motion.img
          src={logo3v}
          alt="Logo 3V"
          className="h-20 w-auto mx-auto mb-8 drop-shadow-2xl"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        />

        {/* Greeting */}
        {user && (
          <motion.p
            className="text-white/80 text-sm tracking-widest uppercase mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {getTimeGreeting()}{userName ? `, ${userName}` : ''}
          </motion.p>
        )}

        {/* Main title */}
        <motion.h1
          className="text-5xl sm:text-6xl md:text-8xl font-playfair font-bold text-white mb-6 drop-shadow-lg"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          Voie, Vérité, Vie
        </motion.h1>

        {/* Divider */}
        <motion.div
          className="w-20 h-0.5 bg-accent mx-auto mb-8"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        />

        {/* Rotating verse */}
        <div className="h-16 mb-10 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={currentVerse}
              className="text-white/90 text-lg md:text-xl font-playfair italic max-w-xl"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5 }}
            >
              « {biblicalVerses[currentVerse].text} »
              <span className="block text-accent text-sm mt-2 not-italic font-inter">
                — {biblicalVerses[currentVerse].reference}
              </span>
            </motion.p>
          </AnimatePresence>
        </div>

        {/* CTA */}
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1.1 }}
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
            <Button
              size="lg"
              className="text-lg px-8 py-6 bg-white text-foreground hover:bg-white/90 shadow-xl"
              asChild
            >
              <Link to="/auth">
                <Users className="mr-2 w-5 h-5" />
                Rejoignez-nous
              </Link>
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
            <Button
              variant="outline"
              size="lg"
              className="text-lg px-8 py-6 border-white/40 text-white hover:bg-white/10 backdrop-blur-sm"
              asChild
            >
              <Link to="/about">
                En savoir plus
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
          <motion.div
            className="w-1 h-3 bg-white/60 rounded-full mt-2"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
