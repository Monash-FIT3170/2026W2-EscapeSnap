import React from 'react';
import LandingHeader from '../../components/landing/LandingHeader';
import LandingHero from '../../components/landing/LandingHero';
import JoinCard from '../../components/landing/JoinCard';
import HostCard from '../../components/landing/HostCard';
import FinalCodeCard from '../../components/landing/FinalCodeCard';
import HowItWorks from '../../components/landing/HowItWorks';
import DifficultyTiers from '../../components/landing/DifficultyTiers';
import LandingFooter from '../../components/landing/LandingFooter';
import { BG, INK } from '../../components/landing/theme';

function Landing() {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: BG, color: INK }}
    >
      <LandingHeader />

      <main className="flex-1 w-full max-w-6xl mx-auto px-6 md:px-12">
        <section className="pt-12 md:pt-20 pb-16">
          <LandingHero />

          {/* Three equal cards in one row. Equal columns is what keeps the
              final-code panel level with the other two: an earlier 7/5 split
              left the short column with ~130px of dead space under it. Each
              card is a flex column, so the buttons share a baseline. */}
          <div className="grid md:grid-cols-3 gap-6 mt-14">
            <JoinCard />
            <HostCard />
            <FinalCodeCard />
          </div>
        </section>

        <HowItWorks />
        <DifficultyTiers />
      </main>

      <LandingFooter />
    </div>
  );
}

export default Landing;
