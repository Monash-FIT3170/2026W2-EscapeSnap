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
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-ground text-ink">
      <div className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col px-5 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted">
              {t('mobile.tutorial.missionBriefing')}
            </p>

            <h1 className="mt-2 font-display text-2xl font-black tracking-[0.1em] text-ink">
              {t('mobile.tutorial.howToPlay')}
            </h1>
          </div>

          <span className="font-mono text-xs tabular-nums text-muted">
            {currentStep + 1}/{tutorialSteps.length}
          </span>
        </div>

        <div className="mt-6 flex gap-2">
          {tutorialSteps.map((_, index) => (
            <div
              key={index}
              className={`h-1 flex-1 ${
                index <= currentStep ? 'bg-brand' : 'bg-line'
              }`}
            />
          ))}
        </div>

        {/* Scrolls on short phones so step copy is never clipped. */}
        <div className="flex min-h-0 flex-1 flex-col justify-center gap-4 overflow-y-auto py-6">
          <div className="border border-line bg-panel px-5 py-8">
            <p className="font-display text-5xl font-black text-brand">
              {step.number}
            </p>

            <h2 className="mt-5 font-display text-xl font-bold tracking-[0.15em] text-ink">
              {t(step.titleKey)}
            </h2>

            <p className="mt-4 font-mono text-sm leading-6 text-muted">
              {t(step.descriptionKey)}
            </p>
          </div>

          <div className="border-l-4 border-brand bg-panel px-5 py-4">
            <p className="font-mono text-xs uppercase leading-5 tracking-[0.15em] text-muted">
              {t('mobile.tutorial.objectiveHint')}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          {currentStep > 0 && (
            <button
              type="button"
              onClick={handleBack}
              className="min-h-[52px] flex-1 border border-line px-4 font-mono text-sm font-semibold uppercase tracking-[0.2em] text-muted transition active:border-muted"
            >
              {t('mobile.tutorial.back')}
            </button>
          )}

          <button
            type="button"
            onClick={handleNext}
            className="min-h-[52px] flex-1 border border-brand bg-brand px-4 font-mono text-sm font-semibold uppercase tracking-[0.2em] text-on-brand transition active:bg-brand-bright"
          >
            {isLastStep ? t('mobile.tutorial.startMission') : t('mobile.tutorial.next')}
          </button>
        </div>

        <button
          type="button"
          onClick={onComplete}
          className="mt-3 min-h-[44px] font-mono text-[11px] uppercase tracking-[0.2em] text-dim transition active:text-muted"
        >
          {t('mobile.tutorial.skipTutorial')}
        </button>
      </div>
    </div>
  );
}