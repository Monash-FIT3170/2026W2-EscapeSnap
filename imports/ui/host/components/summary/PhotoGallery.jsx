import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useT } from '../../../../languages/LanguageProvider';

// The model's three outcomes collapse to two for the operator: only 'pass'
// earned a letter.
function isPass(photo) {
  return photo.outcome === 'pass';
}

function formatTimestamp(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    day: '2-digit',
    month: 'short',
  }).toUpperCase();
}

const SectionHeader = ({ label }) => (
  <h2 className="es-title mb-4 text-2xl text-ink">{label}</h2>
);

const FilterButton = ({ active, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={`es-chip !min-h-[38px] ${active ? '!border-brand-bright text-brand-bright' : 'text-muted'}`}
  >
    {children}
  </button>
);

const EmptyPanel = ({ title, detail }) => (
  <div className="rounded-sm border-2 border-dashed border-line/70 px-6 py-12 text-center">
    <p className="font-display text-lg tracking-[0.03em] text-muted">{title}</p>
    {detail && <p className="mx-auto mt-3 max-w-[56ch] text-sm leading-6 text-dim">{detail}</p>}
  </div>
);

// Each capture is pinned up as a polaroid, the way the landing page's
// evidence board shows its photos: who took it written on the border, and
// whether it counted stamped on top.
const PhotoTile = ({ photo, onOpen, index }) => {
  const t = useT();
  const pass = isPass(photo);

  return (
    <button
      type="button"
      onClick={() => onOpen(photo)}
      aria-label={`Round ${photo.roundNumber}, ${photo.playerName}, ${pass ? 'correct' : 'incorrect'} — open larger view`}
      className="es-pola relative block w-full text-left transition-transform hover:!rotate-0"
      style={{ '--rot': `${[-1.6, 1.2, -0.6, 1.8][index % 4]}deg` }}
    >
      <div className="es-pola-photo">
        <img
          src={photo.photoUrl}
          alt=""
          className="block w-full object-cover"
          style={{ aspectRatio: '4 / 3' }}
        />
        <span
          className={`es-stamp absolute right-2 top-2 !border-2 bg-black/30 !px-2 !py-0.5 !text-xs ${pass ? 'text-correct' : 'text-incorrect'}`}
        >
          {pass ? t('host.summary.correctLabel') : t('host.summary.incorrectLabel')}
        </span>
      </div>

      <div className="flex items-baseline justify-between gap-2 px-1 pt-3">
        <span className="es-pola-note truncate text-sm">{String(photo.playerName).toUpperCase()}</span>
        <span className="whitespace-nowrap font-display text-sm text-[#3b322b]">
          {t('host.summary.round', { n: photo.roundNumber })}
          {photo.attemptNumber > 1 && `, ${t('host.summary.retry', { n: photo.attemptNumber })}`}
        </span>
      </div>
    </button>
  );
};

const PhotoLightbox = ({ photo, onClose }) => {
  const t = useT();
  const dialogRef = useRef(null);
  const closeRef = useRef(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    closeRef.current?.focus();

    function onKeyDown(event) {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;

      // Keep focus inside the dialog while it is open.
      const focusable = dialogRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, [onClose]);

  const pass = isPass(photo);
  const detections = [...(photo.detections ?? [])].sort((a, b) => b.confidence - a.confidence);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Photo detail — round ${photo.roundNumber}, ${photo.playerName}`}
      ref={dialogRef}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-8"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="es-plate flex max-h-full w-full max-w-[1100px] overflow-hidden"
      >
        <div className="flex min-w-0 flex-[1_1_60%] items-center bg-black">
          <img
            src={photo.photoUrl}
            alt={`Submission for round ${photo.roundNumber} by ${photo.playerName}`}
            className="max-h-[80vh] w-full object-contain"
          />
        </div>

        <div className="max-h-[80vh] flex-[0_0_320px] overflow-y-auto p-6">
          <div className="mb-5 flex items-start justify-between">
            <div>
              <p className="es-label">{t('host.summary.round', { n: photo.roundNumber })}</p>
              <p className="es-title mt-1 text-3xl text-ink">{String(photo.playerName).toUpperCase()}</p>
            </div>
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label={t('host.summary.closePhotoDetail')}
              className="es-chip"
            >
              ✕
            </button>
          </div>

          <div className="mb-5">
            <span className={`es-stamp ${pass ? 'text-correct' : 'text-incorrect'}`}>
              {pass ? t('host.summary.correctLabel') : t('host.summary.incorrectLabel')}
            </span>
            {photo.attemptNumber > 1 && (
              <p className="mt-2 text-sm text-dim">{t('host.summary.attempt', { n: photo.attemptNumber })}</p>
            )}
          </div>

          <p className="es-label">{t('host.summary.targetObject')}</p>
          <p className="mb-5 mt-1 font-display text-xl font-semibold tracking-[0.03em] text-ink">
            {String(photo.targetObject ?? '—').toUpperCase()}
          </p>

          <p className="es-label mb-2">{t('host.summary.detections')}</p>
          {detections.length === 0 ? (
            <p className="mb-5 text-sm text-dim">{t('host.summary.nothingDetected')}</p>
          ) : (
            <ul className="mb-5">
              {detections.map((d, i) => {
                const hit = d.label === photo.targetObject;
                return (
                  <li
                    key={`${d.label}-${i}`}
                    className="flex items-center justify-between border-b border-line/60 py-2 text-sm"
                  >
                    <span className={hit ? 'text-correct' : 'text-ink'}>{String(d.label).toUpperCase()}</span>
                    <span className="tabular-nums text-muted">{Math.round(d.confidence * 100)}%</span>
                  </li>
                );
              })}
            </ul>
          )}

          <p className="es-label">{t('host.summary.captured')}</p>
          <p className="mt-1 text-sm text-ink">{formatTimestamp(photo.createdAt)}</p>
        </div>
      </div>
    </div>
  );
};

const PhotoGallery = ({ photos = [], players = [], photosExpired = false }) => {
  const t = useT();
  const [outcomeFilter, setOutcomeFilter] = useState('all');
  const [playerFilter, setPlayerFilter] = useState('all');
  const [selected, setSelected] = useState(null);

  const visible = useMemo(
    () =>
      photos.filter((photo) => {
        if (outcomeFilter === 'correct' && !isPass(photo)) return false;
        if (outcomeFilter === 'incorrect' && isPass(photo)) return false;
        if (playerFilter !== 'all' && photo.playerId !== playerFilter) return false;
        return true;
      }),
    [photos, outcomeFilter, playerFilter]
  );

  const filtered = outcomeFilter !== 'all' || playerFilter !== 'all';

  return (
    <section className="es-well px-6 pb-8 pt-5">
      <SectionHeader label={t('host.summary.photoArchive')} />

      {photos.length === 0 ? (
        photosExpired ? (
          // The expected state after 6 hours, not a failure — stats above still stand.
          <EmptyPanel
            title={t('host.summary.photoArchivePurged')}
            detail={t('host.summary.photoArchivePurgedDetail')}
          />
        ) : (
          <EmptyPanel
            title={t('host.summary.noPhotosOnRecord')}
            detail={t('host.summary.noCapturesSubmitted')}
          />
        )
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="es-label mr-1">{t('host.summary.outcome')}</span>
            <FilterButton active={outcomeFilter === 'all'} onClick={() => setOutcomeFilter('all')}>
              {t('host.summary.all')}
            </FilterButton>
            <FilterButton active={outcomeFilter === 'correct'} onClick={() => setOutcomeFilter('correct')}>
              {t('host.summary.correctLabel')}
            </FilterButton>
            <FilterButton active={outcomeFilter === 'incorrect'} onClick={() => setOutcomeFilter('incorrect')}>
              {t('host.summary.incorrectLabel')}
            </FilterButton>

            <span className="es-label ml-4 mr-1">{t('host.summary.operative')}</span>
            <FilterButton active={playerFilter === 'all'} onClick={() => setPlayerFilter('all')}>
              {t('host.summary.all')}
            </FilterButton>
            {players.map((p) => (
              <FilterButton
                key={p.playerId}
                active={playerFilter === p.playerId}
                onClick={() => setPlayerFilter(p.playerId)}
              >
                {p.name.toUpperCase()}
              </FilterButton>
            ))}
          </div>

          <p className="mb-6 text-sm text-dim">
            {t('host.summary.showingXOfY', { shown: visible.length, total: photos.length })}
          </p>

          {visible.length === 0 ? (
            <EmptyPanel title={t('host.summary.noPhotosMatchFilter')} />
          ) : (
            <div className="grid gap-x-6 gap-y-8" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))' }}>
              {visible.map((photo, i) => (
                <PhotoTile key={photo._id} photo={photo} onOpen={setSelected} index={i} />
              ))}
            </div>
          )}
        </>
      )}

      {filtered && photos.length > 0 && (
        <button
          onClick={() => {
            setOutcomeFilter('all');
            setPlayerFilter('all');
          }}
          type="button"
          className="es-link mt-6 text-muted"
        >
          {t('host.summary.clearFilters')}
        </button>
      )}

      {selected && <PhotoLightbox photo={selected} onClose={() => setSelected(null)} />}
    </section>
  );
};

export default PhotoGallery;
