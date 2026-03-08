import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { AnimatedSection, staggerContainer, staggerItem } from '@/components/AnimatedSection';
import missionVoie from '@/assets/mission-voie.jpg';
import missionVerite from '@/assets/mission-verite.jpg';
import missionVie from '@/assets/mission-vie.jpg';

const missions = [
  {
    title: 'Voie',
    subtitle: 'Le Chemin',
    verse: '« Je suis le chemin »',
    ref: 'Jean 14:6',
    description: "Le chemin tracé par Jésus-Christ, suivre ses pas et embrasser ses enseignements d'amour et de salut.",
    image: missionVoie,
  },
  {
    title: 'Vérité',
    subtitle: 'La Lumière',
    verse: '« La vérité vous affranchira »',
    ref: 'Jean 8:32',
    description: "La lumière révélée par Jésus, vérité absolue et libératrice qui nous affranchit des illusions du monde.",
    image: missionVerite,
  },
  {
    title: 'Vie',
    subtitle: 'La Plénitude',
    verse: '« Je suis venu pour qu\'ils aient la vie »',
    ref: 'Jean 10:10',
    description: "L'abondance spirituelle offerte par le Christ, une plénitude emplie de joie, de paix et de communion avec Dieu.",
    image: missionVie,
  },
];

const MissionSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });
  const bgY = useTransform(scrollYProgress, [0, 1], ['-5%', '5%']);

  return (
    <section ref={containerRef} className="py-24 bg-background relative overflow-hidden">
      {/* Subtle moving bg */}
      <motion.div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{ y: bgY }}
      >
        <div className="w-full h-full bg-[radial-gradient(circle_at_30%_50%,hsl(var(--primary))_0%,transparent_50%),radial-gradient(circle_at_70%_50%,hsl(var(--secondary))_0%,transparent_50%)]" />
      </motion.div>

      <div className="container mx-auto px-4 relative z-10">
        <AnimatedSection className="text-center mb-16">
          <p className="text-sm tracking-[0.3em] uppercase text-muted-foreground mb-4">Notre Mission</p>
          <h2 className="text-4xl md:text-5xl font-playfair font-bold text-foreground mb-4">
            Trois piliers de foi
          </h2>
          <div className="w-16 h-0.5 bg-accent mx-auto" />
        </AnimatedSection>

        {/* Horizontal scroll cards on mobile, grid on desktop */}
        <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide md:grid md:grid-cols-3 md:overflow-visible md:pb-0">
          {missions.map((mission, index) => (
            <motion.div
              key={mission.title}
              className="min-w-[85vw] sm:min-w-[60vw] md:min-w-0 snap-center"
              initial={{ opacity: 0, x: 60 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.7, delay: index * 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <motion.div
                className="group relative rounded-2xl overflow-hidden h-[480px] cursor-pointer"
                whileHover={{ y: -8 }}
                transition={{ type: 'spring' as const, stiffness: 300, damping: 25 }}
              >
                {/* Image */}
                <div className="absolute inset-0">
                  <motion.img
                    src={mission.image}
                    alt={mission.title}
                    className="w-full h-full object-cover"
                    whileHover={{ scale: 1.08 }}
                    transition={{ duration: 0.6 }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                </div>

                {/* Content overlay */}
                <div className="absolute inset-0 flex flex-col justify-end p-8 text-white">
                  <motion.div
                    initial={{ y: 20 }}
                    whileInView={{ y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                  >
                    <p className="text-xs tracking-[0.25em] uppercase text-white/60 mb-2">
                      {mission.subtitle}
                    </p>
                    <h3 className="text-3xl font-playfair font-bold mb-3">
                      {mission.title}
                    </h3>
                    <p className="text-white/80 text-sm leading-relaxed mb-4 line-clamp-3 group-hover:line-clamp-none transition-all">
                      {mission.description}
                    </p>
                    <p className="text-accent text-sm italic font-playfair">
                      {mission.verse}
                      <span className="block text-white/50 text-xs mt-1 not-italic font-inter">
                        — {mission.ref}
                      </span>
                    </p>
                  </motion.div>
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
