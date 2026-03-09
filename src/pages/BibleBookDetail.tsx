import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen, Play, Pause, Square, ChevronDown } from 'lucide-react';
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
import { useSettings } from '@/hooks/useSettings';
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
  const { settings } = useSettings();

  const [book, setBook] = useState<BookData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [chapterText, setChapterText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Refs for pause/resume functionality
  const fullTextRef = useRef<string>('');
  const startOffsetRef = useRef<number>(0);
  const charOffsetRef = useRef<number>(0);
  const pauseRequestedRef = useRef<boolean>(false);

  const langCode = i18n.language?.split('-')[0] === 'en' ? 'en-US' : i18n.language?.split('-')[0] === 'it' ? 'it-IT' : 'fr-FR';

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

  // Stop speaking on chapter change
  useEffect(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
    }
  }, [selectedChapter]);

  const speakFrom = useCallback((offset: number) => {
    const text = fullTextRef.current.slice(offset);
    if (!text.trim()) return;

    startOffsetRef.current = offset;
    charOffsetRef.current = 0;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langCode;

    // Use selected voice from settings (real system voices)
    const voices = window.speechSynthesis.getVoices();
    if (settings.selectedVoice) {
      const voice = voices.find(v => v.voiceURI === settings.selectedVoice);
      if (voice) utterance.voice = voice;
    }

    utterance.onboundary = (e) => {
      if (e.name === 'word') {
        charOffsetRef.current = e.charIndex;
      }
    };

    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
      pauseRequestedRef.current = false;
    };

    utterance.onend = () => {
      if (pauseRequestedRef.current) return;
      setIsSpeaking(false);
      setIsPaused(false);
    };

    utterance.onerror = (e) => {
      if (pauseRequestedRef.current) return;
      if (e.error !== 'canceled' && e.error !== 'interrupted') {
        setIsSpeaking(false);
        setIsPaused(false);
      }
    };

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }, [langCode, settings.selectedVoice]);

  const handlePlayVoice = useCallback(() => {
    if (!('speechSynthesis' in window)) {
      toast({
        title: t('common.error'),
        description: t('bibleBook.voiceUnsupported'),
      });
      return;
    }

    if (!chapterText.trim()) {
      toast({
        title: t('bibleBook.voiceNoTextTitle'),
        description: t('bibleBook.voiceNoTextDesc'),
      });
      return;
    }

    // Build text: "Chapitre X" then verse texts only (no verse numbers)
    const chapterIntro = `${t('bibleBook.chaptersTitle')} ${selectedChapter}. `;
    const cleanText = chapterText.replace(/\d+\.\s*/g, ' ').trim();
    const fullText = chapterIntro + cleanText;

    fullTextRef.current = fullText;
    startOffsetRef.current = 0;
    charOffsetRef.current = 0;

    speakFrom(0);
  }, [chapterText, selectedChapter, t, speakFrom, toast]);

  const handleStopVoice = useCallback(() => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
    startOffsetRef.current = 0;
    charOffsetRef.current = 0;
  }, []);

  const handlePauseResume = useCallback(() => {
    if (!window.speechSynthesis) return;

    if (isPaused) {
      // Resume from last known position
      const absoluteOffset = startOffsetRef.current + charOffsetRef.current;
      speakFrom(absoluteOffset);
    } else {
      // Pause: cancel and save position
      window.speechSynthesis.cancel();
      setIsPaused(true);
      setIsSpeaking(true); // Still logically "speaking" but paused
    }
  }, [isPaused, speakFrom]);

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
                {t('common.back')}
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
                aria-label={t('common.back')}
                title={t('common.back')}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>

              {!isSpeaking ? (
                <Button
                  onClick={handlePlayVoice}
                  variant="outline"
                  size="sm"
                  disabled={!chapterText.trim()}
                >
                  <Play className="w-4 h-4 mr-1" />
                  {t('bibleBook.voiceRead')}
                </Button>
              ) : (
                <>
                  <Button onClick={handlePauseResume} variant="outline" size="sm">
                    {isPaused ? <Play className="w-4 h-4 mr-1" /> : <Pause className="w-4 h-4 mr-1" />}
                    {isPaused ? t('bibleBook.voiceResume') : t('bibleBook.voicePause')}
                  </Button>
                  <Button onClick={handleStopVoice} variant="outline" size="sm">
                    <Square className="w-4 h-4 mr-1" />
                    {t('bibleBook.voiceStop')}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="border-b bg-background sticky top-[7.25rem] z-10">
          <div className="container mx-auto px-4">
            <div className="py-1">
              <ScrollArea className="w-full">
                <div className="flex items-center gap-1 pr-2">
                  {chapters.map((ch) => (
                    <DropdownMenu key={ch}>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant={ch === selectedChapter ? 'secondary' : 'ghost'}
                          size="sm"
                          className="h-9 min-w-12 px-3 gap-1"
                        >
                          {ch}
                          {ch === selectedChapter && <ChevronDown className="w-3 h-3" />}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="max-h-72 w-40 overflow-y-auto">
                        {chapters.map((chapterOption) => (
                          <DropdownMenuItem
                            key={`menu-${ch}-${chapterOption}`}
                            onSelect={() => setSelectedChapter(chapterOption)}
                            className={selectedChapter === chapterOption ? 'bg-accent text-accent-foreground' : ''}
                          >
                            {t('bibleBook.chaptersTitle')} {chapterOption}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
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
