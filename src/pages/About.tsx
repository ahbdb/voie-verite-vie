import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import Navigation from '@/components/Navigation';
import { Cross, Heart, Book, Target, Lightbulb } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const About = memo(() => {
  const { t } = useTranslation();

  const timeline = [
    { year: '2024', event: t('about.timeline2024a'), description: t('about.timeline2024aDesc') },
    { year: '2024', event: t('about.timeline2024b'), description: t('about.timeline2024bDesc') },
    { year: '2025', event: t('about.timeline2025'), description: t('about.timeline2025Desc') },
  ];

  const values = [
    {
      icon: Cross,
      title: t('mission.way'),
      verse: 'Jean 14:6',
      description: t('mission.wayDescription')
    },
    {
      icon: Book,
      title: t('mission.truth'),
      verse: 'Jean 8:32',
      description: t('mission.truthDescription')
    },
    {
      icon: Heart,
      title: t('mission.life'),
      verse: 'Jean 10:10',
      description: t('mission.lifeDescription')
    }
  ];

  return (
    <div className="min-h-screen">
      <Navigation />
      <main className="pt-16">
        <section className="py-8 bg-gradient-subtle">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-4xl mx-auto">
              <h1 className="text-3xl md:text-5xl font-playfair font-bold text-primary mb-4">
                {t('about.title')}
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {t('about.subtitle')}
              </p>
            </div>
          </div>
        </section>

        <section className="py-6">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-6 md:p-10 shadow-elegant border border-border/50">
                <div className="flex items-center mb-6">
                  <Cross className="w-6 h-6 text-primary mr-3" />
                  <h2 className="text-xl md:text-2xl font-playfair font-semibold text-primary">
                    {t('about.ourMission')}
                  </h2>
                </div>
                <div className="prose prose-lg max-w-none">
                  <p className="text-muted-foreground leading-relaxed mb-4 text-sm md:text-base">{t('about.missionP1')}</p>
                  <p className="text-muted-foreground leading-relaxed mb-4 text-sm md:text-base">{t('about.missionP2')}</p>
                  <p className="text-muted-foreground leading-relaxed mb-4 text-sm md:text-base">{t('about.missionP3')}</p>
                  <div className="bg-gradient-peace/10 rounded-lg p-4 my-6">
                    <blockquote className="text-center italic text-base md:text-lg">
                      {t('about.mainVerse')}
                      <cite className="block mt-2 text-primary font-semibold">— Jean 14:6</cite>
                    </blockquote>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-6 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-playfair font-bold text-primary text-center mb-10">
                {t('about.whyTitle')}
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                {values.map((value, index) => {
                  const Icon = value.icon;
                  return (
                    <div key={index} className="text-center group">
                      <div className="bg-gradient-peace rounded-full w-14 h-14 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-glow">
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <h3 className="text-xl font-playfair font-semibold text-primary mb-2">{value.title}</h3>
                      <p className="text-sm text-primary/80 font-semibold mb-3">{value.verse}</p>
                      <p className="text-muted-foreground leading-relaxed text-sm">{value.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="py-6">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-playfair font-bold text-primary text-center mb-10">
                {t('about.objectives')}
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {[1,2,3,4,5,6].map((i) => (
                  <div key={i} className="flex items-start space-x-3 group">
                    <Target className="w-5 h-5 text-primary mt-0.5 group-hover:scale-110 transition-transform duration-300 flex-shrink-0" />
                    <p className="text-muted-foreground leading-relaxed text-sm">
                      {t(`about.obj${i}`)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-6 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-playfair font-bold text-primary text-center mb-10 flex items-center justify-center gap-2">
                <Lightbulb className="w-8 h-8" />
                {t('about.whatWeOffer')}
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                {[
                  { titleKey: 'about.offerReadings', descKey: 'about.offerReadingsDesc' },
                  { titleKey: 'about.offerLent', descKey: 'about.offerLentDesc' },
                  { titleKey: 'about.offerStations', descKey: 'about.offerStationsDesc' },
                  { titleKey: 'about.offerCommunity', descKey: 'about.offerCommunityDesc' },
                  { titleKey: 'about.offerPrayer', descKey: 'about.offerPrayerDesc' },
                  { titleKey: 'about.offerResources', descKey: 'about.offerResourcesDesc' },
                ].map((item, index) => (
                  <Card key={index} className="border-primary/20">
                    <CardHeader>
                      <CardTitle className="text-lg">{t(item.titleKey)}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{t(item.descKey)}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-6">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-playfair font-bold text-primary text-center mb-10">
                {t('about.ourJourney')}
              </h2>
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-peace"></div>
                {timeline.map((item, index) => (
                  <div key={index} className="relative flex items-start mb-8 last:mb-0">
                    <div className="w-8 h-8 bg-gradient-peace rounded-full flex items-center justify-center relative z-10 shadow-glow">
                      <span className="text-white text-xs font-bold">{item.year.slice(-2)}</span>
                    </div>
                    <div className="ml-6">
                      <div className="bg-card/50 backdrop-blur-sm rounded-lg p-4 shadow-subtle border border-border/50">
                        <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded-full">{item.year}</span>
                        <h3 className="text-base font-playfair font-semibold text-primary mt-2 mb-1">{item.event}</h3>
                        <p className="text-muted-foreground text-sm">{item.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
});

About.displayName = 'About';

export default About;
