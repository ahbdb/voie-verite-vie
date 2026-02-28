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
    const { books, chapters, dayNumber, difficulty } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log(`Generating ${difficulty} quiz for: ${books}, chapters ${chapters}, day ${dayNumber}`);

    const difficultyInstructions = {
      easy: "Questions de niveau débutant/facile. Questions simples sur les faits principaux, les personnages, les événements clés. Pas de questions sur des détails obscurs.",
      medium: "Questions de niveau intermédiaire. Questions sur les thèmes, les leçons morales, les liens entre passages. Quelques questions sur des références de versets.",
      hard: "Questions de niveau difficile. Questions approfondies sur l'exégèse, les références de versets précis, les parallèles bibliques, le contexte historique.",
      expert: "Questions de niveau expert/super difficile. Questions très complexes sur les nuances théologiques, les références croisées avec d'autres livres, l'analyse littéraire, les termes originaux hébreux/grecs."
    };

    const systemPrompt = `Tu es un expert en théologie catholique et en études bibliques. Tu génères des quiz éducatifs sur la Bible.
Tu dois créer exactement 20 questions au total: 15 questions à choix multiples et 5 questions à réponse ouverte COURTES.
Les questions doivent porter sur le contenu spécifique des livres et chapitres mentionnés.
${difficultyInstructions[difficulty as keyof typeof difficultyInstructions] || difficultyInstructions.easy}

IMPORTANT pour les questions:
- Inclus des questions sur des références de versets précis (ex: "Dans quel verset trouve-t-on...")
- Pose des questions sur les personnages, lieux, événements
- Inclus des questions d'interprétation et d'exégèse
- Les questions doivent être variées et couvrir tout le passage
- Les questions ouvertes doivent être COURTES et appeler des réponses de 2-3 phrases maximum

Réponds UNIQUEMENT en JSON valide, sans commentaires ni texte supplémentaire.`;

    const userPrompt = `Génère un quiz de niveau ${difficulty} sur ${books}, chapitres ${chapters}.

Format JSON requis:
{
  "multipleChoice": [
    {
      "question": "La question avec référence de verset si applicable",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Explication détaillée avec référence biblique"
    }
  ],
  "openEnded": [
    {
      "question": "Question courte demandant une réflexion brève",
      "keyPoints": ["Point clé 1", "Point clé 2"],
      "sampleAnswer": "Réponse attendue en 2-3 phrases"
    }
  ]
}

Génère exactement 15 questions à choix multiples et 5 questions à réponse ouverte courtes.`;

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

    console.log("AI response received, parsing...");

    let quizData;
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
      quizData = JSON.parse(jsonStr.trim());
      
      // Validation de la structure
      if (!quizData.multipleChoice || !quizData.openEnded) {
        throw new Error("Invalid quiz structure");
      }
      
      // Vérifier que chaque question MC a les bonnes données
      quizData.multipleChoice = quizData.multipleChoice.map((q: any, idx: number) => {
        if (!q.options || q.options.length < 2) {
          throw new Error(`Question ${idx} missing options`);
        }
        if (q.correctIndex === undefined || q.correctIndex < 0 || q.correctIndex >= q.options.length) {
          throw new Error(`Question ${idx} has invalid correctIndex`);
        }
        
        // Mélanger les réponses SAUF si correctIndex est déjà approprié
        // Pour éviter que la première soit toujours correcte
        const options = [...q.options];
        const correctAnswer = options[q.correctIndex];
        
        // Shuffle les options et mettre à jour correctIndex
        for (let i = options.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [options[i], options[j]] = [options[j], options[i]];
        }
        
        const newCorrectIndex = options.indexOf(correctAnswer);
        
        return {
          ...q,
          options,
          correctIndex: newCorrectIndex
        };
      });
      
    } catch (parseError) {
      console.error("Failed to parse quiz JSON:", parseError);
      console.error("Content was:", content);
      throw new Error("Failed to parse quiz data");
    }

    return new Response(JSON.stringify(quizData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("Error generating quiz:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
