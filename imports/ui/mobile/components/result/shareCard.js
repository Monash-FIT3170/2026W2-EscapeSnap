import { createTranslation } from '../../../../languages/translate.js';

export const SHARE_FORMATS = {
  portrait: {
    labelKey: 'extra.portrait',
    ratio: '4 / 5',
    width: 1080,
    height: 1350,
  },
  story: {
    labelKey: 'extra.story',
    ratio: '9 / 16',
    width: 1080,
    height: 1920,
  },
  square: {
    labelKey: 'extra.square',
    ratio: '1 / 1',
    width: 1080,
    height: 1080,
  },
};

export const SHARE_THEMES = {
  dossier: {
    labelKey: 'extra.dossier',
    background: '#0e0e0e',
    panel: '#181717',
    inner: '#080808',
    accent: '#b50f19',
    text: '#f1eeed',
    muted: '#b69893',
    dim: '#5f5452',
    grid: 'rgba(181, 15, 25, 0.09)',
  },
  signal: {
    labelKey: 'extra.signal',
    background: '#160305',
    panel: '#27070b',
    inner: '#0b0102',
    accent: '#ff3344',
    text: '#fff3f3',
    muted: '#e49ba1',
    dim: '#8f4e55',
    grid: 'rgba(255, 51, 68, 0.15)',
  },
  stealth: {
    labelKey: 'extra.stealth',
    background: '#070a0d',
    panel: '#11161b',
    inner: '#040608',
    accent: '#d7dde3',
    text: '#f5f7f9',
    muted: '#98a3ad',
    dim: '#4c565f',
    grid: 'rgba(152, 163, 173, 0.08)',
  },
};

export const DEFAULT_SHARE_SECTIONS = {
  result: true,
  score: true,
  stats: true,
  fragments: true,
  squad: false,
};

export function formatScore(value, locale = 'en') {
  return new Intl.NumberFormat(locale).format(value ?? 0);
}

export function formatMissionTime(seconds) {
  if (seconds === null || seconds === undefined) return '--:--';
  const safeSeconds = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(
    2,
    '0'
  )}`;
}

export function buildShareText(
  snapshot,
  sections,
  t = createTranslation('en'),
  locale = 'en'
) {
  const lines = [`ESCAPESNAP // ${t('mobile.share.afterActionReport')}`];
  if (sections.result)
    lines.push(
      t(snapshot.outcome === 'won' ? 'extra.shareWon' : 'extra.shareLost', {
        name: snapshot.operativeName,
      })
    );
  if (sections.score)
    lines.push(
      `${t('mobile.share.missionScoreLabel')}: ${formatScore(snapshot.score, locale)}`
    );
  if (sections.stats)
    lines.push(
      `${t('mobile.share.statObjectives')}: ${snapshot.correct}/${snapshot.totalRounds} · ${t('mobile.share.statAccuracy')}: ${snapshot.accuracy}% · ${t('mobile.share.statTime')}: ${formatMissionTime(snapshot.timeUsedSeconds)}`
    );
  if (sections.fragments)
    lines.push(
      `${t('mobile.share.keyFragmentsRecovered')}: ${snapshot.recoveredLetters.join(' ')}`
    );
  if (sections.squad)
    lines.push(
      t('mobile.share.squadStanding', {
        rank: snapshot.squadRank,
        size: snapshot.squadSize,
      })
    );
  lines.push('#EscapeSnap');
  return lines.join('\n');
}

function roundedRect(context, x, y, width, height, radius) {
  const safeRadius = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.roundRect(x, y, width, height, safeRadius);
}

function drawLabel(context, text, x, y, color, align = 'left', maxWidth = 800) {
  context.fillStyle = color;
  context.font = '700 24px Arial, sans-serif';
  context.textAlign = align;
  context.fillText(text, x, y, maxWidth);
}

function drawGrid(context, width, height, color) {
  context.save();
  context.strokeStyle = color;
  context.lineWidth = 1;
  for (let x = 0; x <= width; x += 54) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, height);
    context.stroke();
  }
  for (let y = 0; y <= height; y += 54) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(width, y);
    context.stroke();
  }
  context.restore();
}

function drawCornerMarks(context, width, height, accent) {
  const edge = 44;
  const offset = 36;
  context.strokeStyle = accent;
  context.lineWidth = 4;
  const corners = [
    [offset, offset, 1, 1],
    [width - offset, offset, -1, 1],
    [offset, height - offset, 1, -1],
    [width - offset, height - offset, -1, -1],
  ];
  corners.forEach(([x, y, horizontal, vertical]) => {
    context.beginPath();
    context.moveTo(x + horizontal * edge, y);
    context.lineTo(x, y);
    context.lineTo(x, y + vertical * edge);
    context.stroke();
  });
}

function drawStat(context, theme, label, value, x, y, width) {
  roundedRect(context, x, y, width, 130, 8);
  context.fillStyle = theme.panel;
  context.fill();
  context.fillStyle = theme.accent;
  context.fillRect(x, y, 5, 130);
  drawLabel(context, label, x + 28, y + 38, theme.muted, 'left', width - 48);
  context.fillStyle = theme.text;
  context.font = '800 44px Arial, sans-serif';
  context.textAlign = 'left';
  context.fillText(value, x + 28, y + 96);
}

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Could not create share image'));
    }, 'image/png');
  });
}

export async function renderShareCard({
  snapshot,
  sections,
  themeKey = 'dossier',
  formatKey = 'portrait',
  t = createTranslation('en'),
  locale = 'en',
}) {
  const theme = SHARE_THEMES[themeKey] ?? SHARE_THEMES.dossier;
  const format = SHARE_FORMATS[formatKey] ?? SHARE_FORMATS.portrait;
  const canvas = document.createElement('canvas');
  canvas.width = format.width;
  canvas.height = format.height;
  const context = canvas.getContext('2d');
  const { width, height } = canvas;
  canvas.lang = locale;
  context.direction = locale === 'ar' ? 'rtl' : 'ltr';
  const compact = height <= 1080;
  const padding = 72;
  const contentWidth = width - padding * 2;

  context.fillStyle = theme.background;
  context.fillRect(0, 0, width, height);
  drawGrid(context, width, height, theme.grid);
  drawCornerMarks(context, width, height, theme.accent);

  context.fillStyle = theme.accent;
  context.fillRect(padding, 78, 18, 18);
  context.fillStyle = theme.text;
  context.font = '800 32px Arial, sans-serif';
  context.textAlign = 'left';
  context.fillText('ESCAPESNAP', padding + 34, 98);
  drawLabel(
    context,
    t('mobile.share.afterActionReport'),
    width - padding,
    96,
    theme.muted,
    'right',
    contentWidth / 2
  );

  let y = 162;
  if (sections.result) {
    drawLabel(
      context,
      snapshot.outcome === 'won'
        ? t('mobile.share.missionComplete')
        : t('mobile.share.missionEnded'),
      padding,
      y,
      theme.accent
    );
    context.fillStyle = theme.text;
    context.font = `900 ${compact ? 78 : 94}px Arial, sans-serif`;
    context.textAlign = 'left';
    context.fillText(
      snapshot.outcome === 'won'
        ? t('mobile.share.escaped')
        : t('mobile.share.noEscape'),
      padding,
      y + 92,
      contentWidth
    );
    context.fillStyle = theme.muted;
    context.font = '600 28px Arial, sans-serif';
    context.fillText(
      snapshot.operativeName.toUpperCase(),
      padding,
      y + 140,
      contentWidth
    );
    y += compact ? 185 : 205;
  }

  if (sections.score) {
    roundedRect(context, padding, y, contentWidth, compact ? 150 : 170, 10);
    context.fillStyle = theme.inner;
    context.fill();
    context.strokeStyle = theme.accent;
    context.lineWidth = 2;
    context.stroke();
    drawLabel(
      context,
      t('mobile.share.missionScoreLabel'),
      padding + 34,
      y + 43,
      theme.muted
    );
    context.fillStyle = theme.text;
    context.font = `900 ${compact ? 68 : 78}px Arial, sans-serif`;
    context.textAlign = 'left';
    context.fillText(
      formatScore(snapshot.score, locale),
      padding + 34,
      y + (compact ? 121 : 136)
    );
    drawLabel(
      context,
      `${t(`difficulty.${snapshot.difficulty.toLowerCase()}`)} // ${snapshot.missionRef}`,
      width - padding - 34,
      y + (compact ? 112 : 126),
      theme.dim,
      'right'
    );
    y += compact ? 174 : 194;
  }

  if (sections.stats) {
    const gap = 14;
    const statWidth = (contentWidth - gap * 2) / 3;
    drawStat(
      context,
      theme,
      t('mobile.share.statObjectives'),
      `${snapshot.correct}/${snapshot.totalRounds}`,
      padding,
      y,
      statWidth
    );
    drawStat(
      context,
      theme,
      t('mobile.share.statAccuracy'),
      `${snapshot.accuracy}%`,
      padding + statWidth + gap,
      y,
      statWidth
    );
    drawStat(
      context,
      theme,
      t('mobile.share.statTime'),
      formatMissionTime(snapshot.timeUsedSeconds),
      padding + (statWidth + gap) * 2,
      y,
      statWidth
    );
    y += 154;
  }

  if (sections.fragments) {
    roundedRect(context, padding, y, contentWidth, 150, 8);
    context.fillStyle = theme.panel;
    context.fill();
    drawLabel(
      context,
      t('mobile.share.keyFragmentsRecovered'),
      padding + 28,
      y + 40,
      theme.muted
    );
    const letters = snapshot.recoveredLetters;
    const gap = 12;
    const boxWidth = Math.min(
      92,
      (contentWidth - 56 - gap * (letters.length - 1)) / letters.length
    );
    letters.forEach((letter, index) => {
      const x = padding + 28 + index * (boxWidth + gap);
      roundedRect(context, x, y + 60, boxWidth, 64, 5);
      context.fillStyle = theme.inner;
      context.fill();
      context.fillStyle = letter === '?' ? theme.dim : theme.text;
      context.font = '900 36px Arial, sans-serif';
      context.textAlign = 'center';
      context.fillText(letter, x + boxWidth / 2, y + 105);
      context.fillStyle = letter === '?' ? theme.dim : theme.accent;
      context.fillRect(x, y + 122, boxWidth, 3);
    });
    y += 174;
  }

  if (sections.squad) {
    const boardHeight = 64 + snapshot.squadBoard.length * 54;
    roundedRect(context, padding, y, contentWidth, boardHeight, 8);
    context.fillStyle = theme.panel;
    context.fill();
    drawLabel(
      context,
      t('mobile.share.squadStanding', {
        rank: snapshot.squadRank,
        size: snapshot.squadSize,
      }),
      padding + 28,
      y + 40,
      theme.muted
    );
    snapshot.squadBoard.forEach((entry, index) => {
      const rowY = y + 78 + index * 54;
      context.fillStyle = entry.isCurrent ? theme.accent : theme.dim;
      context.font = '800 24px Arial, sans-serif';
      context.textAlign = 'left';
      context.fillText(`#${entry.rank}`, padding + 28, rowY);
      context.fillStyle = theme.text;
      context.fillText(entry.name.toUpperCase(), padding + 100, rowY);
      context.textAlign = 'right';
      context.fillText(
        formatScore(entry.score, locale),
        width - padding - 28,
        rowY
      );
    });
    y += boardHeight + 24;
  }

  const footerY = Math.max(y + 16, height - 112);
  context.fillStyle = theme.accent;
  context.fillRect(padding, footerY, contentWidth, 2);
  drawLabel(
    context,
    t('mobile.share.tagline'),
    padding,
    footerY + 46,
    theme.muted,
    'left',
    contentWidth - 230
  );
  drawLabel(
    context,
    '#ESCAPESNAP',
    width - padding,
    footerY + 46,
    theme.text,
    'right'
  );

  return { blob: await canvasToBlob(canvas), canvas };
}

export function downloadShareCard(blob, snapshot, formatKey) {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = `escapesnap-${snapshot.missionRef.toLowerCase()}-${formatKey}.png`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}
