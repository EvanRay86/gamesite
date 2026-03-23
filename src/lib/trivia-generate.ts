import type { TriviaQuestion } from "@/types/trivia";

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

export async function generateTriviaQuestions(
  date: string
): Promise<TriviaQuestion[] | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const prompt = `Generate 8 trivia questions for a daily trivia game dated ${date}.

IMPORTANT REQUIREMENTS:
- 4 questions MUST be about current/recent news events and world happenings (politics, sports, tech, entertainment, science breakthroughs, etc. from the past few weeks). Use Google Search to find the latest news.
- 4 questions should be general knowledge (science, history, geography, pop culture, etc.)
- Mix the current events and general knowledge questions together randomly
- Each question must have exactly 4 answer options (A, B, C, D)
- Only one option should be correct
- Questions should be interesting and varied in difficulty
- For current events questions, use the category "Current Events"
- For general knowledge, use categories like: Science, History, Geography, Art, Music, Literature, Nature, Technology, Culture, Sports

Return ONLY valid JSON in this exact format, no markdown, no code fences:
[
  {
    "question": "What is...?",
    "options": ["A", "B", "C", "D"],
    "correctIndex": 0,
    "category": "Category Name"
  }
]`;

  try {
    const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        tools: [{ google_search: {} }],
        generationConfig: {
          temperature: 0.9,
          maxOutputTokens: 2048,
        },
      }),
    });

    if (!res.ok) {
      console.error("Gemini API error:", res.status, await res.text());
      return null;
    }

    const data = await res.json();
    const text =
      data?.candidates?.[0]?.content?.parts
        ?.filter((p: { text?: string }) => p.text)
        ?.map((p: { text: string }) => p.text)
        ?.join("") ?? "";

    // Extract JSON from response (handle potential markdown fences)
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error("No JSON array found in Gemini response:", text);
      return null;
    }

    const questions: TriviaQuestion[] = JSON.parse(jsonMatch[0]);

    // Validate structure
    if (!Array.isArray(questions) || questions.length < 1) return null;
    for (const q of questions) {
      if (
        !q.question ||
        !Array.isArray(q.options) ||
        q.options.length !== 4 ||
        typeof q.correctIndex !== "number" ||
        q.correctIndex < 0 ||
        q.correctIndex > 3 ||
        !q.category
      ) {
        console.error("Invalid question format:", q);
        return null;
      }
    }

    return questions.slice(0, 8);
  } catch (err) {
    console.error("Gemini generation failed:", err);
    return null;
  }
}
