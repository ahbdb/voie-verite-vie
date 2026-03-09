import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Copy, Share2, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { loadBibleChapterCached, clearBibleCache, BibleVerse } from '@/lib/bible-content-loader';
import { supabase } from '@/integrations/supabase/client';

interface BibleChapterViewerProps {
  bookId: string;
  bookName: string;
  abbreviation: string;
  chapterNumber: number;
  totalChapters?: number;
  onChapterChange?: (ch: number) => void;
  onChapterTextReady?: (text: string) => void;
  onBack?: () => void;
}

export const BibleChapterViewer = ({
  bookId,
  bookName,
  abbreviation,
  chapterNumber,
  totalChapters,
  onChapterChange,
  onChapterTextReady,
}: BibleChapterViewerProps) => {
  const { t, i18n } = useTranslation();
  const [verses, setVerses] = useState<BibleVerse[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const lang = i18n.language?.split('-')[0] || 'fr';

  useEffect(() => {
    let isMounted = true;

    const loadChapter = async () => {
      try {
        setLoading(true);
        setInitialLoadDone(false);
        setError(null);

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

        if (lang === 'fr') {
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
            } catch {
              // ignore parse cache errors
            }
          }

          const nonEmpty = chapterVerses.filter((v: any) => v.text && v.text.trim());
          setVerses(nonEmpty);
          setLoading(false);

          const hasEmpty = chapterVerses.some((v: any) => !v.text || v.text.trim() === '');
          if (hasEmpty) {
            supabase.functions
              .invoke('translate-bible-chapter', {
                body: {
                  verses: chapterVerses,
                  bookName,
                  chapterNumber,
                  bookFileName: bookId,
                  patchEmptyVerses: true,
                },
              })
              .then(({ data }) => {
                if (isMounted && data?.verses?.length > 0) {
                  const patched = data.verses.filter((v: any) => v.text && v.text.trim());
                  setVerses(patched);
                  if (data.patched > 0) {
                    localStorage.setItem(patchKey, JSON.stringify(patched));
                  }
                }
              })
              .catch(() => {});
          }
          return;
        }

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
          } catch {
            // ignore parse cache errors
          }
        }

        setLoading(false);
        const { data, error: fnError } = await supabase.functions.invoke('translate-bible-chapter', {
          body: { verses: chapterVerses, bookName, chapterNumber, targetLang: lang, bookFileName: bookId },
        });

        if (!isMounted) return;

        if (!fnError && data?.verses?.length > 0) {
          setVerses(data.verses);
          localStorage.setItem(cacheKey, JSON.stringify(data.verses));
        } else {
          setVerses(chapterVerses.filter((v: any) => v.text && v.text.trim()));
        }
      } catch (err) {
        if (isMounted) {
          setError(t('bibleChapter.loadError', { error: String(err) }));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          setInitialLoadDone(true);
        }
      }
    };

    loadChapter();
    return () => {
      isMounted = false;
    };
  }, [bookId, chapterNumber, bookName, t, lang]);

  useEffect(() => {
    if (!onChapterTextReady) return;
    const text = verses.map((verse) => `${verse.number}. ${verse.text}`).join(' ');
    onChapterTextReady(text);
  }, [verses, onChapterTextReady]);

  const copyToClipboard = useCallback(
    (verseText: string) => {
      navigator.clipboard.writeText(verseText);
      toast({ title: t('bibleChapter.copied'), description: t('bibleChapter.verseCopied') });
    },
    [toast, t]
  );

  const shareVerse = useCallback(
    (verseNumber: number) => {
      const reference = `${abbreviation} ${chapterNumber}:${verseNumber}`;
      const text = verses.find((v) => Number(v.number) === Number(verseNumber))?.text || '';

      if (navigator.share) {
        navigator
          .share({ title: `${bookName} ${chapterNumber}:${verseNumber}`, text: `${reference}\n\n${text}` })
          .catch(() => {
            navigator.clipboard.writeText(`${reference}\n\n${text}`);
            toast({ title: t('bibleChapter.copied'), description: t('bibleChapter.refCopied', { ref: reference }) });
          });
      } else {
        navigator.clipboard.writeText(`${reference}\n\n${text}`);
        toast({ title: t('bibleChapter.copied'), description: t('bibleChapter.refCopied', { ref: reference }) });
      }
    },
    [abbreviation, chapterNumber, verses, bookName, toast, t]
  );

  const saveVerse = useCallback(
    (verseNumber: number) => {
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
    },
    [abbreviation, chapterNumber, verses, bookName, toast, t]
  );

  if (loading) {
    return (
      <div className="py-12 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
        <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8">
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 text-destructive text-sm">{error}</div>
      </div>
    );
  }

  return (
    <div>
      {verses.length > 0 && (
        <div>
          {verses.map((verse) => (
            <div key={verse.number} className="flex items-start gap-2 py-0.5">
              <span className="pt-1 text-xs font-semibold text-muted-foreground">{verse.number}</span>
              <p className="flex-1 text-base leading-relaxed text-foreground">{verse.text}</p>
              <div className="flex shrink-0 items-center gap-0.5">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => shareVerse(Number(verse.number))}
                  title={t('bibleChapter.shareVerse')}
                >
                  <Share2 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => saveVerse(Number(verse.number))}
                  title={t('bibleChapter.saveVerse')}
                >
                  <Heart className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => copyToClipboard(verse.text)}
                  title={t('bibleChapter.copyVerse')}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {verses.length === 0 && initialLoadDone && !error && (
        <div className="text-center py-8 text-muted-foreground">
          <p>{t('bibleChapter.noVerses')}</p>
        </div>
      )}

      {totalChapters && onChapterChange && (
        <div className="flex justify-between items-center mt-8 pt-4 border-t">
          <button
            disabled={chapterNumber <= 1}
            onClick={() => onChapterChange(chapterNumber - 1)}
            className="text-sm font-medium text-primary disabled:text-muted-foreground disabled:cursor-not-allowed"
          >
            ← {t('bibleChapter.prevChapter', 'Précédent')}
          </button>
          <span className="text-xs text-muted-foreground">
            {chapterNumber} / {totalChapters}
          </span>
          <button
            disabled={chapterNumber >= totalChapters}
            onClick={() => onChapterChange(chapterNumber + 1)}
            className="text-sm font-medium text-primary disabled:text-muted-foreground disabled:cursor-not-allowed"
          >
            {t('bibleChapter.nextChapter', 'Suivant')} →
          </button>
        </div>
      )}
    </div>
  );
};

export default BibleChapterViewer;
