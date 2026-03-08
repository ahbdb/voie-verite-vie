import { memo } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
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
  const { t, i18n } = useTranslation();

  const founderFr = {
    name: 'AHOUFACK Dylanne Baudouin',
    title: 'Fondateur & Promoteur de VOIE, VÉRITÉ, VIE (3V)',
    birthDate: '14 septembre 2001',
    birthPlace: 'Fossong-Wentcheng, Cameroun',
    bio: `Jeune Entrepreneur; enseignant; Concepteur Designer; Community Manager; Développeur d'applications; Formateur... sont les différentes casquettes qui définissent ma modeste personne dans le domaine Informatique. Passionné par la technologie et la foi catholique, j'ai créé l'application 3V pour aider les jeunes à découvrir et approfondir leur foi à travers une lecture structurée de la Bible. Actuellement étudiant en Intelligence Artificielle en Italie.`,
    vision: `Ma vision est de créer un "sanctuaire spirituel" numérique accessible à tous, combinant technologie et spiritualité pour aider des milliers de catholiques à approfondir leur foi. En utilisant mes talents en informatique et en théologie au service de l'Église, je souhaite bâtir une communauté unie par la foi biblique.`,
    education: [
      { degree: 'Étudiant en Intelligence Artificielle', institution: 'Università della Calabria, Italie', year: 'Depuis 2025', icon: Code },
      { degree: 'Diplôme en Théologie', institution: "ECATHED - École Cathédrale de Théologie pour les laïcs de l'Archidiocèse de Douala", year: 'Juillet 2025', icon: Cross },
      { degree: 'CILS B2 - Certificazione di Italiano come Lingua Straniera', institution: 'CLID, Douala', year: '2022', icon: Globe },
      { degree: 'Licence Professionnelle en Génie Logiciel', institution: 'IUG - Institut Universitaire du Golf de Guinée', year: '2021', icon: Code },
      { degree: 'Licence Académique en Mathématiques', institution: 'Université de Douala', year: '2021', icon: Target },
      { degree: 'BTS en Génie Logiciel', institution: 'ISTG-AC, Douala', year: '2020', icon: Code },
    ],
    experience: [
      { role: 'Chef des départements Mathématiques et Informatique', company: 'Plateforme EXAM-PREP', description: 'Direction académique et pédagogique des programmes de préparation aux examens', since: '2023', icon: GraduationCap },
      { role: "Enseignant d'Informatique", company: 'Collège Catholique Saint Nicolas & Collège BAHO', description: "Transmission du savoir informatique aux jeunes dans le cadre de l'éducation catholique", since: '2023', icon: Book },
      { role: 'Responsable Informatique et Communication', company: 'ONG GEN Cameroon & Youth Business Cameroon', description: "Développement des outils numériques et stratégies de communication pour l'impact social", since: '2023', icon: MessageSquare },
      { role: 'Formateur', company: 'PI Startup (Progress Intelligent Startup)', description: "Formation en développement d'applications et technologies numériques", since: '2021', icon: Award },
      { role: 'Présentateur et Chroniqueur', company: 'Radio et Télé catholique VERITAS - Émission Canal Campus', description: "Animation d'émissions dédiées à la jeunesse catholique et à l'évangélisation", since: '2022', icon: Radio },
    ],
    skills: [
      { name: 'Enseignement', icon: GraduationCap },
      { name: "Développement d'applications", icon: Code },
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

  const founderEn = {
    ...founderFr,
    title: 'Founder & Promoter of WAY, TRUTH, LIFE (3V)',
    birthDate: 'September 14, 2001',
    birthPlace: 'Fossong-Wentcheng, Cameroon',
    bio: `Young entrepreneur, teacher, designer, community manager, app developer and trainer... these are the many hats that define me in the tech field. Passionate about technology and the Catholic faith, I created the 3V app to help young people discover and deepen their faith through a structured Bible reading path. I am currently studying Artificial Intelligence in Italy.`,
    vision: `My vision is to build a digital "spiritual sanctuary" accessible to everyone, combining technology and spirituality to help thousands of Catholics deepen their faith. By putting my tech and theology skills at the service of the Church, I want to build a community united by biblical faith.`,
    education: [
      { degree: 'Artificial Intelligence Student', institution: 'Università della Calabria, Italy', year: 'Since 2025', icon: Code },
      { degree: 'Diploma in Theology', institution: 'ECATHED - Cathedral School of Theology for Lay People of the Archdiocese of Douala', year: 'July 2025', icon: Cross },
      { degree: 'CILS B2 - Certificazione di Italiano come Lingua Straniera', institution: 'CLID, Douala', year: '2022', icon: Globe },
      { degree: 'Professional Bachelor in Software Engineering', institution: 'IUG - Gulf of Guinea University Institute', year: '2021', icon: Code },
      { degree: 'Academic Bachelor in Mathematics', institution: 'University of Douala', year: '2021', icon: Target },
      { degree: 'Higher National Diploma in Software Engineering', institution: 'ISTG-AC, Douala', year: '2020', icon: Code },
    ],
    experience: [
      { role: 'Head of Mathematics and Computer Science Departments', company: 'EXAM-PREP Platform', description: 'Academic and pedagogical leadership of exam preparation programs', since: '2023', icon: GraduationCap },
      { role: 'Computer Science Teacher', company: 'Saint Nicolas Catholic College & BAHO College', description: 'Teaching computer science to young people within Catholic education', since: '2023', icon: Book },
      { role: 'IT and Communication Manager', company: 'GEN Cameroon NGO & Youth Business Cameroon', description: 'Development of digital tools and communication strategies for social impact', since: '2023', icon: MessageSquare },
      { role: 'Trainer', company: 'PI Startup (Progress Intelligent Startup)', description: 'Training in app development and digital technologies', since: '2021', icon: Award },
      { role: 'Presenter and Columnist', company: 'VERITAS Catholic Radio & TV - Canal Campus Show', description: 'Hosting programs dedicated to Catholic youth and evangelization', since: '2022', icon: Radio },
    ],
    skills: [
      { name: 'Teaching', icon: GraduationCap },
      { name: 'App Development', icon: Code },
      { name: 'Community Management', icon: Users },
      { name: 'Design', icon: PenTool },
      { name: 'Office Administration', icon: Briefcase },
      { name: 'Training', icon: Award },
      { name: 'Communication', icon: Mic },
    ],
    languages: [
      { name: 'French', level: 'Native' },
      { name: 'English', level: 'Fluent' },
      { name: 'Italian', level: 'Certified B2' },
      { name: 'Yemba', level: 'Fluent' },
    ],
    qualities: ['Courageous', 'Disciplined', 'Rigorous', 'Punctual', 'Adaptable', 'Passionate', 'Creative'],
  };

  const founderIt = {
    ...founderFr,
    title: 'Fondatore & Promotore di VIA, VERITÀ, VITA (3V)',
    birthDate: '14 settembre 2001',
    birthPlace: 'Fossong-Wentcheng, Camerun',
    bio: `Giovane imprenditore, insegnante, designer, community manager, sviluppatore di applicazioni e formatore... sono i diversi ruoli che mi definiscono nel settore informatico. Appassionato di tecnologia e fede cattolica, ho creato l'app 3V per aiutare i giovani a scoprire e approfondire la loro fede attraverso una lettura strutturata della Bibbia. Attualmente studio Intelligenza Artificiale in Italia.`,
    vision: `La mia visione è creare un "santuario spirituale" digitale accessibile a tutti, unendo tecnologia e spiritualità per aiutare migliaia di cattolici ad approfondire la propria fede. Mettendo i miei talenti nell'informatica e nella teologia al servizio della Chiesa, desidero costruire una comunità unita dalla fede biblica.`,
    education: [
      { degree: 'Studente in Intelligenza Artificiale', institution: 'Università della Calabria, Italia', year: 'Dal 2025', icon: Code },
      { degree: 'Diploma in Teologia', institution: "ECATHED - Scuola Cattedrale di Teologia per i laici dell'Arcidiocesi di Douala", year: 'Luglio 2025', icon: Cross },
      { degree: 'CILS B2 - Certificazione di Italiano come Lingua Straniera', institution: 'CLID, Douala', year: '2022', icon: Globe },
      { degree: 'Laurea Professionale in Ingegneria del Software', institution: 'IUG - Istituto Universitario del Golfo di Guinea', year: '2021', icon: Code },
      { degree: 'Laurea in Matematica', institution: 'Università di Douala', year: '2021', icon: Target },
      { degree: 'BTS in Ingegneria del Software', institution: 'ISTG-AC, Douala', year: '2020', icon: Code },
    ],
    experience: [
      { role: 'Responsabile dei dipartimenti di Matematica e Informatica', company: 'Piattaforma EXAM-PREP', description: 'Direzione accademica e pedagogica dei programmi di preparazione agli esami', since: '2023', icon: GraduationCap },
      { role: 'Docente di Informatica', company: 'Collegio Cattolico Saint Nicolas & Collegio BAHO', description: "Trasmissione del sapere informatico ai giovani nel contesto dell'educazione cattolica", since: '2023', icon: Book },
      { role: 'Responsabile IT e Comunicazione', company: 'ONG GEN Cameroon & Youth Business Cameroon', description: 'Sviluppo di strumenti digitali e strategie di comunicazione per impatto sociale', since: '2023', icon: MessageSquare },
      { role: 'Formatore', company: 'PI Startup (Progress Intelligent Startup)', description: 'Formazione nello sviluppo di applicazioni e tecnologie digitali', since: '2021', icon: Award },
      { role: 'Presentatore e Cronista', company: 'Radio e TV cattolica VERITAS - Trasmissione Canal Campus', description: 'Conduzione di programmi dedicati ai giovani cattolici e all’evangelizzazione', since: '2022', icon: Radio },
    ],
    skills: [
      { name: 'Insegnamento', icon: GraduationCap },
      { name: 'Sviluppo di applicazioni', icon: Code },
      { name: 'Community Management', icon: Users },
      { name: 'Progettazione & Design', icon: PenTool },
      { name: 'Segreteria e ufficio', icon: Briefcase },
      { name: 'Formazione', icon: Award },
      { name: 'Comunicazione', icon: Mic },
    ],
    languages: [
      { name: 'Francese', level: 'Madrelingua' },
      { name: 'Inglese', level: 'Fluente' },
      { name: 'Italiano', level: 'B2 Certificato' },
      { name: 'Yemba', level: 'Fluente' },
    ],
    qualities: ['Coraggioso', 'Disciplinato', 'Rigoroso', 'Puntuale', 'Adattabile', 'Appassionato', 'Creativo'],
  };

  const founder = i18n.language.startsWith('en') ? founderEn : i18n.language.startsWith('it') ? founderIt : founderFr;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": founder.name,
    "jobTitle": founder.title,
    "birthDate": "2001-09-14",
    "birthPlace": { "@type": "Place", "name": founder.birthPlace },
    "address": { "@type": "PostalAddress", "addressLocality": "Cameroun", "addressCountry": "Cameroon" },
    "sameAs": [founder.socialLinks.youtube],
    "knowsLanguage": founder.languages.map(l => l.name),
    "alumniOf": founder.education.map(e => ({ "@type": "EducationalOrganization", "name": e.institution })),
    "worksFor": founder.experience.map(e => ({ "@type": "Organization", "name": e.company })),
    "founder": { "@type": "Organization", "name": "Voie, Vérité, Vie (3V)", "description": "Association spirituelle catholique pour la lecture biblique" }
  };

  return (
    <>
      <Helmet>
        <title>AHOUFACK Dylanne Baudouin - Fondateur de Voie, Vérité, Vie (3V) | Cameroun</title>
        <meta name="description" content="Découvrez AHOUFACK Dylanne Baudouin, fondateur de l'application 3V (Voie, Vérité, Vie)." />
        <link rel="canonical" href="https://voie-verite-vie.lovable.app/createur" />
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="pt-16">
          {/* Hero */}
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
                <h1 className="text-3xl md:text-5xl font-playfair font-bold text-primary mb-3">{founder.name}</h1>
                <p className="text-lg md:text-xl text-muted-foreground mb-4">{founder.title}</p>
                <div className="flex flex-wrap gap-3 justify-center mb-6">
                  <Badge variant="secondary" className="text-sm py-1 px-3"><Calendar className="w-4 h-4 mr-2" />{founder.birthDate}</Badge>
                  <Badge variant="secondary" className="text-sm py-1 px-3"><MapPin className="w-4 h-4 mr-2" />{founder.birthPlace}</Badge>
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
                    <CardTitle className="flex items-center gap-2 text-xl"><Heart className="w-5 h-5 text-primary" />{t('creator.aboutMe')}</CardTitle>
                  </CardHeader>
                  <CardContent><p className="text-muted-foreground leading-relaxed text-sm">{founder.bio}</p></CardContent>
                </Card>
                <Card className="border-border/50 shadow-elegant">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl"><Target className="w-5 h-5 text-primary" />{t('creator.myVision')}</CardTitle>
                  </CardHeader>
                  <CardContent><p className="text-muted-foreground leading-relaxed text-sm">{founder.vision}</p></CardContent>
                </Card>
              </div>
            </div>
          </section>

          {/* Education */}
          <section className="py-10 bg-muted/30">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-2xl md:text-3xl font-playfair font-bold text-primary text-center mb-8 flex items-center justify-center gap-3">
                  <GraduationCap className="w-8 h-8" />{t('creator.education')}
                </h2>
                <div className="space-y-4">
                  {founder.education.map((edu, i) => {
                    const Icon = edu.icon;
                    return (
                      <Card key={i} className="border-l-4 border-l-primary hover:shadow-lg transition-shadow">
                        <CardContent className="py-4">
                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0"><Icon className="w-5 h-5 text-primary" /></div>
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

          {/* Experience */}
          <section className="py-10">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-2xl md:text-3xl font-playfair font-bold text-primary text-center mb-8 flex items-center justify-center gap-3">
                  <Briefcase className="w-8 h-8" />{t('creator.experience')}
                </h2>
                <div className="space-y-4">
                  {founder.experience.map((exp, i) => {
                    const Icon = exp.icon;
                    return (
                      <Card key={i} className="hover:shadow-lg transition-shadow">
                        <CardContent className="py-4">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-peace flex items-center justify-center flex-shrink-0"><Icon className="w-6 h-6 text-white" /></div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-foreground">{exp.role}</h3>
                              <p className="text-sm text-primary font-medium">{exp.company}</p>
                              <p className="text-sm text-muted-foreground mt-1">{exp.description}</p>
                              <Badge className="mt-2 text-xs bg-primary/10 text-primary">{t('creator.since')} {exp.since}</Badge>
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

          {/* Skills, Languages, Qualities */}
          <section className="py-10 bg-muted/30">
            <div className="container mx-auto px-4">
              <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="pb-3"><CardTitle className="text-lg flex items-center gap-2"><Star className="w-5 h-5 text-primary" />{t('creator.skills')}</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {founder.skills.map((skill, i) => { const Icon = skill.icon; return (<div key={i} className="flex items-center gap-2 text-sm"><Icon className="w-4 h-4 text-primary" /><span className="text-muted-foreground">{skill.name}</span></div>); })}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3"><CardTitle className="text-lg flex items-center gap-2"><Globe className="w-5 h-5 text-primary" />{t('creator.languages')}</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {founder.languages.map((lang, i) => (<div key={i} className="flex items-center justify-between"><span className="text-muted-foreground text-sm">{lang.name}</span><Badge variant="outline" className="text-xs">{lang.level}</Badge></div>))}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3"><CardTitle className="text-lg flex items-center gap-2"><Heart className="w-5 h-5 text-primary" />{t('creator.qualities')}</CardTitle></CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {founder.qualities.map((q, i) => (<Badge key={i} className="text-xs bg-primary/10 text-primary">{q}</Badge>))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="py-12">
            <div className="container mx-auto px-4">
              <div className="max-w-3xl mx-auto text-center">
                <h2 className="text-2xl md:text-3xl font-playfair font-bold text-primary mb-4">{t('creator.joinMovement')}</h2>
                <p className="text-muted-foreground mb-8">{t('creator.joinMovementDesc')}</p>
                <div className="flex flex-wrap gap-4 justify-center">
                  <Button asChild className="gap-2"><a href={founder.socialLinks.youtube} target="_blank" rel="noopener noreferrer"><ExternalLink className="w-4 h-4" />{t('creator.youtubeChannel')}</a></Button>
                  <Button asChild variant="outline" className="gap-2"><a href={founder.socialLinks.whatsappChannel} target="_blank" rel="noopener noreferrer"><ChevronRight className="w-4 h-4" />{t('creator.whatsappChannel')}</a></Button>
                  <Button asChild variant="secondary" className="gap-2"><a href={founder.socialLinks.whatsappGroup} target="_blank" rel="noopener noreferrer"><Users className="w-4 h-4" />{t('creator.whatsappGroup')}</a></Button>
                </div>
              </div>
            </div>
          </section>

          <Separator />

          {/* About 3V Mini */}
          <section className="py-10">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto text-center">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <Cross className="w-6 h-6 text-primary" />
                  <Book className="w-6 h-6 text-primary" />
                  <Heart className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-playfair font-semibold text-primary mb-3">Voie, Vérité, Vie</h3>
                <p className="text-muted-foreground text-sm max-w-2xl mx-auto mb-6">
                  {t('about.mainVerse')}
                </p>
                <Button asChild variant="outline">
                  <a href="/about">{t('common.learnMore')}<ChevronRight className="w-4 h-4 ml-2" /></a>
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
