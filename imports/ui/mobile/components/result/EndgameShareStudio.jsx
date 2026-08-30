// Meteor's JSX transform still requires React in module scope.
// eslint-disable-next-line no-unused-vars
import React, { useEffect, useMemo, useState } from 'react';
import {
  buildShareText,
  DEFAULT_SHARE_SECTIONS,
  downloadShareCard,
  formatMissionTime,
  formatScore,
  renderShareCard,
  SHARE_FORMATS,
  SHARE_THEMES,
} from './shareCard';
import { useT } from '../../../../languages/LanguageProvider';

const SECTION_OPTIONS = [
  { key: 'result', labelKey: 'mobile.share.sectionResultLabel', noteKey: 'mobile.share.sectionResultNote' },
  { key: 'score', labelKey: 'mobile.share.sectionScoreLabel', noteKey: 'mobile.share.sectionScoreNote' },
  { key: 'stats', labelKey: 'mobile.share.sectionStatsLabel', noteKey: 'mobile.share.sectionStatsNote' },
  { key: 'fragments', labelKey: 'mobile.share.sectionFragmentsLabel', noteKey: 'mobile.share.sectionFragmentsNote' },
  {
    key: 'squad',
    labelKey: 'mobile.share.sectionSquadLabel',
    noteKey: 'mobile.share.sectionSquadNote',
  },
];

function Icon({ name }) {
  const paths = {
    share: (
      <>
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <path d="m8.6 10.6 6.8-4.1M8.6 13.4l6.8 4.1" />
      </>
    ),
    download: (
      <>
        <path d="M12 3v12m0 0 4-4m-4 4-4-4" />
        <path d="M4 19h16" />
      </>
    ),
    copy: (
      <>
        <rect x="8" y="8" width="11" height="11" rx="1" />
        <path d="M16 8V5H5v11h3" />
      </>
    ),
  };
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

function PreviewCard({ snapshot, sections, themeKey, formatKey }) {
  const t = useT();
  const theme = SHARE_THEMES[themeKey];
  const format = SHARE_FORMATS[formatKey];

  return (
    <div
      className="relative mx-auto flex w-full flex-col overflow-hidden border p-5 shadow-2xl"
      style={{
        aspectRatio: format.ratio,
        maxHeight: formatKey === 'story' ? 610 : 520,
        maxWidth: formatKey === 'story' ? 344 : 430,
        backgroundColor: theme.background,
        borderColor: theme.dim,
        color: theme.text,
        backgroundImage: `linear-gradient(${theme.grid} 1px, transparent 1px), linear-gradient(90deg, ${theme.grid} 1px, transparent 1px)`,
        backgroundSize: '24px 24px',
      }}
    >
      <span
        className="pointer-events-none absolute left-3 top-3 h-7 w-7 border-l-2 border-t-2"
        style={{ borderColor: theme.accent }}
      />
      <span
        className="pointer-events-none absolute bottom-3 right-3 h-7 w-7 border-b-2 border-r-2"
        style={{ borderColor: theme.accent }}
      />

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2" style={{ background: theme.accent }} />
          <span className="font-mono text-[10px] font-bold tracking-[0.18em]">
            ESCAPESNAP
          </span>
        </div>
        <span
          className="font-mono text-[8px] tracking-[0.14em]"
          style={{ color: theme.muted }}
        >
          {t('mobile.share.afterActionReport')}
        </span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col justify-center gap-3 py-4">
        {sections.result && (
          <div>
            <p
              className="font-mono text-[9px] font-bold tracking-[0.2em]"
              style={{ color: theme.accent }}
            >
              {snapshot.outcome === 'won'
                ? t('mobile.share.missionComplete')
                : t('mobile.share.missionEnded')}
            </p>
            <p className="mt-1 font-display text-4xl font-black leading-none tracking-tight">
              {snapshot.outcome === 'won' ? t('mobile.share.escaped') : t('mobile.share.noEscape')}
            </p>
            <p
              className="mt-2 font-mono text-[10px] font-bold tracking-[0.2em]"
              style={{ color: theme.muted }}
            >
              {snapshot.operativeName.toUpperCase()}
            </p>
          </div>
        )}

        {sections.score && (
          <div
            className="border p-3"
            style={{ background: theme.inner, borderColor: theme.accent }}
          >
            <div className="flex items-end justify-between gap-3">
              <div>
                <p
                  className="font-mono text-[8px] tracking-[0.16em]"
                  style={{ color: theme.muted }}
                >
                  {t('mobile.share.missionScoreLabel')}
                </p>
                <p className="mt-1 font-display text-4xl font-black leading-none">
                  {formatScore(snapshot.score)}
                </p>
              </div>
              <p
                className="pb-1 text-right font-mono text-[7px] tracking-[0.12em]"
                style={{ color: theme.dim }}
              >
                {snapshot.difficulty}
                <br />
                {snapshot.missionRef}
              </p>
            </div>
          </div>
        )}

        {sections.stats && (
          <div className="grid grid-cols-3 gap-1.5">
            {[
              [t('mobile.share.statObjectives'), `${snapshot.correct}/${snapshot.totalRounds}`],
              [t('mobile.share.statAccuracy'), `${snapshot.accuracy}%`],
              [t('mobile.share.statTime'), formatMissionTime(snapshot.timeUsedSeconds)],
            ].map(([label, value]) => (
              <div
                key={label}
                className="border-l-2 p-2"
                style={{ background: theme.panel, borderColor: theme.accent }}
              >
                <p
                  className="font-mono text-[6px] tracking-[0.12em]"
                  style={{ color: theme.muted }}
                >
                  {label}
                </p>
                <p className="mt-1 font-mono text-sm font-black">{value}</p>
              </div>
            ))}
          </div>
        )}

        {sections.fragments && (
          <div className="p-2.5" style={{ background: theme.panel }}>
            <p
              className="font-mono text-[7px] tracking-[0.14em]"
              style={{ color: theme.muted }}
            >
              {t('mobile.share.keyFragmentsRecovered')}
            </p>
            <div className="mt-2 flex gap-1.5">
              {snapshot.recoveredLetters.map((letter, index) => (
                <span
                  key={`${letter}-${index}`}
                  className="flex h-8 min-w-0 flex-1 items-center justify-center border-b-2 font-mono text-sm font-black"
                  style={{
                    background: theme.inner,
                    borderColor: letter === '?' ? theme.dim : theme.accent,
                    color: letter === '?' ? theme.dim : theme.text,
                  }}
                >
                  {letter}
                </span>
              ))}
            </div>
          </div>
        )}

        {sections.squad && (
          <div className="p-2.5" style={{ background: theme.panel }}>
            <p
              className="font-mono text-[7px] tracking-[0.14em]"
              style={{ color: theme.muted }}
            >
              {t('mobile.share.squadStanding', { rank: snapshot.squadRank, size: snapshot.squadSize })}
            </p>
            <div className="mt-2 flex flex-col gap-1">
              {snapshot.squadBoard.slice(0, 3).map((entry) => (
                <div
                  key={`${entry.rank}-${entry.name}`}
                  className="flex items-center gap-2 font-mono text-[8px]"
                >
                  <span
                    style={{
                      color: entry.isCurrent ? theme.accent : theme.dim,
                    }}
                  >
                    #{entry.rank}
                  </span>
                  <span className="flex-1 truncate font-bold">
                    {entry.name.toUpperCase()}
                  </span>
                  <span>{formatScore(entry.score)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div
        className="flex items-center justify-between border-t pt-2 font-mono text-[7px] tracking-[0.12em]"
        style={{ borderColor: theme.accent, color: theme.muted }}
      >
        <span>{t('mobile.share.tagline')}</span>
        <span style={{ color: theme.text }}>#ESCAPESNAP</span>
      </div>
    </div>
  );
}

async function copyWithFallback(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  textarea.remove();
}

export function EndgameShareStudio({ snapshot, loading = false }) {
  const t = useT();
  const [sections, setSections] = useState(DEFAULT_SHARE_SECTIONS);
  const [themeKey, setThemeKey] = useState('dossier');
  const [formatKey, setFormatKey] = useState('portrait');
  const [status, setStatus] = useState('');
  const [working, setWorking] = useState(false);

  const selectedCount = useMemo(
    () => Object.values(sections).filter(Boolean).length,
    [sections]
  );
  const shareText = useMemo(
    () => (snapshot ? buildShareText(snapshot, sections) : ''),
    [snapshot, sections]
  );

  useEffect(() => {
    if (!status) return undefined;
    const timeout = setTimeout(() => setStatus(''), 4500);
    return () => clearTimeout(timeout);
  }, [status]);

  if (!snapshot) {
    return (
      <div className="flex items-center justify-center bg-[#0e0e0e] px-8 py-16 text-center font-mono text-xs uppercase tracking-[0.2em] text-[#aa8984]">
        {t('mobile.share.preparingDebrief')}
      </div>
    );
  }

  const toggleSection = (key) => {
    setSections((current) => {
      if (current[key] && selectedCount === 1) {
        setStatus(t('mobile.share.keepAtLeastOne'));
        return current;
      }
      return { ...current, [key]: !current[key] };
    });
  };

  const makeCard = () =>
    renderShareCard({ snapshot, sections, themeKey, formatKey });

  const handleShare = async () => {
    setWorking(true);
    setStatus('');
    try {
      const { blob } = await makeCard();
      const file = new File(
        [blob],
        `escapesnap-${snapshot.missionRef.toLowerCase()}.png`,
        { type: 'image/png' }
      );
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: t('mobile.share.shareTitle'),
          text: shareText,
          files: [file],
        });
        setStatus(t('mobile.share.statusSent'));
      } else if (navigator.share) {
        await navigator.share({
          title: t('mobile.share.shareTitle'),
          text: shareText,
        });
        setStatus(t('mobile.share.statusStatsShared'));
      } else {
        downloadShareCard(blob, snapshot, formatKey);
        await copyWithFallback(shareText);
        setStatus(t('mobile.share.statusSavedCopied'));
      }
    } catch (error) {
      if (error?.name !== 'AbortError') {
        setStatus(t('mobile.share.statusShareBlocked'));
      }
    } finally {
      setWorking(false);
    }
  };

  const handleDownload = async () => {
    setWorking(true);
    try {
      const { blob } = await makeCard();
      downloadShareCard(blob, snapshot, formatKey);
      setStatus(t('mobile.share.statusCardSaved', { format: SHARE_FORMATS[formatKey].label }));
    } catch {
      setStatus(t('mobile.share.statusCreateImageFailed'));
    } finally {
      setWorking(false);
    }
  };

  const handleCopy = async () => {
    try {
      await copyWithFallback(shareText);
      setStatus(t('mobile.share.statusCaptionCopied'));
    } catch {
      setStatus(t('mobile.share.statusClipboardBlocked'));
    }
  };

  const outcomeLabel =
    snapshot.outcome === 'won' ? t('mobile.share.missionComplete') : t('mobile.share.missionEnded');

  return (
    <div
      className="bg-[#0e0e0e] text-[#e5e2e1]"
      style={{
        backgroundImage:
          'linear-gradient(rgba(239,68,68,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(239,68,68,0.035) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
      }}
    >
      <header className="sticky top-0 z-20 border-b border-[#353534] bg-[#0e0e0e]/95 px-5 py-3 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 animate-pulse bg-[#8b0000]" />
            <span className="font-mono text-xs font-black tracking-[0.18em]">
              ESCAPESNAP
            </span>
          </div>
          <span className="font-mono text-[9px] tracking-[0.2em] text-[#aa8984]">
            {t('mobile.share.shareLabOnline')}
          </span>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-5xl gap-8 px-5 py-8 lg:grid-cols-[minmax(0,1fr)_minmax(330px,0.82fr)] lg:items-start">
        <section className="min-w-0">
          <div className="border-l-4 border-[#8b0000] pl-4">
            <p className="font-mono text-[10px] font-bold tracking-[0.24em] text-[#aa8984]">
              {outcomeLabel}
            </p>
            <h1 className="mt-1 font-display text-4xl font-black uppercase leading-none text-[#e5e2e1] sm:text-5xl">
              {t('mobile.share.headlineLine1')}
              <br />
              <span className="text-[#8b0000]">{t('mobile.share.headlineLine2')}</span>
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#aa8984]">
              {t('mobile.share.subheadline')}
            </p>
          </div>

          <div className="mt-7 border border-[#353534] bg-[#1c1b1b] p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="font-mono text-[10px] font-bold tracking-[0.2em] text-[#e5e2e1]">
                {t('mobile.share.step1Title')}
              </p>
              <span className="font-mono text-[9px] text-[#555]">
                {t('mobile.share.activeCount', { n: selectedCount })}
              </span>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {SECTION_OPTIONS.map((option) => {
                const active = sections[option.key];
                return (
                  <button
                    key={option.key}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggleSection(option.key)}
                    className="flex items-center gap-3 border p-3 text-left transition"
                    style={{
                      borderColor: active ? '#b91c1c' : '#1e293b',
                      background: active
                        ? 'rgba(127, 29, 29, 0.18)'
                        : 'rgba(2, 6, 23, 0.6)',
                    }}
                  >
                    <span
                      className="flex h-5 w-5 flex-shrink-0 items-center justify-center border font-mono text-[10px] font-black"
                      style={{
                        borderColor: active ? '#ef4444' : '#475569',
                        background: active ? '#b91c1c' : 'transparent',
                        color: active ? '#fff' : '#64748b',
                      }}
                    >
                      {active ? '✓' : '+'}
                    </span>
                    <span className="min-w-0">
                      <span className="block font-mono text-[11px] font-bold uppercase tracking-wider text-[#e5e2e1]">
                        {t(option.labelKey)}
                      </span>
                      <span className="mt-0.5 block text-[10px] text-[#aa8984]">
                        {t(option.noteKey)}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="mt-3 flex items-start gap-2 border-t border-[#353534] pt-3">
              <span className="font-mono text-[10px] text-emerald-400">●</span>
              <p className="font-mono text-[9px] leading-4 text-[#aa8984]">
                {t('mobile.share.privacyShield')}
              </p>
            </div>
          </div>

          <div className="mt-4 border border-[#353534] bg-[#1c1b1b] p-4">
            <p className="font-mono text-[10px] font-bold tracking-[0.2em] text-[#e5e2e1]">
              {t('mobile.share.step2Title')}
            </p>
            <div className="mt-4">
              <p className="mb-2 font-mono text-[9px] tracking-widest text-[#555]">
                {t('mobile.share.cardStyleLabel')}
              </p>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(SHARE_THEMES).map(([key, theme]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setThemeKey(key)}
                    className="border px-2 py-3 font-mono text-[9px] font-bold tracking-wider transition"
                    style={{
                      borderColor: themeKey === key ? theme.accent : '#1e293b',
                      background: themeKey === key ? theme.panel : '#020617',
                      color: themeKey === key ? theme.text : '#64748b',
                    }}
                  >
                    <span
                      className="mx-auto mb-2 block h-1 w-8"
                      style={{ background: theme.accent }}
                    />
                    {theme.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-4">
              <p className="mb-2 font-mono text-[9px] tracking-widest text-[#555]">
                {t('mobile.share.outputFormatLabel')}
              </p>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(SHARE_FORMATS).map(([key, format]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFormatKey(key)}
                    className="border px-2 py-3 font-mono text-[9px] font-bold tracking-wider transition"
                    style={{
                      borderColor: formatKey === key ? '#b91c1c' : '#1e293b',
                      background:
                        formatKey === key
                          ? 'rgba(127, 29, 29, 0.18)'
                          : '#020617',
                      color: formatKey === key ? '#fff' : '#64748b',
                    }}
                  >
                    {format.label}
                    <span className="mt-1 block text-[8px] font-normal text-[#555]">
                      {format.ratio.replaceAll(' ', '')}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 border border-[#353534] bg-[#1c1b1b] p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="font-mono text-[10px] font-bold tracking-[0.2em] text-[#e5e2e1]">
                {t('mobile.share.step3Title')}
              </p>
              <span className="font-display text-2xl font-black text-[#e5e2e1]">
                {formatScore(snapshot.score)}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-x-5 gap-y-2 font-mono text-[9px]">
              {[
                [t('mobile.share.statObjectives'), snapshot.scoreBreakdown.objectivePoints],
                [t('mobile.share.scoreEvidenceBonus'), snapshot.scoreBreakdown.evidenceBonus],
                [t('mobile.share.scoreEscapeBonus'), snapshot.scoreBreakdown.escapeBonus],
                [t('mobile.share.scoreTimeBonus'), snapshot.scoreBreakdown.timeBonus],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center justify-between gap-2 border-b border-[#353534] pb-2"
                >
                  <span className="text-[#555]">{label}</span>
                  <span className="text-[#e5e2e1]">+{formatScore(value)}</span>
                </div>
              ))}
              <div className="flex items-center justify-between gap-2 border-b border-[#353534] pb-2">
                <span className="text-[#555]">{t('mobile.share.penalties')}</span>
                <span className="text-[#ef4444]">
                  −{formatScore(snapshot.scoreBreakdown.penalties)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 border-b border-[#353534] pb-2">
                <span className="text-[#555]">{t('mobile.share.difficultyLabel')}</span>
                <span className="text-[#e5e2e1]">
                  ×{snapshot.scoreBreakdown.multiplier.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </section>

        <aside className="min-w-0 lg:sticky lg:top-20">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="font-mono text-[10px] font-bold tracking-[0.2em] text-[#e5e2e1]">
              {t('mobile.share.liveCardPreview')}
            </p>
            <span className="font-mono text-[9px] text-[#555]">
              {loading ? t('mobile.share.syncing') : t('mobile.share.verifiedData')}
            </span>
          </div>
          <PreviewCard
            snapshot={snapshot}
            sections={sections}
            themeKey={themeKey}
            formatKey={formatKey}
          />

          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleShare}
              disabled={working || loading}
              className="col-span-2 flex items-center justify-center gap-2 border border-[#8b0000] bg-[#8b0000] px-5 py-4 font-mono text-xs font-black uppercase tracking-[0.18em] text-[#e5e2e1] transition active:bg-[#a50000] disabled:cursor-wait disabled:opacity-50"
            >
              <Icon name="share" />
              {working ? t('mobile.share.rendering') : t('mobile.share.shareCardButton')}
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={working || loading}
              className="flex items-center justify-center gap-2 border border-[#353534] bg-[#1c1b1b] px-3 py-3 font-mono text-[10px] font-bold uppercase tracking-wider text-[#e5e2e1] transition active:border-[#aa8984] disabled:opacity-50"
            >
              <Icon name="download" />
              {t('mobile.share.saveImage')}
            </button>
            <button
              type="button"
              onClick={handleCopy}
              disabled={loading}
              className="flex items-center justify-center gap-2 border border-[#353534] bg-[#1c1b1b] px-3 py-3 font-mono text-[10px] font-bold uppercase tracking-wider text-[#e5e2e1] transition active:border-[#aa8984] disabled:opacity-50"
            >
              <Icon name="copy" />
              {t('mobile.share.copyStats')}
            </button>
          </div>

          <div className="mt-3 min-h-10 border-l-2 border-red-800 bg-red-950/15 px-3 py-2">
            <p
              role="status"
              aria-live="polite"
              className="font-mono text-[9px] leading-4 text-[#aa8984]"
            >
              {status ||
                t('mobile.share.statusPlaceholder')}
            </p>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3 border border-dashed border-[#353534] px-3 py-2">
            <div>
              <p className="font-mono text-[8px] font-bold tracking-widest text-[#aa8984]">
                {t('mobile.share.globalLeaderboardPort')}
              </p>
              <p className="mt-1 text-[9px] text-[#555]">
                {snapshot.globalLeaderboard.available
                  ? t('mobile.share.rankDataConnected')
                  : t('mobile.share.rankingsGoLive')}
              </p>
            </div>
            <span className="font-mono text-[9px] text-[#555]">
              {snapshot.globalLeaderboard.available ? t('mobile.share.online') : t('mobile.share.standby')}
            </span>
          </div>
        </aside>
      </main>
    </div>
  );
}
