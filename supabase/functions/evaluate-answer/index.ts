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
    const { question, userAnswer, keyPoints, sampleAnswer, books, chapters } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Evaluating answer for question:", question.substring(0, 50) + "...");

    const systemPrompt = `Tu es un expert en théologie catholique et en études bibliques.
Tu dois évaluer la réponse d'un utilisateur à une question biblique de façon méticuleuse et juste.

Contexte: ${books}, chapitres ${chapters}

Évalue selon ces critères:
1. Exactitude biblique (les faits mentionnés sont-ils corrects?)
2. Pertinence (la réponse répond-elle à la question?)
3. Profondeur (niveau de réflexion et de compréhension)
4. Références scripturaires (utilisation de versets appropriés)

Sois encourageant mais honnête. Donne une note sur 10 et des commentaires constructifs.

Réponds UNIQUEMENT en JSON valide.`;

    const userPrompt = `Question posée: "${question}"

Réponse de l'utilisateur: "${userAnswer}"

Points clés attendus: ${JSON.stringify(keyPoints)}

Exemple de bonne réponse: "${sampleAnswer}"

Évalue cette réponse et fournis:
{
  "score": 7,
  "maxScore": 10,
  "feedback": "Commentaire détaillé sur la réponse",
  "strengths": ["Point fort 1", "Point fort 2"],
  "improvements": ["Suggestion d'amélioration 1", "Suggestion 2"],
  "missingPoints": ["Point manquant si applicable"]
}`;

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
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error("No content from AI");
    }

    let evaluation;
    try {
      let jsonStr = content.trim();
      if (jsonStr.startsWith("```json")) {
        jsonStr = jsonStr.slice(7);
      }
      if (jsonStr.startsWith("```")) {
        jsonStr = jsonStr.slice(3);
      }
      if (jsonStr.endsWith("```")) {
        jsonStr = jsonStr.slice(0, -3);
      }
      evaluation = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error("Failed to parse evaluation JSON:", parseError);
      evaluation = {
        score: 5,
        maxScore: 10,
        feedback: "Réponse reçue. Merci pour votre participation.",
        strengths: [],
        improvements: [],
        missingPoints: []
      };
    }

    return new Response(JSON.stringify(evaluation), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("Error evaluating answer:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
