import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen } from 'lucide-react';
import BibleChapterViewer from '@/components/BibleChapterViewer';
import { preloadBibleChapters, clearBibleCache } from '@/lib/bible-content-loader';
import bibleBooks from '@/data/bible-books.json';
import { getBookName, getBookAbbreviation } from '@/lib/bible-utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

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
  const [book, setBook] = useState<BookData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedChapter, setSelectedChapter] = useState<number>(1);

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
                {t('bibleBook.backToReadings')}
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
        {/* Top bar: just back button */}
        <div className="border-b bg-background/95 backdrop-blur sticky top-16 z-10">
          <div className="container mx-auto px-4 py-2 flex items-center">
            <Button onClick={() => navigate('/biblical-reading')} variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-1" />
              {t('bibleBook.backToReadings')}
            </Button>
          </div>
        </div>

        {/* Horizontal chapter navigation bar */}
        <div className="border-b bg-muted/30 sticky top-[7.5rem] z-10">
          <div className="container mx-auto px-4">
            <ScrollArea className="w-full">
              <div className="flex items-center gap-1 py-2">
                {chapters.map((ch) => (
                  <button
                    key={ch}
                    onClick={() => setSelectedChapter(ch)}
                    className={`flex-shrink-0 px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                      selectedChapter === ch
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    {ch}
                  </button>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        </div>

        {/* Chapter content */}
        <section className="py-4">
          <div className="container mx-auto px-4 max-w-3xl">
            <BibleChapterViewer
              bookId={book.fileName}
              bookName={localizedName}
              abbreviation={localizedAbbr}
              chapterNumber={selectedChapter}
              totalChapters={book.chapters}
              onChapterChange={setSelectedChapter}
              onBack={() => navigate('/biblical-reading')}
            />
          </div>
        </section>
      </main>
    </div>
  );
};

export default BibleBookDetail;
