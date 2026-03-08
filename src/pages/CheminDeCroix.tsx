import { memo, useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import Navigation from '@/components/Navigation';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronRight, ChevronLeft, Cross, Share2, Printer, BookOpen } from 'lucide-react';
import { getCheminDeCroixData } from '@/data/chemin-de-croix-data';
import { supabase } from '@/integrations/supabase/client';
import { generateShareImage, shareImage } from '@/lib/share-utils';
import { useToast } from '@/components/ui/use-toast';

interface Station {
  number: number;
  title: string;
  reading: string;
  text: string;
  meditation: string;
  prayer: string;
}

const mergeCheminContent = (rawContent: any, baseData: any) => ({ ...baseData, ...rawContent, intro: { ...baseData.intro, ...(rawContent?.intro || {}) }, conclusion: { ...baseData.conclusion, ...(rawContent?.conclusion || {}) }, stations: Array.isArray(rawContent?.stations) && rawContent.stations.length > 0 ? rawContent.stations : baseData.stations, adoration: rawContent?.adoration || baseData.adoration });

const CheminDeCroix = memo(() => {
  const { t, i18n } = useTranslation();
  const cheminDeCroixData = getCheminDeCroixData(i18n.language);
  const [selectedStation, setSelectedStation] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState('intro');
  const [sharingProgress, setSharingProgress] = useState<{ current: number, total: number } | null>(null);
  const subscriptionRef = useRef<any>(null);
  const { toast } = useToast();

  const printPage = () => window.print();
  const shareProgram = async () => {
    try {
      if ((navigator as any).share) {
        await (navigator as any).share({
          title: `${t('chemin.title')} — Voie-Vérité-Vie`,
          text: t('chemin.subtitle'),
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const goToNextStation = (stations: any[]) => {
    if (!selectedStation) return;
    const currentIndex = stations.findIndex(s => s.number === selectedStation.number);
    if (currentIndex < stations.length - 1) {
      setSelectedStation(stations[currentIndex + 1]);
    }
  };

  const goToPreviousStation = (stations: any[]) => {
    if (!selectedStation) return;
    const currentIndex = stations.findIndex(s => s.number === selectedStation.number);
    if (currentIndex > 0) {
      setSelectedStation(stations[currentIndex - 1]);
    }
  };

  const shareStation = async (adoration: string) => {
    if (!selectedStation) return;
    try {
      console.log('🔄 Génération image pour:', selectedStation.title);
      const station = selectedStation;
      
      const blob = await generateShareImage({
        title: station.title,
        reading: station.reading,
        text: station.text,
        meditation: station.meditation,
        prayer: station.prayer,
        adoration: adoration,
        number: station.number,
        type: 'station',
      });

      console.log('📸 Blob généré:', blob ? `${blob.size} bytes` : 'null');

      if (blob) {
        console.log('📤 Partage en cours...');
        const shared = await shareImage(blob, `Station-${String(station.number).padStart(2, '0')}`);
        console.log('📊 Résultat partage:', shared);
      } else {
        console.error('❌ Erreur génération image');
        alert('❌ Erreur: Image non générée. Vérifiez la console.');
      }
    } catch (error) {
      console.error('❌ Erreur:', error);
      alert('❌ Erreur lors du partage');
    }
  };

  const shareAllStations = async (stations: any[], adoration: string) => {
    if (stations.length === 0) return;
    
    setSharingProgress({ current: 0, total: stations.length });
    
    for (let idx = 0; idx < stations.length; idx++) {
      const station = stations[idx];
      try {
        setSharingProgress({ current: idx + 1, total: stations.length });
        const blob = await generateShareImage({
          title: station.title, reading: station.reading, text: station.text,
          meditation: station.meditation, prayer: station.prayer,
          adoration: cheminDeCroixData.adoration, number: station.number, type: 'station',
        });
        if (blob) {
          await shareImage(blob, `Station-${String(station.number).padStart(2, '0')}`);
        }
      } catch (error) {
        console.error(`❌ Erreur station ${station.number}:`, error);
      }
      const isDesktop = !/android|iphone|ipad|ipot|webos/i.test(navigator.userAgent.toLowerCase());
      await new Promise(resolve => setTimeout(resolve, isDesktop ? 500 : 300));
    }
    
    setSharingProgress(null);
    toast({ title: `✝️ ${t('chemin.allStationsShared')}` });
  };

  const [contentData, setContentData] = useState<any>(null);

  useEffect(() => {
    const loadContent = async () => {
      try {
        const { data, error } = await supabase.from('page_content').select('*').eq('page_key', 'chemin-de-croix').single();
        if (error) { console.warn('⚠️ [CheminDeCroix] Error loading content:', error.message); return; }
        const content = data.content as { stations?: Station[] } | null;
        if (content) setContentData(mergeCheminContent(content, cheminDeCroixData));
      } catch (err) { console.error('❌ [CheminDeCroix] Failed to load content:', err); }
    };
    void loadContent();
    if (!subscriptionRef.current) {
      subscriptionRef.current = supabase.channel('chemin_de_croix_updates').on('postgres_changes', { event: '*', schema: 'public', table: 'page_content', filter: `page_key=eq.chemin-de-croix` }, (payload: any) => { if (payload.new?.content) { setContentData(mergeCheminContent(payload.new.content)); } else { void loadContent(); } }).subscribe();
    }
    return () => { subscriptionRef.current?.unsubscribe(); subscriptionRef.current = null; };
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const loadContent = async () => {
          try {
            const { data, error } = await supabase.from('page_content').select('*').eq('page_key', 'chemin-de-croix').single();
            if (data?.content && !error) setContentData(mergeCheminContent(data.content));
          } catch (err) { console.warn('⚠️ [CheminDeCroix] Reload failed:', err); }
        };
        loadContent();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const effective = contentData || cheminDeCroixData;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:bg-slate-950 dark:text-slate-100">
      <Navigation />

      {sharingProgress && (
        <div className="fixed top-0 left-0 right-0 bg-purple-600 text-white p-4 z-50 flex items-center gap-4">
          <div className="flex-1">
            <div className="flex justify-between text-sm mb-2">
              <span>{t('chemin.sharingInProgress')}</span>
              <span>{sharingProgress.current}/{sharingProgress.total}</span>
            </div>
            <div className="w-full bg-purple-800 rounded-full h-2">
              <div className="bg-white h-2 rounded-full transition-all duration-300" style={{ width: `${(sharingProgress.current / sharingProgress.total) * 100}%` }}></div>
            </div>
          </div>
        </div>
      )}

      <header className="bg-gradient-to-br from-purple-900 via-purple-800 to-purple-900 text-white pt-20 pb-12 px-4 relative overflow-hidden dark:from-purple-950 dark:via-purple-900 dark:to-purple-950">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>
        <div className="container mx-auto relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <Cross className="w-8 h-8 text-purple-200" />
            <span className="text-sm font-semibold text-purple-200">{effective.intro.community}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2">{effective.intro.title}</h1>
          <p className="text-base sm:text-lg text-purple-100 mb-3">{effective.intro.subtitle}</p>
          <p className="text-sm italic text-purple-200 mb-4 max-w-2xl">{effective.intro.verse}</p>
          <p className="text-sm text-purple-150">⏱️ {t('chemin.duration')} : {effective.intro.duration}</p>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-8 md:py-12">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6 bg-slate-100 p-1 rounded-lg dark:bg-slate-800">
            <TabsTrigger value="intro" className="text-xs sm:text-sm">📖 {t('chemin.introTab')}</TabsTrigger>
            <TabsTrigger value="stations" className="text-xs sm:text-sm">✝️ {t('chemin.stationsTab')}</TabsTrigger>
            <TabsTrigger value="conclusion" className="text-xs sm:text-sm">✨ {t('chemin.conclusionTab')}</TabsTrigger>
          </TabsList>

          <TabsContent value="intro" className="space-y-6">
            <Card className="border-purple-200">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100/50">
                <CardTitle className="text-lg">✠ {t('chemin.introTitle')} ✠</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="text-sm leading-relaxed whitespace-pre-line text-gray-700">{effective.intro.introduction}</p>
              </CardContent>
            </Card>

            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <Button onClick={printPage} variant="outline" className="gap-2 flex-1">
                  <Printer className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('chemin.print')}</span>
                </Button>
                <Button onClick={shareProgram} variant="outline" className="gap-2 flex-1">
                  <Share2 className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('chemin.share')}</span>
                </Button>
              </div>
              <Button onClick={() => shareAllStations(effective.stations, effective.adoration)} className="w-full gap-2 bg-purple-600 hover:bg-purple-700">
                <Share2 className="w-4 h-4" />
                {t('chemin.shareAll14')}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="stations" className="space-y-4">
            <div className="grid gap-3 md:gap-4">
              {effective.stations.map((station, idx) => (
                <button key={idx} onClick={() => setSelectedStation(station)} className="text-left">
                  <Card className="border-purple-100 hover:border-purple-300 hover:shadow-md transition-all cursor-pointer h-full">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg font-bold text-purple-800 w-6">{String(station.number).padStart(2, '0')}</span>
                            <h3 className="font-semibold text-purple-900 truncate text-sm sm:text-base">{station.title}</h3>
                          </div>
                          <p className="text-xs text-gray-600 line-clamp-1">{station.reading}</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-purple-600 flex-shrink-0 mt-1" />
                      </div>
                      <p className="text-xs italic text-purple-700 leading-tight">{effective.adoration}</p>
                    </CardContent>
                  </Card>
                </button>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="conclusion" className="space-y-6">
            <Card className="border-purple-200">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100/50">
                <CardTitle className="text-lg">✠ {t('chemin.conclusionTitle')} ✠</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <p className="text-sm leading-relaxed text-gray-700">{cheminDeCroixData.conclusion.text}</p>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200 p-4 rounded-lg dark:bg-gradient-to-br dark:from-purple-950 dark:to-purple-900/50 dark:border-purple-800">
                  <p className="leading-relaxed whitespace-pre-line text-xs sm:text-sm text-gray-800">{cheminDeCroixData.conclusion.prayer}</p>
                  <div className="mt-6 pt-6 border-t-2 border-purple-300 italic text-center space-y-3">
                    <p className="text-sm font-semibold text-purple-900 whitespace-pre-line">{t('chemin.adorationText')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={!!selectedStation} onOpenChange={(open) => { if (!open) setSelectedStation(null); }}>
        <DialogContent id={selectedStation ? 'share-source' : undefined} className="max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-xl">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl font-bold text-purple-800">{String(selectedStation?.number).padStart(2, '0')}</span>
                <div>
                  <h2 className="text-lg dark:text-slate-100">{selectedStation?.title}</h2>
                  <p className="text-xs text-gray-500 dark:text-slate-400">{selectedStation?.reading}</p>
                </div>
              </div>
            </DialogTitle>
            <DialogDescription className="sr-only">{t('chemin.title')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-purple-50 border-2 border-purple-300 p-4 rounded-lg text-center dark:bg-purple-950 dark:border-purple-700 dark:text-slate-100">
              <p className="text-sm font-semibold text-purple-900 leading-relaxed whitespace-pre-line dark:text-purple-100">{cheminDeCroixData.adoration}</p>
            </div>

            <div className="bg-purple-50 border-l-4 border-purple-600 p-4 rounded dark:bg-purple-950 dark:border-l-4 dark:border-purple-600 dark:text-slate-100">
              <p className="text-sm italic text-gray-700 dark:text-slate-300">"{ selectedStation?.text}"</p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-purple-900 mb-2 dark:text-purple-100">💭 {t('chemin.meditationLabel')}</h3>
              <p className="text-sm leading-relaxed text-gray-700 dark:text-slate-300">{selectedStation?.meditation}</p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200 p-4 rounded-lg dark:bg-gradient-to-br dark:from-purple-950 dark:to-purple-900/50 dark:border-purple-800">
              <h3 className="text-sm font-semibold text-purple-900 mb-2 dark:text-purple-100">🙏 {t('chemin.prayerLabel')}</h3>
              <p className="text-sm italic text-purple-900 dark:text-purple-200">{selectedStation?.prayer}</p>
              <p className="text-xs text-purple-700 mt-3 pt-2 border-t border-purple-200 dark:text-purple-300 dark:border-purple-800">
                {t('neuvaines.ourFather')}... • {t('neuvaines.hailMary')}...
              </p>
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Button onClick={() => goToPreviousStation(effective.stations)} disabled={selectedStation?.number === 1} className="flex-1 bg-purple-600 hover:bg-purple-700 flex items-center justify-center gap-1">
                <ChevronLeft className="w-4 h-4 flex-shrink-0" />
                <span className="hidden sm:inline text-xs">{t('chemin.previousStation')}</span>
              </Button>
              <Button onClick={() => shareStation(effective.adoration)} className="flex-1 bg-purple-600 hover:bg-purple-700 flex items-center justify-center gap-1">
                <Share2 className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline text-xs">{t('chemin.share')}</span>
              </Button>
              <Button onClick={() => setSelectedStation(null)} variant="outline" className="flex-1 flex items-center justify-center">
                <span className="hidden sm:inline">{t('chemin.close')}</span>
                <span className="sm:hidden text-lg">✕</span>
              </Button>
              <Button onClick={() => goToNextStation(effective.stations)} disabled={selectedStation?.number === 14} className="flex-1 bg-purple-600 hover:bg-purple-700 flex items-center justify-center gap-1">
                <span className="hidden sm:inline text-xs">{t('chemin.nextStation')}</span>
                <ChevronRight className="w-4 h-4 flex-shrink-0" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
});

export default CheminDeCroix;
