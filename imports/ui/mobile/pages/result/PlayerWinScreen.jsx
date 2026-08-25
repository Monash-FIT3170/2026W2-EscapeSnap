// Meteor's JSX transform still requires React in module scope.
// eslint-disable-next-line no-unused-vars
import React from 'react';
import { EndgameShareStudio } from '../../components/result/EndgameShareStudio';

export function PlayerWinScreen({ snapshot, loading }) {
  return <EndgameShareStudio snapshot={snapshot} loading={loading} />;
}
