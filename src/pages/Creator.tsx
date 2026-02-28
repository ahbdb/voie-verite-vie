import { memo } from 'react';
import { Helmet } from 'react-helmet-async';
import Navigation from '@/components/Navigation';
import { 
  Users, Calendar, GraduationCap, Briefcase, Globe, Mail, Phone, MapPin, 
  Heart, Cross, Book, Target, Award, Mic, Radio, Code, PenTool, 
  MessageSquare, Star, ChevronRight, ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const Creator = memo(() => {
  const founder = {
    name: 'AHOUFACK Dylanne Baudouin',
    title: 'Fondateur & Promoteur de VOIE, VÉRITÉ, VIE (3V)',
    birthDate: '14 septembre 2001',
    birthPlace: 'Fossong-Wentcheng, Cameroun',
    bio: `Jeune Entrepreneur; enseignant; Concepteur Designer; Community Manager; Développeur d'applications; Formateur...
    sont les différentes casquettes qui définissent ma modeste personne dans le domaine Informatique. 
    Passionné par la technologie et la foi catholique, j'ai créé l'application 3V pour aider les jeunes à découvrir 
    et approfondir leur foi à travers une lecture structurée de la Bible. Actuellement étudiant en Intelligence Artificielle en Italie.`,
    vision: `Ma vision est de créer un "sanctuaire spirituel" numérique accessible à tous, combinant technologie et spiritualité 
    pour aider des milliers de catholiques à approfondir leur foi. En utilisant mes talents en informatique et en théologie 
    au service de l'Église, je souhaite bâtir une communauté unie par la foi biblique.`,
    education: [
      { 
        degree: 'Étudiant en Intelligence Artificielle', 
        institution: 'Università della Calabria, Italie', 
        year: 'Depuis 2025',
        icon: Code
      },
      { 
        degree: 'Diplôme en Théologie', 
        institution: 'ECATHED - École Cathédrale de Théologie pour les laïcs de l\'Archidiocèse de Douala', 
        year: 'Juillet 2025',
        icon: Cross
      },
      { 
        degree: 'CILS B2 - Certificazione di Italiano come Lingua Straniera', 
        institution: 'CLID, Douala', 
        year: '2022',
        icon: Globe
      },
      { 
        degree: 'Licence Professionnelle en Génie Logiciel', 
        institution: 'IUG - Institut Universitaire du Golf de Guinée', 
        year: '2021',
        icon: Code
      },
      { 
        degree: 'Licence Académique en Mathématiques', 
        institution: 'Université de Douala', 
        year: '2021',
        icon: Target
      },
      { 
        degree: 'BTS en Génie Logiciel', 
        institution: 'ISTG-AC, Douala', 
        year: '2020',
        icon: Code
      },
    ],
    experience: [
      { 
        role: 'Chef des départements Mathématiques et Informatique', 
        company: 'Plateforme EXAM-PREP', 
        description: 'Direction académique et pédagogique des programmes de préparation aux examens',
        since: '2023',
        icon: GraduationCap
      },
      { 
        role: 'Enseignant d\'Informatique', 
        company: 'Collège Catholique Saint Nicolas & Collège BAHO', 
        description: 'Transmission du savoir informatique aux jeunes dans le cadre de l\'éducation catholique',
        since: '2023',
        icon: Book
      },
      { 
        role: 'Responsable Informatique et Communication', 
        company: 'ONG GEN Cameroon & Youth Business Cameroon', 
        description: 'Développement des outils numériques et stratégies de communication pour l\'impact social',
        since: '2023',
        icon: MessageSquare
      },
      { 
        role: 'Formateur', 
        company: 'PI Startup (Progress Intelligent Startup)', 
        description: 'Formation en développement d\'applications et technologies numériques',
        since: '2021',
        icon: Award
      },
      { 
        role: 'Présentateur et Chroniqueur', 
        company: 'Radio et Télé catholique VERITAS - Émission Canal Campus', 
        description: 'Animation d\'émissions dédiées à la jeunesse catholique et à l\'évangélisation',
        since: '2022',
        icon: Radio
      },
    ],
    skills: [
      { name: 'Enseignement', icon: GraduationCap },
      { name: 'Développement d\'applications', icon: Code },
      { name: 'Community Management', icon: Users },
      { name: 'Conception & Design', icon: PenTool },
      { name: 'Secrétariat Bureautique', icon: Briefcase },
      { name: 'Formation', icon: Award },
      { name: 'Communication', icon: Mic },
    ],
    languages: [
      { name: 'Français', level: 'Natif' },
      { name: 'Anglais', level: 'Courant' },
      { name: 'Italien', level: 'B2 Certifié' },
      { name: 'Yemba', level: 'Courant' },
    ],
    qualities: ['Courageux', 'Discipliné', 'Rigoureux', 'Ponctuel', 'Adaptation facile', 'Passionné', 'Créatif'],
    socialLinks: {
      youtube: 'https://youtube.com/@voie-verite-vie?si=qD8LmbyREJdQm1Db',
      whatsappChannel: 'https://whatsapp.com/channel/0029VbB0GplLY6d6hkP5930J',
      whatsappGroup: 'https://chat.whatsapp.com/FfvCe9nHwpj5OYoDZBfGER',
    }
  };

  // Structured data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": founder.name,
    "jobTitle": founder.title,
    "birthDate": "2001-09-14",
    "birthPlace": {
      "@type": "Place",
      "name": founder.birthPlace
    },
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Cameroun",
      "addressCountry": "Cameroon"
    },
    "sameAs": [
      founder.socialLinks.youtube,
    ],
    "knowsLanguage": founder.languages.map(l => l.name),
    "alumniOf": founder.education.map(e => ({
      "@type": "EducationalOrganization",
      "name": e.institution
    })),
    "worksFor": founder.experience.map(e => ({
      "@type": "Organization",
      "name": e.company
    })),
    "founder": {
      "@type": "Organization",
      "name": "Voie, Vérité, Vie (3V)",
      "description": "Association spirituelle catholique pour la lecture biblique"
    }
  };

  return (
    <>
      <Helmet>
        <title>AHOUFACK Dylanne Baudouin - Fondateur de Voie, Vérité, Vie (3V) | Cameroun</title>
        <meta name="description" content="Découvrez AHOUFACK Dylanne Baudouin, fondateur de l'application 3V (Voie, Vérité, Vie). Jeune théologien, développeur et entrepreneur camerounais passionné par la foi catholique et la technologie." />
        <meta name="keywords" content="AHOUFACK Dylanne Baudouin, 3V, Voie Vérité Vie, fondateur, Cameroun, théologien, développeur, catholique, Bible, application spirituelle" />
        <meta property="og:title" content="AHOUFACK Dylanne Baudouin - Fondateur de Voie, Vérité, Vie (3V)" />
        <meta property="og:description" content="Jeune théologien et développeur camerounais, créateur de l'application spirituelle 3V pour la lecture biblique." />
        <meta property="og:type" content="profile" />
        <link rel="canonical" href="https://voie-verite-vie.lovable.app/createur" />
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="pt-16">
          {/* Hero Section */}
          <section className="py-12 bg-gradient-subtle relative overflow-hidden">
            <div className="absolute inset-0 opacity-5">
              <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-primary blur-3xl"></div>
              <div className="absolute bottom-10 right-10 w-40 h-40 rounded-full bg-secondary blur-3xl"></div>
            </div>
            <div className="container mx-auto px-4 relative z-10">
              <div className="max-w-4xl mx-auto text-center">
                <div className="w-28 h-28 bg-gradient-peace rounded-full flex items-center justify-center mx-auto mb-6 shadow-glow">
                  <Users className="w-14 h-14 text-white" />
                </div>
                <h1 className="text-3xl md:text-5xl font-playfair font-bold text-primary mb-3">
                  {founder.name}
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground mb-4">
                  {founder.title}
                </p>
                <div className="flex flex-wrap gap-3 justify-center mb-6">
                  <Badge variant="secondary" className="text-sm py-1 px-3">
                    <Calendar className="w-4 h-4 mr-2" />
                    {founder.birthDate}
                  </Badge>
                  <Badge variant="secondary" className="text-sm py-1 px-3">
                    <MapPin className="w-4 h-4 mr-2" />
                    {founder.birthPlace}
                  </Badge>
                </div>
              </div>
            </div>
          </section>

          {/* Bio & Vision */}
          <section className="py-10">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6">
                <Card className="border-border/50 shadow-elegant">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <Heart className="w-5 h-5 text-primary" />
                      À Propos de Moi
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed text-sm">
                      {founder.bio}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-border/50 shadow-elegant">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <Target className="w-5 h-5 text-primary" />
                      Ma Vision
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed text-sm">
                      {founder.vision}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          {/* Formation */}
          <section className="py-10 bg-muted/30">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-2xl md:text-3xl font-playfair font-bold text-primary text-center mb-8 flex items-center justify-center gap-3">
                  <GraduationCap className="w-8 h-8" />
                  Formation Académique
                </h2>
                <div className="space-y-4">
                  {founder.education.map((edu, i) => {
                    const Icon = edu.icon;
                    return (
                      <Card key={i} className="border-l-4 border-l-primary hover:shadow-lg transition-shadow">
                        <CardContent className="py-4">
                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <Icon className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-foreground">{edu.degree}</h3>
                              <p className="text-sm text-muted-foreground">{edu.institution}</p>
                              <Badge variant="outline" className="mt-2 text-xs">{edu.year}</Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* Expérience */}
          <section className="py-10">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-2xl md:text-3xl font-playfair font-bold text-primary text-center mb-8 flex items-center justify-center gap-3">
                  <Briefcase className="w-8 h-8" />
                  Expérience Professionnelle
                </h2>
                <div className="space-y-4">
                  {founder.experience.map((exp, i) => {
                    const Icon = exp.icon;
                    return (
                      <Card key={i} className="hover:shadow-lg transition-shadow">
                        <CardContent className="py-4">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-peace flex items-center justify-center flex-shrink-0">
                              <Icon className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-foreground">{exp.role}</h3>
                              <p className="text-sm text-primary font-medium">{exp.company}</p>
                              <p className="text-sm text-muted-foreground mt-1">{exp.description}</p>
                              <Badge className="mt-2 text-xs bg-primary/10 text-primary">Depuis {exp.since}</Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* Compétences, Langues, Qualités */}
          <section className="py-10 bg-muted/30">
            <div className="container mx-auto px-4">
              <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6">
                {/* Compétences */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Star className="w-5 h-5 text-primary" />
                      Compétences
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {founder.skills.map((skill, i) => {
                        const Icon = skill.icon;
                        return (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <Icon className="w-4 h-4 text-primary" />
                            <span className="text-muted-foreground">{skill.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Langues */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Globe className="w-5 h-5 text-primary" />
                      Langues
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {founder.languages.map((lang, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <span className="text-muted-foreground text-sm">{lang.name}</span>
                          <Badge variant="outline" className="text-xs">{lang.level}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Qualités */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Heart className="w-5 h-5 text-primary" />
                      Qualités
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {founder.qualities.map((q, i) => (
                        <Badge key={i} className="text-xs bg-primary/10 text-primary">
                          {q}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          {/* Call to Action */}
          <section className="py-12">
            <div className="container mx-auto px-4">
              <div className="max-w-3xl mx-auto text-center">
                <h2 className="text-2xl md:text-3xl font-playfair font-bold text-primary mb-4">
                  Rejoignez le Mouvement 3V
                </h2>
                <p className="text-muted-foreground mb-8">
                  Suivez-moi sur les réseaux sociaux et rejoignez notre communauté spirituelle.
                </p>
                <div className="flex flex-wrap gap-4 justify-center">
                  <Button asChild className="gap-2">
                    <a href={founder.socialLinks.youtube} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4" />
                      Chaîne YouTube
                    </a>
                  </Button>
                  <Button asChild variant="outline" className="gap-2">
                    <a href={founder.socialLinks.whatsappChannel} target="_blank" rel="noopener noreferrer">
                      <ChevronRight className="w-4 h-4" />
                      Chaîne WhatsApp
                    </a>
                  </Button>
                  <Button asChild variant="secondary" className="gap-2">
                    <a href={founder.socialLinks.whatsappGroup} target="_blank" rel="noopener noreferrer">
                      <Users className="w-4 h-4" />
                      Groupe WhatsApp
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </section>

          <Separator />

          {/* About 3V Mini Section */}
          <section className="py-10">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto text-center">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <Cross className="w-6 h-6 text-primary" />
                  <Book className="w-6 h-6 text-primary" />
                  <Heart className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-playfair font-semibold text-primary mb-3">
                  Voie, Vérité, Vie
                </h3>
                <p className="text-muted-foreground text-sm max-w-2xl mx-auto mb-6">
                  "Je suis le chemin, la vérité et la vie. Nul ne vient au Père que par moi." — Jean 14:6
                </p>
                <Button asChild variant="outline">
                  <a href="/about">
                    En savoir plus sur 3V
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </a>
                </Button>
              </div>
            </div>
          </section>
        </main>
      </div>
    </>
  );
});

Creator.displayName = 'Creator';

export default Creator;
