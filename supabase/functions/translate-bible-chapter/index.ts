import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { verses, bookName, chapterNumber, targetLang } = await req.json();
    
    if (!verses || !targetLang || targetLang === 'fr') {
      return new Response(JSON.stringify({ verses }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const translationStyle = targetLang === 'en' 
      ? "Translate using a style similar to the NIV (New International Version) or KJV (King James Version). Use dignified, reverent English suitable for Scripture."
      : "Traduci usando uno stile simile alla CEI (Conferenza Episcopale Italiana). Usa un italiano dignitoso e reverente, adatto alle Sacre Scritture.";

    const langName = targetLang === 'en' ? 'English' : 'Italian';

    // Build compact verse text for translation
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
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) throw new Error("No content from AI");

    let translatedVerses;
    try {
      let jsonStr = content.trim();
      if (jsonStr.startsWith("```json")) jsonStr = jsonStr.slice(7);
      if (jsonStr.startsWith("```")) jsonStr = jsonStr.slice(3);
      if (jsonStr.endsWith("```")) jsonStr = jsonStr.slice(0, -3);
      translatedVerses = JSON.parse(jsonStr.trim());
    } catch {
      // Fallback: return original verses
      console.error("Failed to parse translation, returning originals");
      translatedVerses = verses;
    }

    return new Response(JSON.stringify({ verses: translatedVerses }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("Translation error:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
