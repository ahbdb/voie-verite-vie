import { motion } from 'framer-motion';
import { AnimatedSection } from '@/components/AnimatedSection';
import missionVoie from '@/assets/mission-voie.jpg';
import missionVerite from '@/assets/mission-verite.jpg';
import missionVie from '@/assets/mission-vie.jpg';

const missions = [
  {
    title: 'Voie',
    subtitle: 'Le Chemin',
    verse: '« Je suis le chemin »',
    ref: 'Jean 14:6',
    description: "Le chemin tracé par Jésus-Christ, suivre ses pas et embrasser ses enseignements.",
    image: missionVoie,
  },
  {
    title: 'Vérité',
    subtitle: 'La Lumière',
    verse: '« La vérité vous affranchira »',
    ref: 'Jean 8:32',
    description: "La lumière révélée par Jésus, vérité absolue et libératrice.",
    image: missionVerite,
  },
  {
    title: 'Vie',
    subtitle: 'La Plénitude',
    verse: '« Je suis venu pour qu\'ils aient la vie »',
    ref: 'Jean 10:10',
    description: "L'abondance spirituelle offerte par le Christ, joie, paix et communion.",
    image: missionVie,
  },
];

const MissionSection = () => {
  return (
    <section className="py-12 bg-background">
      <div className="container mx-auto px-4">
        <AnimatedSection className="text-center mb-8">
          <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground mb-2">Notre Mission</p>
          <h2 className="text-3xl md:text-4xl font-playfair font-bold text-foreground mb-2">
            Trois piliers de foi
          </h2>
          <div className="w-12 h-0.5 bg-accent mx-auto" />
        </AnimatedSection>

        {/* Horizontal scroll on mobile, grid on desktop */}
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
