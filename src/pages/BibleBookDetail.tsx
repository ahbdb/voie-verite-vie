import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import BibleChapterViewer from '@/components/BibleChapterViewer';
import { preloadBibleChapters, clearBibleCache } from '@/lib/bible-content-loader';
import bibleBooks from '@/data/bible-books.json';

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
  const { bookId } = useParams<{ bookId: string }>(); // bookId is now fileName
  const navigate = useNavigate();
  const [book, setBook] = useState<BookData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);

  useEffect(() => {
    if (bookId) {
      const foundBook = (bibleBooks.books as BookData[]).find(
        (b) => b.fileName === bookId
      );
      setBook(foundBook || null);
      setLoading(false);

      // Clear cache to ensure we don't show stale missing-chapter errors
      clearBibleCache();

      // Pré-charger les chapitres en arrière-plan
      if (foundBook) {
        preloadBibleChapters(foundBook.fileName, foundBook.chapters).catch(() => {
          // Ignorer silencieusement les erreurs de pré-chargement
        });
      }
    }
  }, [bookId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Chargement...</p>
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
              <h1 className="text-2xl font-bold text-foreground mb-2">Livre non trouvé</h1>
              <p className="text-muted-foreground mb-6">Le livre que vous cherchez n'existe pas.</p>
              <Button onClick={() => navigate('/biblical-reading')} variant="default">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour aux lectures
              </Button>
            </div>
          </section>
        </main>
      </div>
    );
  }

  const testamentName = book.testament === 'old' ? 'Testament Ancien' : 'Testament Nouveau';
  const chapters = Array.from({ length: book.chapters }, (_, i) => i + 1);

  return (
    <div className="min-h-screen">
      <Navigation />
      <main className="pt-16 pb-8">
        <section className="py-6 md:py-10 bg-gradient-to-b from-primary/5 to-transparent border-b">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-4">
              <Button
                onClick={() => navigate('/biblical-reading')}
                variant="ghost"
                size="sm"
                title="Retour aux lectures"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div className="text-right">
                <div className="flex items-center gap-2 justify-end">
                  <h1 className="text-3xl md:text-5xl font-playfair font-bold text-primary">
                    {book.name}
                  </h1>
                  <Badge variant="default" className="text-lg px-3 py-1 h-fit">
                    {book.abbreviation}
                  </Badge>
                </div>
                {book.apocrypha && (
                  <Badge variant="secondary" className="mt-2">Deutérocanonique</Badge>
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
                bookName={book.name}
                abbreviation={book.abbreviation}
                chapterNumber={selectedChapter}
                onBack={() => setSelectedChapter(null)}
              />
            ) : (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5" />
                      Chapitres ({book.chapters})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[500px] border rounded-lg p-4">
                      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                        {chapters.map((chapter) => (
                          <Button
                            key={chapter}
                            onClick={() => setSelectedChapter(chapter)}
                            variant="outline"
                            className="h-10 p-0 text-sm font-semibold hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all cursor-pointer"
                          >
                            {chapter}
                          </Button>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                <div className="mt-8 grid md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Informations</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Nom complet:</span>
                        <span className="font-semibold">{book.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Abréviation:</span>
                        <span className="font-semibold">{book.abbreviation}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Chapitres:</span>
                        <span className="font-semibold">{book.chapters}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Testament:</span>
                        <span className="font-semibold">{testamentName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Position:</span>
                        <span className="font-semibold">{book.order}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Références</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <p className="text-muted-foreground">
                        {book.name} est le {book.order}
                        <sup>
                          {book.order === 1
                            ? 'er'
                            : book.order === 2
                              ? 'e'
                              : book.order === 3
                                ? 'e'
                                : 'e'}
                        </sup>{' '}
                        livre de la Bible catholique.
                      </p>
                      {book.apocrypha && (
                        <p className="text-amber-600 bg-amber-50 p-2 rounded">
                          Ce livre fait partie des livres deutérocanoniques (livres supplémentaires reconnus par l'Église catholique).
                        </p>
                      )}
                      <p className="text-muted-foreground">
                        Vous pouvez consulter les {book.chapters} chapitres de ce livre en cliquant sur les numéros ci-dessus.
                      </p>
                    </CardContent>
                  </Card>
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
