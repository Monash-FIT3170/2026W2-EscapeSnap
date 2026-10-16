import { GameEvents } from './GameEventsCollection';
import { Players } from '../players/PlayersCollection';

// Records one event for the host's event log. The log is a nice-to-have, so a
// failed write is logged and swallowed rather than failing the game action
// that triggered it.
export async function logGameEvent({ gameId, type, playerId, roundNumber }) {
  try {
    const event = { gameId, type, createdAt: new Date() };

    if (playerId) {
      event.playerId = playerId;
      const player = await Players.findOneAsync(playerId, {
        fields: { name: 1 },
      });
      if (player) event.playerName = player.name;
    }
    if (roundNumber) event.roundNumber = roundNumber;

    await GameEvents.insertAsync(event);
  } catch (err) {
    console.error(`[EscapeSnap] logGameEvent ${type} failed:`, err);
  }
}
