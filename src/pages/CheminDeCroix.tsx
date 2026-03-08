import { memo, useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
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
import stainedGlass from '@/assets/stained-glass-cross.jpg';

interface Station { number: number; title: string; reading: string; text: string; meditation: string; prayer: string; }

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
      if ((navigator as any).share) { await (navigator as any).share({ title: `${t('chemin.title')} — Voie-Vérité-Vie`, text: t('chemin.subtitle'), url: window.location.href }); }
      else { await navigator.clipboard.writeText(window.location.href); }
    } catch (err) { console.error(err); }
  };

  const goToNextStation = (stations: any[]) => { if (!selectedStation) return; const idx = stations.findIndex(s => s.number === selectedStation.number); if (idx < stations.length - 1) setSelectedStation(stations[idx + 1]); };
  const goToPreviousStation = (stations: any[]) => { if (!selectedStation) return; const idx = stations.findIndex(s => s.number === selectedStation.number); if (idx > 0) setSelectedStation(stations[idx - 1]); };

  const shareStation = async (adoration: string) => {
    if (!selectedStation) return;
    try {
      const blob = await generateShareImage({ title: selectedStation.title, reading: selectedStation.reading, text: selectedStation.text, meditation: selectedStation.meditation, prayer: selectedStation.prayer, adoration, number: selectedStation.number, type: 'station' });
      if (blob) await shareImage(blob, `Station-${String(selectedStation.number).padStart(2, '0')}`);
    } catch (error) { console.error('❌ Erreur:', error); }
  };

  const shareAllStations = async (stations: any[], adoration: string) => {
    if (stations.length === 0) return;
    setSharingProgress({ current: 0, total: stations.length });
    for (let idx = 0; idx < stations.length; idx++) {
      try {
        setSharingProgress({ current: idx + 1, total: stations.length });
        const blob = await generateShareImage({ title: stations[idx].title, reading: stations[idx].reading, text: stations[idx].text, meditation: stations[idx].meditation, prayer: stations[idx].prayer, adoration: cheminDeCroixData.adoration, number: stations[idx].number, type: 'station' });
        if (blob) await shareImage(blob, `Station-${String(stations[idx].number).padStart(2, '0')}`);
      } catch (error) { console.error(`❌ Erreur station ${stations[idx].number}:`, error); }
      await new Promise(resolve => setTimeout(resolve, !/android|iphone|ipad/i.test(navigator.userAgent) ? 500 : 300));
    }
    setSharingProgress(null);
    toast({ title: `✝️ ${t('chemin.allStationsShared')}` });
  };

  const [contentData, setContentData] = useState<any>(null);

  useEffect(() => {
    const loadContent = async () => {
      try {
        const { data, error } = await supabase.from('page_content').select('*').eq('page_key', 'chemin-de-croix').single();
        if (error) return;
        const content = data.content as { stations?: Station[] } | null;
        if (content) setContentData(mergeCheminContent(content, cheminDeCroixData));
      } catch (err) { console.error('❌ [CheminDeCroix] Failed to load content:', err); }
    };
    void loadContent();
    if (!subscriptionRef.current) {
      subscriptionRef.current = supabase.channel('chemin_de_croix_updates').on('postgres_changes', { event: '*', schema: 'public', table: 'page_content', filter: `page_key=eq.chemin-de-croix` }, (payload: any) => { if (payload.new?.content) setContentData(mergeCheminContent(payload.new.content, cheminDeCroixData)); else void loadContent(); }).subscribe();
    }
    return () => { subscriptionRef.current?.unsubscribe(); subscriptionRef.current = null; };
  }, []);

  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === 'visible') {
        (async () => {
          const { data, error } = await supabase.from('page_content').select('*').eq('page_key', 'chemin-de-croix').single();
          if (data?.content && !error) setContentData(mergeCheminContent(data.content, cheminDeCroixData));
        })();
      }
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, []);

  const effective = contentData || cheminDeCroixData;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {sharingProgress && (
        <div className="fixed top-0 left-0 right-0 bg-secondary text-secondary-foreground p-4 z-50 flex items-center gap-4">
          <div className="flex-1">
            <div className="flex justify-between text-sm mb-2"><span>{t('chemin.sharingInProgress')}</span><span>{sharingProgress.current}/{sharingProgress.total}</span></div>
            <div className="w-full bg-secondary/50 rounded-full h-2"><div className="bg-cathedral-gold h-2 rounded-full transition-all duration-300" style={{ width: `${(sharingProgress.current / sharingProgress.total) * 100}%` }} /></div>
          </div>
        </div>
      )}

      {/* Cathedral Hero */}
      <header className="relative h-[45vh] min-h-[320px] flex items-center justify-center overflow-hidden">
        <img src={stainedGlass} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-[hsl(220,55%,5%,0.6)] via-[hsl(220,55%,5%,0.45)] to-[hsl(220,55%,5%,0.8)]" />
        <motion.div className="relative z-10 container mx-auto px-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-4">
            <Cross className="w-8 h-8 text-cathedral-gold" />
            <span className="text-sm font-semibold text-cathedral-gold/80 font-inter">{effective.intro.community}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-cinzel font-bold text-white mb-2">{effective.intro.title}</h1>
          <p className="text-base sm:text-lg text-white/60 mb-3 font-inter">{effective.intro.subtitle}</p>
          <p className="text-sm italic text-cathedral-gold/60 mb-4 max-w-2xl font-playfair">{effective.intro.verse}</p>
          <p className="text-sm text-white/40">⏱️ {t('chemin.duration')} : {effective.intro.duration}</p>
        </motion.div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-8 md:py-12">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="intro" className="text-xs sm:text-sm">📖 {t('chemin.introTab')}</TabsTrigger>
            <TabsTrigger value="stations" className="text-xs sm:text-sm">✝️ {t('chemin.stationsTab')}</TabsTrigger>
            <TabsTrigger value="conclusion" className="text-xs sm:text-sm">✨ {t('chemin.conclusionTab')}</TabsTrigger>
          </TabsList>

          <TabsContent value="intro" className="space-y-6">
            <Card>
              <CardHeader className="bg-muted/50"><CardTitle className="text-lg">✠ {t('chemin.introTitle')} ✠</CardTitle></CardHeader>
              <CardContent className="pt-6"><p className="text-sm leading-relaxed whitespace-pre-line text-muted-foreground">{effective.intro.introduction}</p></CardContent>
            </Card>
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <Button onClick={printPage} variant="outline" className="gap-2 flex-1"><Printer className="w-4 h-4" /><span className="hidden sm:inline">{t('chemin.print')}</span></Button>
                <Button onClick={shareProgram} variant="outline" className="gap-2 flex-1"><Share2 className="w-4 h-4" /><span className="hidden sm:inline">{t('chemin.share')}</span></Button>
              </div>
              <Button onClick={() => shareAllStations(effective.stations, effective.adoration)} className="w-full gap-2 bg-secondary hover:bg-secondary/90"><Share2 className="w-4 h-4" />{t('chemin.shareAll14')}</Button>
            </div>
          </TabsContent>

          <TabsContent value="stations" className="space-y-4">
            <div className="grid gap-3 md:gap-4">
              {effective.stations.map((station: any, idx: number) => (
                <motion.button
                  key={idx}
                  onClick={() => setSelectedStation(station)}
                  className="text-left w-full"
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className="border-border hover:border-primary/30 hover:shadow-elegant transition-all cursor-pointer h-full">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg font-cinzel font-bold text-primary w-6">{String(station.number).padStart(2, '0')}</span>
                            <h3 className="font-semibold truncate text-sm sm:text-base">{station.title}</h3>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-1">{station.reading}</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                      </div>
                      <p className="text-xs italic text-primary/60 leading-tight">{effective.adoration}</p>
                    </CardContent>
                  </Card>
                </motion.button>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="conclusion" className="space-y-6">
            <Card>
              <CardHeader className="bg-muted/50"><CardTitle className="text-lg">✠ {t('chemin.conclusionTitle')} ✠</CardTitle></CardHeader>
              <CardContent className="pt-6 space-y-4">
                <p className="text-sm leading-relaxed text-muted-foreground">{cheminDeCroixData.conclusion.text}</p>
                <div className="bg-muted/50 border border-border p-4 rounded-lg">
                  <p className="leading-relaxed whitespace-pre-line text-xs sm:text-sm">{cheminDeCroixData.conclusion.prayer}</p>
                  <div className="mt-6 pt-6 border-t-2 border-primary/20 italic text-center space-y-3">
                    <p className="text-sm font-semibold whitespace-pre-line">{t('chemin.adorationText')}</p>
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
                <span className="text-3xl font-cinzel font-bold text-primary">{String(selectedStation?.number).padStart(2, '0')}</span>
                <div><h2 className="text-lg">{selectedStation?.title}</h2><p className="text-xs text-muted-foreground">{selectedStation?.reading}</p></div>
              </div>
            </DialogTitle>
            <DialogDescription className="sr-only">{t('chemin.title')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-primary/5 border-2 border-primary/20 p-4 rounded-lg text-center">
              <p className="text-sm font-semibold leading-relaxed whitespace-pre-line">{cheminDeCroixData.adoration}</p>
            </div>
            <div className="bg-muted/50 border-l-4 border-primary p-4 rounded">
              <p className="text-sm italic text-muted-foreground">"{ selectedStation?.text}"</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-2">💭 {t('chemin.meditationLabel')}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{selectedStation?.meditation}</p>
            </div>
            <div className="bg-muted/50 border border-border p-4 rounded-lg">
              <h3 className="text-sm font-semibold mb-2">🙏 {t('chemin.prayerLabel')}</h3>
              <p className="text-sm italic">{selectedStation?.prayer}</p>
              <p className="text-xs text-muted-foreground mt-3 pt-2 border-t border-border">{t('neuvaines.ourFather')}... • {t('neuvaines.hailMary')}...</p>
            </div>
            <div className="flex gap-2 pt-4 border-t border-border">
              <Button onClick={() => goToPreviousStation(effective.stations)} disabled={selectedStation?.number === 1} className="flex-1 flex items-center justify-center gap-1"><ChevronLeft className="w-4 h-4" /><span className="hidden sm:inline text-xs">{t('chemin.previousStation')}</span></Button>
              <Button onClick={() => shareStation(effective.adoration)} className="flex-1 flex items-center justify-center gap-1"><Share2 className="h-4 w-4" /><span className="hidden sm:inline text-xs">{t('chemin.share')}</span></Button>
              <Button onClick={() => setSelectedStation(null)} variant="outline" className="flex-1"><span className="hidden sm:inline">{t('chemin.close')}</span><span className="sm:hidden text-lg">✕</span></Button>
              <Button onClick={() => goToNextStation(effective.stations)} disabled={selectedStation?.number === 14} className="flex-1 flex items-center justify-center gap-1"><span className="hidden sm:inline text-xs">{t('chemin.nextStation')}</span><ChevronRight className="w-4 h-4" /></Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
});

export default CheminDeCroix;
