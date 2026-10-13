import { Meteor } from 'meteor/meteor';
import { Games } from '../games/GamesCollection';
import { Rounds } from '../rounds/RoundsCollection';
import { callGemini } from '../riddles/geminiClient';
import { createTranslator, TRANSLATION_LANGUAGES } from './translateText';

const translateEnglish = createTranslator(callGemini);

Meteor.methods({
  async 'translations.riddle'(kind, id, field, locale) {
    if (
      !['round', 'final'].includes(kind) ||
      typeof id !== 'string' ||
      !id ||
      id.length > 100 ||
      !['riddle', 'hint'].includes(field) ||
      !Object.hasOwn(TRANSLATION_LANGUAGES, locale)
    ) {
      throw new Meteor.Error('invalid-translation');
    }
    // Accept stored IDs, never arbitrary client text or answer fields. Keep the
    // paid round hint behind the same reveal state as rounds.revealHint.
    const record =
      kind === 'round'
        ? await Rounds.findOneAsync(id)
        : await Games.findOneAsync(id);
    if (!record) throw new Meteor.Error('not-found');
    if (kind === 'round' && field === 'hint' && !record.hintRevealedAt) {
      throw new Meteor.Error('invalid-state');
    }
    const text =
      kind === 'round'
        ? record[field === 'riddle' ? 'riddleText' : 'hint']
        : record.finalRiddle?.[field];
    if (!text) throw new Meteor.Error('no-riddle');
    // Allow a riddle and its hint together, but bound concurrent calls.
    const connection = this.connection;
    if ((connection?.translationPending || 0) >= 4)
      throw new Meteor.Error('translation-busy');
    if (connection)
      connection.translationPending = (connection.translationPending || 0) + 1;
    try {
      return await translateEnglish(text, locale);
    } catch {
      throw new Meteor.Error('translation-unavailable');
    } finally {
      if (connection) connection.translationPending -= 1;
    }
  },
});
