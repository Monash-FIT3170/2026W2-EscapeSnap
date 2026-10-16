import React, { useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { useNavigate } from 'react-router';
import { useT } from '../../../../languages/LanguageProvider';
import { LanguagePicker } from '../../../../languages/LanguagePicker';
import { ThemePicker } from '../../../shared/components/theme/ThemePicker';
import { RoomBar } from '/imports/ui/shared/components/room/RoomBar';
import { useUiTheme } from '../../../shared/components/theme/UiThemeProvider';
import { errorKey } from '../../../../languages/errors';
import { DEFAULT_ANSWER_MODE } from '../../../../lib/answerModes';
import { CUSTOM_THEME, CUSTOM_THEME_MAX_LENGTH } from '../../../../lib/customTheme';

const DIFFICULTY_OPTIONS = [
  { value: 'easy', labelKey: 'difficulty.easy', subKey: 'difficulty.easySub' },
  { value: 'medium', labelKey: 'difficulty.medium', subKey: 'difficulty.mediumSub' },
  { value: 'hard', labelKey: 'difficulty.hard', subKey: 'difficulty.hardSub' },
];

const PLAY_MODE_OPTIONS = [
  { value: 'solo', labelKey: 'host.createGame.modeSolo', subKey: 'host.createGame.modeSoloSub' },
  { value: 'local', labelKey: 'host.createGame.modeLocal', subKey: 'host.createGame.modeLocalSub' },
  { value: 'online', labelKey: 'host.createGame.modeOnline', subKey: 'host.createGame.modeOnlineSub' },
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

// One row of keypad keys; the chosen one stays pressed in and lit.
function OptionKeys({ options, value, onChange, columns = 3, renderLabel }) {
  const t = useT();
  return (
    <div className={`grid gap-2 ${columns === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          aria-pressed={value === opt.value}
          onClick={() => onChange(opt.value)}
          className="es-key"
        >
          <span>{renderLabel ? renderLabel(opt) : opt.labelKey ? t(opt.labelKey) : opt.label}</span>
          <span className="es-key-sub">{opt.subKey ? t(opt.subKey) : opt.sub}</span>
        </button>
      ))}
    </div>
  );
}

// A labelled block on the rig.
function Section({ label, children }) {
  return (
    <section className="border-t border-line/70 px-5 py-5 first:border-t-0">
      <h2 className="es-label mb-3">{label}</h2>
      {children}
    </section>
  );
}

const CreateGame = () => {
  const navigate = useNavigate();
  const t = useT();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [playMode, setPlayMode] = useState('solo');
  const [groupName, setGroupName] = useState('');
  const [rivalName, setRivalName] = useState('');
  const [timer, setTimer] = useState(30);
  const [capacity, setCapacity] = useState(4);
  const [difficulty, setDifficulty] = useState('medium');
  const [theme, setTheme] = useState('classroom');
  // The new game starts in whatever skin the host is looking at now.
  const { uiTheme } = useUiTheme();
  const [customTheme, setCustomTheme] = useState('');
  const [mode, setMode] = useState(DEFAULT_ANSWER_MODE);

  const isLocal = playMode === 'local';

  const handleCreateGame = async () => {
    if (!groupName.trim() || (isLocal && !rivalName.trim())) {
      setError(t(isLocal ? 'host.createGame.errTeamNamesRequired' : 'host.createGame.errGroupNameRequired'));
      return;
    }
    if (theme === CUSTOM_THEME && !customTheme.trim()) {
      setError(t('host.createGame.errCustomThemeRequired'));
      return;
    }
    setLoading(true);
    setError(null);
    const settings = {
      timerMinutes: timer,
      capacity,
      difficulty,
      theme,
      uiTheme,
      mode,
      customTheme: theme === CUSTOM_THEME ? customTheme.trim() : undefined,
    };
    try {
      if (isLocal) {
        const matchId = await Meteor.callAsync('matches.createLocal', {
          ...settings,
          teamNames: [groupName.trim(), rivalName.trim()],
        });
        navigate(`/match/${matchId}/lobby`);
      } else {
        const gameId = await Meteor.callAsync('games.create', { ...settings, groupName: groupName.trim(), playMode });
        navigate(`/game/${gameId}/lobby`);
      }
    } catch (err) {
      setError(t(errorKey(err, { 'invalid-custom-theme': 'host.createGame.errCustomThemeRequired' })));
      setLoading(false);
    }
  };

  // Laid out like the landing page's hero: the title on the left, the
  // controls on a plate beside it (stacked on narrow screens).
  return (
    <div className="es-room flex flex-col">
      <RoomBar>
        <ThemePicker chipClassName="es-chip" />
        <LanguagePicker chipClassName="es-chip" />
      </RoomBar>

      <main className="mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 gap-10 px-5 py-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:px-10">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="es-label mb-3">{t('host.createGame.eyebrow')}</p>
          <h1 className="es-title text-6xl text-ink lg:text-7xl">{t('host.createGame.title')}</h1>
          <p className="mt-5 max-w-[42ch] text-lg leading-8 text-muted">{t('host.createGame.subtitle')}</p>
        </div>

        <div className="es-plate">
          <Section label={t('host.createGame.gameMode')}>
            <OptionKeys options={PLAY_MODE_OPTIONS} value={playMode} onChange={setPlayMode} />
            {playMode !== 'solo' && (
              <p className="mt-3 text-sm leading-6 text-muted">
                {t(isLocal ? 'host.createGame.localNote' : 'host.createGame.onlineNote')}
              </p>
            )}
          </Section>

          <Section
            label={t(isLocal ? 'host.createGame.team1Name' : playMode === 'online' ? 'host.createGame.teamName' : 'host.createGame.groupName')}
          >
            <input
              type="text"
              aria-label={t(isLocal ? 'host.createGame.team1Name' : playMode === 'online' ? 'host.createGame.teamName' : 'host.createGame.groupName')}
              placeholder={t(isLocal ? 'host.createGame.team1Placeholder' : 'host.createGame.groupNamePlaceholder')}
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
              maxLength={40}
              autoComplete="off"
              className="es-field"
            />
            {isLocal && (
              <>
                <h2 className="es-label mb-3 mt-5">{t('host.createGame.team2Name')}</h2>
                <input
                  type="text"
                  aria-label={t('host.createGame.team2Name')}
                  placeholder={t('host.createGame.team2Placeholder')}
                  value={rivalName}
                  onChange={e => setRivalName(e.target.value)}
                  maxLength={40}
                  autoComplete="off"
                  className="es-field"
                />
              </>
            )}
          </Section>

          <div className="grid grid-cols-1 border-t border-line/70 sm:grid-cols-2 [&>section]:border-t-0 sm:[&>section+section]:border-l">
            <Section label={t('host.createGame.timeLimit')}>
              <div className="flex items-center gap-4">
                <input
                  type="range" min={10} max={60} step={5} value={timer}
                  aria-label={t('host.createGame.timeLimit')}
                  className="es-range flex-1"
                  onChange={e => setTimer(Number(e.target.value))}
                />
                <span className="es-lcd es-lcd-text w-16 py-1 text-center text-2xl tabular-nums">{timer}</span>
              </div>
            </Section>

            <Section label={t(playMode === 'solo' ? 'host.createGame.lobbyCapacity' : 'host.createGame.playersPerTeam')}>
              <div className="flex items-center gap-4">
                <input
                  type="range" min={2} max={4} step={1} value={capacity}
                  aria-label={t(playMode === 'solo' ? 'host.createGame.lobbyCapacity' : 'host.createGame.playersPerTeam')}
                  onChange={e => setCapacity(Number(e.target.value))}
                  className="es-range flex-1"
                />
                <span className="es-lcd es-lcd-text w-16 py-1 text-center text-2xl tabular-nums">
                  {String(capacity).padStart(2, '0')}
                </span>
              </div>
            </Section>
          </div>

          <Section label={t('host.createGame.difficultyLevel')}>
            <OptionKeys options={DIFFICULTY_OPTIONS} value={difficulty} onChange={setDifficulty} />
          </Section>

          <Section label="RIDDLE THEME">
            <OptionKeys
              options={THEME_OPTIONS}
              value={theme}
              onChange={setTheme}
              renderLabel={opt =>
                opt.value === CUSTOM_THEME ? (
                  // Shimmers so hosts notice they can type their own theme.
                  <span className="ai-text">{t(opt.labelKey)}</span>
                ) : (
                  opt.label
                )
              }
            />
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
                className="es-field mt-3"
              />
            )}
          </Section>

          <Section label={t('host.createGame.answerMode')}>
            <OptionKeys options={MODE_OPTIONS} value={mode} onChange={setMode} columns={2} />
          </Section>

          <div className="border-t border-line/70 px-5 pb-5 pt-5">
            {error && (
              <p role="alert" className="mb-4 font-display text-base tracking-[0.03em] text-brand-bright">
                ⚠ {error}
              </p>
            )}
            <button
              type="button"
              onClick={handleCreateGame}
              disabled={loading}
              className="es-btn es-btn-primary w-full"
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