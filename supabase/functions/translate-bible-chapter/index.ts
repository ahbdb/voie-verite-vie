import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Map internal fileName to USFM book code used by bible.helloao.org
const fileNameToUSFM: Record<string, string> = {
  'genesis': 'GEN', 'exodus': 'EXO', 'leviticus': 'LEV', 'numbers': 'NUM',
  'deuteronomy': 'DEU', 'joshua': 'JOS', 'judges': 'JDG', 'ruth': 'RUT',
  '1-samuel': '1SA', '2-samuel': '2SA', '1-kings': '1KI', '2-kings': '2KI',
  '1-chronicles': '1CH', '2-chronicles': '2CH', 'ezra': 'EZR', 'nehemiah': 'NEH',
  'esther': 'EST', 'job': 'JOB', 'psalms': 'PSA', 'proverbs': 'PRO',
  'ecclesiastes': 'ECC', 'song-of-solomon': 'SNG', 'isaiah': 'ISA', 'jeremiah': 'JER',
  'lamentations': 'LAM', 'ezekiel': 'EZK', 'daniel': 'DAN', 'hosea': 'HOS',
  'joel': 'JOL', 'amos': 'AMO', 'obadiah': 'OBA', 'jonah': 'JON',
  'micah': 'MIC', 'nahum': 'NAM', 'habakkuk': 'HAB', 'zephaniah': 'ZEP',
  'haggai': 'HAG', 'zechariah': 'ZEC', 'malachi': 'MAL',
  // Deuterocanonical books (available in eng_dra Douay-Rheims)
  'tobit': 'TOB', 'judith': 'JDT', 'wisdom': 'WIS', 'sirach': 'SIR',
  'baruch': 'BAR', '1-maccabees': '1MA', '2-maccabees': '2MA',
  // New Testament
  'matthew': 'MAT', 'mark': 'MRK', 'luke': 'LUK', 'john': 'JHN',
  'acts': 'ACT', 'romans': 'ROM', '1-corinthians': '1CO', '2-corinthians': '2CO',
  'galatians': 'GAL', 'ephesians': 'EPH', 'philippians': 'PHP', 'colossians': 'COL',
  '1-thessalonians': '1TH', '2-thessalonians': '2TH', '1-timothy': '1TI', '2-timothy': '2TI',
  'titus': 'TIT', 'philemon': 'PHM', 'hebrews': 'HEB', 'james': 'JAS',
  '1-peter': '1PE', '2-peter': '2PE', '1-john': '1JN', '2-john': '2JN',
  '3-john': '3JN', 'jude': 'JUD', 'revelation': 'REV',
};

// Deuterocanonical books — not in fra_lsg or ita_riv
const deuterocanonicalFileNames = new Set([
  'tobit', 'judith', '1-maccabees', '2-maccabees', 'wisdom', 'sirach', 'baruch'
]);

// Map fileName to Italian name for laparola.net CEI queries
const fileNameToItalianCEI: Record<string, string> = {
  'tobit': 'Tobia',
  'judith': 'Giuditta',
  '1-maccabees': '1Maccabei',
  '2-maccabees': '2Maccabei',
  'wisdom': 'Sapienza',
  'sirach': 'Siracide',
  'baruch': 'Baruc',
};

// Map fileName to French name for Crampon-style references
const fileNameToFrenchName: Record<string, string> = {
  'tobit': 'Tobie',
  'judith': 'Judith',
  '1-maccabees': '1 Maccabées',
  '2-maccabees': '2 Maccabées',
  'wisdom': 'Sagesse',
  'sirach': 'Siracide (Ecclésiastique)',
  'baruch': 'Baruch',
  'daniel': 'Daniel',
  'esther': 'Esther',
};

/**
 * Extract plain text from helloao verse content array.
 */
function extractVerseText(content: any[]): string {
  return content
    .map((item: any) => {
      if (typeof item === 'string') return item;
      if (item?.text) return item.text;
      if (item?.heading) return '';
      return '';
    })
    .join('')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Fetch chapter from bible.helloao.org API
 */
async function fetchBibleAPIChapter(
  translationId: string,
  usfmCode: string,
  chapter: number
): Promise<{ number: number; text: string }[] | null> {
  try {
    const url = `https://bible.helloao.org/api/${translationId}/${usfmCode}/${chapter}.json`;
    console.log(`Fetching ${translationId}: ${url}`);

    const resp = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(15000)
    });

    if (!resp.ok) {
      console.warn(`API returned ${resp.status} for ${translationId}/${usfmCode}/${chapter}`);
      return null;
    }

    const data = await resp.json();
    const chapterContent = data?.chapter?.content;

    if (!chapterContent || !Array.isArray(chapterContent)) {
      console.warn(`No chapter content for ${translationId}/${usfmCode}/${chapter}`);
      return null;
    }

    const verses: { number: number; text: string }[] = [];
    for (const item of chapterContent) {
      if (item.type === 'verse' && item.number && item.content) {
        const text = extractVerseText(item.content);
        if (text) {
          verses.push({ number: item.number, text });
        }
      }
    }

    return verses.length > 0 ? verses : null;
  } catch (err) {
    console.error(`Error fetching ${translationId} for ${usfmCode}/${chapter}:`, err);
    return null;
  }
}

/**
 * Fetch Italian deuterocanonical chapter from laparola.net (CEI text)
 */
async function fetchItalianCEIChapter(
  bookName: string,
  chapter: number
): Promise<{ number: number; text: string }[] | null> {
  try {
    const url = `https://www.laparola.net/testo.php?riferimento=${encodeURIComponent(bookName)}+${chapter}&versioni[]=C.E.I.`;
    console.log(`Fetching Italian CEI: ${url}`);

    const resp = await fetch(url, {
      headers: {
        'Accept': 'text/html',
        'User-Agent': 'Mozilla/5.0 (compatible; BibleReader/1.0)'
      },
      signal: AbortSignal.timeout(15000)
    });

    if (!resp.ok) {
      console.warn(`laparola.net returned ${resp.status}`);
      return null;
    }

    const html = await resp.text();
    const verses: { number: number; text: string }[] = [];
    const verseRegex = /<b>(\d+)<\/b>\s*([\s\S]*?)(?=<b>\d+<\/b>|<\/p>|<br\s*\/?>.*?<b>\d|$)/gi;
    let match;

    while ((match = verseRegex.exec(html)) !== null) {
      const num = parseInt(match[1]);
      let text = match[2]
        .replace(/<[^>]+>/g, '')
        .replace(/&[a-z]+;/gi, (entity: string) => {
          const map: Record<string, string> = {
            '&nbsp;': ' ', '&amp;': '&', '&lt;': '<', '&gt;': '>',
            '&quot;': '"', '&apos;': "'", '&egrave;': 'è', '&eacute;': 'é',
            '&agrave;': 'à', '&ograve;': 'ò', '&ugrave;': 'ù', '&igrave;': 'ì',
          };
          return map[entity.toLowerCase()] || entity;
        })
        .replace(/\s+/g, ' ')
        .trim();

      if (num > 0 && text) {
        verses.push({ number: num, text });
      }
    }

    if (verses.length > 0) {
      console.log(`✅ Parsed ${verses.length} Italian CEI verses for ${bookName} ${chapter}`);
      return verses;
    }
    return null;
  } catch (err) {
    console.error(`Error fetching Italian CEI for ${bookName} ${chapter}:`, err);
    return null;
  }
}

/**
 * Use AI to fill in specific missing French verses (only for deuterocanonical books)
 */
async function fillMissingVersesWithAI(
  emptyVerseNumbers: number[],
  bookName: string,
  chapterNumber: number,
  existingVerses: any[]
): Promise<{ number: number; text: string }[]> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    throw new Error("LOVABLE_API_KEY is not configured");
  }

  // Build context from surrounding verses
  const contextVerses = existingVerses
    .filter((v: any) => v.text && v.text.trim())
    .map((v: any) => `[${v.number}] ${v.text}`)
    .join('\n');

  const missingList = emptyVerseNumbers.join(', ');

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content: `Tu es un spécialiste de la Bible catholique en français (traduction Crampon). On te donne un chapitre avec des versets manquants. Tu dois fournir UNIQUEMENT les versets manquants dans le style de la Bible Crampon.

RÈGLES CRITIQUES:
- Fournis UNIQUEMENT les versets dont les numéros sont demandés
- Utilise le style de la traduction Crampon (français classique, révérent)
- Retourne un tableau JSON: [{"number": N, "text": "texte du verset"}]
- Aucun commentaire, juste le JSON`
        },
        {
          role: "user",
          content: `Livre: ${bookName}, Chapitre ${chapterNumber}
Versets manquants à fournir: ${missingList}

Contexte (versets existants du même chapitre):
${contextVerses}

Retourne les versets manquants en JSON:`
        }
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`AI error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("No AI content");

  let jsonStr = content.trim();
  if (jsonStr.startsWith("```json")) jsonStr = jsonStr.slice(7);
  if (jsonStr.startsWith("```")) jsonStr = jsonStr.slice(3);
  if (jsonStr.endsWith("```")) jsonStr = jsonStr.slice(0, -3);

  return JSON.parse(jsonStr.trim());
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { verses, bookName, chapterNumber, targetLang, bookFileName, patchEmptyVerses } = await req.json();

    // === MODE: Patch empty French verses ===
    if (patchEmptyVerses && bookFileName && verses) {
      const emptyVerseNumbers: number[] = verses
        .filter((v: any) => !v.text || v.text.trim() === '')
        .map((v: any) => v.number || v.verse);

      if (emptyVerseNumbers.length === 0) {
        return new Response(JSON.stringify({ verses, source: 'original', patched: 0 }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log(`🔧 Patching ${emptyVerseNumbers.length} empty French verses in ${bookFileName} ch.${chapterNumber}`);

      const isDeuterocanonical = deuterocanonicalFileNames.has(bookFileName);
      const usfmCode = fileNameToUSFM[bookFileName];
      let patchedVerses: { number: number; text: string }[] = [];

      // Try Louis Segond (fra_lsg) for canonical books
      if (!isDeuterocanonical && usfmCode) {
        const lsgChapter = await fetchBibleAPIChapter('fra_lsg', usfmCode, chapterNumber);
        if (lsgChapter) {
          patchedVerses = lsgChapter.filter(v => emptyVerseNumbers.includes(v.number));
          console.log(`📖 Found ${patchedVerses.length}/${emptyVerseNumbers.length} verses from Louis Segond`);
        }
      }

      // For remaining empty verses (deuterocanonical or not found in LSG), use AI
      const foundNumbers = new Set(patchedVerses.map(v => v.number));
      const stillMissing = emptyVerseNumbers.filter(n => !foundNumbers.has(n));

      if (stillMissing.length > 0) {
        try {
          const frenchName = fileNameToFrenchName[bookFileName] || bookName;
          const aiVerses = await fillMissingVersesWithAI(stillMissing, frenchName, chapterNumber, verses);
          patchedVerses = [...patchedVerses, ...aiVerses];
          console.log(`🤖 AI filled ${aiVerses.length} remaining verses`);
        } catch (aiErr) {
          console.error('AI patching failed:', aiErr);
        }
      }

      // Merge patched verses back into original
      const patchMap = new Map(patchedVerses.map(v => [v.number, v.text]));
      const mergedVerses = verses.map((v: any) => {
        const num = v.number || v.verse;
        if ((!v.text || v.text.trim() === '') && patchMap.has(num)) {
          return { ...v, text: patchMap.get(num) };
        }
        return v;
      });

      const patchedCount = patchedVerses.length;
      console.log(`✅ Patched ${patchedCount}/${emptyVerseNumbers.length} empty verses in ${bookFileName} ch.${chapterNumber}`);

      return new Response(JSON.stringify({ verses: mergedVerses, source: 'patched', patched: patchedCount }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // === MODE: Translation (English / Italian) ===

    // No translation needed for French
    if (!verses || !targetLang || targetLang === 'fr') {
      return new Response(JSON.stringify({ verses, source: 'original' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const usfmCode = bookFileName ? fileNameToUSFM[bookFileName] : null;
    const isDeuterocanonical = bookFileName ? deuterocanonicalFileNames.has(bookFileName) : false;

    // === ENGLISH: Douay-Rheims (eng_dra) — ALL 73 books ===
    if (targetLang === 'en' && usfmCode) {
      const draVerses = await fetchBibleAPIChapter('eng_dra', usfmCode, chapterNumber);
      if (draVerses && draVerses.length > 0) {
        console.log(`✅ Served Douay-Rheims for ${bookFileName} ch.${chapterNumber} (${draVerses.length} verses)`);
        return new Response(JSON.stringify({ verses: draVerses, source: 'douay-rheims' }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.warn(`⚠️ Douay-Rheims failed for ${usfmCode}/${chapterNumber}`);
    }

    // === ITALIAN: Riveduta (ita_riv) for canonical, CEI via laparola.net for deuterocanonical ===
    if (targetLang === 'it') {
      if (isDeuterocanonical && bookFileName) {
        const italianName = fileNameToItalianCEI[bookFileName];
        if (italianName) {
          const ceiVerses = await fetchItalianCEIChapter(italianName, chapterNumber);
          if (ceiVerses && ceiVerses.length > 0) {
            console.log(`✅ Served Italian CEI for ${bookFileName} ch.${chapterNumber} (${ceiVerses.length} verses)`);
            return new Response(JSON.stringify({ verses: ceiVerses, source: 'cei' }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        }
        console.warn(`⚠️ Italian CEI failed for ${bookFileName}`);
      } else if (usfmCode) {
        const rivVerses = await fetchBibleAPIChapter('ita_riv', usfmCode, chapterNumber);
        if (rivVerses && rivVerses.length > 0) {
          console.log(`✅ Served Italian Riveduta for ${bookFileName} ch.${chapterNumber} (${rivVerses.length} verses)`);
          return new Response(JSON.stringify({ verses: rivVerses, source: 'riveduta' }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        console.warn(`⚠️ Riveduta failed for ${usfmCode}/${chapterNumber}`);
      }
    }

    // === FALLBACK: return original French verses ===
    console.warn(`⚠️ No source found for ${bookFileName} ch.${chapterNumber} in ${targetLang}`);
    return new Response(JSON.stringify({ verses, source: 'fallback-french' }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
