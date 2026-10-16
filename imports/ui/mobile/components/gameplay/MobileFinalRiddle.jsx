// Meteor's JSX transform still requires React in module scope.
import React, { useState } from 'react';
import { useFinalRiddle } from '/imports/ui/shared/hooks/useFinalRiddle';
import { useRevealedLetters } from '/imports/ui/shared/hooks/useRevealedLetters';
import FinalRiddleInput from '/imports/ui/host/components/riddle/FinalRiddleInput';
import { useT } from '../../../../languages/LanguageProvider';

// In a versus match the shared screen can't show the final riddle — the rival
// team would see it — so once every round is done each phone shows it instead.
// Any teammate can submit; the attempts are shared through the server.
export function MobileFinalRiddle({ gameId, attemptsUsed, rivalName }) {
  const t = useT();
  const [hintShown, setHintShown] = useState(false);
  const { finalRiddle, finalRiddleHint } = useFinalRiddle(gameId);
  const { letters } = useRevealedLetters(gameId);

  return (
    <div className="es-paper flex -rotate-[0.6deg] flex-col gap-4 px-5 pb-5 pt-6">
      <div>
        <p className="es-stamp !text-base text-[#a3150e]">
          {t('mobile.versus.finalRiddleTitle')}
        </p>
        <p className="mt-3 text-sm leading-5 text-[#3b322b]">
          {t('mobile.versus.finalRiddleBody', { team: rivalName ?? '' })}
        </p>
      </div>

      <p className="text-lg leading-8">
        &ldquo;{finalRiddle ?? '...'}&rdquo;
      </p>

      {finalRiddleHint &&
        (hintShown ? (
          <p className="text-sm leading-5 text-[#3b322b]">
            💡 {t('mobile.versus.hint', { hint: finalRiddleHint })}
          </p>
        ) : (
          <button
            type="button"
            onClick={() => setHintShown(true)}
            className="es-link min-h-[44px] self-start text-[#3b322b]"
          >
            💡 {t('mobile.versus.revealHint')}
          </button>
        ))}

      <div>
        <p className="es-label mb-2 !text-[#3b322b]">
          {t('mobile.versus.teamLetters')}
        </p>
        <div className="flex flex-wrap gap-2">
          {letters.map((letter, i) => (
            <span
              key={i}
              className="es-lcd es-lcd-text flex h-11 w-10 items-center justify-center text-2xl"
            >
              {letter}
            </span>
          ))}
        </div>
      </div>

      <FinalRiddleInput gameId={gameId} attemptsUsed={attemptsUsed} />
    </div>
  );
}
