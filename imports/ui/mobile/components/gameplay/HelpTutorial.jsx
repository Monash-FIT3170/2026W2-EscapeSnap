import React, { useState } from 'react';
import { useT } from '../../../../languages/LanguageProvider';

const tutorialSteps = [
  {
    number: '01',
    titleKey: 'mobile.tutorial.step1Title',
    descriptionKey: 'mobile.tutorial.step1Description',
  },
  {
    number: '02',
    titleKey: 'mobile.tutorial.step2Title',
    descriptionKey: 'mobile.tutorial.step2Description',
  },
  {
    number: '03',
    titleKey: 'mobile.tutorial.step3Title',
    descriptionKey: 'mobile.tutorial.step3Description',
  },
  {
    number: '04',
    titleKey: 'mobile.tutorial.step4Title',
    descriptionKey: 'mobile.tutorial.step4Description',
  },
  {
    number: '05',
    titleKey: 'mobile.tutorial.step5Title',
    descriptionKey: 'mobile.tutorial.step5Description',
  },
];

export function HelpTutorial({ onComplete }) {
  const t = useT();
  const [currentStep, setCurrentStep] = useState(0);

  const step = tutorialSteps[currentStep];
  const isLastStep = currentStep === tutorialSteps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
      return;
    }

    setCurrentStep(stepIndex => stepIndex + 1);
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(stepIndex => stepIndex - 1);
    }
  };

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-[#0e0e0e] text-[#e5e2e1]">
      <div className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col px-5 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-[#aa8984]">
              {t('mobile.tutorial.missionBriefing')}
            </p>

            <h1 className="mt-2 font-display text-2xl font-black tracking-[0.1em] text-[#e5e2e1]">
              {t('mobile.tutorial.howToPlay')}
            </h1>
          </div>

          <span className="font-mono text-xs tabular-nums text-[#aa8984]">
            {currentStep + 1}/{tutorialSteps.length}
          </span>
        </div>

        <div className="mt-6 flex gap-2">
          {tutorialSteps.map((_, index) => (
            <div
              key={index}
              className={`h-1 flex-1 ${
                index <= currentStep ? 'bg-[#8b0000]' : 'bg-[#353534]'
              }`}
            />
          ))}
        </div>

        {/* Scrolls on short phones so step copy is never clipped. */}
        <div className="flex min-h-0 flex-1 flex-col justify-center gap-4 overflow-y-auto py-6">
          <div className="border border-[#353534] bg-[#1c1b1b] px-5 py-8">
            <p className="font-display text-5xl font-black text-[#8b0000]">
              {step.number}
            </p>

            <h2 className="mt-5 font-display text-xl font-bold tracking-[0.15em] text-[#e5e2e1]">
              {t(step.titleKey)}
            </h2>

            <p className="mt-4 font-mono text-sm leading-6 text-[#aa8984]">
              {t(step.descriptionKey)}
            </p>
          </div>

          <div className="border-l-4 border-[#8b0000] bg-[#1c1b1b] px-5 py-4">
            <p className="font-mono text-xs uppercase leading-5 tracking-[0.15em] text-[#aa8984]">
              {t('mobile.tutorial.objectiveHint')}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          {currentStep > 0 && (
            <button
              type="button"
              onClick={handleBack}
              className="min-h-[52px] flex-1 border border-[#353534] px-4 font-mono text-sm font-semibold uppercase tracking-[0.2em] text-[#aa8984] transition active:border-[#aa8984]"
            >
              {t('mobile.tutorial.back')}
            </button>
          )}

          <button
            type="button"
            onClick={handleNext}
            className="min-h-[52px] flex-1 border border-[#8b0000] bg-[#8b0000] px-4 font-mono text-sm font-semibold uppercase tracking-[0.2em] text-[#e5e2e1] transition active:bg-[#a50000]"
          >
            {isLastStep ? t('mobile.tutorial.startMission') : t('mobile.tutorial.next')}
          </button>
        </div>

        <button
          type="button"
          onClick={onComplete}
          className="mt-3 min-h-[44px] font-mono text-[11px] uppercase tracking-[0.2em] text-[#555] transition active:text-[#aa8984]"
        >
          {t('mobile.tutorial.skipTutorial')}
        </button>
      </div>
    </div>
  );
}