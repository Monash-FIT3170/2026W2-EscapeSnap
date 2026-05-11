import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { Games } from '../../../../api/games/GamesCollection';
import SidebarLayout from '/imports/ui/host/layouts/SidebarLayout.jsx';

const MOCK_PUZZLE_DATA = [
  { puzzles: [true, true, true, false, false], status: 'COMPLETED' },
  { puzzles: [true, false, false, false, false], status: 'NEEDS HELP' },
  { puzzles: [true, true, true, false, false], status: 'COMPLETED' },
  { puzzles: [true, true, false, false, false], status: 'NEEDS HELP' },
];

const MOCK_EVENTS = [
  { time: '14:22:10', message: 'DYLAN HAS COMPLETED THE PUZZLE', highlight: true },
  { time: '14:18:05', message: 'SEBASTIAN HAS UPLOADED AN INCORRECT ANSWER', highlight: false },
  { time: '14:15:33', message: 'KAYVIS HAS UPLOADED AN INCORRECT ANSWER', highlight: false },
  { time: '14:10:12', message: 'CASIE HAS COMPLETED THE PUZZLE', highlight: false },
];

const CheckIcon = () => (
  <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
    <path d="M1 6L6 11L15 1" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CrossIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M1 1L13 13M13 1L1 13" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const ProgressPage = () => {
  const { gameId } = useParams();
  const [timeLeft, setTimeLeft] = useState(null);

  const { game, loading } = useTracker(() => {
    const sub = Meteor.subscribe('games.current', gameId);
    return {
      loading: !sub.ready(),
      game: Games.findOne(gameId),
    };
  }, [gameId]);

  useEffect(() => {
    if (!game?.startedAt || !game?.timerMinutes) {
      setTimeLeft(null);
      return;
    }
    const tick = () => {
      const elapsed = Date.now() - new Date(game.startedAt).getTime();
      const remaining = Math.max(0, game.timerMinutes * 60 * 1000 - elapsed);
      setTimeLeft(remaining);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [game?.startedAt, game?.timerMinutes]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#131313' }}>
        <p style={{ color: '#aa8984', fontSize: 10, letterSpacing: '1px' }}>LOADING...</p>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#131313' }}>
        <p style={{ color: '#8b0000', fontSize: 10, letterSpacing: '1px' }}>GAME NOT FOUND</p>
      </div>
    );
  }

  const players = game.players || [];
  const pinRaw = gameId.slice(-6).toUpperCase();
  const pin = pinRaw.slice(0, 3) + '-' + pinRaw.slice(3);

  const formatTime = (ms) => {
    if (ms === null) return '--:--';
    const total = Math.floor(ms / 1000);
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const isExpired = timeLeft === 0;

  return (
    <SidebarLayout gameId={gameId} activePage="progress">

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4" style={{ background: '#131313', borderBottom: '2px solid #1c1b1b' }}>
        <div className="flex items-center gap-4">
          <span style={{ fontWeight: 700, fontSize: 18, letterSpacing: '1.8px', color: '#e5e2e1' }}>ESCAPESNAP</span>
          <div style={{ width: 1, height: 16, background: '#5a403c', opacity: 0.3 }} />
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 p-8 flex flex-col gap-8">

        {/* Stats row */}
        <div className="grid grid-cols-4" style={{ height: 160 }}>
          <div className="flex flex-col justify-between p-6" style={{ background: '#0e0e0e', borderLeft: `2px solid ${isExpired ? '#ff0000' : '#8b0000'}` }}>
            <span style={{ fontSize: 10, letterSpacing: '1px', color: '#aa8984' }}>TIME REMAINING</span>
            <span style={{ fontWeight: 300, fontSize: 60, letterSpacing: '-3px', lineHeight: '60px', color: isExpired ? '#ff4444' : '#e5e2e1' }}>
              {game.startedAt ? formatTime(timeLeft) : '--:--'}
            </span>
            {!game.startedAt && (
              <span style={{ fontSize: 9, color: '#aa8984', opacity: 0.6, letterSpacing: '0.5px' }}>GAME NOT STARTED</span>
            )}
          </div>

          <div className="flex flex-col justify-between p-6" style={{ background: '#1c1b1b' }}>
            <span style={{ fontSize: 10, letterSpacing: '1px', color: '#aa8984' }}>TEAM PROGRESS</span>
            <div className="flex items-end gap-2">
              <span style={{ fontWeight: 700, fontSize: 48, lineHeight: '48px', color: '#e5e2e1' }}>64</span>
              <span style={{ fontSize: 24, color: '#aa8984', paddingBottom: 4 }}>%</span>
            </div>
            <div style={{ height: 4, background: '#353534' }}>
              <div style={{ height: '100%', width: '64%', background: '#8b0000' }} />
            </div>
          </div>

          <div className="flex flex-col justify-between p-6" style={{ background: '#1c1b1b' }}>
            <span style={{ fontSize: 10, letterSpacing: '1px', color: '#aa8984' }}>CURRENT ROUND</span>
            <div className="flex items-end gap-2">
              <span style={{ fontWeight: 700, fontSize: 48, lineHeight: '48px', color: '#e5e2e1' }}>03</span>
              <span style={{ fontSize: 18, color: '#aa8984', paddingBottom: 6 }}>/ 05</span>
            </div>
            <span style={{ fontSize: 10, color: '#aa8984', opacity: 0.6 }}>REMAINING PUZZLES: 2</span>
          </div>

          <div className="flex items-center justify-center p-6 relative" style={{ background: '#0e0e0e' }}>
            <span style={{ position: 'absolute', top: 8, right: 8, fontSize: 8, color: '#aa8984', opacity: 0.4 }}>AUTH_QR_SCAN</span>
            <div style={{ width: 96, height: 96, background: 'rgba(255,255,255,0.8)' }} />
          </div>
        </div>

        {/* Operative Manifest */}
        <div style={{ background: '#1c1b1b' }}>
          <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #353534' }}>
            <div className="flex items-center gap-3">
              <div style={{ width: 4, height: 16, background: '#8b0000' }} />
              <span style={{ fontWeight: 700, fontSize: 14, letterSpacing: '1.4px', color: '#e5e2e1' }}>OPERATIVE_MANIFEST</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <CheckIcon />
                <span style={{ fontSize: 10, color: '#aa8984' }}>SOLVED</span>
              </div>
              <div className="flex items-center gap-1">
                <CrossIcon />
                <span style={{ fontSize: 10, color: '#aa8984' }}>IN PROGRESS</span>
              </div>
            </div>
          </div>

          <div className="flex items-center px-6 py-3" style={{ background: '#0e0e0e', borderBottom: '1px solid #353534' }}>
            <div style={{ width: 160, fontSize: 10, fontWeight: 700, letterSpacing: '1px', color: '#aa8984' }}>PLAYER</div>
            {[1, 2, 3, 4, 5].map(n => (
              <div key={n} style={{ flex: 1, fontSize: 10, fontWeight: 700, letterSpacing: '1px', color: '#aa8984', textAlign: 'center' }}>PUZZLE {n}</div>
            ))}
            <div style={{ width: 120, fontSize: 10, fontWeight: 700, letterSpacing: '1px', color: '#aa8984', textAlign: 'right' }}>STATUS</div>
          </div>

          {players.map((player, i) => {
            const data = MOCK_PUZZLE_DATA[i] || { puzzles: [false, false, false, false, false], status: 'NEEDS HELP' };
            const isCompleted = data.status === 'COMPLETED';
            return (
              <div key={player.id} className="flex items-center px-6 py-4" style={{ borderTop: i > 0 ? '1px solid #353534' : 'none' }}>
                <div style={{ width: 160, fontWeight: 700, fontSize: 12, color: '#e5e2e1' }}>{player.name.toUpperCase()}</div>
                {data.puzzles.map((solved, pi) => (
                  <div key={pi} style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    {solved ? <CheckIcon /> : pi < 3 ? <CrossIcon /> : null}
                  </div>
                ))}
                <div style={{ width: 120, display: 'flex', justifyContent: 'flex-end' }}>
                  <span style={{
                    fontSize: 9,
                    padding: '2px 8px',
                    background: isCompleted ? '#474747' : '#93000a',
                    color: isCompleted ? '#e5e2e1' : '#ffdad6',
                  }}>
                    {data.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Event Log */}
        <div className="p-6" style={{ background: '#0e0e0e', borderLeft: '1px solid rgba(90,64,60,0.2)' }}>
          <div className="flex items-center gap-3 mb-4">
            <div style={{ width: 4, height: 16, background: '#8b0000' }} />
            <span style={{ fontWeight: 700, fontSize: 12, letterSpacing: '1.2px', color: '#e5e2e1' }}>EVENT_LOG</span>
          </div>
          <div className="flex flex-col gap-4">
            {MOCK_EVENTS.map((event, i) => (
              <div key={i} className="flex items-start gap-4 pl-3 py-1" style={{ borderLeft: `1px solid ${event.highlight ? '#8b0000' : 'rgba(90,64,60,0.3)'}` }}>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#aa8984', whiteSpace: 'nowrap' }}>[ {event.time} ]</span>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: event.highlight ? '#e5e2e1' : '#e3beb8' }}>{event.message}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </SidebarLayout>
  );
};

export default ProgressPage;
