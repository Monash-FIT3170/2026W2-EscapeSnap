import React, { useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { useNavigate } from 'react-router';
import { useT } from '../../../../languages/LanguageProvider';
import { LanguagePicker } from '../../../../languages/LanguagePicker';
import { ThemePicker } from '../../../shared/components/theme/ThemePicker';
import { useUiTheme } from '../../../shared/components/theme/UiThemeProvider';
import { errorKey } from '../../../../languages/errors';
import { DEFAULT_ANSWER_MODE } from '../../../../lib/answerModes';
import { CUSTOM_THEME, CUSTOM_THEME_MAX_LENGTH } from '../../../../lib/customTheme';

const DIFFICULTY_OPTIONS = [
  { value: 'easy', labelKey: 'difficulty.easy', subKey: 'difficulty.easySub' },
  { value: 'medium', labelKey: 'difficulty.medium', subKey: 'difficulty.mediumSub' },
  { value: 'hard', labelKey: 'difficulty.hard', subKey: 'difficulty.hardSub' },
];

const THEME_OPTIONS = [
  { value: 'classroom', label: 'CLASSROOM', sub: 'LECTURE HALL ITEMS' },
  { value: 'home', label: 'HOME', sub: 'DOMESTIC ITEMS' },
  { value: CUSTOM_THEME, labelKey: 'host.createGame.themeOther', subKey: 'host.createGame.themeOtherSub' },
];

const MODE_OPTIONS = [
  { value: 'camera', labelKey: 'host.createGame.modeCamera', subKey: 'host.createGame.modeCameraSub' },
  { value: 'drawing', labelKey: 'host.createGame.modeDrawing', subKey: 'host.createGame.modeDrawingSub' },
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
  // The new game starts in whatever skin the host is looking at now.
  const { uiTheme } = useUiTheme();
  const [customTheme, setCustomTheme] = useState('');
  const [mode, setMode] = useState(DEFAULT_ANSWER_MODE);

  const handleCreateGame = async () => {
    if (!groupName.trim()) {
      setError(t('host.createGame.errGroupNameRequired'));
      return;
    }
    if (theme === CUSTOM_THEME && !customTheme.trim()) {
      setError(t('host.createGame.errCustomThemeRequired'));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const gameId = await Meteor.callAsync('games.create', { groupName: groupName.trim(), timerMinutes: timer, capacity, difficulty, theme, uiTheme, mode, customTheme: theme === CUSTOM_THEME ? customTheme.trim() : undefined });
      navigate(`/game/${gameId}/lobby`);
    } catch (err) {
      setError(t(errorKey(err, { 'invalid-custom-theme': 'host.createGame.errCustomThemeRequired' })));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-ink flex flex-col" style={{ background: 'rgb(var(--es-ground))' }}>
      <header className="px-8 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgb(var(--es-panel))' }}>
        <span className="font-display text-xl font-black tracking-wide text-brand">
          ESCAPESNAP
        </span>
        <div className="flex items-center gap-3">
          <ThemePicker />
          <LanguagePicker />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-8 py-12">
        <div className="w-full max-w-lg">
          <div className="mb-8">
            <p className="text-xs tracking-widest mb-1" style={{ color: 'rgb(var(--es-brand))' }}>
              {t('host.createGame.eyebrow')}
            </p>
            <h1 className="text-3xl font-bold tracking-widest uppercase" style={{ color: 'rgb(var(--es-ink))' }}>
              {t('host.createGame.title')}
            </h1>
            <p className="text-xs mt-2 tracking-wide" style={{ color: 'rgb(var(--es-dim))' }}>
              {t('host.createGame.subtitle')}
            </p>
          </div>

          <div className="space-y-6">

            <div className="p-4" style={{ border: '1px solid rgb(var(--es-panel))' }}>
              <label className="block text-xs tracking-widest mb-3" style={{ color: 'rgb(var(--es-muted))' }}>
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
                style={{ border: '1px solid rgb(var(--es-panel))', color: 'rgb(var(--es-ink))' }}
              />
            </div>

            <div className="p-4" style={{ border: '1px solid rgb(var(--es-panel))' }}>
              <label className="block text-xs tracking-widest mb-3" style={{ color: 'rgb(var(--es-muted))' }}>
                {t('host.createGame.timeLimit')}
              </label>
              <input
                type="range" min={10} max={60} step={5} value={timer}
                className="w-full accent-brand cursor-pointer"
                onChange={e => setTimer(Number(e.target.value))}
              />
              <div className="flex justify-between px-2.5 mt-2 text-xs" style={{ color: 'rgb(var(--es-dim))' }}>
                <span>|</span><span>|</span><span>|</span><span>|</span><span>|</span>
                <span>|</span><span>|</span><span>|</span><span>|</span><span>|</span><span>|</span>
              </div>
              <div className="flex justify-between px-2.5 mt-2 text-xs" style={{ color: 'rgb(var(--es-dim))' }}>
                <span>10</span><span>15</span><span>20</span><span>25</span><span>30</span>
                <span>35</span><span>40</span><span>45</span><span>50</span><span>55</span><span>60</span>
              </div>
            </div>

            <div className="p-4" style={{ border: '1px solid rgb(var(--es-panel))' }}>
              <label className="block text-xs tracking-widest mb-3" style={{ color: 'rgb(var(--es-muted))' }}>
                {t('host.createGame.lobbyCapacity')}
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range" min={2} max={4} step={1} value={capacity}
                  onChange={e => setCapacity(Number(e.target.value))}
                  className="flex-1 accent-brand cursor-pointer"
                />
                <span className="text-lg w-12 text-right font-bold" style={{ color: 'rgb(var(--es-brand))' }}>
                  {String(capacity).padStart(2, '0')}
                </span>
              </div>
            </div>

            <div className="p-4" style={{ border: '1px solid rgb(var(--es-panel))' }}>
              <label className="block text-xs tracking-widest mb-3" style={{ color: 'rgb(var(--es-muted))' }}>
                {t('host.createGame.difficultyLevel')}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {DIFFICULTY_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setDifficulty(opt.value)}
                    className="p-3 text-left transition-colors cursor-pointer"
                    style={{
                      border: difficulty === opt.value ? '1px solid rgb(var(--es-brand))' : '1px solid rgb(var(--es-panel))',
                      background: difficulty === opt.value ? 'rgb(var(--es-brand) / 0.2)' : 'transparent',
                    }}
                  >
                    <div className="text-xs font-bold" style={{ color: 'rgb(var(--es-ink))' }}>
                      {t(opt.labelKey)}
                    </div>
                    <div className="text-xs mt-1 leading-tight" style={{ color: difficulty === opt.value ? 'rgb(var(--es-muted))' : 'rgb(var(--es-dim))' }}>
                      {t(opt.subKey)}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4" style={{ border: '1px solid rgb(var(--es-panel))' }}>
              <label className="block text-xs tracking-widest mb-3" style={{ color: 'rgb(var(--es-muted))' }}>
                RIDDLE THEME
              </label>
              <div className="grid grid-cols-3 gap-2">
                {THEME_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setTheme(opt.value)}
                    className="p-3 text-left transition-colors cursor-pointer"
                    style={{
                      border: theme === opt.value ? '1px solid rgb(var(--es-brand))' : '1px solid rgb(var(--es-panel))',
                      background: theme === opt.value ? 'rgb(var(--es-brand) / 0.2)' : 'transparent',
                    }}
                  >
                    <div className="text-xs font-bold" style={{ color: 'rgb(var(--es-ink))' }}>
                      {opt.value === CUSTOM_THEME ? (
                        // Shimmers so hosts notice they can type their own theme.
                        <span className="ai-text">{t(opt.labelKey)}</span>
                      ) : (
                        opt.label
                      )}
                    </div>
                    <div className="text-xs mt-1 leading-tight" style={{ color: theme === opt.value ? 'rgb(var(--es-muted))' : 'rgb(var(--es-dim))' }}>
                      {opt.subKey ? t(opt.subKey) : opt.sub}
                    </div>
                  </button>
                ))}
              </div>
              {theme === CUSTOM_THEME && (
                <input
                  type="text"
                  autoFocus
                  placeholder={t('host.createGame.customThemePlaceholder')}
                  aria-label={t('host.createGame.themeOther')}
                  value={customTheme}
                  onChange={e => setCustomTheme(e.target.value)}
                  maxLength={CUSTOM_THEME_MAX_LENGTH}
                  autoComplete="off"
                  className="mt-3 w-full bg-transparent px-3 py-3 text-sm tracking-wide focus:outline-none"
                  style={{ border: '1px solid rgb(var(--es-brand))', color: 'rgb(var(--es-ink))' }}
                />
              )}
            </div>

            <div className="p-4" style={{ border: '1px solid rgb(var(--es-panel))' }}>
              <label className="block text-xs tracking-widest mb-3" style={{ color: 'rgb(var(--es-muted))' }}>
                {t('host.createGame.answerMode')}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {MODE_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setMode(opt.value)}
                    className="p-3 text-left transition-colors cursor-pointer"
                    style={{
                      border: mode === opt.value ? '1px solid rgb(var(--es-brand))' : '1px solid rgb(var(--es-panel))',
                      background: mode === opt.value ? 'rgb(var(--es-brand) / 0.2)' : 'transparent',
                    }}
                  >
                    <div className="text-xs font-bold" style={{ color: 'rgb(var(--es-ink))' }}>
                      {t(opt.labelKey)}
                    </div>
                    <div className="text-xs mt-1 leading-tight" style={{ color: mode === opt.value ? 'rgb(var(--es-muted))' : 'rgb(var(--es-dim))' }}>
                      {t(opt.subKey)}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <p className="text-xs tracking-widest" style={{ color: 'rgb(var(--es-brand))' }}>
                !! {error}
              </p>
            )}

            <button
              onClick={handleCreateGame}
              disabled={loading}
              className="w-full text-sm tracking-widest uppercase py-4 transition-colors cursor-pointer disabled:cursor-not-allowed"
              style={{
                background: loading ? 'rgb(var(--es-brand) / 0.4)' : 'rgb(var(--es-brand))',
                color: loading ? 'rgb(var(--es-dim))' : 'rgb(var(--es-on-brand))',
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