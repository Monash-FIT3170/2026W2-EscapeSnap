// Server-only — picks a Gemini model that is actually answering right now.
// Gemini regularly returns 503 ("high demand") or 429 (quota) for one model
// while others are fine, and preview model names get renamed or retired (404).
// Each call walks an ordered list of models and moves on when one is busy or
// missing, instead of failing the whole request.

// Fallback order after the caller's preferred model. All work with any
// Gemini API key; the "-latest" aliases track Google's current flash models.
const DEFAULT_MODELS = [
  'gemini-3-flash-preview',
  'gemini-flash-latest',
  'gemini-flash-lite-latest',
];

// Worth trying another model: overloaded, rate-limited, server error, or the
// model name no longer exists. Anything else (400 bad request, 401/403 bad
// key) would fail the same way on every model, so it is thrown straight away.
const FALLBACK_STATUSES = new Set([404, 429, 500, 503]);
// Busy/quota-limited models are skipped for a while so that, during a spike,
// calls go straight to a model that is answering.
const COOLDOWN_STATUSES = new Set([429, 503]);
const COOLDOWN_MS = 60 * 1000;

const GEMINI_URL = (model) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

export function modelCandidates(preferred) {
  return [...new Set([preferred, ...DEFAULT_MODELS].filter(Boolean))];
}

// `thinkingConfig.thinkingLevel` only exists on Gemini 3 models; older models
// reject the whole request with a 400 if it is sent.
export function supportsThinkingLevel(model) {
  return model.startsWith('gemini-3');
}

export function createGeminiCaller({
  apiKey,
  fetchImpl = fetch,
  now = Date.now,
  log = console.warn,
}) {
  const busyUntil = new Map();

  // Cooling-down models go to the back rather than being dropped, so a call
  // still has something to try when every model was busy a moment ago.
  function orderByAvailability(models) {
    const time = now();
    const ready = models.filter((m) => !(busyUntil.get(m) > time));
    const cooling = models.filter((m) => busyUntil.get(m) > time);
    return [...ready, ...cooling];
  }

  // `buildBody(model)` returns the request body, so callers can vary config by
  // model. Resolves to { data, model }. A timeout rejects with an AbortError
  // and does not fall back — the caller has already waited `timeoutMs`.
  async function generate(buildBody, { models, timeoutMs = 30000 }) {
    if (!apiKey) throw new Error('GEMINI_API_KEY is not set');

    const ordered = orderByAvailability(models);
    let lastErr;

    for (let i = 0; i < ordered.length; i++) {
      const model = ordered[i];
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      let res;
      try {
        res = await fetchImpl(GEMINI_URL(model), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
          },
          body: JSON.stringify(buildBody(model)),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeout);
      }

      if (res.ok) {
        busyUntil.delete(model);
        return { data: await res.json(), model };
      }

      const text = await res.text().catch(() => '');
      lastErr = new Error(`Gemini request failed: ${res.status} ${text}`);
      lastErr.status = res.status;

      if (!FALLBACK_STATUSES.has(res.status)) throw lastErr;
      if (COOLDOWN_STATUSES.has(res.status)) {
        busyUntil.set(model, now() + COOLDOWN_MS);
      }

      const next = ordered[i + 1];
      log(
        next
          ? `[Gemini] ${model} → ${res.status}, trying ${next}`
          : `[Gemini] ${model} → ${res.status}, no models left`
      );
    }

    throw lastErr;
  }

  return { generate };
}

// Shared instance so cooldowns carry across riddle generation and photo checks.
export const gemini = createGeminiCaller({
  apiKey: process.env.GEMINI_API_KEY,
});
