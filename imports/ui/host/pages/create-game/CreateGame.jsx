import React, { useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { useNavigate } from 'react-router';
import { useT } from '../../../../languages/LanguageProvider';
import { LanguagePicker } from '../../../../languages/LanguagePicker';
import { errorKey } from '../../../../languages/errors';

const DIFFICULTY_OPTIONS = [
  { value: 'easy', labelKey: 'difficulty.easy', subKey: 'difficulty.easySub' },
  { value: 'medium', labelKey: 'difficulty.medium', subKey: 'difficulty.mediumSub' },
  { value: 'hard', labelKey: 'difficulty.hard', subKey: 'difficulty.hardSub' },
];

const THEME_OPTIONS = [
  { value: 'classroom', label: 'CLASSROOM', sub: 'LECTURE HALL ITEMS' },
  { value: 'home', label: 'HOME', sub: 'DOMESTIC ITEMS' },
];

const CreateGame = () => {
  const navigate = useNavigate();
  const t = useT();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [groupName, setGroupName] = useState('');
  const [timer, setTimer] = useState(30);
  const [capacity, setCapacity] = useState(4);
  const [difficulty, setDifficulty] = useState('medium');
  const [theme, setTheme] = useState('classroom');

  const handleCreateGame = async () => {
    if (!groupName.trim()) {
      setError(t('host.createGame.errGroupNameRequired'));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const gameId = await Meteor.callAsync('games.create', { groupName: groupName.trim(), timerMinutes: timer, capacity, difficulty, theme });
      navigate(`/game/${gameId}/lobby`);
    } catch (err) {
      setError(t(errorKey(err)));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-gray-100 flex flex-col" style={{ background: '#0e0e0e' }}>
      <header className="px-8 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #1c1b1b' }}>
        <span className="font-bold text-xl tracking-widest uppercase" style={{ color: '#e5e2e1' }}>
          ESCAPESNAP
        </span>
        <LanguagePicker />
      </header>

      <main className="flex-1 flex items-center justify-center px-8 py-12">
        <div className="w-full max-w-lg">
          <div className="mb-8">
            <p className="text-xs tracking-widest mb-1" style={{ color: '#8b0000' }}>
              {t('host.createGame.eyebrow')}
            </p>
            <h1 className="text-3xl font-bold tracking-widest uppercase" style={{ color: '#e5e2e1' }}>
              {t('host.createGame.title')}
            </h1>
            <p className="text-xs mt-2 tracking-wide" style={{ color: '#555' }}>
              {t('host.createGame.subtitle')}
            </p>
          </div>

          <div className="space-y-6">

            <div className="p-4" style={{ border: '1px solid #1c1b1b' }}>
              <label className="block text-xs tracking-widest mb-3" style={{ color: '#aa8984' }}>
                {t('host.createGame.groupName')}
              </label>
              <input
                type="text"
                placeholder={t('host.createGame.groupNamePlaceholder')}
                value={groupName}
                onChange={e => setGroupName(e.target.value)}
                maxLength={40}
                autoComplete="off"
                className="w-full bg-transparent px-3 py-3 text-sm tracking-wide focus:outline-none"
                style={{ border: '1px solid #1c1b1b', color: '#e5e2e1' }}
              />
            </div>

            <div className="p-4" style={{ border: '1px solid #1c1b1b' }}>
              <label className="block text-xs tracking-widest mb-3" style={{ color: '#aa8984' }}>
                {t('host.createGame.timeLimit')}
              </label>
              <input
                type="range" min={10} max={60} step={5} value={timer}
                className="w-full accent-[#8b0000] cursor-pointer"
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
                {t('host.createGame.lobbyCapacity')}
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range" min={2} max={4} step={1} value={capacity}
                  onChange={e => setCapacity(Number(e.target.value))}
                  className="flex-1 accent-[#8b0000] cursor-pointer"
                />
                <span className="text-lg w-12 text-right font-bold" style={{ color: '#8b0000' }}>
                  {String(capacity).padStart(2, '0')}
                </span>
              </div>
            </div>

            <div className="p-4" style={{ border: '1px solid #1c1b1b' }}>
              <label className="block text-xs tracking-widest mb-3" style={{ color: '#aa8984' }}>
                {t('host.createGame.difficultyLevel')}
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
                      {t(opt.labelKey)}
                    </div>
                    <div className="text-xs mt-1 leading-tight" style={{ color: difficulty === opt.value ? '#aa8984' : '#555' }}>
                      {t(opt.subKey)}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4" style={{ border: '1px solid #1c1b1b' }}>
              <label className="block text-xs tracking-widest mb-3" style={{ color: '#aa8984' }}>
                RIDDLE THEME
              </label>
              <div className="grid grid-cols-2 gap-2">
                {THEME_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setTheme(opt.value)}
                    className="p-3 text-left transition-colors cursor-pointer"
                    style={{
                      border: theme === opt.value ? '1px solid #8b0000' : '1px solid #1c1b1b',
                      background: theme === opt.value ? '#1c0000' : 'transparent',
                    }}
                  >
                    <div className="text-xs font-bold" style={{ color: '#e5e2e1' }}>
                      {opt.label}
                    </div>
                    <div className="text-xs mt-1 leading-tight" style={{ color: theme === opt.value ? '#aa8984' : '#555' }}>
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
              {loading ? t('host.createGame.initializing') : t('host.createGame.initializeMission')}
            </button>

          </div>
        </div>
      </main>
    </div>
  );
};

export default CreateGame;