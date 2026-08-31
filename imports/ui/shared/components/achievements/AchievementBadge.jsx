// React must remain in scope for Meteor's classic JSX transform.
import React, { useId } from 'react';
import {
  formatBadgeMetric,
  getBadgeDefinition,
} from '/imports/api/achievements/badgeDefinitions';

const SHAPE_STYLES = Object.freeze({
  circle: { borderRadius: '50%' },
  diamond: { clipPath: 'polygon(50% 0, 100% 50%, 50% 100%, 0 50%)' },
  triangle: { clipPath: 'polygon(50% 0, 100% 100%, 0 100%)' },
  hexagon: {
    clipPath: 'polygon(25% 7%, 75% 7%, 100% 50%, 75% 93%, 25% 93%, 0 50%)',
  },
  star: {
    clipPath:
      'polygon(50% 0, 61% 35%, 98% 35%, 68% 57%, 79% 100%, 50% 74%, 21% 100%, 32% 57%, 2% 35%, 39% 35%)',
  },
  shield: { clipPath: 'polygon(10% 0, 90% 0, 100% 62%, 50% 100%, 0 62%)' },
});

export function AchievementBadge({ badge, size = 24 }) {
  const tooltipId = useId();
  const definition = getBadgeDefinition(badge.id);
  if (!definition) return null;

  const metric = formatBadgeMetric(badge);
  const shapeStyle = SHAPE_STYLES[definition.shape] ?? SHAPE_STYLES.circle;

  return (
    <button
      type="button"
      aria-label={`${definition.name}: ${definition.description}`}
      aria-describedby={tooltipId}
      className="group relative inline-flex flex-shrink-0 items-center justify-center border-0 bg-transparent p-0 focus:outline-none"
      style={{ width: size, height: size, cursor: 'help' }}
    >
      <span
        aria-hidden="true"
        style={{
          width: size,
          height: size,
          display: 'block',
          background: definition.color,
          boxShadow: `0 0 12px ${definition.color}66`,
          ...shapeStyle,
        }}
      />

      <span
        id={tooltipId}
        role="tooltip"
        className="pointer-events-none invisible absolute bottom-full left-1/2 z-50 mb-3 w-56 -translate-x-1/2 text-left opacity-0 transition-opacity group-hover:visible group-hover:opacity-100 group-focus:visible group-focus:opacity-100"
        style={{
          background: '#090909',
          border: `1px solid ${definition.color}`,
          padding: '12px 14px',
          color: '#e5e2e1',
          boxShadow: '0 12px 30px rgba(0,0,0,0.45)',
        }}
      >
        <span
          className="block font-bold uppercase"
          style={{
            color: definition.color,
            fontSize: 11,
            letterSpacing: '1px',
          }}
        >
          {definition.name}
        </span>
        <span
          className="mt-1 block"
          style={{ color: '#c9b8b5', fontSize: 11, lineHeight: 1.5 }}
        >
          {definition.description}
        </span>
        {metric && (
          <span
            className="mt-2 block font-mono"
            style={{ color: '#ffffff', fontSize: 10 }}
          >
            {metric}
          </span>
        )}
      </span>
    </button>
  );
}
