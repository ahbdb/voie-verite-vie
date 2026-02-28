import { Card, CardContent } from '@/components/ui/card';
import { Cross, BookOpen, Users, Heart, Shield, Star } from 'lucide-react';

const MissionSection = () => {
  const missions = [
    {
      icon: Cross,
      title: "Voie",
      description: "Le chemin tracé par Jésus-Christ, suivre ses pas et embrasser ses enseignements d'amour et de salut.",
      verse: "Je suis le chemin, la vérité et la vie",
      color: "text-primary"
    },
    {
      icon: BookOpen,
      title: "Vérité",
      description: "La lumière révélée par Jésus, vérité absolue et libératrice qui nous affranchit des illusions du monde.",
      verse: "La vérité vous affranchira",
      color: "text-secondary"
    },
    {
      icon: Heart,
      title: "Vie",
      description: "L'abondance spirituelle offerte par le Christ, une plénitude emplie de joie, de paix et de communion avec Dieu.",
      verse: "Je suis venu pour qu'ils aient la vie",
      color: "text-accent"
    }
  ];

  const objectives = [
    {
      icon: Shield,
      title: "Refuge Spirituel",
      description: "Offrir un sanctuaire sûr aux jeunes confrontés aux défis de la société moderne"
    },
    {
      icon: BookOpen,
      title: "Éducation Spirituelle",
      description: "Éduquer et sensibiliser la jeunesse aux principes moraux de la foi chrétienne"
    },
    {
      icon: Users,
      title: "Formation de Leaders",
      description: "Former des leaders chrétiens, agents de transformation dans leurs communautés"
    },
    {
      icon: Star,
      title: "Mode de Vie Équilibré",
      description: "Promouvoir un mode de vie sain fondé sur les valeurs évangéliques"
    }
  ];

  return (
    <section className="py-20 bg-gradient-divine">
      <div className="container mx-auto px-4">
        {/* En-tête de section */}
        <div className="text-center mb-16 fade-in-up">
          <h2 className="text-4xl md:text-5xl font-playfair font-bold text-foreground mb-6">
            Notre Mission
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Fondée sur les principes intemporels de la foi chrétienne, 3V se dresse comme 
            un rempart face aux tempêtes de la dépravation morale qui assaillent notre société.
          </p>
        </div>

        {/* Les trois piliers : Voie, Vérité, Vie */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {missions.map((mission, index) => {
            const Icon = mission.icon;
            return (
              <div
                key={mission.title}
                className="fade-in-up spiritual-card text-center group hover:scale-105 transition-all duration-500"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-white to-gray-50 mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-700`}>
                  <Icon className={`w-8 h-8 ${mission.color} dark:text-white`} />
                </div>
                <h3 className="text-2xl font-playfair font-semibold mb-4 text-foreground">
                  {mission.title}
                </h3>
                <p className="text-muted-foreground mb-4 leading-relaxed">
                  {mission.description}
                </p>
                <div className={`italic text-sm ${mission.color} font-medium dark:text-white`}>
                  "{mission.verse}"
                </div>
              </div>
            );
          })}
        </div>

        {/* Séparateur spirituel */}
        <div className="flex items-center justify-center mb-16">
          <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent w-full max-w-md"></div>
          <div className="mx-6 w-8 h-8 bg-gradient-peace rounded-full flex items-center justify-center">
            <Cross className="w-4 h-4 text-white" />
          </div>
          <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent w-full max-w-md"></div>
        </div>

        {/* Nos objectifs */}
        <div className="text-center mb-12">
          <h3 className="text-3xl font-playfair font-bold text-foreground mb-4">
            Nos Objectifs
          </h3>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Un engagement concret pour la transformation spirituelle et morale de la jeunesse
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {objectives.map((objective, index) => {
            const Icon = objective.icon;
            return (
              <Card
                key={objective.title}
                className="fade-in-up border-border/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-2"
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                <CardContent className="p-6 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h4 className="font-semibold mb-3 text-foreground">
                    {objective.title}
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {objective.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Citation inspirante */}
        <div className="mt-16 text-center">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 max-w-4xl mx-auto shadow-lg dark:bg-slate-900/80 dark:text-slate-100">
            <blockquote className="text-xl md:text-2xl font-playfair text-primary mb-4 leading-relaxed italic">
              "Voie, Vérité, Vie se tient comme un phare dans les ténèbres, 
              offrant un refuge spirituel et une éducation morale pour aider 
              les jeunes à résister aux influences délétères et à embrasser 
              la vérité de l'Évangile."
            </blockquote>
            <cite className="text-muted-foreground font-medium">
              — Charte de l'Association 3V
            </cite>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MissionSection;