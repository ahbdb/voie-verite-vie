import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, BookOpen, Calendar, Heart, MessageCircle, Youtube } from 'lucide-react';
import { AnimatedSection } from '@/components/AnimatedSection';
import activityBible from '@/assets/activity-bible-study.jpg';
import activityCommunity from '@/assets/activity-community.jpg';
import activityConference from '@/assets/activity-conference.jpg';
import activityCreative from '@/assets/activity-creative.jpg';
import activityMeditation from '@/assets/activity-meditation.jpg';
import ctaMary from '@/assets/cta-mary.jpg';

const activities = [
  { title: 'Lecture Biblique', desc: '73 livres en 358 jours', image: activityBible, link: '/biblical-reading', icon: BookOpen },
  { title: 'Communauté', desc: 'Priez et partagez ensemble', image: activityCommunity, link: '/prayer-forum', icon: Heart },
  { title: 'Conférences', desc: 'Enseignements et formations', image: activityConference, link: '/activities', icon: Calendar },
  { title: 'Neuvaines', desc: 'Parcours de prière guidée', image: activityCreative, link: '/neuvaines', icon: Heart },
  { title: 'Méditation', desc: 'Carême et chemin de croix', image: activityMeditation, link: '/careme-2026', icon: BookOpen },
];

const ActivitiesSection = () => {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <AnimatedSection className="flex items-end justify-between mb-12">
          <div>
            <p className="text-sm tracking-[0.3em] uppercase text-muted-foreground mb-3">Découvrir</p>
            <h2 className="text-3xl md:text-4xl font-playfair font-bold text-foreground">
              Nos activités
            </h2>
          </div>
          <motion.div whileHover={{ x: 4 }} className="hidden sm:block">
            <Button variant="ghost" asChild className="gap-2">
              <Link to="/activities">
                Tout voir <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </motion.div>
        </AnimatedSection>
      </div>

      {/* Horizontal scrolling carousel — full bleed */}
      <div className="flex gap-5 overflow-x-auto pb-6 px-4 snap-x snap-mandatory scrollbar-hide">
        {/* Left spacer for container alignment */}
        <div className="min-w-[max(0px,calc((100vw-1400px)/2+2rem-1rem))] shrink-0" />

        {activities.map((activity, index) => (
          <motion.div
            key={activity.title}
            className="min-w-[280px] sm:min-w-[320px] snap-center shrink-0"
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-20px' }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Link to={activity.link}>
              <motion.div
                className="group relative rounded-2xl overflow-hidden h-[360px] bg-card shadow-md"
                whileHover={{ y: -6 }}
                transition={{ type: 'spring' as const, stiffness: 300, damping: 25 }}
              >
                <motion.img
                  src={activity.image}
                  alt={activity.title}
                  className="w-full h-full object-cover"
                  whileHover={{ scale: 1.06 }}
                  transition={{ duration: 0.5 }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <div className="flex items-center gap-2 mb-2">
                    <activity.icon className="w-4 h-4 text-accent" />
                    <p className="text-xs tracking-wider uppercase text-white/60">{activity.desc}</p>
                  </div>
                  <h3 className="text-xl font-playfair font-semibold">{activity.title}</h3>
                </div>
              </motion.div>
            </Link>
          </motion.div>
        ))}

        {/* Right spacer */}
        <div className="min-w-[max(0px,calc((100vw-1400px)/2+2rem-1rem))] shrink-0" />
      </div>

      <div className="container mx-auto px-4 mt-6 sm:hidden">
        <Button variant="outline" asChild className="w-full gap-2">
          <Link to="/activities">
            Voir toutes les activités <ArrowRight className="w-4 h-4" />
          </Link>
        </Button>
      </div>
    </section>
  );
};

const CTASection = () => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const scale = useTransform(scrollYProgress, [0, 0.5], [1.1, 1]);

  return (
    <section ref={ref} className="relative h-[70vh] min-h-[500px] flex items-center justify-center overflow-hidden">
      {/* Background */}
      <motion.div className="absolute inset-0" style={{ scale }}>
        <img src={ctaMary} alt="Vierge Marie" className="w-full h-full object-cover" />
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/70" />

      {/* Content */}
      <AnimatedSection className="relative z-10 text-center px-4 max-w-2xl mx-auto">
        <p className="text-sm tracking-[0.3em] uppercase text-white/60 mb-4">Ensemble en Christ</p>
        <h2 className="text-3xl md:text-5xl font-playfair font-bold text-white mb-6">
          Rejoignez notre communauté
        </h2>
        <p className="text-white/80 text-lg mb-10 leading-relaxed">
          Un sanctuaire spirituel pour la jeunesse, fondé sur les valeurs de l'Évangile
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
            <Button size="lg" className="text-lg px-8 py-6 bg-white text-foreground hover:bg-white/90 shadow-xl" asChild>
              <Link to="/auth">Créer un compte</Link>
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
            <Button size="lg" className="text-lg px-8 py-6 bg-green-600 hover:bg-green-700 text-white" asChild>
              <a href="https://chat.whatsapp.com/FfvCe9nHwpj5OYoDZBfGER" target="_blank" rel="noopener noreferrer">
                <MessageCircle className="mr-2 w-5 h-5" />
                WhatsApp
              </a>
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-white/40 text-white hover:bg-white/10" asChild>
              <a href="https://youtube.com/@voie-verite-vie?si=qD8LmbyREJdQm1Db" target="_blank" rel="noopener noreferrer">
                <Youtube className="mr-2 w-5 h-5" />
                YouTube
              </a>
            </Button>
          </motion.div>
        </div>
      </AnimatedSection>
    </section>
  );
};

export { ActivitiesSection, CTASection };
