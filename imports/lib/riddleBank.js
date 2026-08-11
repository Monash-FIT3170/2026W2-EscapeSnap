// Offline fallback riddles, used if live Gemini generation fails. Every `answer`
// must exactly match a ROUND_RIDDLE_CLASSES entry (imports/lib/cocoClasses.js).
export const RIDDLE_BANK = [
  {
    text: 'I breathe, I think, and I might be reading this riddle right now. Capture me.',
    hint: "It's the one taking the photo, or someone sitting nearby.",
    answer: 'person',
  },
  {
    text: 'I hold words but cannot read them myself. What am I?',
    hint: 'Something with pages you flip through to read.',
    answer: 'book',
  },
  {
    text: 'I have hands but cannot clap, and a face but no eyes. What am I?',
    hint: 'It tells you what time it is.',
    answer: 'clock',
  },
  {
    text: 'I have a screen and I ring, but I am not a TV. I fit in your hand. What am I?',
    hint: 'The device in your pocket you use to call or scroll.',
    answer: 'cell phone',
  },
  {
    text: 'I have legs but cannot run, and arms but cannot hug. What am I?',
    hint: 'Something you sit on.',
    answer: 'chair',
  },
  {
    text: 'I have a neck and a mouth, but I cannot speak or swallow. What am I?',
    hint: 'Something you drink water from.',
    answer: 'bottle',
  },
  {
    text: 'I have keys but open no locks. What am I?',
    hint: 'What you type on to use a computer.',
    answer: 'keyboard',
  },
  {
    text: 'I have a handle but open no doors, and I hold your coffee. What am I?',
    hint: "Something you'd drink coffee or tea from.",
    answer: 'cup',
  },
  {
    text: 'I carry your books all day but I have no hands. What am I?',
    hint: 'What you carry your books and laptop in.',
    answer: 'backpack',
  },
  {
    text: 'I open my arms only when it starts to rain. What am I?',
    hint: "What you open when it's raining.",
    answer: 'umbrella',
  },
  {
    text: 'I have two blades but I am not a sword. What am I?',
    hint: 'Used to cut paper.',
    answer: 'scissors',
  },
  {
    text: 'I have a keyboard but I am not a piano, and a screen but I am not a TV. What am I?',
    hint: 'A portable computer you open and close.',
    answer: 'laptop',
  },
  {
    text: 'I have buttons but no keys, and I sit quietly beside a screen at the front of the room. What am I?',
    hint: 'Used to control a TV or screen from a distance.',
    answer: 'remote',
  },
  {
    text: 'I have four legs but I never walk, and you rest your notes on my back. What am I?',
    hint: 'What you put your notes or laptop on in class.',
    answer: 'dining table',
  },
  {
    text: 'I show pictures and words all day but I have no eyes. What am I?',
    hint: 'A screen used to display pictures or videos.',
    answer: 'tv',
  },
  {
    text: 'I have no tail but I still scurry quietly beside your laptop. What am I?',
    hint: 'The small device you click and move next to a laptop.',
    answer: 'mouse',
  },
  {
    text: 'I grow quietly in the corner of the room and never say a word. What am I?',
    hint: 'A plant growing in a pot, usually in a corner.',
    answer: 'potted plant',
  },
  {
    text: 'I am yellow and curved, and you peel me before eating. What am I?',
    hint: 'A yellow fruit you peel to eat.',
    answer: 'banana',
  },
  {
    text: 'I keep the doctor away, or so they say, and I am red or green. What am I?',
    hint: 'A round fruit, often red or green.',
    answer: 'apple',
  },
  {
    text: 'I am made of layers stacked between two slices, perfect for a quick lunch. What am I?',
    hint: 'Food made with fillings between two slices of bread.',
    answer: 'sandwich',
  },
  {
    text: 'I carry your things but I am not a backpack, and I hang from your shoulder. What am I?',
    hint: 'A small bag carried over the shoulder.',
    answer: 'handbag',
  },
];
