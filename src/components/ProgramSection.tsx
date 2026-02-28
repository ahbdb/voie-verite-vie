import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  Calendar, 
  Clock, 
  Target, 
  CheckCircle, 
  Star,
  ArrowRight,
  Play
} from 'lucide-react';

const ProgramSection = () => {
  const [selectedMonth, setSelectedMonth] = useState('novembre');

  const programStats = [
    { label: "Livres bibliques", value: "73", color: "text-primary" },
    { label: "Jours de lecture", value: "354", color: "text-secondary" },
    { label: "Jours de rattrapage", value: "4", color: "text-accent" },
    { label: "Durée totale", value: "358", color: "text-primary" },
  ];

  const monthlyHighlights = {
    novembre: {
      books: "Genèse (début)",
      chapters: "30 Nov: Genèse 1-4",
      theme: "Création et promesse",
      liturgy: "1er dimanche de l'Avent"
    },
    décembre: {
      books: "Genèse, Exode, Lévitique",
      chapters: "Genèse 1-50, Exode 1-40, Lévitique 1-27",
      theme: "Alliance et libération",
      liturgy: "Avent et Noël"
    },
    septembre: {
      books: "Matthieu (année A)",
      chapters: "Mt 1-28, début Nouveau Testament",
      theme: "Royaume des Cieux",
      liturgy: "Année liturgique A"
    }
  };

  const upcomingReadings = [
    {
      date: "30 Nov 2025",
      book: "Genèse",
      chapters: "1-4",
      theme: "Création, promesse",
      type: "Début du programme",
      status: "upcoming"
    },
    {
      date: "15 Fév 2026",
      book: "Rattrapage",
      chapters: "Révision",
      theme: "Méditation communautaire",
      type: "Pause spirituelle",
      status: "break"
    },
    {
      date: "15 Sep 2026",
      book: "Matthieu",
      chapters: "1-4",
      theme: "Messie, Royaume",
      type: "Nouveau Testament",
      status: "milestone"
    },
    {
      date: "22 Nov 2026",
      book: "Apocalypse",
      chapters: "22",
      theme: "Victoire du Christ",
      type: "Fin du programme",
      status: "completion"
    }
  ];

  const features = [
    {
      icon: Target,
      title: "Progression personnalisée",
      description: "Suivez votre avancement avec des statistiques détaillées et des badges de réussite"
    },
    {
      icon: Calendar,
      title: "Calendrier liturgique",
      description: "Synchronisé avec l'année A (Matthieu) et les temps forts de l'Église"
    },
    {
      icon: CheckCircle,
      title: "Commentaires spirituels",
      description: "Lectio divina et méditations guidées pour chaque livre terminé"
    },
    {
      icon: Star,
      title: "Communauté active",
      description: "Partagez vos réflexions et participez aux discussions bibliques"
    }
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* En-tête */}
        <div className="text-center mb-16 fade-in-up">
          <h2 className="text-4xl md:text-5xl font-playfair font-bold text-foreground mb-6">
            Programme de Lecture Biblique
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-8">
            Un parcours complet à travers les 73 livres de la Bible catholique, 
            du 30 novembre 2025 au 22 novembre 2026
          </p>
          <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full">
            <Calendar className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">
              1er dimanche de l'Avent → Christ Roi
            </span>
          </div>
        </div>

        {/* Statistiques du programme */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {programStats.map((stat, index) => (
            <div
              key={stat.label}
              className="fade-in-up text-center p-6 spiritual-card"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`text-3xl font-bold ${stat.color} mb-2`}>
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Section interactive du programme */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Aperçu mensuel */}
          <Card className="fade-in-up divine-glow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                Aperçu du Programme
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-2 flex-wrap">
                  {Object.keys(monthlyHighlights).map((month) => (
                    <Button
                      key={month}
                      variant={selectedMonth === month ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedMonth(month)}
                      className="capitalize"
                    >
                      {month}
                    </Button>
                  ))}
                </div>
                
                <div className="bg-muted/30 rounded-lg p-4 space-y-3 dark:bg-slate-800 dark:text-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">Livres étudiés</span>
                    <Badge variant="secondary">
                      {monthlyHighlights[selectedMonth].books}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">Exemple de lecture</span>
                    <span className="text-sm text-muted-foreground">
                      {monthlyHighlights[selectedMonth].chapters}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">Thème principal</span>
                    <span className="text-sm text-primary font-medium">
                      {monthlyHighlights[selectedMonth].theme}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">Contexte liturgique</span>
                    <span className="text-sm text-accent font-medium">
                      {monthlyHighlights[selectedMonth].liturgy}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Étapes importantes */}
          <Card className="fade-in-up">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-secondary" />
                Étapes Importantes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingReadings.map((reading, index) => (
                  <div
                    key={reading.date}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/30 transition-colors"
                  >
                    <div className={`w-3 h-3 rounded-full ${
                      reading.status === 'upcoming' ? 'bg-primary' :
                      reading.status === 'break' ? 'bg-accent' :
                      reading.status === 'milestone' ? 'bg-secondary' :
                      'bg-primary'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-foreground">
                          {reading.date}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {reading.type}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <span className="font-medium">{reading.book}</span>
                        {reading.chapters !== "Révision" && (
                          <span> {reading.chapters}</span>
                        )}
                        <span className="text-primary"> • {reading.theme}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Fonctionnalités */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="fade-in-up text-center p-6 spiritual-card group hover:scale-105 transition-all duration-300"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg mb-4 group-hover:bg-primary/20 transition-colors">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h4 className="font-semibold mb-2 text-foreground">
                  {feature.title}
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Barre de progression simulée */}
        <Card className="fade-in-up bg-gradient-divine">
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-playfair font-semibold mb-2">
                Commencez votre parcours spirituel
              </h3>
              <p className="text-muted-foreground">
                Rejoignez notre communauté et découvrez la richesse de la Parole de Dieu
              </p>
            </div>
            
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Progression de la communauté</span>
                <span className="text-sm text-muted-foreground">Préparation en cours</span>
              </div>
              <Progress value={15} className="h-3" />
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="divine-glow" asChild>
                <Link to="/biblical-reading">
                  <Play className="w-4 h-4 mr-2" />
                  Commencer maintenant
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/biblical-reading">
                  <Calendar className="w-4 h-4 mr-2" />
                  Voir le calendrier complet
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default ProgramSection;