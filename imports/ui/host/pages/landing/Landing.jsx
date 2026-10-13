import React, { useEffect, useRef } from 'react';
import { Meteor } from 'meteor/meteor';
import { useNavigate } from 'react-router-dom';
import LandingNav from '../../components/landing/LandingNav';
import HeroSection from '../../components/landing/HeroSection';
import CautionTape from '../../components/landing/CautionTape';
import EvidenceBoard from '../../components/landing/EvidenceBoard';
import FinalRiddleDemo from '../../components/landing/FinalRiddleDemo';
import VitalsSection from '../../components/landing/VitalsSection';
import SetupRig from '../../components/landing/SetupRig';
import ExitDoor from '../../components/landing/ExitDoor';
import LandingFooter from '../../components/landing/LandingFooter';
import { sound } from '../../components/landing/landingSound';
import { reducedMotion } from '../../components/landing/motion';
// Not "landing.css": on macOS's case-insensitive disk, Meteor resolves
// App.jsx's import of ./landing/Landing to Landing.css first and drops this
// file from the bundle.
import './landingPage.css';

// Resolves to { playerId, gameId }, or throws 'not-found' / 'full'.
const joinGame = (name, code) => Meteor.callAsync('players.join', code, name);

// The landing page is "the room": every control is a prop in it. Each section
// owns its own motion and cleans it up; this page owns the scroll reveals and
// the sound's lifetime. Styles live in landingPage.css, scoped under .lp.
function Landing() {
  const rootRef = useRef(null);
  const navigate = useNavigate();

  // Scroll reveals: one observer adds .is-in to each [data-reveal] once.
  useEffect(() => {
    const els = rootRef.current.querySelectorAll('[data-reveal]');
    if (reducedMotion()) {
      els.forEach((el) => el.classList.add('is-in'));
      return undefined;
    }
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }),
      { threshold: 0.2, rootMargin: '0px 0px -6% 0px' }
    );
    els.forEach((el) => io.observe(el));
    // Smooth in-page links (#how, #final...) while this page is mounted.
    const html = document.documentElement;
    const before = html.style.scrollBehavior;
    html.style.scrollBehavior = 'smooth';
    return () => {
      io.disconnect();
      html.style.scrollBehavior = before;
    };
  }, []);

  useEffect(() => () => sound.dispose(), []);

  // A join made on the keypad goes straight to the lobby; PlayerFlow picks the
  // session up from router state.
  const onJoined = (session) =>
    navigate('/player', { state: { joined: session } });

  return (
    <div className="lp" ref={rootRef}>
      <div className="lp-grain" aria-hidden="true" />
      <div className="lp-flashbang" id="lp-flashbang" aria-hidden="true" />
      <LandingNav />
      <main>
        <HeroSection join={joinGame} onJoined={onJoined} />
        <CautionTape />
        <EvidenceBoard />
        <FinalRiddleDemo />
        <VitalsSection />
        <SetupRig />
        <ExitDoor />
      </main>
      <LandingFooter />
    </div>
  );
}

export default Landing;
