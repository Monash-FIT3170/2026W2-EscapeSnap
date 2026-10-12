import React from 'react';
import { useT } from '../../../../languages/LanguageProvider';

const FinalRiddle = ({ finalRiddle }) => {
  const t = useT();
  return (
    <div className="mb-8">
      <h1
        className="text-ink uppercase mb-6"
        style={{
          fontSize: '4.5rem',
          letterSpacing: '0.0em',
          lineHeight: 1
        }}
      >
        {t('host.finalRiddle.theFinal')} <span style={{ color: 'rgb(var(--es-brand-bright))' }}>{t('host.finalRiddle.riddle')}</span>
      </h1>
      <div className="border-l-4 border-brand p-8" style={{ backgroundColor: 'rgb(var(--es-panel))' }}>
        <p className="text-ink font-bold text-xl leading-relaxed tracking-wide">
          &ldquo;{finalRiddle}&rdquo;
        </p>
      </div>
    </div>
  );
};

export default FinalRiddle;