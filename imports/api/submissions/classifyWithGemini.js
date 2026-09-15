const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3-flash-preview';
// gemini-3-flash-preview thinks before answering, and at the default budget
// that regularly ran 3-10s and occasionally past the old 10s abort. Capping
// the thinking at 'low' puts it at ~2-5s; the timeout keeps real headroom
// over that so a slow-but-working call isn't killed mid-flight.
const GEMINI_TIMEOUT_MS = 20_000;

export async function classifyWithGemini(imageBase64, targetObject) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('[Gemini] GEMINI_API_KEY is not set');
    return {
      outcome: 'error',
      explanation: 'Photo verification is not configured.',
    };
  }

  const prompt = `Does this photo clearly show a "${targetObject}"? Ignore any other objects, people, or background in the frame — only judge whether a "${targetObject}" is present. Respond with strict JSON only, no markdown: {"outcome": "pass" or "fail", "explanation": "one short sentence"}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                { inline_data: { mime_type: 'image/jpeg', data: imageBase64 } },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            thinkingConfig: { thinkingLevel: 'low' },
          },
        }),
        signal: controller.signal,
      }
    );

    if (!response.ok) {
      const body = await response.text();
      console.error(`[Gemini] HTTP ${response.status}:`, body);
      return {
        outcome: 'error',
        explanation: 'Could not verify photo — try again.',
      };
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsed = JSON.parse(text);

    if (parsed.outcome !== 'pass' && parsed.outcome !== 'fail') {
      throw new Error(`unexpected outcome: ${parsed.outcome}`);
    }

    return { outcome: parsed.outcome, explanation: parsed.explanation ?? '' };
  } catch (err) {
    console.error('[Gemini] classification failed:', err);
    return {
      outcome: 'error',
      explanation: 'Could not verify photo — try again.',
    };
  } finally {
    clearTimeout(timeout);
  }
}
