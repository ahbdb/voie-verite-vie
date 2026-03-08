import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Heart, ArrowRight } from 'lucide-react';

const PrayerIntentionsSection = () => {
  const { t } = useTranslation();

  return (
    <section className="relative py-20 overflow-hidden">
      {/* Background with gradient and subtle pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-cathedral-gold/[0.05] via-background to-stained-ruby/[0.03]" />
      
      {/* Floating prayer orbs */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-cathedral-gold/[0.06]"
          style={{
            width: 60 + i * 30,
            height: 60 + i * 30,
            left: `${15 + i * 18}%`,
            top: `${20 + (i % 3) * 25}%`,
          }}
          animate={{
            y: [0, -20, 0],
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 4 + i,
            repeat: Infinity,
            delay: i * 0.7,
            ease: 'easeInOut',
          }}
        />
      ))}

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-2xl mx-auto text-center">
          {/* Animated praying hands icon */}
          <motion.div
            className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-cathedral-gold/10 border border-cathedral-gold/20 mb-8"
            initial={{ scale: 0, rotate: -180 }}
            whileInView={{ scale: 1, rotate: 0 }}
            viewport={{ once: true }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          >
            <motion.div
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Heart className="w-8 h-8 text-cathedral-gold" />
            </motion.div>
          </motion.div>

          <motion.h2
            className="text-3xl md:text-4xl font-cinzel font-bold text-foreground mb-4 text-gradient-gold"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            {t('prayerIntentions.sectionTitle')}
          </motion.h2>

          <motion.p
            className="text-muted-foreground text-sm md:text-base mb-6 font-inter leading-relaxed"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
          >
            {t('prayerIntentions.sectionSubtitle')}
          </motion.p>

          {/* Verse */}
          <motion.blockquote
            className="relative mb-10 px-8 py-5 rounded-xl border border-cathedral-gold/15 bg-cathedral-gold/[0.04] backdrop-blur-sm"
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
          >
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-3xl text-cathedral-gold/40">✦</div>
            <p className="text-foreground/80 italic font-playfair text-sm md:text-base leading-relaxed">
              {t('prayerIntentions.verse')}
            </p>
            <p className="text-cathedral-gold/60 text-xs mt-2 font-inter tracking-wider">
              — {t('prayerIntentions.verseRef')}
            </p>
          </motion.blockquote>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6 }}
          >
            <Button
              size="lg"
              asChild
              className="bg-cathedral-gold text-secondary font-semibold hover:bg-cathedral-gold/90 shadow-xl shadow-cathedral-gold/20 rounded-full font-cinzel tracking-wider px-8"
            >
              <Link to="/prayer-forum">
                <Heart className="w-5 h-5 mr-2" />
                {t('prayerIntentions.cta')}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </div>

      <div className="cathedral-line w-full mt-20" />
    </section>
  );
};

export default PrayerIntentionsSection;
