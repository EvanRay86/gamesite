interface CrosswordEntry {
  answer: string;
  clue: string;
}

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

export async function generateCrosswordEntries(
  date: string
): Promise<CrosswordEntry[] | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const prompt = `You are generating words and clues for a daily crossword puzzle dated ${date}.
The crossword should be themed around today's news headlines and pop culture.

IMPORTANT: Use Google Search to find the latest news from AP News (apnews.com) and current pop culture trends for this date.

Generate exactly 12 crossword entries. Each entry needs:
- "answer": A single word (3-10 letters, ALL UPPERCASE, no spaces or hyphens). These should be names, places, or keywords directly from today's headlines.
- "clue": A concise crossword-style clue referencing the news story (keep under 80 characters)

REQUIREMENTS:
- 6-8 entries MUST come from current news headlines (politics, world events, economy, sports)
- 4-6 entries should come from pop culture (movies, TV, music, celebrities, viral trends)
- Words should be common enough to be solvable but specific enough to be interesting
- Prefer proper nouns (last names, city names, country names) and newsworthy terms
- Answers must ONLY contain letters A-Z (no numbers, spaces, or special characters)
- Each answer must be between 3 and 10 letters long
- Try to include words that share common letters (like S, T, E, A, R, N) so they can intersect in a crossword grid
- Avoid obscure abbreviations

GOOD EXAMPLES of answer types:
- Last names: BIDEN, SWIFT, MUSK
- Places: GAZA, KYIV, MARS
- Terms: TARIFF, SUMMIT, DRONE
- Pop culture: BARBIE, OSCAR, GRAMMY

Return ONLY valid JSON in this exact format, no markdown, no code fences:
[
  { "answer": "EXAMPLE", "clue": "A sample crossword entry" }
]`;

  try {
    const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        tools: [{ google_search: {} }],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 2048,
        },
      }),
    });

    if (!res.ok) {
      console.error("Gemini API error (crossword):", res.status, await res.text());
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
      console.error("No JSON array found in Gemini crossword response:", text);
      return null;
    }

    const entries: CrosswordEntry[] = JSON.parse(jsonMatch[0]);

    // Validate structure
    if (!Array.isArray(entries) || entries.length < 8) {
      console.error("Too few crossword entries:", entries.length);
      return null;
    }

    // Validate and clean each entry
    const valid: CrosswordEntry[] = [];
    for (const e of entries) {
      if (!e.answer || !e.clue) continue;

      const answer = e.answer.toUpperCase().replace(/[^A-Z]/g, "");
      if (answer.length < 3 || answer.length > 10) continue;

      valid.push({ answer, clue: e.clue });
    }

    if (valid.length < 8) {
      console.error("Too few valid crossword entries after filtering:", valid.length);
      return null;
    }

    return valid.slice(0, 12);
  } catch (err) {
    console.error("Gemini crossword generation failed:", err);
    return null;
  }
}
