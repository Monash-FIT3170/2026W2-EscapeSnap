import { useState, useEffect, useRef, useMemo } from 'react';
import { useT } from '../../../../languages/LanguageProvider';

const PANEL = '#1c1b1b';
const INNER = '#0e0e0e';
const BORDER = '#353534';
const ACCENT = '#8b0000';
const TEXT = '#e5e2e1';
const MUTED = '#aa8984';
const DIM = '#555';
const CORRECT = '#4ade80';
const INCORRECT = '#ef4444';

const FOCUS_RING = `2px solid ${MUTED}`;

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
  <div className="flex items-center gap-3 mb-4">
    <div style={{ width: 4, height: 16, background: ACCENT }} />
    <span style={{ fontWeight: 700, fontSize: 12, letterSpacing: '1.2px', color: TEXT }}>{label}</span>
  </div>
);

const FilterButton = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    style={{
      background: active ? ACCENT : 'transparent',
      color: active ? TEXT : MUTED,
      border: `1px solid ${active ? ACCENT : BORDER}`,
      padding: '8px 16px',
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: '1px',
      cursor: 'pointer',
      whiteSpace: 'nowrap',
    }}
    onFocus={(e) => (e.currentTarget.style.outline = FOCUS_RING)}
    onBlur={(e) => (e.currentTarget.style.outline = 'none')}
  >
    {children}
  </button>
);

const EmptyPanel = ({ title, detail }) => (
  <div style={{ background: INNER, border: `1px dashed ${BORDER}`, padding: '48px 24px', textAlign: 'center' }}>
    <p style={{ fontSize: 11, letterSpacing: '1px', color: MUTED }}>{title}</p>
    {detail && (
      <p style={{ fontSize: 10, letterSpacing: '0.5px', color: DIM, marginTop: 10, lineHeight: 1.8 }}>
        {detail}
      </p>
    )}
  </div>
);

const PhotoTile = ({ photo, onOpen }) => {
  const t = useT();
  const pass = isPass(photo);
  const status = pass ? CORRECT : INCORRECT;

  return (
    <button
      onClick={() => onOpen(photo)}
      aria-label={`Round ${photo.roundNumber}, ${photo.playerName}, ${pass ? 'correct' : 'incorrect'} — open larger view`}
      style={{
        position: 'relative',
        padding: 0,
        border: `1px solid ${BORDER}`,
        borderBottom: `3px solid ${status}`,
        background: INNER,
        cursor: 'pointer',
        display: 'block',
        width: '100%',
        textAlign: 'left',
      }}
      onFocus={(e) => (e.currentTarget.style.outline = FOCUS_RING)}
      onBlur={(e) => (e.currentTarget.style.outline = 'none')}
    >
      <img
        src={photo.photoUrl}
        alt=""
        style={{ display: 'block', width: '100%', aspectRatio: '4 / 3', objectFit: 'cover' }}
      />

      <span style={{
        position: 'absolute', top: 8, left: 8,
        background: 'rgba(14,14,14,0.85)', color: TEXT,
        fontSize: 9, fontWeight: 700, letterSpacing: '1px', padding: '4px 8px',
      }}>
        {t('host.summary.round', { n: photo.roundNumber })}
      </span>

      {photo.attemptNumber > 1 && (
        <span style={{
          position: 'absolute', top: 8, right: 8,
          background: 'rgba(139,0,0,0.9)', color: TEXT,
          fontSize: 9, fontWeight: 700, letterSpacing: '1px', padding: '4px 8px',
        }}>
          {t('host.summary.retry', { n: photo.attemptNumber })}
        </span>
      )}

      <div className="flex items-center justify-between" style={{ padding: '10px 12px' }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1px', color: TEXT }}>
          {String(photo.playerName).toUpperCase()}
        </span>
        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '1px', color: status }}>
          {pass ? t('host.summary.correctLabel') : t('host.summary.incorrectLabel')}
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
  const status = pass ? CORRECT : INCORRECT;
  const detections = [...(photo.detections ?? [])].sort((a, b) => b.confidence - a.confidence);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Photo detail — round ${photo.roundNumber}, ${photo.playerName}`}
      ref={dialogRef}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 32,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: PANEL, border: `1px solid ${BORDER}`,
          display: 'flex', gap: 0,
          maxWidth: 1100, width: '100%', maxHeight: '100%',
        }}
      >
        <div style={{ background: '#000', flex: '1 1 60%', display: 'flex', alignItems: 'center', minWidth: 0 }}>
          <img
            src={photo.photoUrl}
            alt={`Submission for round ${photo.roundNumber} by ${photo.playerName}`}
            style={{ width: '100%', maxHeight: '80vh', objectFit: 'contain' }}
          />
        </div>

        <div style={{ flex: '0 0 320px', padding: 24, overflowY: 'auto', maxHeight: '80vh' }}>
          <div className="flex items-start justify-between" style={{ marginBottom: 20 }}>
            <div>
              <p style={{ fontSize: 10, letterSpacing: '1px', color: MUTED }}>{t('host.summary.round', { n: photo.roundNumber })}</p>
              <p style={{ fontSize: 20, fontWeight: 700, letterSpacing: '1.5px', color: TEXT, marginTop: 4 }}>
                {String(photo.playerName).toUpperCase()}
              </p>
            </div>
            <button
              ref={closeRef}
              onClick={onClose}
              aria-label={t('host.summary.closePhotoDetail')}
              style={{
                background: 'transparent', border: `1px solid ${BORDER}`, color: MUTED,
                fontSize: 14, lineHeight: 1, padding: '8px 12px', cursor: 'pointer',
              }}
              onFocus={(e) => (e.currentTarget.style.outline = FOCUS_RING)}
              onBlur={(e) => (e.currentTarget.style.outline = 'none')}
            >
              ✕
            </button>
          </div>

          <div style={{ borderLeft: `4px solid ${status}`, background: INNER, padding: '12px 16px', marginBottom: 20 }}>
            <p style={{ fontSize: 14, fontWeight: 700, letterSpacing: '1.5px', color: status }}>
              {pass ? t('host.summary.correctLabel') : t('host.summary.incorrectLabel')}
            </p>
            {photo.attemptNumber > 1 && (
              <p style={{ fontSize: 10, letterSpacing: '0.5px', color: DIM, marginTop: 4 }}>
                {t('host.summary.attempt', { n: photo.attemptNumber })}
              </p>
            )}
          </div>

          <p style={{ fontSize: 10, letterSpacing: '1px', color: MUTED }}>{t('host.summary.targetObject')}</p>
          <p style={{ fontSize: 16, fontWeight: 700, letterSpacing: '1px', color: TEXT, marginTop: 4, marginBottom: 20 }}>
            {String(photo.targetObject ?? '—').toUpperCase()}
          </p>

          <p style={{ fontSize: 10, letterSpacing: '1px', color: MUTED, marginBottom: 8 }}>{t('host.summary.detections')}</p>
          {detections.length === 0 ? (
            <p style={{ fontSize: 11, color: DIM, marginBottom: 20 }}>{t('host.summary.nothingDetected')}</p>
          ) : (
            <div style={{ marginBottom: 20 }}>
              {detections.map((d, i) => {
                const hit = d.label === photo.targetObject;
                return (
                  <div
                    key={`${d.label}-${i}`}
                    className="flex items-center justify-between"
                    style={{ padding: '8px 0', borderBottom: `1px solid ${BORDER}` }}
                  >
                    <span style={{ fontSize: 12, letterSpacing: '0.5px', color: hit ? CORRECT : TEXT }}>
                      {String(d.label).toUpperCase()}
                    </span>
                    <span style={{ fontSize: 12, color: MUTED }}>
                      {Math.round(d.confidence * 100)}%
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          <p style={{ fontSize: 10, letterSpacing: '1px', color: MUTED }}>{t('host.summary.captured')}</p>
          <p style={{ fontSize: 12, letterSpacing: '0.5px', color: TEXT, marginTop: 4 }}>
            {formatTimestamp(photo.createdAt)}
          </p>
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
    <div style={{ background: PANEL, padding: 24 }}>
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
          <div className="flex flex-wrap items-center gap-2" style={{ marginBottom: 16 }}>
            <span style={{ fontSize: 10, letterSpacing: '1px', color: DIM, marginRight: 4 }}>{t('host.summary.outcome')}</span>
            <FilterButton active={outcomeFilter === 'all'} onClick={() => setOutcomeFilter('all')}>
              {t('host.summary.all')}
            </FilterButton>
            <FilterButton active={outcomeFilter === 'correct'} onClick={() => setOutcomeFilter('correct')}>
              {t('host.summary.correctLabel')}
            </FilterButton>
            <FilterButton active={outcomeFilter === 'incorrect'} onClick={() => setOutcomeFilter('incorrect')}>
              {t('host.summary.incorrectLabel')}
            </FilterButton>

            <span style={{ fontSize: 10, letterSpacing: '1px', color: DIM, margin: '0 4px 0 16px' }}>{t('host.summary.operative')}</span>
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

          <p style={{ fontSize: 10, letterSpacing: '1px', color: DIM, marginBottom: 12 }}>
            {t('host.summary.showingXOfY', { shown: visible.length, total: photos.length })}
          </p>

          {visible.length === 0 ? (
            <EmptyPanel title={t('host.summary.noPhotosMatchFilter')} />
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 12,
            }}>
              {visible.map((photo) => (
                <PhotoTile key={photo._id} photo={photo} onOpen={setSelected} />
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
          style={{
            marginTop: 16, background: 'transparent', border: `1px solid ${BORDER}`,
            color: MUTED, fontSize: 10, fontWeight: 700, letterSpacing: '1px',
            padding: '8px 16px', cursor: 'pointer',
          }}
          onFocus={(e) => (e.currentTarget.style.outline = FOCUS_RING)}
          onBlur={(e) => (e.currentTarget.style.outline = 'none')}
        >
          {t('host.summary.clearFilters')}
        </button>
      )}

      {selected && <PhotoLightbox photo={selected} onClose={() => setSelected(null)} />}
    </div>
  );
};

export default PhotoGallery;
