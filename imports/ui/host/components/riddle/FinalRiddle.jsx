import React from 'react';
import { useT } from '../../../../languages/LanguageProvider';

const FinalRiddle = ({ finalRiddle }) => {
  const t = useT();
  return (
    <div className="mb-8">
      <h1
        className="text-white uppercase mb-6"
        style={{
          fontSize: '4.5rem',
          letterSpacing: '0.0em',
          lineHeight: 1
        }}
      >
        {t('host.finalRiddle.theFinal')} <span style={{ color: '#991b1b' }}>{t('host.finalRiddle.riddle')}</span>
      </h1>
      <div className="border-l-4 border-red-600 p-8" style={{ backgroundColor: '#1a1a1a' }}>
        <p className="text-white font-bold text-xl leading-relaxed tracking-wide">
          &ldquo;{finalRiddle}&rdquo;
        </p>
      </div>
    </div>
  );
};

export default FinalRiddle;