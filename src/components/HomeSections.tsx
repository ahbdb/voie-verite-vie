import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, BookOpen, Calendar, Heart, MessageCircle, Youtube } from 'lucide-react';
import { AnimatedSection } from '@/components/AnimatedSection';
import activityBible from '@/assets/activity-bible-study.jpg';
import activityCommunity from '@/assets/activity-community.jpg';
import activityConference from '@/assets/activity-conference.jpg';
import activityCreative from '@/assets/activity-creative.jpg';
import activityMeditation from '@/assets/activity-meditation.jpg';
import ctaMary from '@/assets/cta-mary.jpg';
import { useRef } from 'react';
import { useScroll, useTransform } from 'framer-motion';

const activities = [
  { title: 'Lecture Biblique', desc: '73 livres en 358 jours', image: activityBible, link: '/biblical-reading', icon: BookOpen },
  { title: 'Communauté', desc: 'Priez et partagez', image: activityCommunity, link: '/prayer-forum', icon: Heart },
  { title: 'Conférences', desc: 'Enseignements', image: activityConference, link: '/activities', icon: Calendar },
  { title: 'Neuvaines', desc: 'Prière guidée', image: activityCreative, link: '/neuvaines', icon: Heart },
  { title: 'Méditation', desc: 'Carême & croix', image: activityMeditation, link: '/careme-2026', icon: BookOpen },
];

const ActivitiesSection = () => {
  return (
    <section className="py-12 bg-muted/30">
      <div className="container mx-auto px-4">
        <AnimatedSection className="flex items-end justify-between mb-6">
          <div>
            <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground mb-1">Découvrir</p>
            <h2 className="text-2xl md:text-3xl font-playfair font-bold text-foreground">Nos activités</h2>
          </div>
          <Button variant="ghost" asChild className="gap-1 hidden sm:flex">
            <Link to="/activities">Tout voir <ArrowRight className="w-4 h-4" /></Link>
          </Button>
        </AnimatedSection>
      </div>

      {/* Horizontal carousel */}
      <div className="flex gap-4 overflow-x-auto pb-4 px-4 snap-x snap-mandatory scrollbar-hide">
        <div className="min-w-[max(0px,calc((100vw-1400px)/2+2rem-1rem))] shrink-0 hidden md:block" />
        {activities.map((activity, index) => (
          <motion.div
            key={activity.title}
            className="min-w-[240px] sm:min-w-[280px] snap-center shrink-0"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: index * 0.08 }}
          >
            <Link to={activity.link}>
              <motion.div
                className="group relative rounded-xl overflow-hidden h-[300px] bg-card shadow-sm"
                whileHover={{ y: -4 }}
                transition={{ type: 'spring' as const, stiffness: 300, damping: 25 }}
              >
                <motion.img
                  src={activity.image}
                  alt={activity.title}
                  className="w-full h-full object-cover"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.4 }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <div className="flex items-center gap-1.5 mb-1">
                    <activity.icon className="w-3.5 h-3.5 text-accent" />
                    <p className="text-[10px] tracking-wider uppercase text-white/60">{activity.desc}</p>
                  </div>
                  <h3 className="text-lg font-playfair font-semibold">{activity.title}</h3>
                </div>
              </motion.div>
            </Link>
          </motion.div>
        ))}
        <div className="min-w-[max(0px,calc((100vw-1400px)/2+2rem-1rem))] shrink-0 hidden md:block" />
      </div>

      <div className="container mx-auto px-4 mt-4 sm:hidden">
        <Button variant="outline" asChild className="w-full gap-2">
          <Link to="/activities">Voir toutes les activités <ArrowRight className="w-4 h-4" /></Link>
        </Button>
      </div>
    </section>
  );
};

const CTASection = () => {
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const scale = useTransform(scrollYProgress, [0, 0.5], [1.08, 1]);

  return (
    <section ref={ref} className="relative h-[50vh] min-h-[380px] flex items-center justify-center overflow-hidden">
      <motion.div className="absolute inset-0" style={{ scale }}>
        <img src={ctaMary} alt="Vierge Marie" className="w-full h-full object-cover" />
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/70" />

      <AnimatedSection className="relative z-10 text-center px-4 max-w-2xl mx-auto">
        <p className="text-xs tracking-[0.3em] uppercase text-white/60 mb-2">Ensemble en Christ</p>
        <h2 className="text-2xl md:text-4xl font-playfair font-bold text-white mb-4">
          Rejoignez notre communauté
        </h2>
        <p className="text-white/80 text-sm mb-6 leading-relaxed">
          Un sanctuaire spirituel pour la jeunesse, fondé sur les valeurs de l'Évangile
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button
            size="default"
            asChild
            className="bg-primary text-primary-foreground font-semibold hover:bg-primary/90 shadow-lg rounded-full"
          >
            <Link to="/auth">Créer un compte</Link>
          </Button>
          <Button size="default" className="bg-green-600 hover:bg-green-700 text-white rounded-full" asChild>
            <a href="https://chat.whatsapp.com/FfvCe9nHwpj5OYoDZBfGER" target="_blank" rel="noopener noreferrer">
              <MessageCircle className="mr-1.5 w-4 h-4" />WhatsApp
            </a>
          </Button>
          <Button size="default" variant="outline" className="border-white/40 text-white hover:bg-white/10 rounded-full" asChild>
            <a href="https://youtube.com/@voie-verite-vie?si=qD8LmbyREJdQm1Db" target="_blank" rel="noopener noreferrer">
              <Youtube className="mr-1.5 w-4 h-4" />YouTube
            </a>
          </Button>
        </div>
      </AnimatedSection>
    </section>
  );
};

export { ActivitiesSection, CTASection };
