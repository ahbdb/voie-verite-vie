import { motion, useScroll, useTransform } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useRef } from 'react';

/**
 * Three symbolic animations representing the 3V pillars:
 * 1. VOIE → A winding path that draws itself
 * 2. VÉRITÉ → A seed becoming a tree (growth/truth)
 * 3. VIE → A mouth/proclamation with sound waves
 */

const PathAnimation = () => {
  const { t } = useTranslation();
  return (
    <div className="relative flex flex-col items-center">
      <div className="relative w-48 h-48 md:w-56 md:h-56">
        <svg viewBox="0 0 200 200" className="w-full h-full">
          {/* Winding path */}
          <motion.path
            d="M30 180 C50 140, 80 160, 100 120 S140 60, 160 30"
            fill="none"
            stroke="hsl(var(--cathedral-gold))"
            strokeWidth="3"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            whileInView={{ pathLength: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 2.5, ease: 'easeInOut' }}
          />
          {/* Dotted guide path */}
          <motion.path
            d="M30 180 C50 140, 80 160, 100 120 S140 60, 160 30"
            fill="none"
            stroke="hsl(var(--cathedral-gold) / 0.15)"
            strokeWidth="8"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 2, ease: 'easeInOut' }}
          />
          {/* Walking figure (simplified) */}
          <motion.g
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 1.5, duration: 0.5 }}
          >
            <motion.circle
              cx="30" cy="175"
              r="6"
              fill="hsl(var(--cathedral-gold))"
              animate={{
                cx: [30, 65, 100, 135, 160],
                cy: [175, 150, 120, 80, 35],
              }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1 }}
            />
            {/* Glowing trail */}
            <motion.circle
              cx="30" cy="175"
              r="12"
              fill="none"
              stroke="hsl(var(--cathedral-gold) / 0.3)"
              strokeWidth="1"
              animate={{
                cx: [30, 65, 100, 135, 160],
                cy: [175, 150, 120, 80, 35],
                scale: [1, 1.5, 1, 1.5, 1],
                opacity: [0.5, 0.2, 0.5, 0.2, 0.5],
              }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1 }}
            />
          </motion.g>
          {/* Cross at destination */}
          <motion.g
            initial={{ opacity: 0, scale: 0 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 2, duration: 0.6, type: 'spring' }}
          >
            <line x1="155" y1="15" x2="165" y2="15" stroke="hsl(var(--cathedral-gold))" strokeWidth="2" />
            <line x1="160" y1="10" x2="160" y2="25" stroke="hsl(var(--cathedral-gold))" strokeWidth="2" />
          </motion.g>
        </svg>
      </div>
      <motion.h3
        className="text-2xl font-cinzel font-bold text-foreground mt-4 text-gradient-gold"
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.5 }}
      >
        {t('brand.word1').replace(',', '')}
      </motion.h3>
      <motion.p
        className="text-muted-foreground text-sm mt-2 text-center max-w-[200px] font-inter"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.8 }}
      >
        {t('mission.wayVerse')}
      </motion.p>
    </div>
  );
};

const TreeAnimation = () => {
  const { t } = useTranslation();
  return (
    <div className="relative flex flex-col items-center">
      <div className="relative w-48 h-48 md:w-56 md:h-56">
        <svg viewBox="0 0 200 200" className="w-full h-full">
          {/* Seed */}
          <motion.ellipse
            cx="100" cy="180"
            rx="8" ry="5"
            fill="hsl(var(--stained-emerald))"
            initial={{ scale: 1 }}
            whileInView={{ scale: [1, 1.2, 0.5, 0] }}
            viewport={{ once: true }}
            transition={{ duration: 1.5, times: [0, 0.3, 0.6, 1] }}
          />
          {/* Trunk growing up */}
          <motion.line
            x1="100" y1="180" x2="100" y2="80"
            stroke="hsl(var(--cathedral-gold) / 0.8)"
            strokeWidth="4"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.5, delay: 0.8, ease: 'easeOut' }}
          />
          {/* Branches */}
          {[
            { d: 'M100 120 C80 110, 60 90, 45 75', delay: 1.8 },
            { d: 'M100 120 C120 110, 140 90, 155 75', delay: 2 },
            { d: 'M100 100 C85 85, 65 70, 50 55', delay: 2.2 },
            { d: 'M100 100 C115 85, 135 70, 150 55', delay: 2.4 },
            { d: 'M100 85 C90 70, 75 55, 70 40', delay: 2.6 },
            { d: 'M100 85 C110 70, 125 55, 130 40', delay: 2.8 },
          ].map((branch, i) => (
            <motion.path
              key={i}
              d={branch.d}
              fill="none"
              stroke="hsl(var(--stained-emerald) / 0.7)"
              strokeWidth="2"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: branch.delay, ease: 'easeOut' }}
            />
          ))}
          {/* Leaves (circles at branch ends) */}
          {[
            { cx: 45, cy: 75, delay: 2.5, color: 'stained-emerald' },
            { cx: 155, cy: 75, delay: 2.7, color: 'stained-emerald' },
            { cx: 50, cy: 55, delay: 2.9, color: 'stained-emerald' },
            { cx: 150, cy: 55, delay: 3.1, color: 'stained-emerald' },
            { cx: 70, cy: 40, delay: 3.3, color: 'cathedral-gold' },
            { cx: 130, cy: 40, delay: 3.5, color: 'cathedral-gold' },
            { cx: 100, cy: 35, delay: 3.7, color: 'cathedral-gold' },
          ].map((leaf, i) => (
            <motion.circle
              key={i}
              cx={leaf.cx}
              cy={leaf.cy}
              r="8"
              fill={`hsl(var(--${leaf.color}) / 0.3)`}
              stroke={`hsl(var(--${leaf.color}) / 0.6)`}
              strokeWidth="1"
              initial={{ scale: 0, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: leaf.delay, duration: 0.4, type: 'spring' }}
            />
          ))}
          {/* Light rays from top */}
          <motion.g
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 3.5, duration: 1 }}
          >
            {[85, 100, 115].map((x, i) => (
              <motion.line
                key={i}
                x1={x} y1="10" x2={x} y2="30"
                stroke="hsl(var(--cathedral-gold) / 0.3)"
                strokeWidth="1"
                animate={{ opacity: [0.2, 0.6, 0.2] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
              />
            ))}
          </motion.g>
        </svg>
      </div>
      <motion.h3
        className="text-2xl font-cinzel font-bold text-foreground mt-4 text-gradient-gold"
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.5 }}
      >
        {t('brand.word2').replace(',', '')}
      </motion.h3>
      <motion.p
        className="text-muted-foreground text-sm mt-2 text-center max-w-[200px] font-inter"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.8 }}
      >
        {t('mission.truthVerse')}
      </motion.p>
    </div>
  );
};

const ProclamationAnimation = () => {
  const { t } = useTranslation();
  return (
    <div className="relative flex flex-col items-center">
      <div className="relative w-48 h-48 md:w-56 md:h-56">
        <svg viewBox="0 0 200 200" className="w-full h-full">
          {/* Face silhouette */}
          <motion.path
            d="M60 130 C60 80, 70 50, 100 45 C130 50, 140 80, 140 130"
            fill="none"
            stroke="hsl(var(--stained-ruby) / 0.6)"
            strokeWidth="2"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.5 }}
          />
          {/* Mouth opening */}
          <motion.ellipse
            cx="100" cy="110"
            fill="hsl(var(--stained-ruby) / 0.2)"
            stroke="hsl(var(--stained-ruby) / 0.5)"
            strokeWidth="1.5"
            initial={{ rx: 5, ry: 2 }}
            whileInView={{ rx: 15, ry: 10 }}
            viewport={{ once: true }}
            transition={{ delay: 1.2, duration: 0.6, type: 'spring' }}
          />
          {/* Sound waves emanating */}
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.path
              key={i}
              d={`M${125 + i * 12} 95 Q${135 + i * 12} 110, ${125 + i * 12} 125`}
              fill="none"
              stroke="hsl(var(--cathedral-gold))"
              strokeWidth={2 - i * 0.3}
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              whileInView={{ pathLength: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 1.5 + i * 0.2, duration: 0.5 }}
            />
          ))}
          {/* Continuous wave animation */}
          {[0, 1, 2].map((i) => (
            <motion.path
              key={`wave-${i}`}
              d={`M${140 + i * 15} 90 Q${155 + i * 15} 110, ${140 + i * 15} 130`}
              fill="none"
              stroke="hsl(var(--cathedral-gold) / 0.4)"
              strokeWidth="1.5"
              strokeLinecap="round"
              animate={{
                opacity: [0, 0.6, 0],
                scale: [0.8, 1.1, 0.8],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: 2.5 + i * 0.3,
                ease: 'easeInOut',
              }}
            />
          ))}
          {/* Words / letters floating out */}
          {['V', 'I', 'E'].map((letter, i) => (
            <motion.text
              key={letter}
              x={130 + i * 20}
              y={85 + i * 15}
              fill="hsl(var(--cathedral-gold))"
              fontSize="14"
              fontFamily="Cinzel, serif"
              fontWeight="bold"
              initial={{ opacity: 0, x: 115 }}
              animate={{
                opacity: [0, 1, 0],
                x: [115, 130 + i * 20, 145 + i * 20],
                y: [110, 85 + i * 15, 75 + i * 15],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: 3 + i * 0.5,
                ease: 'easeOut',
              }}
            />
          ))}
          {/* Heart/dove at top */}
          <motion.path
            d="M95 50 C90 40, 80 40, 80 48 C80 55, 95 65, 100 70 C105 65, 120 55, 120 48 C120 40, 110 40, 105 50 Z"
            fill="hsl(var(--stained-ruby) / 0.3)"
            stroke="hsl(var(--stained-ruby) / 0.5)"
            strokeWidth="1"
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 2, type: 'spring' }}
          />
        </svg>
      </div>
      <motion.h3
        className="text-2xl font-cinzel font-bold text-foreground mt-4 text-gradient-gold"
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.5 }}
      >
        {t('brand.word3')}
      </motion.h3>
      <motion.p
        className="text-muted-foreground text-sm mt-2 text-center max-w-[200px] font-inter"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.8 }}
      >
        {t('mission.lifeVerse')}
      </motion.p>
    </div>
  );
};

const SymbolicAnimations = () => {
  const { t } = useTranslation();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const bgOpacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]);

  return (
    <section ref={ref} className="relative py-24 overflow-hidden bg-background">
      {/* Animated background gradient */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ opacity: bgOpacity }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-cathedral-gold/[0.03] via-transparent to-cathedral-gold/[0.03]" />
      </motion.div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <p className="text-xs tracking-[0.4em] uppercase text-muted-foreground mb-3 font-inter">
            {t('mission.ourMission')}
          </p>
          <h2 className="text-3xl md:text-5xl font-cinzel font-bold text-foreground text-gradient-gold">
            {t('brand.fullName')}
          </h2>
          <div className="cathedral-line w-20 mx-auto mt-4" />
        </motion.div>

        <div className="grid md:grid-cols-3 gap-12 md:gap-8 max-w-4xl mx-auto">
          <PathAnimation />
          <TreeAnimation />
          <ProclamationAnimation />
        </div>

        {/* Connecting line between animations */}
        <div className="hidden md:block absolute top-1/2 left-1/4 right-1/4 h-px">
          <motion.div
            className="w-full h-full bg-gradient-to-r from-transparent via-cathedral-gold/20 to-transparent"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.5, delay: 1 }}
          />
        </div>
      </div>
    </section>
  );
};

export default SymbolicAnimations;
