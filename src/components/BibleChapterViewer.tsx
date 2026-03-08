import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Copy, Share2, Heart } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { loadBibleChapterCached, clearBibleCache, BibleVerse } from '@/lib/bible-content-loader';
import { supabase } from '@/integrations/supabase/client';

interface BibleChapterViewerProps {
  bookId: string;
  bookName: string;
  abbreviation: string;
  chapterNumber: number;
  onBack: () => void;
}

export const BibleChapterViewer = ({
  bookId,
  bookName,
  abbreviation,
  chapterNumber,
  onBack,
}: BibleChapterViewerProps) => {
  const { t, i18n } = useTranslation();
  const [verses, setVerses] = useState<BibleVerse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const lang = i18n.language?.split('-')[0] || 'fr';

  useEffect(() => {
    let isMounted = true;

    const loadChapter = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load French verses from local data
        let chapterVerses = await loadBibleChapterCached(bookId, chapterNumber);
        if (!chapterVerses) {
          clearBibleCache();
          chapterVerses = await loadBibleChapterCached(bookId, chapterNumber);
        }

        if (!isMounted) return;

        if (!chapterVerses) {
          setError(t('bibleChapter.chapterNotAvailable', { chapter: chapterNumber, book: bookName }));
          setVerses([]);
          setLoading(false);
          return;
        }

        // === FRENCH: Show instantly, patch empty verses silently ===
        if (lang === 'fr') {
          // Check patch cache first
          const patchKey = `bible_patched_fr_${bookId}_${chapterNumber}`;
          const cached = localStorage.getItem(patchKey);
          if (cached) {
            try {
              const parsed = JSON.parse(cached);
              if (parsed?.length > 0) {
                setVerses(parsed);
                setLoading(false);
                return;
              }
            } catch { /* ignore */ }
          }

          // Show non-empty verses IMMEDIATELY
          const nonEmpty = chapterVerses.filter((v: any) => v.text && v.text.trim());
          setVerses(nonEmpty);
          setLoading(false);

          // Patch empty verses silently in background
          const hasEmpty = chapterVerses.some((v: any) => !v.text || v.text.trim() === '');
          if (hasEmpty) {
            supabase.functions.invoke('translate-bible-chapter', {
              body: { verses: chapterVerses, bookName, chapterNumber, bookFileName: bookId, patchEmptyVerses: true }
            }).then(({ data }) => {
              if (isMounted && data?.verses?.length > 0) {
                const patched = data.verses.filter((v: any) => v.text && v.text.trim());
                setVerses(patched);
                if (data.patched > 0) {
                  localStorage.setItem(patchKey, JSON.stringify(patched));
                }
              }
            }).catch(() => {});
          }
          return;
        }

        // === ENGLISH / ITALIAN: Check cache first, show instantly if available ===
        const cacheKey = `bible_${lang}_${bookId}_${chapterNumber}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (parsed?.length > 0) {
              setVerses(parsed);
              setLoading(false);
              return;
            }
          } catch { /* ignore */ }
        }

        // Fetch from API — show loading briefly
        setLoading(false); // Don't show loading, just empty then fill
        
        const { data, error: fnError } = await supabase.functions.invoke('translate-bible-chapter', {
          body: { verses: chapterVerses, bookName, chapterNumber, targetLang: lang, bookFileName: bookId }
        });

        if (!isMounted) return;

        if (!fnError && data?.verses?.length > 0) {
          setVerses(data.verses);
          localStorage.setItem(cacheKey, JSON.stringify(data.verses));
        } else {
          // Show French as fallback (non-empty only)
          setVerses(chapterVerses.filter((v: any) => v.text && v.text.trim()));
        }

      } catch (err) {
        if (isMounted) {
          setError(t('bibleChapter.loadError', { error: String(err) }));
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadChapter();
    return () => { isMounted = false; };
  }, [bookId, chapterNumber, bookName, t, lang]);

  const copyToClipboard = useCallback((verseText: string) => {
    navigator.clipboard.writeText(verseText);
    toast({ title: t('bibleChapter.copied'), description: t('bibleChapter.verseCopied') });
  }, [toast, t]);

  const shareVerse = useCallback((verseNumber: number) => {
    const reference = `${abbreviation} ${chapterNumber}:${verseNumber}`;
    const text = verses.find((v) => Number(v.number) === Number(verseNumber))?.text || '';
    if (navigator.share) {
      navigator.share({ title: `${bookName} ${chapterNumber}:${verseNumber}`, text: `${reference}\n\n${text}` })
        .catch(() => {
          navigator.clipboard.writeText(`${reference}\n\n${text}`);
          toast({ title: t('bibleChapter.copied'), description: t('bibleChapter.refCopied', { ref: reference }) });
        });
    } else {
      navigator.clipboard.writeText(`${reference}\n\n${text}`);
      toast({ title: t('bibleChapter.copied'), description: t('bibleChapter.refCopied', { ref: reference }) });
    }
  }, [abbreviation, chapterNumber, verses, bookName, toast, t]);

  const saveVerse = useCallback((verseNumber: number) => {
    const reference = `${abbreviation} ${chapterNumber}:${verseNumber}`;
    const text = verses.find((v) => Number(v.number) === Number(verseNumber))?.text || '';
    const savedVerses = JSON.parse(localStorage.getItem('saved_verses') || '[]');
    const verseData = { reference, text, bookName, savedAt: new Date().toISOString() };
    const isAlreadySaved = savedVerses.some((v: any) => v.reference === reference);
    if (!isAlreadySaved) {
      savedVerses.push(verseData);
      localStorage.setItem('saved_verses', JSON.stringify(savedVerses));
      toast({ title: t('bibleChapter.verseSaved'), description: t('bibleChapter.verseSavedDesc', { ref: reference }) });
    } else {
      toast({ title: t('bibleChapter.alreadySaved'), description: t('bibleChapter.alreadySavedDesc', { ref: reference }) });
    }
  }, [abbreviation, chapterNumber, verses, bookName, toast, t]);

  if (error) {
    return (
      <Card className="w-full bg-card/50 backdrop-blur-sm border-primary/20">
        <CardHeader className="space-y-0 pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">{bookName} {chapterNumber}</CardTitle>
            <Button variant="ghost" size="sm" onClick={onBack} title={t('bibleChapter.back')}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 text-destructive">
            {error}
          </div>
          <Button variant="outline" onClick={() => window.location.reload()}>{t('bibleChapter.retry')}</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full bg-card/50 backdrop-blur-sm border-primary/20">
      <CardHeader className="space-y-0 pb-3">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onBack} title={t('bibleChapter.back')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <CardTitle className="text-2xl">{bookName} {chapterNumber}</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="pt-0 px-2 md:px-4">
        {verses.length > 0 && (
          <ScrollArea className="h-[600px] pr-2 md:pr-4">
            <div className="space-y-2 md:space-y-1">
              {verses.map((verse) => (
                <div key={verse.number} className="py-0.5">
                  <div className="flex gap-2">
                    <Badge variant="secondary" className="h-fit flex-shrink-0 font-semibold text-xs sticky left-0 mt-0.5">
                      {verse.number}
                    </Badge>
                    <div className="flex-1">
                      <p className="text-sm leading-relaxed text-foreground/90 text-justify inline">
                        {verse.text}
                        <span className="inline-flex gap-1 ml-2">
                          <Button variant="ghost" size="sm" className="h-5 w-5 p-0 text-muted-foreground hover:text-primary transition-colors inline-flex" onClick={() => copyToClipboard(verse.text)} title={t('bibleChapter.copyVerse')}>
                            <Copy className="w-3 h-3" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-5 w-5 p-0 text-muted-foreground hover:text-primary transition-colors inline-flex" onClick={() => shareVerse(verse.number)} title={t('bibleChapter.shareVerse')}>
                            <Share2 className="w-3 h-3" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive transition-colors inline-flex" onClick={() => saveVerse(verse.number)} title={t('bibleChapter.saveVerse')}>
                            <Heart className="w-3 h-3" />
                          </Button>
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {verses.length === 0 && !loading && !error && (
          <div className="text-center py-8 text-muted-foreground">
            <p>{t('bibleChapter.noVerses')}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BibleChapterViewer;
