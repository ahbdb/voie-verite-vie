import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { AnimatedSection } from '@/components/AnimatedSection';
import missionVoie from '@/assets/mission-voie.jpg';
import missionVerite from '@/assets/mission-verite.jpg';
import missionVie from '@/assets/mission-vie.jpg';

const MissionSection = () => {
  const { t } = useTranslation();

  const missions = [
    {
      title: t('mission.way'),
      subtitle: t('mission.waySubtitle'),
      verse: t('mission.wayVerse'),
      ref: 'Jean 14:6',
      description: t('mission.wayDescription'),
      image: missionVoie,
    },
    {
      title: t('mission.truth'),
      subtitle: t('mission.truthSubtitle'),
      verse: t('mission.truthVerse'),
      ref: 'Jean 8:32',
      description: t('mission.truthDescription'),
      image: missionVerite,
    },
    {
      title: t('mission.life'),
      subtitle: t('mission.lifeSubtitle'),
      verse: t('mission.lifeVerse'),
      ref: 'Jean 10:10',
      description: t('mission.lifeDescription'),
      image: missionVie,
    },
  ];

  return (
    <section className="py-12 bg-background">
      <div className="container mx-auto px-4">
        <AnimatedSection className="text-center mb-8">
          <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground mb-2">{t('mission.ourMission')}</p>
          <h2 className="text-3xl md:text-4xl font-playfair font-bold text-foreground mb-2">
            {t('mission.threePillars')}
          </h2>
          <div className="w-12 h-0.5 bg-accent mx-auto" />
        </AnimatedSection>

        <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide md:grid md:grid-cols-3 md:overflow-visible md:pb-0">
          {missions.map((mission, index) => (
            <motion.div
              key={mission.title}
              className="min-w-[75vw] sm:min-w-[55vw] md:min-w-0 snap-center"
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <motion.div
                className="group relative rounded-xl overflow-hidden h-[380px]"
                whileHover={{ y: -4 }}
                transition={{ type: 'spring' as const, stiffness: 300, damping: 25 }}
              >
                <motion.img
                  src={mission.image}
                  alt={mission.title}
                  className="w-full h-full object-cover"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.5 }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                <div className="absolute inset-0 flex flex-col justify-end p-6 text-white">
                  <p className="text-[10px] tracking-[0.25em] uppercase text-white/50 mb-1">{mission.subtitle}</p>
                  <h3 className="text-2xl font-playfair font-bold mb-2">{mission.title}</h3>
                  <p className="text-white/70 text-sm leading-relaxed mb-2">{mission.description}</p>
                  <p className="text-accent text-sm italic font-playfair">
                    {mission.verse}
                    <span className="block text-white/40 text-xs mt-0.5 not-italic font-inter">— {mission.ref}</span>
                  </p>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MissionSection;
