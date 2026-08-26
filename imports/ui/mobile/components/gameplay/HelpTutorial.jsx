import React, { useState } from 'react';

const tutorialSteps = [
  {
    number: '01',
    title: 'READ THE RIDDLE',
    description:
      'Each round gives you a riddle describing an object that you need to find.',
  },
  {
    number: '02',
    title: 'FIND THE OBJECT',
    description:
      'Work out the answer to the riddle and find the matching object in the real world.',
  },
  {
    number: '03',
    title: 'TAKE A PHOTO',
    description:
      'Use the scanner to take a photo of the object before the timer expires.',
  },
  {
    number: '04',
    title: 'COLLECT LETTERS',
    description:
      'Correct answers reveal letters. Keep the letters you collect during each round.',
  },
  {
    number: '05',
    title: 'ESCAPE',
    description:
      'Complete all rounds and use the letters you collected to help solve the final riddle.',
  },
];

export function HelpTutorial({ onComplete }) {
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
    <div
      className="h-screen overflow-hidden bg-black text-white flex flex-col"
      style={{
        backgroundImage:
          'linear-gradient(rgba(239,68,68,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(239,68,68,0.04) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
      }}
    >
      <div className="flex-1 flex flex-col w-full max-w-md mx-auto px-6 py-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-red-500">
              Mission Briefing
            </p>

            <h1 className="mt-2 font-display text-3xl font-black tracking-wide text-white">
              HOW TO PLAY
            </h1>
          </div>

          <span className="font-mono text-xs text-slate-500">
            {currentStep + 1}/{tutorialSteps.length}
          </span>
        </div>

        <div className="mt-6 flex gap-2">
          {tutorialSteps.map((_, index) => (
            <div
              key={index}
              className={`h-1 flex-1 ${
                index <= currentStep ? 'bg-red-600' : 'bg-slate-800'
              }`}
            />
          ))}
        </div>

        <div className="flex-1 flex flex-col justify-center">
          <div className="border border-red-900/60 bg-slate-950/80 px-6 py-10">
            <p className="font-display text-6xl font-black text-red-700">
              {step.number}
            </p>

            <h2 className="mt-6 font-display text-2xl font-bold tracking-widest text-white">
              {step.title}
            </h2>

            <p className="mt-5 font-mono text-sm leading-7 text-slate-400">
              {step.description}
            </p>
          </div>

          <div className="mt-5 border-l-4 border-red-600 bg-red-950/20 px-5 py-4">
            <p className="font-mono text-xs leading-5 uppercase tracking-wider text-slate-400">
              Complete each objective before the game timer reaches zero.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          {currentStep > 0 && (
            <button
              type="button"
              onClick={handleBack}
              className="flex-1 border border-slate-700 px-4 py-4 font-mono text-sm font-semibold uppercase tracking-widest text-slate-400 transition hover:border-slate-500 hover:text-white"
            >
              Back
            </button>
          )}

          <button
            type="button"
            onClick={handleNext}
            className="flex-1 border border-red-600 bg-red-600 px-4 py-4 font-mono text-sm font-semibold uppercase tracking-widest text-white transition hover:bg-red-500"
          >
            {isLastStep ? 'Start Mission' : 'Next'}
          </button>
        </div>

        <button
          type="button"
          onClick={onComplete}
          className="mt-4 font-mono text-xs uppercase tracking-widest text-slate-600 transition hover:text-slate-400"
        >
          Skip Tutorial
        </button>
      </div>
    </div>
  );
}