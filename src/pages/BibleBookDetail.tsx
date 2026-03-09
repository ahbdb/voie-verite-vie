import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, BookOpen } from 'lucide-react';
import BibleChapterViewer from '@/components/BibleChapterViewer';
import { preloadBibleChapters, clearBibleCache } from '@/lib/bible-content-loader';
import bibleBooks from '@/data/bible-books.json';
import { getBookName, getBookAbbreviation } from '@/lib/bible-utils';

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
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);

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
  const testamentName = book.testament === 'old' ? t('bibleBook.oldTestament') : t('bibleBook.newTestament');
  const chapters = Array.from({ length: book.chapters }, (_, i) => i + 1);

  return (
    <div className="min-h-screen">
      <Navigation />
      <main className="pt-16 pb-8">
        <section className="py-6 md:py-10 bg-gradient-to-b from-primary/5 to-transparent border-b">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-4">
              <Button onClick={() => navigate('/biblical-reading')} variant="ghost" size="sm" title={t('bibleBook.backToReadings')}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div className="text-right">
                <div className="flex items-center gap-2 justify-end">
                  <h1 className="text-3xl md:text-5xl font-playfair font-bold text-primary">{localizedName}</h1>
                  <Badge variant="default" className="text-lg px-3 py-1 h-fit">{localizedAbbr}</Badge>
                </div>
                {book.apocrypha && (
                  <Badge variant="secondary" className="mt-2">{t('bibleBook.deuterocanonical')}</Badge>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="py-8">
          <div className="container mx-auto px-4 max-w-4xl">
            {selectedChapter ? (
              <BibleChapterViewer
                bookId={book.fileName}
                bookName={localizedName}
                abbreviation={localizedAbbr}
                chapterNumber={selectedChapter}
                onBack={() => setSelectedChapter(null)}
              />
            ) : (
              <>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-primary" />
                      {t('bibleBook.chaptersTitle')}
                    </h2>
                    <span className="text-sm text-muted-foreground">{book.chapters} {t('bibleBook.chaptersCount').toLowerCase()}</span>
                  </div>

                  <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-10 gap-2">
                    {chapters.map((chapter) => (
                      <button
                        key={chapter}
                        onClick={() => setSelectedChapter(chapter)}
                        className="aspect-square flex items-center justify-center rounded-lg bg-primary/10 text-primary font-semibold text-sm hover:bg-primary hover:text-primary-foreground transition-all"
                      >
                        {chapter}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-8 space-y-3 text-sm">
                  <h3 className="text-base font-semibold text-foreground">{t('bibleBook.info')}</h3>
                  <div className="divide-y divide-border">
                    <div className="flex justify-between py-2">
                      <span className="text-muted-foreground">{t('bibleBook.fullName')}</span>
                      <span className="font-semibold">{localizedName}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-muted-foreground">{t('bibleBook.abbreviation')}</span>
                      <span className="font-semibold">{localizedAbbr}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-muted-foreground">{t('bibleBook.testament')}</span>
                      <span className="font-semibold">{testamentName}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-muted-foreground">{t('bibleBook.position')}</span>
                      <span className="font-semibold">{book.order}</span>
                    </div>
                  </div>
                  {book.apocrypha && (
                    <p className="text-xs italic text-muted-foreground mt-2">
                      {t('bibleBook.deuterocanonicalNote')}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default BibleBookDetail;
