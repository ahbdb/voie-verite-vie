import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Heart, BookOpen, MessageCircle, Youtube, Users } from 'lucide-react';
import { AnimatedSection } from '@/components/AnimatedSection';
import heroDove from '@/assets/hero-dove.jpg';
import logo3v from '@/assets/logo-3v.png';
import { useAuth } from '@/hooks/useAuth';

type GreetingLocation = { city?: string; country?: string };

function getTimeGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bonjour';
  if (h < 18) return 'Bon après-midi';
  return 'Bonsoir';
}

function pickPrayerIntention(seed: string) {
  const intentions = [
    'Que le Seigneur te garde dans la paix aujourd\'hui.',
    'Que l\'Esprit Saint éclaire tes décisions.',
    'Que Jésus te donne force et courage face aux défis du jour.',
    'Que Marie t\'accompagne et te conduise vers le Christ.',
    'Que la Parole de Dieu transforme ton cœur et ton regard.',
  ];
  const day = new Date().toISOString().slice(0, 10);
  let hash = 0;
  const str = `${seed}-${day}`;
  for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  return intentions[hash % intentions.length];
}

const HeroSection = () => {
  const { user } = useAuth();
  const [currentVerse, setCurrentVerse] = useState(0);
  const [location, setLocation] = useState<GreetingLocation | null>(null);
  const [showCommunityOptions, setShowCommunityOptions] = useState(false);

  const userName = useMemo(() => {
    const metaName = (user?.user_metadata as any)?.full_name as string | undefined;
    return metaName || user?.email?.split('@')[0] || '';
  }, [user]);

  const intention = useMemo(() => pickPrayerIntention(user?.id ?? 'device'), [user?.id]);

  useEffect(() => {
    const CACHE_KEY = 'greeting_location_cache_v1';
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { ts: number; location: GreetingLocation };
        if (Date.now() - parsed.ts < 1000 * 60 * 60 * 24) {
          setLocation(parsed.location);
          return;
        }
      }
    } catch { /* ignore */ }

    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`;
          const res = await fetch(url);
          if (!res.ok) return;
          const data = await res.json();
          const loc: GreetingLocation = {
            city: data?.address?.city || data?.address?.town || data?.address?.village,
            country: data?.address?.country,
          };
          setLocation(loc);
          try { localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), location: loc })); } catch { /* ignore */ }
        } catch { /* ignore */ }
      },
      () => { /* ignore denial */ },
      { enableHighAccuracy: false, timeout: 6000, maximumAge: 1000 * 60 * 60 }
    );
  }, []);

  const place = location?.city
    ? `depuis ${location.city}${location.country ? `, ${location.country}` : ''}`
    : location?.country
      ? `depuis ${location.country}`
      : null;

  const biblicalVerses = [
    { text: "Je suis le chemin, la vérité et la vie. Nul ne vient au Père que par moi.", reference: "Jean 14:6" },
    { text: "Ne vous conformez pas au monde actuel, mais soyez transformés par le renouvellement de l'intelligence.", reference: "Romains 12:2" },
    { text: "Fuyez l'immoralité sexuelle. Tout autre péché qu'un homme peut commettre est extérieur au corps.", reference: "1 Corinthiens 6:18" },
    { text: "Vous connaîtrez la vérité, et la vérité vous affranchira.", reference: "Jean 8:32" },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentVerse((prev) => (prev + 1) % biblicalVerses.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [biblicalVerses.length]);

  return (
    <section className="hero-section min-h-screen flex items-center relative pt-16 dark:bg-slate-950 dark:text-slate-100">
      {/* Background image with parallax feel */}
      <motion.div
        className="absolute inset-0 z-0"
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.8, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <img
          src={heroDove}
          alt="Colombe spirituelle symbolisant la paix divine"
          className="w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-sky-blue/20 via-transparent to-life-green/10" />
      </motion.div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Logo */}
          <AnimatedSection delay={0.1} direction="none" duration={0.8}>
            <motion.div
              className="inline-flex items-center justify-center mb-6 dark:bg-transparent dark:shadow-none"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <img
                src={logo3v}
                alt="Logo 3V - Voie, Vérité, Vie"
                className="h-32 w-auto divine-glow dark:shadow-none dark:drop-shadow-none"
              />
            </motion.div>
          </AnimatedSection>

          <AnimatedSection delay={0.2} duration={0.8}>
            <h1 className="text-5xl md:text-7xl font-playfair font-bold text-foreground mb-4">
              Voie, Vérité, Vie
            </h1>
            <div className="w-24 h-1 bg-gradient-peace mx-auto mb-6" />
          </AnimatedSection>

          {/* Personalized greeting */}
          {user && (
            <AnimatedSection delay={0.35} duration={0.6}>
              <div className="mb-8 p-4 bg-white/70 backdrop-blur-sm rounded-xl shadow-md max-w-xl mx-auto dark:bg-slate-900/80 dark:text-slate-100">
                <p className="text-base md:text-lg font-medium text-foreground dark:text-slate-100">
                  {getTimeGreeting()}
                  {userName ? `, ${userName}` : ''} {place ? `(${place})` : ''}
                </p>
                <p className="text-sm text-muted-foreground dark:text-slate-300">{intention}</p>
              </div>
            </AnimatedSection>
          )}

          {/* Slogan */}
          <AnimatedSection delay={0.4} duration={0.7}>
            <h2 className="text-2xl md:text-4xl font-playfair font-medium text-primary mb-6">
              Trouvez la paix en Christ
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-12">
              Un sanctuaire spirituel et un phare d'espérance pour la jeunesse confrontée
              aux défis moraux de notre société moderne
            </p>
          </AnimatedSection>

          {/* Biblical verse carousel */}
          <AnimatedSection delay={0.6} duration={0.7}>
            <div className="mb-12 p-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg max-w-3xl mx-auto border border-primary/20 dark:bg-slate-900/90 dark:border-slate-700 dark:text-slate-100">
              <div className="min-h-[120px] flex items-center justify-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentVerse}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="text-center"
                  >
                    <blockquote className="verse-highlight text-lg md:text-xl mb-4 leading-relaxed dark:text-slate-100">
                      {biblicalVerses[currentVerse].text}
                    </blockquote>
                    <cite className="text-divine-gold-deep font-medium dark:text-divine-gold">
                      — {biblicalVerses[currentVerse].reference}
                    </cite>
                  </motion.div>
                </AnimatePresence>
              </div>
              <div className="flex justify-center space-x-2 mt-6">
                {biblicalVerses.map((_, index) => (
                  <button
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      index === currentVerse ? 'bg-primary w-6' : 'bg-muted'
                    }`}
                    onClick={() => setCurrentVerse(index)}
                  />
                ))}
              </div>
            </div>
          </AnimatedSection>

          {/* Action buttons */}
          <AnimatedSection delay={0.8} duration={0.6}>
            <AnimatePresence mode="wait">
              {!showCommunityOptions ? (
                <motion.div
                  key="main-buttons"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col sm:flex-row items-center justify-center gap-4"
                >
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                    <Button
                      size="lg"
                      className="divine-glow text-lg px-8 py-6 bg-gradient-peace transition-all duration-300"
                      onClick={() => setShowCommunityOptions(true)}
                    >
                      <Users className="mr-2 w-5 h-5" />
                      Rejoignez notre communauté
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                    <Button
                      variant="outline"
                      size="lg"
                      className="text-lg px-8 py-6 border-2 border-primary/30 hover:bg-primary/5 transition-all duration-300"
                      asChild
                    >
                      <Link to="/activities">
                        <BookOpen className="mr-2 w-5 h-5" />
                        Découvrir nos activités
                      </Link>
                    </Button>
                  </motion.div>
                </motion.div>
              ) : (
                <motion.div
                  key="community-options"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto"
                >
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <Button size="lg" className="w-full divine-glow text-lg px-8 py-6 bg-gradient-peace transition-all duration-300" asChild>
                      <Link to="/auth"><Heart className="mr-2 w-5 h-5" />Créer un compte</Link>
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <Button size="lg" className="w-full text-lg px-8 py-6 bg-green-600 hover:bg-green-700 transition-all duration-300 text-white" asChild>
                      <a href="https://chat.whatsapp.com/FfvCe9nHwpj5OYoDZBfGER" target="_blank" rel="noopener noreferrer">
                        <MessageCircle className="mr-2 w-5 h-5" />Groupe WhatsApp
                      </a>
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <Button size="lg" className="w-full text-lg px-8 py-6 bg-green-600 hover:bg-green-700 transition-all duration-300 text-white" asChild>
                      <a href="https://whatsapp.com/channel/0029VbB0GplLY6d6hkP5930J" target="_blank" rel="noopener noreferrer">
                        <MessageCircle className="mr-2 w-5 h-5" />Chaîne WhatsApp
                      </a>
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <Button size="lg" className="w-full text-lg px-8 py-6 bg-red-600 hover:bg-red-700 transition-all duration-300 text-white" asChild>
                      <a href="https://youtube.com/@voie-verite-vie?si=qD8LmbyREJdQm1Db" target="_blank" rel="noopener noreferrer">
                        <Youtube className="mr-2 w-5 h-5" />Chaîne YouTube
                      </a>
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="col-span-full md:col-span-2">
                    <Button size="lg" variant="outline" className="w-full text-lg px-8 py-6 transition-all duration-300" onClick={() => setShowCommunityOptions(false)}>
                      Revenir
                    </Button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </AnimatedSection>

          {/* Stats */}
          <AnimatedSection delay={1} duration={0.7}>
            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto dark:text-slate-100">
              {[
                { value: '73', label: 'Livres de la Bible', color: 'text-primary' },
                { value: '358', label: 'Jours de lecture', color: 'text-secondary' },
                { value: '2024', label: 'Année de fondation', color: 'text-accent' },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  className="text-center"
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 1 + i * 0.15 }}
                >
                  <div className={`text-3xl font-bold ${stat.color} mb-2`}>{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="w-6 h-10 border-2 border-primary/30 rounded-full flex justify-center">
          <motion.div
            className="w-1 h-3 bg-primary rounded-full mt-2"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
