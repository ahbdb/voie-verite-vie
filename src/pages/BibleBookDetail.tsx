import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen, Play, Square, RotateCcw, ChevronDown } from 'lucide-react';
import BibleChapterViewer from '@/components/BibleChapterViewer';
import { preloadBibleChapters, clearBibleCache } from '@/lib/bible-content-loader';
import bibleBooks from '@/data/bible-books.json';
import { getBookName, getBookAbbreviation } from '@/lib/bible-utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useWebSpeech } from '@/hooks/useWebSpeech';
import { useToast } from '@/components/ui/use-toast';

interface BookData {
  id: number;
  name: string;
  fileName: string;
  testament: 'old' | 'new';
  abbreviation: string;
  chapters: number;
  order: number;
  apocrypha?: boolean;
}

const BibleBookDetail = () => {
  const { t, i18n } = useTranslation();
  const { bookId } = useParams<{ bookId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [book, setBook] = useState<BookData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [chapterText, setChapterText] = useState('');

  const speechLanguage = useMemo(() => {
    const baseLang = i18n.language?.split('-')[0];
    if (baseLang === 'en') return 'en-US';
    if (baseLang === 'it') return 'it-IT';
    return 'fr-FR';
  }, [i18n.language]);

  const { speak, stopSpeaking, isSpeaking } = useWebSpeech({
    language: speechLanguage,
    onError: (message) => {
      toast({
        title: t('common.error', 'Erreur'),
        description: message,
      });
    },
  });

  useEffect(() => {
    if (bookId) {
      const foundBook = (bibleBooks.books as BookData[]).find((b) => b.fileName === bookId);
      setBook(foundBook || null);
      setLoading(false);
      clearBibleCache();
      if (foundBook) {
        preloadBibleChapters(foundBook.fileName, foundBook.chapters).catch(() => {});
      }
    }
  }, [bookId]);

  useEffect(() => {
    stopSpeaking();
  }, [selectedChapter, stopSpeaking]);

  const handlePlayVoice = () => {
    if (!chapterText.trim()) {
      toast({
        title: t('bibleBook.voiceNoTextTitle', 'Aucun texte à lire'),
        description: t('bibleBook.voiceNoTextDesc', 'Chargez un chapitre puis relancez la lecture vocale.'),
      });
      return;
    }
    speak(chapterText);
  };

  const handleClearVoice = () => {
    stopSpeaking();
    setChapterText('');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <main className="pt-16 pb-8">
          <section className="py-12">
            <div className="container mx-auto px-4 text-center">
              <BookOpen className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-foreground mb-2">{t('bibleBook.bookNotFound')}</h1>
              <p className="text-muted-foreground mb-6">{t('bibleBook.bookNotFoundDesc')}</p>
              <Button onClick={() => navigate('/biblical-reading')} variant="default">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('common.back', 'Retour')}
              </Button>
            </div>
          </section>
        </main>
      </div>
    );
  }

  const localizedName = getBookName(book, i18n.language);
  const localizedAbbr = getBookAbbreviation(book, i18n.language);
  const chapters = Array.from({ length: book.chapters }, (_, i) => i + 1);

  return (
    <div className="min-h-screen">
      <Navigation />
      <main className="pt-16 pb-8">
        <div className="border-b bg-background/95 backdrop-blur sticky top-16 z-20">
          <div className="container mx-auto px-4 py-2">
            <div className="flex items-center gap-2 overflow-x-auto">
              <Button
                onClick={() => navigate('/biblical-reading')}
                variant="ghost"
                size="icon"
                aria-label={t('common.back', 'Retour')}
                title={t('common.back', 'Retour')}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>

              <Button
                onClick={handlePlayVoice}
                variant="outline"
                size="sm"
                disabled={!chapterText.trim() || isSpeaking}
              >
                <Play className="w-4 h-4 mr-1" />
                {t('bibleBook.voiceRead', 'Lire')}
              </Button>

              <Button onClick={stopSpeaking} variant="outline" size="sm" disabled={!isSpeaking}>
                <Square className="w-4 h-4 mr-1" />
                {t('bibleBook.voiceStop', 'Stop')}
              </Button>

              <Button
                onClick={handleClearVoice}
                variant="outline"
                size="sm"
                disabled={!chapterText.trim() && !isSpeaking}
                title={t('bibleBook.voiceClear', 'Effacer la lecture')}
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                {t('bibleBook.voiceClear', 'Effacer')}
              </Button>
            </div>
          </div>
        </div>

        <div className="border-b bg-background sticky top-[7.25rem] z-10">
          <div className="container mx-auto px-4">
            <div className="py-1">
              <ScrollArea className="w-full">
                <div className="flex items-center gap-1 pr-2">
                  {chapters.map((ch) => (
                    ch === selectedChapter ? (
                      <DropdownMenu key={ch}>
                        <DropdownMenuTrigger asChild>
                          <Button variant="secondary" size="sm" className="h-9 min-w-14 px-3 gap-1">
                            {ch}
                            <ChevronDown className="w-3.5 h-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="max-h-72 w-40 overflow-y-auto">
                          {chapters.map((chapterOption) => (
                            <DropdownMenuItem
                              key={`menu-${chapterOption}`}
                              onSelect={() => setSelectedChapter(chapterOption)}
                              className={selectedChapter === chapterOption ? 'bg-accent text-accent-foreground' : ''}
                            >
                              {t('bibleBook.chaptersTitle', 'Chapitre')} {chapterOption}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <Button
                        key={ch}
                        onClick={() => setSelectedChapter(ch)}
                        variant="ghost"
                        size="sm"
                        className="h-9 min-w-12 px-3"
                      >
                        {ch}
                      </Button>
                    )
                  ))}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </div>
          </div>
        </div>

        <section className="py-4">
          <div className="container mx-auto px-4 max-w-3xl">
            <BibleChapterViewer
              bookId={book.fileName}
              bookName={localizedName}
              abbreviation={localizedAbbr}
              chapterNumber={selectedChapter}
              totalChapters={book.chapters}
              onChapterChange={setSelectedChapter}
              onChapterTextReady={setChapterText}
            />
          </div>
        </section>
      </main>
    </div>
  );
};

export default BibleBookDetail;
