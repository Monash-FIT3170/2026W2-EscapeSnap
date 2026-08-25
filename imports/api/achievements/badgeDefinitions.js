export const BADGE_IDS = Object.freeze({
  FIELD_OPERATIVE: 'field-operative',
  LIGHTNING_SOLVER: 'lightning-solver',
  RIDDLE_MASTER: 'riddle-master',
  FLAWLESS_AGENT: 'flawless-agent',
  FIRST_BREAKTHROUGH: 'first-breakthrough',
  CLUTCH_SPECIALIST: 'clutch-specialist',
});

export const BADGE_DEFINITIONS = Object.freeze({
  [BADGE_IDS.FIELD_OPERATIVE]: {
    id: BADGE_IDS.FIELD_OPERATIVE,
    name: 'Field Operative',
    description: 'Participated in the completed mission.',
    color: '#3b82f6',
    shape: 'circle',
    metricType: 'completed-count',
  },
  [BADGE_IDS.LIGHTNING_SOLVER]: {
    id: BADGE_IDS.LIGHTNING_SOLVER,
    name: 'Lightning Solver',
    description: 'Recorded the fastest correct riddle solve in the game.',
    color: '#f59e0b',
    shape: 'diamond',
    metricType: 'duration',
  },
  [BADGE_IDS.RIDDLE_MASTER]: {
    id: BADGE_IDS.RIDDLE_MASTER,
    name: 'Riddle Master',
    description: 'Solved the highest number of riddles correctly.',
    color: '#a855f7',
    shape: 'triangle',
    metricType: 'correct-count',
  },
  [BADGE_IDS.FLAWLESS_AGENT]: {
    id: BADGE_IDS.FLAWLESS_AGENT,
    name: 'Flawless Agent',
    description:
      'Solved every assigned riddle without a wrong answer or timeout.',
    color: '#10b981',
    shape: 'hexagon',
    metricType: 'percent',
  },
  [BADGE_IDS.FIRST_BREAKTHROUGH]: {
    id: BADGE_IDS.FIRST_BREAKTHROUGH,
    name: 'First Breakthrough',
    description: 'Delivered the first correct riddle solve of the game.',
    color: '#06b6d4',
    shape: 'star',
    metricType: 'elapsed',
  },
  [BADGE_IDS.CLUTCH_SPECIALIST]: {
    id: BADGE_IDS.CLUTCH_SPECIALIST,
    name: 'Clutch Specialist',
    description: 'Solved a riddle during the final 10% of the mission timer.',
    color: '#ef4444',
    shape: 'shield',
    metricType: 'remaining',
  },
});

export function getBadgeDefinition(badgeId) {
  return BADGE_DEFINITIONS[badgeId] ?? null;
}

function formatDuration(milliseconds) {
  if (!Number.isFinite(milliseconds)) return null;

  const totalSeconds = Math.max(0, Math.round(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
}

export function formatBadgeMetric(badge) {
  const definition = getBadgeDefinition(badge.id);
  if (!definition || !Number.isFinite(badge.metricValue)) return null;

  switch (definition.metricType) {
    case 'completed-count':
      return `${badge.metricValue} rounds completed`;
    case 'correct-count':
      return `${badge.metricValue} correct ${badge.metricValue === 1 ? 'solve' : 'solves'}`;
    case 'percent':
      return `${badge.metricValue}% accuracy`;
    case 'duration':
      return `Solved in ${formatDuration(badge.metricValue)}`;
    case 'elapsed':
      return `First solve after ${formatDuration(badge.metricValue)}`;
    case 'remaining':
      return `${formatDuration(badge.metricValue)} remaining`;
    default:
      return null;
  }
}
