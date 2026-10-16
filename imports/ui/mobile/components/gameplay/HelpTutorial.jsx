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
    <div className="es-room flex h-[100dvh] flex-col overflow-hidden">
      <div className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col px-5 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="es-label">{t('mobile.tutorial.missionBriefing')}</p>
            <h1 className="es-title mt-2 text-4xl text-ink">
              {t('mobile.tutorial.howToPlay')}
            </h1>
          </div>

          <span className="font-display text-lg tabular-nums text-muted">
            {currentStep + 1}/{tutorialSteps.length}
          </span>
        </div>

        <div className="mt-6 flex gap-2" aria-hidden="true">
          {tutorialSteps.map((_, index) => (
            <span
              key={index}
              className="es-led flex-1 !rounded-sm !h-1.5"
              data-state={index <= currentStep ? 'ready' : 'off'}
            />
          ))}
        </div>

        {/* Scrolls on short phones so step copy is never clipped. */}
        <div className="flex min-h-0 flex-1 flex-col justify-center gap-6 overflow-y-auto overflow-x-hidden py-6">
          <div className="es-plate px-5 pb-7 pt-5">
            <p className="es-lcd es-lcd-text inline-block px-3 py-1 text-4xl tabular-nums">
              {step.number}
            </p>

            <h2 className="es-title mt-6 text-3xl text-ink">{t(step.titleKey)}</h2>

            <p className="mt-3 text-base leading-7 text-muted">
              {t(step.descriptionKey)}
            </p>
          </div>

          <p className="es-hand -rotate-1 px-2 text-sm leading-7 text-brand-bright">
            {t('mobile.tutorial.objectiveHint')}
          </p>
        </div>

        <div className="flex gap-3">
          {currentStep > 0 && (
            <button type="button" onClick={handleBack} className="es-btn es-btn-ghost flex-1">
              {t('mobile.tutorial.back')}
            </button>
          )}

          <button type="button" onClick={handleNext} className="es-btn es-btn-primary flex-[2]">
            {isLastStep ? t('mobile.tutorial.startMission') : t('mobile.tutorial.next')}
          </button>
        </div>

        <button type="button" onClick={onComplete} className="es-link mx-auto mt-3 min-h-[44px] text-muted">
          {t('mobile.tutorial.skipTutorial')}
        </button>
      </div>
    </div>
  );
}
