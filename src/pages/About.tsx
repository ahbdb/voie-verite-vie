import { memo } from 'react';
import Navigation from '@/components/Navigation';
import { Cross, Heart, Book, Target, Lightbulb } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const About = memo(() => {
  const timeline = [
    { year: '2024', event: 'Fondation de l\'association 3V', description: 'Création d\'un sanctuaire spirituel dédié aux jeunes' },
    { year: '2024', event: 'Premiers événements', description: 'Lancement des conférences, ateliers et activités communautaires' },
    { year: '2025', event: 'Programme de lecture biblique', description: 'Cycle annuel de 354 jours de méditations spirituelles' },
  ];

  const values = [
    {
      icon: Cross,
      title: 'Voie',
      verse: 'Jean 14:6',
      description: 'Le chemin tracé par Jésus-Christ pour marcher dans ses pas et embrasser ses enseignements d\'amour et de salut.'
    },
    {
      icon: Book,
      title: 'Vérité',
      verse: 'Jean 8:32',
      description: 'La lumière révélée par Jésus, vérité absolue et libératrice qui nous affranchit des illusions du monde.'
    },
    {
      icon: Heart,
      title: 'Vie',
      verse: 'Jean 10:10',
      description: 'L\'abondance spirituelle offerte par le Christ, une plénitude emplie de joie, de paix et de communion avec Dieu.'
    }
  ];

  return (
    <div className="min-h-screen">
      <Navigation />
      <main className="pt-16">
        {/* Hero Section */}
        <section className="py-8 bg-gradient-subtle">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-4xl mx-auto">
              <h1 className="text-3xl md:text-5xl font-playfair font-bold text-primary mb-4">
                À propos de 3V
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Un sanctuaire spirituel, un phare lumineux guidant les âmes dans un monde en quête de sens
              </p>
            </div>
          </div>
        </section>

        {/* Préambule */}
        <section className="py-6">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-6 md:p-10 shadow-elegant border border-border/50">
                <div className="flex items-center mb-6">
                  <Cross className="w-6 h-6 text-primary mr-3" />
                  <h2 className="text-xl md:text-2xl font-playfair font-semibold text-primary">
                    Notre Mission
                  </h2>
                </div>
                <div className="prose prose-lg max-w-none">
                  <p className="text-muted-foreground leading-relaxed mb-4 text-sm md:text-base">
                    Fondée le 1er janvier 2024, l'association Voie, Vérité, Vie (3V) se veut bien plus qu'une simple organisation : 
                    elle est un sanctuaire spirituel, un phare lumineux guidant les jeunes dans un monde en quête de sens.
                  </p>
                  <p className="text-muted-foreground leading-relaxed mb-4 text-sm md:text-base">
                    Ancrée dans les principes intemporels de la foi chrétienne, 3V se dresse comme un rempart face aux tempêtes 
                    de la dépravation morale, en mettant particulièrement l'accent sur le bien-être spirituel et moral de la jeunesse.
                  </p>
                  <p className="text-muted-foreground leading-relaxed mb-4 text-sm md:text-base">
                    Notre approche combine la sagesse biblique avec des activités modernes, des discussions significatives et des 
                    ressources spirituelles pour aider chaque personne à trouver son chemin vers une vie plus épanouie et centrée 
                    sur les valeurs éternelles.
                  </p>
                  <div className="bg-gradient-peace/10 rounded-lg p-4 my-6">
                    <blockquote className="text-center italic text-base md:text-lg">
                      "Je suis le chemin, la vérité et la vie. Nul ne vient au Père que par moi."
                      <cite className="block mt-2 text-primary font-semibold">— Jean 14:6</cite>
                    </blockquote>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Valeurs Fondamentales */}
        <section className="py-6 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-playfair font-bold text-primary text-center mb-10">
                Pourquoi Voie, Vérité, Vie ?
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                {values.map((value, index) => {
                  const Icon = value.icon;
                  return (
                    <div key={index} className="text-center group">
                      <div className="bg-gradient-peace rounded-full w-14 h-14 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-glow">
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <h3 className="text-xl font-playfair font-semibold text-primary mb-2">
                        {value.title}
                      </h3>
                      <p className="text-sm text-primary/80 font-semibold mb-3">
                        {value.verse}
                      </p>
                      <p className="text-muted-foreground leading-relaxed text-sm">
                        {value.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Objectifs */}
        <section className="py-6">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-playfair font-bold text-primary text-center mb-10">
                Nos Objectifs
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  'Offrir un refuge spirituel et moral aux jeunes confrontés aux défis de la société moderne',
                  'Éduquer et sensibiliser à la foi chrétienne et ses principes',
                  'Créer une communauté bienveillante d\'entraide et de soutien spirituel',
                  'Promouvoir un mode de vie sain et équilibré, fondé sur les valeurs évangéliques',
                  'Former des leaders chrétiens, agents de transformation dans leurs communautés',
                  'Établir des partenariats avec les organisations religieuses et communautaires'
                ].map((objective, index) => (
                  <div key={index} className="flex items-start space-x-3 group">
                    <Target className="w-5 h-5 text-primary mt-0.5 group-hover:scale-110 transition-transform duration-300 flex-shrink-0" />
                    <p className="text-muted-foreground leading-relaxed text-sm">
                      {objective}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Ce que nous proposons */}
        <section className="py-6 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-playfair font-bold text-primary text-center mb-10 flex items-center justify-center gap-2">
                <Lightbulb className="w-8 h-8" />
                Ce que nous proposons
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                {[
                  {
                    title: 'Lectures Bibliques',
                    description: 'Un programme structuré de 354 jours pour une immersion progressive dans les écritures saintes.'
                  },
                  {
                    title: 'Carême Spirituel',
                    description: 'Une période de réflexion, méditation et prière pour approfondir votre foi.'
                  },
                  {
                    title: 'Chemin de Croix',
                    description: 'Une méditation sur le sacrifice du Christ et la voie du salut.'
                  },
                  {
                    title: 'Activités Communautaires',
                    description: 'Rencontres, ateliers et événements pour grandir ensemble spirituellement.'
                  },
                  {
                    title: 'Forum de Prière',
                    description: 'Un espace de partage des intentions de prière et de soutien mutuel.'
                  },
                  {
                    title: 'Ressources Spirituelles',
                    description: 'Galeries, guides et matériaux pour approfondir votre compréhension de la foi.'
                  }
                ].map((item, index) => (
                  <Card key={index} className="border-primary/20">
                    <CardHeader>
                      <CardTitle className="text-lg">{item.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Timeline */}
        <section className="py-6">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-playfair font-bold text-primary text-center mb-10">
                Notre Parcours
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
                        <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded-full">
                          {item.year}
                        </span>
                        <h3 className="text-base font-playfair font-semibold text-primary mt-2 mb-1">
                          {item.event}
                        </h3>
                        <p className="text-muted-foreground text-sm">
                          {item.description}
                        </p>
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
