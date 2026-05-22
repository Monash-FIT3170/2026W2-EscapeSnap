import React, { useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { useNavigate } from 'react-router-dom';

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
      const gameId = await Meteor.callAsync('games.create');
      navigate(`/game/${gameId}/lobby`);
    } catch (err) {
      setError(err.reason || err.message || 'INITIALIZATION FAILED');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      <header className="border-b border-gray-800 px-8 py-4 flex items-center justify-between">
        <span className="text-red-500 font-bold text-xl tracking-widest uppercase">
          ESCAPESNAP
        </span>
      </header>

      <main className="flex-1 flex items-center justify-center px-8 py-12">
        <div className="w-full max-w-lg">
          <div className="mb-8">
            <p className="font-BOLD text-xs text-red-500 tracking-widest mb-1">
              CREATE A NEW GAME
            </p>
            <h1 className="text-3xl font-bold tracking-widest uppercase text-gray-100">
              GAME CONFIGURATION
            </h1>
            <p className="text-xs text-gray-500 mt-2 tracking-wide">
              DEFINE GAME PARAMETERS BEFORE ENTERING
            </p>
          </div>

          <div className="space-y-6">

            <div className="border border-gray-800 p-4">
              <label className="block text-xs text-gray-400 tracking-widest mb-3">
                GAME TIME LIMIT (MIN)
              </label>
              <div className="">
                <input type="range" min={10} max={60} step={5} value={timer} className="range w-full text-gray-400" onChange={e => setTimer(Number(e.target.value))}/>
                <div className="flex justify-between px-2.5 mt-2 text-xs">
                    <span>|</span>
                    <span>|</span>
                    <span>|</span>
                    <span>|</span>
                    <span>|</span>
                    <span>|</span>
                    <span>|</span>
                    <span>|</span>
                    <span>|</span>
                    <span>|</span>
                    <span>|</span>

                </div>
                <div className="flex justify-between px-2.5 mt-2 text-xs">
                    <span>10</span>
                    <span>15</span>
                    <span>20</span>
                    <span>25</span>
                    <span>30</span>
                    <span>35</span>
                    <span>40</span>
                    <span>45</span>
                    <span>50</span>
                    <span>55</span>
                    <span>60</span>
                </div>
              </div>
            </div>

            <div className="border border-gray-800 p-4">
              <label className="block text-xs text-gray-400 tracking-widest mb-3">
                LOBBY CAPACITY
              </label>
              <div className="flex items-center gap-4">
                <input type="range" min={1} max={8} step={1} value={capacity} onChange={e => setCapacity(Number(e.target.value))} className="range flex-1 text-gray-400"
                />
                <span className="text-red-400 text-lg w-12 text-right">
                  {String(capacity).padStart(2, '0')}
                </span>
              </div>
            </div>

            <div className="border border-gray-800 p-4">
              <label className="block text-xs text-gray-400 tracking-widest mb-3">
                DIFFICULTY LEVEL
              </label>
              <div className="grid grid-cols-3 gap-2">
                {DIFFICULTY_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setDifficulty(opt.value)}
                    className={`border p-3 text-left transition-colors cursor-pointer ${
                      difficulty === opt.value
                        ? 'border-red-500 bg-red-950'
                        : 'border-gray-700 hover:border-gray-500'
                    }`}
                  >
                    <div className="text-xs font-bold text-gray-100">
                      {opt.label}
                    </div>
                    <div className="text-xs text-gray-500 mt-1 leading-tight">
                      {opt.sub}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="border border-gray-800 p-3">
              <p className="text-xs text-gray-600 tracking-wide">
                SPRINT_1 // PRESET PLAYER: DYLAN ·
                STATUS WILL BE SET TO{' '}
                <span className="text-gray-500">LOBBY</span>
              </p>
            </div>

            {error && (
              <p className="text-xs text-red-500 tracking-widest">
                !! {error}
              </p>
            )}

            <button
              onClick={handleCreateGame}
              disabled={loading}
              className="w-full bg-red-700 hover:bg-red-600 disabled:bg-gray-800 disabled:text-gray-600 text-white text-sm tracking-widest uppercase py-4 transition-colors cursor-pointer disabled:cursor-not-allowed"
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
