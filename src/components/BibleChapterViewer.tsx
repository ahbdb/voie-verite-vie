/**
 * Composant pour afficher les versets d'un chapitre biblique
 * À intégrer dans BibleBookDetail.tsx
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Copy, Share2, Heart } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { loadBibleChapterCached, clearBibleCache, BibleVerse } from '@/lib/bible-content-loader';

interface BibleChapterViewerProps {
  bookId: string; // fileName
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
  const [verses, setVerses] = useState<BibleVerse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Charger immédiatement avec cache
    let isMounted = true;

    const loadChapter = async () => {
      try {
        setLoading(true);
        setError(null);
        const chapterVerses = await loadBibleChapterCached(bookId, chapterNumber);

        if (!isMounted) return;

        if (!chapterVerses) {
          // Si le chapitre n'est pas disponible, vider le cache et réessayer une fois
          clearBibleCache();
          const retryVerses = await loadBibleChapterCached(bookId, chapterNumber);
          if (retryVerses) {
            if (!isMounted) return;
            setVerses(retryVerses);
            setError(null);
            return;
          }

          setError(`Le chapitre ${chapterNumber} de ${bookName} n'est pas disponible.`);
          setVerses([]);
        } else {
          setVerses(chapterVerses);
        }
      } catch (err) {
        if (isMounted) {
          setError(`Erreur lors du chargement: ${String(err)}`);
          console.error(err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadChapter();

    return () => {
      isMounted = false;
    };
  }, [bookId, chapterNumber, bookName]);

  const copyToClipboard = useCallback((verseText: string) => {
    navigator.clipboard.writeText(verseText);
    toast({
      title: 'Copié',
      description: 'Le verset a été copié',
    });
  }, [toast]);

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
          // Fallback si partage échoue
          navigator.clipboard.writeText(`${reference}\n\n${text}`);
          toast({
            title: 'Copié',
            description: `${reference} copié`,
          });
        });
    } else {
      navigator.clipboard.writeText(`${reference}\n\n${text}`);
      toast({
        title: 'Copié',
        description: `${reference} copié`,
      });
    }
  }, [abbreviation, chapterNumber, verses, bookName, toast]);

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
        title: 'Verset sauvegardé',
        description: `${reference} ajouté à vos mémorisations`,
      });
    } else {
      toast({
        title: 'Déjà sauvegardé',
        description: `${reference} est déjà dans vos mémorisations`,
      });
    }
  }, [abbreviation, chapterNumber, verses, bookName, toast]);

  if (loading) {
    return (
      <Card className="w-full bg-card/50 backdrop-blur-sm border-primary/20">
        <CardHeader className="space-y-0 pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">
              {bookName} {chapterNumber}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onBack} title="Retour">
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
            <Button variant="ghost" size="sm" onClick={onBack} title="Retour">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 text-yellow-700 dark:text-yellow-400">
            {error}
          </div>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Réessayer
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full bg-card/50 backdrop-blur-sm border-primary/20">
      <CardHeader className="space-y-0 pb-3">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onBack} title="Retour">
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
              {verses.map((verse, index) => (
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
                            title="Copier ce verset"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0 text-muted-foreground hover:text-primary transition-colors inline-flex"
                            onClick={() => shareVerse(verse.number)}
                            title="Partager ce verset"
                          >
                            <Share2 className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0 text-muted-foreground hover:text-rose-500 transition-colors inline-flex"
                            onClick={() => saveVerse(verse.number)}
                            title="Mémoriser ce verset"
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
            <p>Aucun verset disponible pour ce chapitre.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BibleChapterViewer;
