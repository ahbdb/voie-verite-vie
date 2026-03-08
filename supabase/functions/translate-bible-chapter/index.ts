import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Map fileName to USFM book code for helloao.org KJV API
const fileNameToUSFM: Record<string, string> = {
  'genesis': 'GEN', 'exodus': 'EXO', 'leviticus': 'LEV', 'numbers': 'NUM',
  'deuteronomy': 'DEU', 'joshua': 'JOS', 'judges': 'JDG', 'ruth': 'RUT',
  '1-samuel': '1SA', '2-samuel': '2SA', '1-kings': '1KI', '2-kings': '2KI',
  '1-chronicles': '1CH', '2-chronicles': '2CH', 'ezra': 'EZR', 'nehemiah': 'NEH',
  'esther': 'EST', 'job': 'JOB', 'psalms': 'PSA', 'proverbs': 'PRO',
  'ecclesiastes': 'ECC', 'song-of-songs': 'SNG', 'isaiah': 'ISA', 'jeremiah': 'JER',
  'lamentations': 'LAM', 'ezekiel': 'EZK', 'daniel': 'DAN', 'hosea': 'HOS',
  'joel': 'JOL', 'amos': 'AMO', 'obadiah': 'OBA', 'jonah': 'JON',
  'micah': 'MIC', 'nahum': 'NAM', 'habakkuk': 'HAB', 'zephaniah': 'ZEP',
  'haggai': 'HAG', 'zechariah': 'ZEC', 'malachi': 'MAL',
  'matthew': 'MAT', 'mark': 'MRK', 'luke': 'LUK', 'john': 'JHN',
  'acts': 'ACT', 'romans': 'ROM', '1-corinthians': '1CO', '2-corinthians': '2CO',
  'galatians': 'GAL', 'ephesians': 'EPH', 'philippians': 'PHP', 'colossians': 'COL',
  '1-thessalonians': '1TH', '2-thessalonians': '2TH', '1-timothy': '1TI', '2-timothy': '2TI',
  'titus': 'TIT', 'philemon': 'PHM', 'hebrews': 'HEB', 'james': 'JAS',
  '1-peter': '1PE', '2-peter': '2PE', '1-john': '1JN', '2-john': '2JN',
  '3-john': '3JN', 'jude': 'JUD', 'revelation': 'REV',
};

// Deuterocanonical books (not in KJV) — will use AI translation
const deuterocanonicalFileNames = new Set([
  'tobit', 'judith', '1-maccabees', '2-maccabees', 'wisdom', 'sirach', 'baruch'
]);

/**
 * Extract plain text from helloao verse content array.
 * Content items can be strings, {text, poem?, wordsOfJesus?}, {noteId}, {heading}, {lineBreak}
 */
function extractVerseText(content: any[]): string {
  return content
    .map((item: any) => {
      if (typeof item === 'string') return item;
      if (item?.text) return item.text;
      if (item?.heading) return ''; // skip inline headings
      return '';
    })
    .join('')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Fetch chapter from helloao.org KJV API
 */
async function fetchKJVChapter(usfmCode: string, chapter: number): Promise<{ number: number; text: string }[] | null> {
  try {
    const url = `https://bible.helloao.org/api/eng_kjv/${usfmCode}/${chapter}.json`;
    console.log(`Fetching KJV: ${url}`);
    
    const resp = await fetch(url, { 
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(10000) 
    });
    
    if (!resp.ok) {
      console.warn(`KJV API returned ${resp.status} for ${usfmCode}/${chapter}`);
      return null;
    }

    const data = await resp.json();
    const chapterContent = data?.chapter?.content;
    
    if (!chapterContent || !Array.isArray(chapterContent)) {
      console.warn(`No chapter content found for ${usfmCode}/${chapter}`);
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
    console.error(`Error fetching KJV for ${usfmCode}/${chapter}:`, err);
    return null;
  }
}

/**
 * Translate verses using AI (for Italian and English deuterocanonical)
 */
async function translateWithAI(
  verses: any[], 
  bookName: string, 
  chapterNumber: number, 
  targetLang: string
): Promise<any[]> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    throw new Error("LOVABLE_API_KEY is not configured");
  }

  const translationStyle = targetLang === 'en' 
    ? "Translate using a style similar to the KJV (King James Version). Use dignified, reverent English suitable for Scripture."
    : "Traduci usando uno stile simile alla CEI (Conferenza Episcopale Italiana). Usa un italiano dignitoso e reverente, adatto alle Sacre Scritture.";

  const langName = targetLang === 'en' ? 'English' : 'Italian';
  const verseTexts = verses.map((v: any) => `[${v.number}] ${v.text}`).join('\n');

  const systemPrompt = `You are a professional Bible translator. Translate the following Bible verses from French to ${langName}. ${translationStyle}

CRITICAL RULES:
- Maintain verse numbering exactly as given
- Preserve the sacred, liturgical tone
- Use proper biblical terminology in ${langName}
- Keep proper nouns in their standard ${langName} biblical form
- Return ONLY a JSON array of objects with "number" and "text" fields
- Do NOT add any commentary or notes`;

  const userPrompt = `Translate ${bookName} chapter ${chapterNumber} from French to ${langName}:

${verseTexts}

Return as JSON array: [{"number": 1, "text": "translated text"}, ...]`;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
    }),
  });

  if (!response.ok) {
    if (response.status === 429) throw new Error("RATE_LIMIT");
    if (response.status === 402) throw new Error("PAYMENT_REQUIRED");
    throw new Error("AI gateway error");
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("No content from AI");

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
    const { verses, bookName, chapterNumber, targetLang, bookFileName } = await req.json();
    
    // No translation needed for French
    if (!verses || !targetLang || targetLang === 'fr') {
      return new Response(JSON.stringify({ verses, source: 'original' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // === ENGLISH: Try KJV API first ===
    if (targetLang === 'en' && bookFileName) {
      const isDeuterocanonical = deuterocanonicalFileNames.has(bookFileName);
      
      if (!isDeuterocanonical) {
        const usfmCode = fileNameToUSFM[bookFileName];
        if (usfmCode) {
          const kjvVerses = await fetchKJVChapter(usfmCode, chapterNumber);
          if (kjvVerses && kjvVerses.length > 0) {
            console.log(`✅ Served KJV for ${bookFileName} ch.${chapterNumber} (${kjvVerses.length} verses)`);
            return new Response(JSON.stringify({ verses: kjvVerses, source: 'kjv' }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          console.warn(`⚠️ KJV API failed for ${usfmCode}/${chapterNumber}, falling back to AI`);
        }
      } else {
        console.log(`📖 Deuterocanonical book ${bookFileName} — using AI translation for English`);
      }
    }

    // === ITALIAN or FALLBACK: Use AI translation ===
    try {
      const translatedVerses = await translateWithAI(verses, bookName, chapterNumber, targetLang);
      const source = targetLang === 'it' ? 'ai-cei-style' : 'ai-kjv-style';
      console.log(`✅ AI translated ${bookName} ch.${chapterNumber} to ${targetLang} (${translatedVerses.length} verses)`);
      
      return new Response(JSON.stringify({ verses: translatedVerses, source }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (aiError: any) {
      if (aiError.message === "RATE_LIMIT") {
        return new Response(JSON.stringify({ error: "Rate limits exceeded" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiError.message === "PAYMENT_REQUIRED") {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // Return original French verses as last resort
      console.error("AI translation failed, returning originals:", aiError);
      return new Response(JSON.stringify({ verses, source: 'fallback-french' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

  } catch (error: unknown) {
    console.error("Translation error:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
