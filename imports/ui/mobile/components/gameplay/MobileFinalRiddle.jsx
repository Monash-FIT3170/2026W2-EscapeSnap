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
    <div className="flex flex-col gap-4 border border-[#8b0000] bg-[#1c1b1b] px-5 py-5">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#8b0000]">
          {t('mobile.versus.finalRiddleTitle')}
        </p>
        <p className="mt-2 font-mono text-xs leading-5 text-[#aa8984]">
          {t('mobile.versus.finalRiddleBody', { team: rivalName ?? '' })}
        </p>
      </div>

      <p className="font-display text-lg font-semibold leading-7 text-[#e5e2e1]">
        &ldquo;{finalRiddle ?? '...'}&rdquo;
      </p>

      {finalRiddleHint &&
        (hintShown ? (
          <p className="font-mono text-xs leading-5 text-[#aa8984]">
            💡 {t('mobile.versus.hint', { hint: finalRiddleHint })}
          </p>
        ) : (
          <button
            type="button"
            onClick={() => setHintShown(true)}
            className="min-h-[44px] self-start font-mono text-[10px] uppercase tracking-[0.2em] text-[#aa8984]"
          >
            💡 {t('mobile.versus.revealHint')}
          </button>
        ))}

      <div>
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.25em] text-[#aa8984]">
          {t('mobile.versus.teamLetters')}
        </p>
        <div className="flex flex-wrap gap-2">
          {letters.map((letter, i) => (
            <span
              key={i}
              className="flex h-10 w-10 items-center justify-center border-b-2 border-[#8b0000] bg-[#0e0e0e] font-display text-xl font-black text-[#e5e2e1]"
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
