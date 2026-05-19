import React, { useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { useNavigate } from 'react-router';

const DIFFICULTY_OPTIONS = [
  { value: 'easy', label: 'EASY', sub: 'STABLE VITALS' },
  { value: 'medium', label: 'MEDIUM', sub: 'ELEVATED CORTISOL' },
  { value: 'hard', label: 'HARD', sub: 'SYSTEMIC FAILURE' },
];

const CreateGame = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [timer, setTimer] = useState(30);
  const [capacity, setCapacity] = useState(4);
  const [difficulty, setDifficulty] = useState('medium');

  const handleCreateGame = async () => {
    setLoading(true);
    setError(null);
    try {
      const gameId = await Meteor.callAsync('games.create', { timerMinutes: timer, capacity, difficulty });
      navigate(`/game/${gameId}/lobby`);
    } catch (err) {
      setError(err.reason || err.message || 'INITIALIZATION FAILED');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-gray-100 flex flex-col" style={{ background: '#0e0e0e' }}>
      <header className="px-8 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #1c1b1b' }}>
        <span className="font-bold text-xl tracking-widest uppercase" style={{ color: '#e5e2e1' }}>
          ESCAPESNAP
        </span>
      </header>

      <main className="flex-1 flex items-center justify-center px-8 py-12">
        <div className="w-full max-w-lg">
          <div className="mb-8">
            <p className="text-xs tracking-widest mb-1" style={{ color: '#8b0000' }}>
              CREATE A NEW GAME
            </p>
            <h1 className="text-3xl font-bold tracking-widest uppercase" style={{ color: '#e5e2e1' }}>
              GAME CONFIGURATION
            </h1>
            <p className="text-xs mt-2 tracking-wide" style={{ color: '#555' }}>
              DEFINE GAME PARAMETERS BEFORE ENTERING
            </p>
          </div>

          <div className="space-y-6">

            <div className="p-4" style={{ border: '1px solid #1c1b1b' }}>
              <label className="block text-xs tracking-widest mb-3" style={{ color: '#aa8984' }}>
                GAME TIME LIMIT (MIN)
              </label>
              <input
                type="range" min={10} max={60} step={5} value={timer}
                className="range w-full"
                onChange={e => setTimer(Number(e.target.value))}
              />
              <div className="flex justify-between px-2.5 mt-2 text-xs" style={{ color: '#333' }}>
                <span>|</span><span>|</span><span>|</span><span>|</span><span>|</span>
                <span>|</span><span>|</span><span>|</span><span>|</span><span>|</span><span>|</span>
              </div>
              <div className="flex justify-between px-2.5 mt-2 text-xs" style={{ color: '#555' }}>
                <span>10</span><span>15</span><span>20</span><span>25</span><span>30</span>
                <span>35</span><span>40</span><span>45</span><span>50</span><span>55</span><span>60</span>
              </div>
            </div>

            <div className="p-4" style={{ border: '1px solid #1c1b1b' }}>
              <label className="block text-xs tracking-widest mb-3" style={{ color: '#aa8984' }}>
                LOBBY CAPACITY
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range" min={2} max={4} step={1} value={capacity}
                  onChange={e => setCapacity(Number(e.target.value))}
                  className="range flex-1"
                />
                <span className="text-lg w-12 text-right font-bold" style={{ color: '#8b0000' }}>
                  {String(capacity).padStart(2, '0')}
                </span>
              </div>
            </div>

            <div className="p-4" style={{ border: '1px solid #1c1b1b' }}>
              <label className="block text-xs tracking-widest mb-3" style={{ color: '#aa8984' }}>
                DIFFICULTY LEVEL
              </label>
              <div className="grid grid-cols-3 gap-2">
                {DIFFICULTY_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setDifficulty(opt.value)}
                    className="p-3 text-left transition-colors cursor-pointer"
                    style={{
                      border: difficulty === opt.value ? '1px solid #8b0000' : '1px solid #1c1b1b',
                      background: difficulty === opt.value ? '#1c0000' : 'transparent',
                    }}
                  >
                    <div className="text-xs font-bold" style={{ color: '#e5e2e1' }}>
                      {opt.label}
                    </div>
                    <div className="text-xs mt-1 leading-tight" style={{ color: difficulty === opt.value ? '#aa8984' : '#555' }}>
                      {opt.sub}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3" style={{ border: '1px solid #1c1b1b' }}>
              <p className="text-xs tracking-wide" style={{ color: '#444' }}>
                SPRINT_1 // PRESET PLAYER: DYLAN ·
                STATUS WILL BE SET TO{' '}
                <span style={{ color: '#555' }}>LOBBY</span>
              </p>
            </div>

            {error && (
              <p className="text-xs tracking-widest" style={{ color: '#8b0000' }}>
                !! {error}
              </p>
            )}

            <button
              onClick={handleCreateGame}
              disabled={loading}
              className="w-full text-sm tracking-widest uppercase py-4 transition-colors cursor-pointer disabled:cursor-not-allowed"
              style={{
                background: loading ? '#3a0000' : '#8b0000',
                color: loading ? '#555' : '#e5e2e1',
              }}
            >
              {loading ? 'INITIALIZING…' : 'INITIALIZE MISSION'}
            </button>

          </div>
        </div>
      </main>
    </div>
  );
};

export default CreateGame;