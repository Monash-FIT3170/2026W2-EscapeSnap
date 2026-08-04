// Offline fallback riddle pool — used only when live Gemini generation
// (imports/api/riddles/geminiClient.js) is unavailable, errors, or returns too few
// riddles. Every `answer` here must be an exact match from ROUND_RIDDLE_CLASSES in
// imports/lib/cocoClasses.js, or the vision model will never confirm a photo.
export const RIDDLE_BANK = [
  {
    text: 'I breathe, I think, and I might be reading this riddle right now. Capture me.',
    answer: 'person',
  },
  {
    text: 'I hold words but cannot read them myself. What am I?',
    answer: 'book',
  },
  {
    text: 'I have hands but cannot clap, and a face but no eyes. What am I?',
    answer: 'clock',
  },
  {
    text: 'I have a screen and I ring, but I am not a TV. I fit in your hand. What am I?',
    answer: 'cell phone',
  },
  {
    text: 'I have legs but cannot run, and arms but cannot hug. What am I?',
    answer: 'chair',
  },
  {
    text: 'I have a neck and a mouth, but I cannot speak or swallow. What am I?',
    answer: 'bottle',
  },
  { text: 'I have keys but open no locks. What am I?', answer: 'keyboard' },
  {
    text: 'I have a handle but open no doors, and I hold your coffee. What am I?',
    answer: 'cup',
  },
  {
    text: 'I am round, I hold your cereal, and I am not a plate. What am I?',
    answer: 'bowl',
  },
  {
    text: 'I carry your books all day but I have no hands. What am I?',
    answer: 'backpack',
  },
  {
    text: 'I open my arms only when it starts to rain. What am I?',
    answer: 'umbrella',
  },
  {
    text: 'I have two blades but I am not a sword. What am I?',
    answer: 'scissors',
  },
  {
    text: 'I have a keyboard but I am not a piano, and a screen but I am not a TV. What am I?',
    answer: 'laptop',
  },
  {
    text: 'I have buttons but no keys, and I never leave the couch. What am I?',
    answer: 'remote',
  },
  {
    text: 'I hold flowers but I never drink the water myself. What am I?',
    answer: 'vase',
  },
  {
    text: 'I am soft, stitched, and I never grow up. What am I?',
    answer: 'teddy bear',
  },
];
