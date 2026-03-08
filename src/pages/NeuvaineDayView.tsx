import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  ChevronLeft, ChevronRight, BookOpen, Download, Heart,
  HandMetal, Cross, ArrowLeft
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Helmet } from 'react-helmet-async';

interface DayContent {
  day: number;
  title: string;
  subtitle: string;
  scripture: string;
  meditation: string;
  intercessions: { title: string; text: string }[];
}

interface NeuvaineFull {
  id: string;
  title: string;
  saint_name: string;
  description: string | null;
  introduction: string | null;
  common_prayers: any;
  days: DayContent[];
  conclusion: any;
  pdf_url: string | null;
  total_days: number;
}

const NeuvaineDayView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [neuvaine, setNeuvaine] = useState<NeuvaineFull | null>(null);
  const [currentDay, setCurrentDay] = useState(0); // 0=intro, 1-9=days, 10=conclusion
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('meditation');

  useEffect(() => {
    const fetch = async () => {
      if (!id) return;
      const { data, error } = await supabase
        .from('neuvaines')
        .select('*')
        .eq('id', id)
        .single();

      if (!error && data) {
        setNeuvaine({
          ...data,
          days: Array.isArray(data.days) ? (data.days as any[]) : [],
          common_prayers: data.common_prayers || {},
          conclusion: data.conclusion || {},
        });
      }
      setLoading(false);
    };
    fetch();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50/50 to-background">
        <Navigation />
        <div className="flex justify-center items-center pt-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600" />
        </div>
      </div>
    );
  }

  if (!neuvaine) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50/50 to-background">
        <Navigation />
        <div className="container mx-auto px-4 pt-32 text-center">
          <p className="text-muted-foreground">Neuvaine introuvable.</p>
          <Button variant="outline" onClick={() => navigate('/neuvaines')} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" /> Retour
          </Button>
        </div>
      </div>
    );
  }

  const days = neuvaine.days;
  const totalPages = days.length + 2; // intro + days + conclusion
  const day = currentDay > 0 && currentDay <= days.length ? days[currentDay - 1] : null;

  const goNext = () => { if (currentDay < totalPages - 1) { setCurrentDay(currentDay + 1); setActiveTab('meditation'); window.scrollTo({ top: 0, behavior: 'smooth' }); } };
  const goPrev = () => { if (currentDay > 0) { setCurrentDay(currentDay - 1); setActiveTab('meditation'); window.scrollTo({ top: 0, behavior: 'smooth' }); } };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/50 to-background">
      <Helmet>
        <title>{neuvaine.title} — Voie Vérité Vie</title>
      </Helmet>
      <Navigation />

      <main className="container mx-auto px-4 py-8 pt-24 max-w-3xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate('/neuvaines')} className="gap-1">
            <ArrowLeft className="h-4 w-4" /> Neuvaines
          </Button>
          {neuvaine.pdf_url && (
            <a href={neuvaine.pdf_url} download target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="gap-1">
                <Download className="h-4 w-4" /> PDF
              </Button>
            </a>
          )}
        </div>

        <h1 className="text-2xl md:text-3xl font-bold font-['Playfair_Display'] text-center text-foreground mb-2">
          {neuvaine.title}
        </h1>

        {/* Day selector pills */}
        <div className="flex flex-wrap justify-center gap-2 my-6">
          <button
            onClick={() => { setCurrentDay(0); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              currentDay === 0
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-200'
            }`}
          >
            Intro
          </button>
          {days.map((_, i) => (
            <button
              key={i}
              onClick={() => { setCurrentDay(i + 1); setActiveTab('meditation'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className={`w-9 h-9 rounded-full text-xs font-bold transition-all ${
                currentDay === i + 1
                  ? 'bg-amber-600 text-white shadow-md scale-110'
                  : 'bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-200'
              }`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => { setCurrentDay(totalPages - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              currentDay === totalPages - 1
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-200'
            }`}
          >
            Fin
          </button>
        </div>

        {/* Content */}
        <Card className="border-amber-200/50 shadow-sm">
          <CardContent className="p-5 md:p-8">
            {/* INTRO PAGE */}
            {currentDay === 0 && (
              <div className="space-y-6">
                <div className="text-center">
                  <Cross className="h-10 w-10 text-amber-600 mx-auto mb-3" />
                  <h2 className="text-xl font-bold font-['Playfair_Display'] text-foreground">Introduction</h2>
                </div>
                <p className="text-foreground/90 leading-relaxed whitespace-pre-line text-sm md:text-base">
                  {neuvaine.introduction}
                </p>

                {/* Common prayers */}
                {neuvaine.common_prayers?.opening && (
                  <div className="space-y-4 mt-6 pt-6 border-t border-amber-200/50">
                    <h3 className="text-lg font-bold font-['Playfair_Display'] text-amber-700">Prières d'ouverture</h3>
                    {neuvaine.common_prayers.opening.signe_de_croix && (
                      <div>
                        <h4 className="font-semibold text-foreground mb-1 text-sm">✝ Signe de la Croix</h4>
                        <p className="text-foreground/80 text-sm italic">{neuvaine.common_prayers.opening.signe_de_croix}</p>
                      </div>
                    )}
                    {neuvaine.common_prayers.opening.priere_esprit_saint && (
                      <div>
                        <h4 className="font-semibold text-foreground mb-1 text-sm">🕊️ Prière à l'Esprit Saint</h4>
                        <p className="text-foreground/80 text-sm whitespace-pre-line">{neuvaine.common_prayers.opening.priere_esprit_saint}</p>
                      </div>
                    )}
                    {neuvaine.common_prayers.opening.notre_pere && (
                      <div>
                        <h4 className="font-semibold text-foreground mb-1 text-sm">🙏 Notre Père</h4>
                        <p className="text-foreground/80 text-sm whitespace-pre-line">{neuvaine.common_prayers.opening.notre_pere}</p>
                      </div>
                    )}
                  </div>
                )}

                {neuvaine.common_prayers?.closing && (
                  <div className="space-y-4 mt-6 pt-6 border-t border-amber-200/50">
                    <h3 className="text-lg font-bold font-['Playfair_Display'] text-amber-700">Prières de clôture</h3>
                    {neuvaine.common_prayers.closing.je_vous_salue_marie && (
                      <div>
                        <h4 className="font-semibold text-foreground mb-1 text-sm">🌹 Je vous salue Marie</h4>
                        <p className="text-foreground/80 text-sm whitespace-pre-line">{neuvaine.common_prayers.closing.je_vous_salue_marie}</p>
                      </div>
                    )}
                    {neuvaine.common_prayers.closing.je_vous_salue_joseph && (
                      <div>
                        <h4 className="font-semibold text-foreground mb-1 text-sm">⚜️ Je vous salue Joseph</h4>
                        <p className="text-foreground/80 text-sm whitespace-pre-line">{neuvaine.common_prayers.closing.je_vous_salue_joseph}</p>
                      </div>
                    )}
                    {neuvaine.common_prayers.closing.gloire_au_pere && (
                      <div>
                        <h4 className="font-semibold text-foreground mb-1 text-sm">✨ Gloire au Père</h4>
                        <p className="text-foreground/80 text-sm whitespace-pre-line">{neuvaine.common_prayers.closing.gloire_au_pere}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* DAY PAGES */}
            {day && (
              <div className="space-y-5">
                <div className="text-center">
                  <Badge className="bg-amber-600 text-white mb-3">Jour {day.day}</Badge>
                  <h2 className="text-xl md:text-2xl font-bold font-['Playfair_Display'] text-foreground">
                    {day.title}
                  </h2>
                  <p className="text-muted-foreground text-sm mt-1 italic">{day.subtitle}</p>
                </div>

                {/* Canevas: OUVERTURE */}
                {neuvaine.common_prayers?.opening && (
                  <div className="bg-sky-50 dark:bg-sky-950/20 rounded-lg p-4 space-y-3 border border-sky-200/50 dark:border-sky-800/30">
                    <h3 className="text-sm font-bold text-sky-800 dark:text-sky-300 uppercase tracking-wide">☩ Ouverture</h3>
                    {neuvaine.common_prayers.opening.signe_de_croix && (
                      <p className="text-foreground/80 text-sm italic">{neuvaine.common_prayers.opening.signe_de_croix}</p>
                    )}
                    {neuvaine.common_prayers.opening.priere_esprit_saint && (
                      <details className="group">
                        <summary className="cursor-pointer text-sm font-semibold text-foreground/90 hover:text-foreground">🕊️ Prière à l'Esprit Saint</summary>
                        <p className="text-foreground/80 text-sm whitespace-pre-line mt-2 pl-2 border-l-2 border-sky-300">{neuvaine.common_prayers.opening.priere_esprit_saint}</p>
                      </details>
                    )}
                    {neuvaine.common_prayers.opening.notre_pere && (
                      <details className="group">
                        <summary className="cursor-pointer text-sm font-semibold text-foreground/90 hover:text-foreground">🙏 Notre Père</summary>
                        <p className="text-foreground/80 text-sm whitespace-pre-line mt-2 pl-2 border-l-2 border-sky-300">{neuvaine.common_prayers.opening.notre_pere}</p>
                      </details>
                    )}
                  </div>
                )}

                {/* Scripture */}
                <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-4 border-l-4 border-amber-500">
                  <div className="flex items-start gap-2">
                    <BookOpen className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                    <p className="text-foreground/90 text-sm italic font-medium">{day.scripture}</p>
                  </div>
                </div>

                {/* Tabs for day content */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-amber-100/50 dark:bg-amber-900/20">
                    <TabsTrigger value="meditation" className="text-xs data-[state=active]:bg-amber-600 data-[state=active]:text-white">
                      Méditation
                    </TabsTrigger>
                    <TabsTrigger value="intercessions" className="text-xs data-[state=active]:bg-amber-600 data-[state=active]:text-white">
                      Intercessions
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="meditation" className="mt-4">
                    <p className="text-foreground/90 leading-relaxed whitespace-pre-line text-sm md:text-base">
                      {day.meditation}
                    </p>
                  </TabsContent>

                  <TabsContent value="intercessions" className="mt-4 space-y-4">
                    {day.intercessions?.map((int, i) => (
                      <div key={i} className="border-l-2 border-amber-400 pl-4">
                        <h4 className="font-semibold text-foreground text-sm mb-1">
                          <Heart className="h-3.5 w-3.5 inline mr-1 text-amber-600" />
                          {int.title}
                        </h4>
                        <p className="text-foreground/80 text-sm leading-relaxed">{int.text}</p>
                      </div>
                    ))}

                    <div className="mt-6 bg-amber-50/50 dark:bg-amber-950/20 rounded-lg p-4 text-center">
                      <HandMetal className="h-5 w-5 text-amber-600 mx-auto mb-2" />
                      <p className="text-sm font-medium text-foreground mb-1">Mon intention personnelle</p>
                      <p className="text-xs text-muted-foreground italic">
                        Formulez ici librement votre prière personnelle, en lien avec le thème du jour.
                      </p>
                      <p className="text-xs text-muted-foreground mt-3 italic">
                        Silence — Déposez votre intention dans le cœur de {neuvaine.saint_name}
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>

                {/* Canevas: CLÔTURE */}
                {neuvaine.common_prayers?.closing && (
                  <div className="bg-violet-50 dark:bg-violet-950/20 rounded-lg p-4 space-y-3 border border-violet-200/50 dark:border-violet-800/30 mt-5">
                    <h3 className="text-sm font-bold text-violet-800 dark:text-violet-300 uppercase tracking-wide">☩ Clôture</h3>
                    {neuvaine.common_prayers.closing.je_vous_salue_marie && (
                      <details className="group">
                        <summary className="cursor-pointer text-sm font-semibold text-foreground/90 hover:text-foreground">🌹 Je vous salue Marie</summary>
                        <p className="text-foreground/80 text-sm whitespace-pre-line mt-2 pl-2 border-l-2 border-violet-300">{neuvaine.common_prayers.closing.je_vous_salue_marie}</p>
                      </details>
                    )}
                    {neuvaine.common_prayers.closing.je_vous_salue_joseph && (
                      <details className="group">
                        <summary className="cursor-pointer text-sm font-semibold text-foreground/90 hover:text-foreground">⚜️ Je vous salue Joseph</summary>
                        <p className="text-foreground/80 text-sm whitespace-pre-line mt-2 pl-2 border-l-2 border-violet-300">{neuvaine.common_prayers.closing.je_vous_salue_joseph}</p>
                      </details>
                    )}
                    {neuvaine.common_prayers.closing.gloire_au_pere && (
                      <details className="group">
                        <summary className="cursor-pointer text-sm font-semibold text-foreground/90 hover:text-foreground">✨ Gloire au Père</summary>
                        <p className="text-foreground/80 text-sm whitespace-pre-line mt-2 pl-2 border-l-2 border-violet-300">{neuvaine.common_prayers.closing.gloire_au_pere}</p>
                      </details>
                    )}
                    <p className="text-xs text-muted-foreground italic mt-2">🎵 Chant à l'Esprit Saint · Signe de la Croix</p>
                  </div>
                )}
              </div>
            )}

            {/* CONCLUSION PAGE */}
            {currentDay === totalPages - 1 && (
              <div className="space-y-6">
                <div className="text-center">
                  <Cross className="h-10 w-10 text-amber-600 mx-auto mb-3" />
                  <h2 className="text-xl font-bold font-['Playfair_Display'] text-foreground">Conclusion</h2>
                </div>

                {neuvaine.conclusion?.consecration && (
                  <div>
                    <h3 className="text-lg font-bold font-['Playfair_Display'] text-amber-700 mb-3">
                      Acte de consécration à {neuvaine.saint_name}
                    </h3>
                    <p className="text-foreground/90 leading-relaxed whitespace-pre-line text-sm">
                      {neuvaine.conclusion.consecration}
                    </p>
                  </div>
                )}

                {neuvaine.conclusion?.litany && (
                  <div className="pt-6 border-t border-amber-200/50">
                    <h3 className="text-lg font-bold font-['Playfair_Display'] text-amber-700 mb-3">
                      Litanie de {neuvaine.saint_name}
                    </h3>
                    <p className="text-foreground/90 leading-relaxed whitespace-pre-line text-sm">
                      {neuvaine.conclusion.litany}
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <Button
            variant="outline"
            onClick={goPrev}
            disabled={currentDay === 0}
            className="gap-1 border-amber-300 hover:bg-amber-50"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Précédent</span>
          </Button>

          <span className="text-sm text-muted-foreground">
            {currentDay === 0 ? 'Introduction' : currentDay === totalPages - 1 ? 'Conclusion' : `Jour ${currentDay} / ${days.length}`}
          </span>

          <Button
            variant="outline"
            onClick={goNext}
            disabled={currentDay === totalPages - 1}
            className="gap-1 border-amber-300 hover:bg-amber-50"
          >
            <span className="hidden sm:inline">Suivant</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </main>
    </div>
  );
};

export default NeuvaineDayView;
