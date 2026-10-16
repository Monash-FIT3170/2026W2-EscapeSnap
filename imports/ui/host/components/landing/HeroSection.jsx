import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../../../languages/LanguageProvider';
import JoinKeypad from './JoinKeypad';
import { startHero } from './heroFx';

const TITLE = [
  ['E'],
  ['S'],
  ['C'],
  ['A'],
  ['P'],
  ['E'],
  ['S', 'lp-red'],
  ['N', 'lp-red'],
  ['A', 'lp-red lp-faulty'],
  ['P', 'lp-red'],
];

const scrawl = (left, top, fontSize, rotate, extra) => ({
  left,
  top,
  fontSize,
  transform: `rotate(${rotate}deg)`,
  ...extra,
});

export default function HeroSection({ join, onJoined }) {
  const { t, locale } = useLanguage();
  const heroRef = useRef(null);
  const dateRef = useRef(null);
  const timeRef = useRef(null);

  useEffect(() => startHero(heroRef.current), []);

  useEffect(() => {
    const date = new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : locale, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const time = new Intl.DateTimeFormat(locale, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    });
    const tick = () => {
      const now = new Date();
      dateRef.current.textContent = date.format(now);
      timeRef.current.textContent = time.format(now);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [locale]);

  return (
    <section
      className="lp-hero"
      id="top"
      ref={heroRef}
      aria-labelledby="lp-hero-title"
    >
      <div className="lp-wall" aria-hidden="true">
        <span
          className="lp-scrawl lp-chalk"
          style={scrawl('41%', '13%', '1.05rem', -5)}
        >
          {t('landing.hero.scrawlLight')}
        </span>
        <svg
          className="lp-scrawl"
          style={{ left: '3.5%', top: '24%', width: 130 }}
          viewBox="0 0 130 50"
        >
          <g
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          >
            <path d="M8 8l1 34M17 7l-1 35M26 9l1 33M35 8v34M3 30L42 16" />
            <path d="M60 9l-1 33M69 8l1 34M78 9l-1 33M87 7l1 35M55 31L93 15" />
            <path d="M110 9v33M119 8l-1 34" />
          </g>
        </svg>
        <span className="lp-scrawl" style={scrawl('52%', '84%', '1.7rem', 4)}>
          4 8 2 ?
        </span>
        <span
          className="lp-scrawl lp-chalk lp-hide-sm"
          style={scrawl('5%', '89%', '.85rem', -2)}
        >
          {t('landing.hero.scrawlBehind')}
        </span>
        <span
          className="lp-scrawl lp-hide-sm"
          style={scrawl('44%', '62%', '.95rem', -8)}
        >
          {t('landing.hero.scrawlSmile')}
        </span>
        <span
          className="lp-scrawl lp-chalk lp-hide-sm"
          style={scrawl('90%', '91%', '.8rem', 3)}
        >
          {t('landing.hero.scrawlDay')}
        </span>
        <span
          className="lp-scrawl lp-hide-sm"
          style={scrawl('2.5%', '55%', '1.3rem', -90, {
            transformOrigin: 'left top',
          })}
        >
          {t('landing.hero.scrawlOut')}
        </span>
      </div>
      <div className="lp-dark" aria-hidden="true" />
      <div className="lp-blackout" aria-hidden="true" />
      <div className="lp-eyes" aria-hidden="true">
        <i />
        <i />
      </div>
      <div className="lp-scan" aria-hidden="true" />
      <div className="lp-osd" aria-hidden="true">
        <span className="lp-corner lp-c-tl" />
        <span className="lp-corner lp-c-tr" />
        <span className="lp-corner lp-c-bl" />
        <span className="lp-corner lp-c-br" />
        <div className="lp-osd-tl">
          <span className="lp-rec">REC</span>
          <span>CAM 03</span>
        </div>
        <div className="lp-osd-tr">
          <span ref={dateRef} />
          <span ref={timeRef} />
        </div>
        <div className="lp-osd-bl">
          <span className="lp-motion">
            <span className="lp-motion-no">{t('landing.hero.noMotion')}</span>
            <span className="lp-motion-yes">{t('landing.hero.motion')}</span>
          </span>
        </div>
        <div className="lp-osd-br">
          <span className="lp-hide-sm">{t('landing.hero.lowLight')}</span>
          <span className="lp-battery">
            <i />
          </span>
        </div>
      </div>

      <div className="lp-wrap lp-hero-inner">
        <div className="lp-hero-copy">
          <h1 className="lp-title" id="lp-hero-title" aria-label="EscapeSnap">
            {TITLE.map(([ch, cls], i) => (
              <span
                key={i}
                className={cls ? `lp-ltr ${cls}` : 'lp-ltr'}
                aria-hidden="true"
              >
                {ch}
              </span>
            ))}
          </h1>
          <p className="lp-lead">
            {t('landing.hero.lead1')}
            <br /> {t('landing.hero.lead2')}
          </p>
          <p className="lp-body">{t('landing.hero.body')}</p>
          <p className="lp-meta">{t('landing.hero.meta')}</p>
          <div className="lp-actions">
            <Link className="lp-btn lp-btn-ghost" to="/host">
              {t('landing.host')}
            </Link>
            <a className="lp-link-quiet" href="#how">
              {t('landing.hero.seeHow')}
            </a>
          </div>
        </div>
        <JoinKeypad join={join} onJoined={onJoined} />
      </div>
    </section>
  );
}
