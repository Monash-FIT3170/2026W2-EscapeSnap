// How players answer a round riddle. Chosen once per game by the host.
// Games created before drawing mode existed have no `mode`, so anything
// unrecognised is treated as the original camera flow.
export const ANSWER_MODES = ['camera', 'drawing'];
export const DEFAULT_ANSWER_MODE = 'camera';

export function normalizeAnswerMode(mode) {
  return ANSWER_MODES.includes(mode) ? mode : DEFAULT_ANSWER_MODE;
}
