/**
 * Bible Content Loader
 * Chargement dynamique du contenu biblique par livre et chapitre
 */

export interface BibleVerse {
  number: number;
  text: string;
}

export interface BibleChapter {
  number: number;
  verses: BibleVerse[];
}

export interface BibleBookContent {
  id: number;
  name: string;
  abbreviation: string;
  chapters: BibleChapter[];
}

import bibleBooks from '@/data/bible-books.json';
import { bibleContent, fileNameMap } from '@/data/bible-content/index';

const getBookIdByFileName = (bookKey: string): number | null => {
  if (!bookKey) return null;
  const book = (bibleBooks.books as any[]).find(
    (b) => b.fileName && b.fileName.toLowerCase() === bookKey.toLowerCase()
  );
  return book ? book.id : null;
};

const padId = (id: number): string => {
  return String(id).padStart(2, '0');
};

/**
 * Charge le contenu d'un livre biblique par fileName
 * @param bookKey - fileName du livre (ex: 'luke', 'genesis', ...)
 * @returns Contenu du livre avec tous les chapitres et versets, ou null si non trouvé
 */
export const loadBibleBook = async (bookKey: string): Promise<BibleBookContent | null> => {
  try {
    if (!bookKey) {
      console.warn(`Livre biblique vide non trouvé`);
      return null;
    }

    // Chercher la clé dans le mapping
    const moduleKey = fileNameMap[bookKey.toLowerCase()];
    if (!moduleKey) {
      console.warn(`Livre biblique '${bookKey}' non trouvé dans le mapping`);
      return null;
    }

    const content = bibleContent[moduleKey];
    if (!content) {
      console.warn(`Contenu du livre '${bookKey}' non disponible`);
      return null;
    }

    return content;
  } catch (error) {
    console.error(`Erreur lors du chargement du livre '${bookKey}':`, error);
    return null;
  }
};

/**
 * Charge les versets d'un chapitre spécifique
 * @param bookKey - fileName du livre
 * @param chapterNumber - Numéro du chapitre (1-indexé)
 * @returns Array de versets, ou null si chapitre non trouvé
 */
export const loadBibleChapter = async (
  bookKey: string,
  chapterNumber: number
): Promise<BibleVerse[] | null> => {
  try {
    const bookContent = await loadBibleBook(bookKey);
    if (!bookContent) return null;

    const chapter = (bookContent.chapters as any[]).find((c: any) => {
      const cn = Number(c.number ?? c.chapter);
      return !Number.isNaN(cn) && cn === chapterNumber;
    });

    if (!chapter) {
      console.warn(`Chapitre ${chapterNumber} non trouvé dans '${bookKey}'`);
      return null;
    }

    const verses = (chapter.verses || []).map((v: any) => ({
      number: Number(v.number ?? v.verse),
      text: v.text
    }));

    return verses.length > 0 ? verses : null;
  } catch (error) {
    console.error(
      `Erreur lors du chargement du chapitre ${chapterNumber} du livre '${bookKey}':`,
      error
    );
    return null;
  }
};

/**
 * Charge un verset spécifique
 * @param bookKey - Clé du livre (fileName)
 * @param chapterNumber - Numéro du chapitre
 * @param verseNumber - Numéro du verset
 * @returns Texte du verset, ou null si non trouvé
 */
export const loadBibleVerse = async (
  bookKey: string,
  chapterNumber: number,
  verseNumber: number
): Promise<string | null> => {
  try {
    const verses = await loadBibleChapter(bookKey, chapterNumber);
    if (!verses) return null;

    const verse = verses.find((v) => v.number === verseNumber);
    return verse?.text || null;
  } catch (error) {
    console.error(
      `Erreur lors du chargement du verset ${verseNumber} du chapitre ${chapterNumber} du livre '${bookKey}':`,
      error
    );
    return null;
  }
};

/**
 * Cache agressif en mémoire avec limite de taille
 */
const bookCache: Map<string, BibleBookContent | null> = new Map();
const chapterCache: Map<string, BibleVerse[] | null> = new Map();
const MAX_CACHE_SIZE = 20;

/**
 * Charge un livre avec cache
 * @param bookKey - fileName du livre
 * @returns Contenu du livre (en cache si déjà chargé)
 */
export const loadBibleBookCached = async (bookKey: string): Promise<BibleBookContent | null> => {
  if (bookCache.has(bookKey)) {
    return bookCache.get(bookKey) || null;
  }

  const content = await loadBibleBook(bookKey);
  if (content) {
    bookCache.set(bookKey, content);
  }

  if (bookCache.size > MAX_CACHE_SIZE) {
    const firstKey = bookCache.keys().next().value;
    bookCache.delete(firstKey);
  }

  return content;
};

/**
 * Charge un chapitre avec cache
 * @param bookKey - fileName du livre
 * @param chapterNumber - Numéro du chapitre
 * @returns Versets du chapitre
 */
export const loadBibleChapterCached = async (
  bookKey: string,
  chapterNumber: number
): Promise<BibleVerse[] | null> => {
  const cacheKey = `${bookKey}-${chapterNumber}`;

  if (chapterCache.has(cacheKey)) {
    return chapterCache.get(cacheKey) || null;
  }

  const verses = await loadBibleChapter(bookKey, chapterNumber);
  if (verses) {
    chapterCache.set(cacheKey, verses);
  }
  return verses;
};

/**
 * Precharge les chapitres d'un livre
 * @param bookKey - fileName du livre
 * @param chapters - Nombre de chapitres a precharger
 */
export const preloadBibleChapters = async (
  bookKey: string,
  chapters: number
): Promise<void> => {
  const bookContent = await loadBibleBookCached(bookKey);
  if (!bookContent) return;

  const toPreload = [1, 2, 3, chapters - 2, chapters - 1, chapters].filter(
    (ch) => ch > 0 && ch <= chapters
  );

  for (const ch of toPreload) {
    await loadBibleChapterCached(bookKey, ch).catch(() => {
      // Ignorer silencieusement
    });
  }
};

/**
 * Vide le cache en memoire
 */
export const clearBibleCache = (): void => {
  bookCache.clear();
  chapterCache.clear();
};
