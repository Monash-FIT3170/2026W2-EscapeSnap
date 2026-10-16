import { normalizeAnswerMode } from '../../lib/answerModes.js';

const JSON_INSTRUCTION =
  'Respond with strict JSON only, no markdown: {"outcome": "pass" or "fail", "explanation": "one short sentence"}';

// The Gemini instruction for checking a submission against the round's
// answer. Sketches are judged on whether the subject is recognisable, not on
// drawing skill — a strict "clearly shows" check fails most phone doodles.
export function buildClassifyPrompt(targetObject, mode) {
  if (normalizeAnswerMode(mode) === 'drawing') {
    return `This is a rough hand-drawn sketch from a drawing game. Would a reasonable person recognise it as a "${targetObject}"? Be generous about drawing skill — only judge whether the subject is recognisable as a "${targetObject}". ${JSON_INSTRUCTION}`;
  }
  return `Does this photo clearly show a "${targetObject}"? Ignore any other objects, people, or background in the frame — only judge whether a "${targetObject}" is present. ${JSON_INSTRUCTION}`;
}

// Camera captures are JPEG; the drawing canvas exports PNG.
export function submissionMimeType(mode) {
  return normalizeAnswerMode(mode) === 'drawing' ? 'image/png' : 'image/jpeg';
}
