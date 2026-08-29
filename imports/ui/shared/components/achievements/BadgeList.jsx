// React must remain in scope for Meteor's classic JSX transform.
// eslint-disable-next-line no-unused-vars
import React from 'react';
import { AchievementBadge } from './AchievementBadge';
import { useT } from '../../../../languages/LanguageProvider';

export function BadgeList({ badges = [], size = 24 }) {
  const t = useT();
  if (badges.length === 0) return null;

  return (
    <span
      className="inline-flex flex-wrap items-center gap-2"
      aria-label={t('shared.achievements.badgeListAria')}
    >
      {badges.map((badge) => (
        <AchievementBadge key={badge.id} badge={badge} size={size} />
      ))}
    </span>
  );
}
