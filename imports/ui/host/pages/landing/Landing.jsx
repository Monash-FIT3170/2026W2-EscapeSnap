import React from 'react';
import { Link } from 'react-router-dom';
import { useT } from '../../../../languages/LanguageProvider';
import { LanguagePicker } from '../../../../languages/LanguagePicker';
import { ThemePicker } from '../../../shared/components/theme/ThemePicker';

function Landing() {
  const t = useT();

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
        <div className="w-full max-w-2xl text-center">
          <p className="text-xs tracking-widest mb-3" style={{ color: 'rgb(var(--es-brand))' }}>
            {t('landing.initiateProtocol')}
          </p>
          <h1 className="text-6xl font-bold tracking-widest uppercase mb-6" style={{ color: 'rgb(var(--es-ink))' }}>
            ESCAPESNAP
          </h1>
          <p className="text-sm tracking-wide mb-12 max-w-md mx-auto leading-relaxed" style={{ color: 'rgb(var(--es-muted))' }}>
            {t('landing.tagline')}
          </p>

          <div className="flex flex-col gap-4 w-full max-w-xs mx-auto">
            <Link
              to="/player"
              className="block w-full py-4 text-center text-sm tracking-widest uppercase transition-colors cursor-pointer"
              style={{ border: '1px solid rgb(var(--es-panel))', color: 'rgb(var(--es-ink))', background: 'transparent' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgb(var(--es-brand))'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'rgb(var(--es-panel))'}
            >
              {t('landing.joinAsPlayer')}
            </Link>
            <Link
              to="/host"
              className="block w-full py-4 text-center text-sm tracking-widest uppercase transition-colors cursor-pointer"
              style={{ background: 'rgb(var(--es-brand))', color: 'rgb(var(--es-on-brand))' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgb(var(--es-brand-bright))'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgb(var(--es-brand))'}
            >
              {t('landing.hostAGame')}
            </Link>
          </div>

          <p className="text-xs tracking-widest mt-8" style={{ color: 'rgb(var(--es-dim))' }}>
            {t('landing.footerTag')}
          </p>
        </div>
      </main>

      <footer className="px-8 py-4 text-center" style={{ borderTop: '1px solid rgb(var(--es-panel))' }}>
        <p className="text-xs tracking-widest" style={{ color: 'rgb(var(--es-dim))' }}>
          ESCAPESNAP
        </p>
      </footer>
    </div>
  );
}

export default Landing;