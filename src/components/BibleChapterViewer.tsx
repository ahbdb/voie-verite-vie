import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Copy, Share2, Heart } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { loadBibleChapterCached, clearBibleCache, BibleVerse } from '@/lib/bible-content-loader';

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
  const { t } = useTranslation();
  const [verses, setVerses] = useState<BibleVerse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    let isMounted = true;

    const loadChapter = async () => {
      try {
        setLoading(true);
        setError(null);
        const chapterVerses = await loadBibleChapterCached(bookId, chapterNumber);

        if (!isMounted) return;

        if (!chapterVerses) {
          clearBibleCache();
          const retryVerses = await loadBibleChapterCached(bookId, chapterNumber);
          if (retryVerses) {
            if (!isMounted) return;
            setVerses(retryVerses);
            setError(null);
            return;
          }

          setError(t('bibleChapter.chapterNotAvailable', { chapter: chapterNumber, book: bookName }));
          setVerses([]);
        } else {
          setVerses(chapterVerses);
        }
      } catch (err) {
        if (isMounted) {
          setError(t('bibleChapter.loadError', { error: String(err) }));
          console.error(err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadChapter();
    return () => { isMounted = false; };
  }, [bookId, chapterNumber, bookName, t]);

  const copyToClipboard = useCallback((verseText: string) => {
    navigator.clipboard.writeText(verseText);
    toast({
      title: t('bibleChapter.copied'),
      description: t('bibleChapter.verseCopied'),
    });
  }, [toast, t]);

  const shareVerse = useCallback((verseNumber: number) => {
    const reference = `${abbreviation} ${chapterNumber}:${verseNumber}`;
    const text = verses.find((v) => Number(v.number) === Number(verseNumber))?.text || '';

    if (navigator.share) {
      navigator
        .share({
          title: `${bookName} ${chapterNumber}:${verseNumber}`,
          text: `${reference}\n\n${text}`,
        })
        .catch(() => {
          navigator.clipboard.writeText(`${reference}\n\n${text}`);
          toast({
            title: t('bibleChapter.copied'),
            description: t('bibleChapter.refCopied', { ref: reference }),
          });
        });
    } else {
      navigator.clipboard.writeText(`${reference}\n\n${text}`);
      toast({
        title: t('bibleChapter.copied'),
        description: t('bibleChapter.refCopied', { ref: reference }),
      });
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
      toast({
        title: t('bibleChapter.verseSaved'),
        description: t('bibleChapter.verseSavedDesc', { ref: reference }),
      });
    } else {
      toast({
        title: t('bibleChapter.alreadySaved'),
        description: t('bibleChapter.alreadySavedDesc', { ref: reference }),
      });
    }
  }, [abbreviation, chapterNumber, verses, bookName, toast, t]);

  if (loading) {
    return (
      <Card className="w-full bg-card/50 backdrop-blur-sm border-primary/20">
        <CardHeader className="space-y-0 pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">
              {bookName} {chapterNumber}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onBack} title={t('bibleChapter.back')}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full bg-card/50 backdrop-blur-sm border-primary/20">
        <CardHeader className="space-y-0 pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">
              {bookName} {chapterNumber}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onBack} title={t('bibleChapter.back')}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 text-yellow-700 dark:text-yellow-400">
            {error}
          </div>
          <Button variant="outline" onClick={() => window.location.reload()}>
            {t('bibleChapter.retry')}
          </Button>
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
          <CardTitle className="text-2xl">
            {bookName} {chapterNumber}
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="pt-0 px-2 md:px-4">
        {verses.length > 0 && (
          <ScrollArea className="h-[600px] pr-2 md:pr-4">
            <div className="space-y-2 md:space-y-1">
              {verses.map((verse) => (
                <div key={verse.number} className="py-0.5">
                  <div className="flex gap-2">
                    <Badge
                      variant="secondary"
                      className="h-fit flex-shrink-0 font-semibold text-xs sticky left-0 mt-0.5"
                    >
                      {verse.number}
                    </Badge>
                    <div className="flex-1">
                      <p className="text-sm leading-relaxed text-foreground/90 text-justify inline">
                        {verse.text}
                        <span className="inline-flex gap-1 ml-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0 text-muted-foreground hover:text-primary transition-colors inline-flex"
                            onClick={() => copyToClipboard(verse.text)}
                            title={t('bibleChapter.copyVerse')}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0 text-muted-foreground hover:text-primary transition-colors inline-flex"
                            onClick={() => shareVerse(verse.number)}
                            title={t('bibleChapter.shareVerse')}
                          >
                            <Share2 className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0 text-muted-foreground hover:text-rose-500 transition-colors inline-flex"
                            onClick={() => saveVerse(verse.number)}
                            title={t('bibleChapter.saveVerse')}
                          >
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

        {verses.length === 0 && !error && (
          <div className="text-center py-8 text-muted-foreground">
            <p>{t('bibleChapter.noVerses')}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BibleChapterViewer;
