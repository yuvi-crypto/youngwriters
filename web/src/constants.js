// ── Badge Definitions ────────────────────────────────────────
export const BADGES = {
  BRAVE_WRITER:     { id: 'brave_writer',     emoji: '✍️',  name: 'Brave Writer',     desc: 'Submitted your first story!',               xp: 50 },
  POET:             { id: 'poet',             emoji: '🎭',  name: 'Poet',              desc: 'Created your first poem!',                  xp: 50 },
  ESSAY_EXPLORER:   { id: 'essay_explorer',   emoji: '📝',  name: 'Essay Explorer',   desc: 'Wrote your first essay!',                   xp: 60 },
  CRITICAL_THINKER: { id: 'critical_thinker', emoji: '🧠',  name: 'Critical Thinker', desc: 'Wrote an opinion with a counter-argument!', xp: 80 },
  COMMUNITY_WRITER: { id: 'community_writer', emoji: '🌍',  name: 'Community Writer', desc: 'Shared your first piece with the community!', xp: 40 },
  CLASS_WRITER:     { id: 'class_writer',     emoji: '🏫',  name: 'Class Writer',     desc: 'Completed a teacher assignment!',            xp: 70 },
  CONTEST_STAR:     { id: 'contest_star',     emoji: '🏆',  name: 'Contest Star',     desc: 'Entered your first contest!',               xp: 100 },
  STREAK_KEEPER:    { id: 'streak_keeper',    emoji: '🔥',  name: 'Streak Keeper',    desc: 'Wrote 7 days in a row!',                    xp: 120 },
  WORD_WIZARD:      { id: 'word_wizard',      emoji: '🪄',  name: 'Word Wizard',      desc: 'Used 200 unique words!',                    xp: 90 },
  FIRST_DRAFT:      { id: 'first_draft',      emoji: '📄',  name: 'First Draft',      desc: 'Saved your very first draft!',              xp: 20 },
  SHARP_EYES:       { id: 'sharp_eyes',       emoji: '👁️',  name: 'Sharp Eyes',       desc: 'Spotted real details from the image in your story!', xp: 75 },
};

// ── Content Formats ──────────────────────────────────────────
export const FORMATS = [
  {
    id: 'story',
    label: 'Story',
    emoji: '📖',
    description: 'Let your imagination run wild!',
    minAge: 5,
    color: 'var(--color-primary)',
    gradient: 'var(--gradient-primary)',
    placeholder: 'Once upon a time...',
    scaffold: null,
  },
  {
    id: 'poem',
    label: 'Poem',
    emoji: '🎭',
    description: 'Play with words and feelings',
    minAge: 5,
    color: 'var(--color-pink)',
    gradient: 'linear-gradient(135deg, hsl(320,80%,62%), hsl(355,80%,65%))',
    placeholder: 'Roses are red...',
    scaffold: null,
  },
  {
    id: 'essay',
    label: 'Essay',
    emoji: '📝',
    description: 'Share what you think and why',
    minAge: 8,
    color: 'var(--color-secondary)',
    gradient: 'var(--gradient-warm)',
    placeholder: 'I believe that...',
    scaffold: ['What I think', 'Why I think it', 'An example that shows it'],
  },
  {
    id: 'opinion',
    label: 'Opinion',
    emoji: '💬',
    description: 'Argue your point of view',
    minAge: 8,
    color: 'var(--color-accent)',
    gradient: 'var(--gradient-green)',
    placeholder: 'In my opinion...',
    scaffold: ['My opinion', 'My reasons', 'The other side'],
    requiresCounterArg: true,
  },
];

// ── Image Library (Image Sprint) ───────────────────────────────
// Each image has:
//   id         — stable slug used in Mixpanel events
//   src        — path in /public/sprint-images/
//   title      — descriptive label shown in admin/logs only (never shown to child)
//   objects    — keywords the detail-match check scans for in the child’s story text
//   themes     — higher-level tags for content screening / future filtering
//   ageBands   — which age groups see this image
// Content rules: illustrated only, no real people, no copyrighted characters,
//   no identifiable real locations, content-screened.
export const IMAGE_LIBRARY = [
  {
    id: 'treehouse_forest',
    src: '/sprint-images/treehouse.png',
    title: 'Cozy Forest Treehouse',
    objects: ['treehouse', 'owl', 'lantern', 'mushroom', 'firefly', 'ladder', 'tree', 'branch', 'forest', 'rope'],
    themes: ['nature', 'adventure', 'magic'],
    ageBands: ['5-7', '8-12', '13-17'],
  },
  {
    id: 'underwater_treasure',
    src: '/sprint-images/underwater.png',
    title: 'Underwater Treasure',
    objects: ['treasure', 'chest', 'fish', 'coral', 'turtle', 'seaweed', 'bubble', 'ocean', 'coins', 'clownfish'],
    themes: ['ocean', 'adventure', 'mystery'],
    ageBands: ['5-7', '8-12', '13-17'],
  },
  {
    id: 'space_planet',
    src: '/sprint-images/space.png',
    title: 'Space Adventure',
    objects: ['rocket', 'planet', 'robot', 'moon', 'star', 'meteor', 'crater', 'alien', 'flower', 'nebula'],
    themes: ['space', 'science', 'adventure'],
    ageBands: ['8-12', '13-17'],
  },
  {
    id: 'bazaar_marketplace',
    src: '/sprint-images/bazaar.png',
    title: 'Colourful Bazaar',
    objects: ['lantern', 'marigold', 'peacock', 'pot', 'mango', 'spice', 'fabric', 'garland', 'stall', 'basket'],
    themes: ['india', 'culture', 'market'],
    ageBands: ['5-7', '8-12', '13-17'],
  },
  {
    id: 'monsoon_rain',
    src: '/sprint-images/rain.png',
    title: 'Monsoon Magic',
    objects: ['rain', 'puddle', 'boat', 'duck', 'frog', 'rainbow', 'mushroom', 'leaf', 'ripple', 'lily'],
    themes: ['weather', 'nature', 'cozy'],
    ageBands: ['5-7', '8-12', '13-17'],
  },
  {
    id: 'mountain_village',
    src: '/sprint-images/mountain.png',
    title: 'Mountain Village at Dusk',
    objects: ['cottage', 'mountain', 'deer', 'pine', 'chimney', 'moon', 'star', 'smoke', 'fence', 'path'],
    themes: ['travel', 'nature', 'peaceful'],
    ageBands: ['8-12', '13-17'],
  },
  {
    id: 'magic_library',
    src: '/sprint-images/library.png',
    title: 'The Magic Library',
    objects: ['book', 'bookshelf', 'cat', 'lamp', 'staircase', 'plant', 'dust', 'armchair', 'light', 'shelf'],
    themes: ['books', 'magic', 'cozy'],
    ageBands: ['5-7', '8-12', '13-17'],
  },
  {
    id: 'garden_butterflies',
    src: '/sprint-images/garden.png',
    title: 'Butterfly Garden',
    objects: ['butterfly', 'sunflower', 'rose', 'bee', 'bird', 'dragonfly', 'birdbath', 'watering can', 'lavender', 'fence'],
    themes: ['nature', 'garden', 'peaceful'],
    ageBands: ['5-7', '8-12', '13-17'],
  },
];

// ── Sharp Eyes badge threshold ──────────────────────────────────
// Child must mention at least this many tagged objects in their story.
export const SHARP_EYES_THRESHOLD = 2;

// ── Age Bands ────────────────────────────────────────────────
export const AGE_BANDS = [
  { id: 'early',  label: '5–7',   range: [5, 7] },
  { id: 'middle', label: '8–12',  range: [8, 12] },
  { id: 'teen',   label: '13–17', range: [13, 17] },
];

export function getAgeBand(age) {
  return AGE_BANDS.find((b) => age >= b.range[0] && age <= b.range[1]) || AGE_BANDS[1];
}

// ── Languages ────────────────────────────────────────────────
export const LANGUAGES = [
  { id: 'en', label: 'English',  nativeLabel: 'English', flag: '🇬🇧' },
  { id: 'te', label: 'Telugu',   nativeLabel: 'తెలుగు',  flag: '🇮🇳' },
  { id: 'hi', label: 'Hindi',    nativeLabel: 'हिन्दी',   flag: '🇮🇳' },
];

// ── Prompts by Age & Format ──────────────────────────────────
export const FALLBACK_PROMPTS = {
  story: {
    early:  ['What if trees could talk?', 'Your pet has a secret superpower!', 'A tiny dragon lives in your school bag.'],
    middle: ['Write about a day you felt brave.', 'What if you woke up invisible?', 'A letter from the future arrives at your door.'],
    teen:   ['What if schools had no walls?', 'You discover a hidden door in your city.', 'Write about a world without the internet.'],
  },
  poem: {
    early:  ['Write a 4-line poem about your favorite animal.', 'A poem about rain!', 'How does the moon feel at night?'],
    middle: ['Write about a colour using all your senses.', 'A poem about a place you love.', 'Describe a feeling without naming it.'],
    teen:   ['Write about something you wish you could change.', 'A poem from the perspective of a city.', 'What does silence sound like?'],
  },
  essay: {
    middle: ['Should homework be optional?', 'Why reading is a superpower.', 'Should schools have longer lunch breaks?'],
    teen:   ['Is social media good or bad for teenagers?', 'Why creativity matters more than grades.', 'Should students choose their own subjects?'],
  },
  opinion: {
    middle: ['Should kids be allowed to choose their own bedtime?', 'Is it better to have many friends or a few close ones?', 'Should junk food be banned in schools?'],
    teen:   ['Is technology making us smarter or lazier?', 'Should school uniforms be mandatory?', 'Are video games a waste of time?'],
  },
};

// ── Positive Feedback Templates ─────────────────────────────
export const POSITIVE_FEEDBACK = [
  "I love the way you described that! It really painted a picture in my mind. 🎨",
  "Your words have such a unique voice — keep going! ✨",
  "The ending you chose was so creative and surprising!",
  "You expressed your feelings so beautifully in this piece. 💛",
  "The details you included made this feel so real and vivid!",
  "I could really feel the emotion in your words! 🌟",
  "Your imagination is incredible — what a wonderful story!",
  "The way you opened this piece instantly drew me in!",
  "Your word choices were so vivid and expressive!",
  "This shows such thoughtful writing — you should be proud! 🏆",
];

export function getRandomFeedback() {
  return POSITIVE_FEEDBACK[Math.floor(Math.random() * POSITIVE_FEEDBACK.length)];
}

// ── Growth Nudges ────────────────────────────────────────────
export const GROWTH_NUDGES = {
  story: [
    "One thing to try next time: describe how the main character *feels* at one key moment.",
    "One thing to try next time: give your reader a surprise near the end!",
    "One thing to try next time: add one detail about what things *look*, *sound*, or *smell* like.",
  ],
  poem: [
    "One thing to try next time: repeat a special word or phrase to create a rhythm.",
    "One thing to try next time: compare something in your poem to something unexpected!",
    "One thing to try next time: end your poem with an image that lingers.",
  ],
  essay: [
    "One thing to try next time: start with a question to draw the reader in.",
    "One thing to try next time: add one specific example to support your main idea.",
    "One thing to try next time: end by restating your main point in a new way.",
  ],
  opinion: [
    "One thing to try next time: make your counter-argument even stronger — it shows you've really thought it through!",
    "One thing to try next time: use a real-life example to back up your opinion.",
    "One thing to try next time: start with your strongest reason first.",
  ],
};

export function getRandomNudge(format) {
  const nudges = GROWTH_NUDGES[format] || GROWTH_NUDGES.story;
  return nudges[Math.floor(Math.random() * nudges.length)];
}

// ── Sample Community Feed Data ────────────────────────────────
export const SAMPLE_FEED = [
  {
    id: 'f1',
    author: { name: 'Arjun K.',     avatar: 'A', ageBand: 'middle' },
    format: 'story',
    title: 'The Dragon Under the Stairs',
    excerpt: 'Nobody believed me when I said our house was magical. But every night at exactly 3am, I could hear it...',
    hearts: 47,
    comments: 8,
    liked: false,
    badge: 'Brave Writer',
    postedAt: '2h ago',
  },
  {
    id: 'f2',
    author: { name: 'Priya S.',     avatar: 'P', ageBand: 'middle' },
    format: 'poem',
    title: 'My City at Midnight',
    excerpt: 'The street lights blink like tired eyes,\nAnd rickshaws sing their lullabies...',
    hearts: 62,
    comments: 12,
    liked: true,
    badge: 'Poet',
    postedAt: '4h ago',
  },
  {
    id: 'f3',
    author: { name: 'Tanvi R.',     avatar: 'T', ageBand: 'teen' },
    format: 'opinion',
    title: 'Should Schools Start Later?',
    excerpt: 'Science says teenage brains need more sleep. So why do we still start school at 7:30 AM?',
    hearts: 89,
    comments: 21,
    liked: false,
    badge: 'Critical Thinker',
    postedAt: '6h ago',
  },
  {
    id: 'f4',
    author: { name: 'Rohan M.',     avatar: 'R', ageBand: 'early' },
    format: 'story',
    title: 'My Magical Pencil Box',
    excerpt: 'One morning I found a golden pencil in my box that could draw things that came alive!',
    hearts: 33,
    comments: 5,
    liked: false,
    badge: 'Brave Writer',
    postedAt: '8h ago',
  },
  {
    id: 'f5',
    author: { name: 'Sneha A.',     avatar: 'S', ageBand: 'teen' },
    format: 'essay',
    title: 'Why Reading is a Superpower',
    excerpt: 'In a world where everyone is glued to short videos, books remain the only technology that can make you live a thousand lives...',
    hearts: 74,
    comments: 16,
    liked: true,
    badge: 'Essay Explorer',
    postedAt: '12h ago',
  },
];

// ── Contest Data ─────────────────────────────────────────────
export const ACTIVE_CONTESTS = [
  {
    id: 'c1',
    theme: 'Stories of Kindness',
    emoji: '💛',
    deadline: '2026-07-15',
    ageBands: ['8–10', '11–13', '14–17'],
    formats: ['story', 'poem'],
    entries: 247,
    gradient: 'linear-gradient(135deg, hsl(32,95%,58%) 0%, hsl(355,80%,65%) 100%)',
  },
  {
    id: 'c2',
    theme: 'My City in 2050',
    emoji: '🏙️',
    deadline: '2026-08-01',
    ageBands: ['11–13', '14–17'],
    formats: ['essay', 'story', 'opinion'],
    entries: 183,
    gradient: 'linear-gradient(135deg, hsl(195,85%,55%) 0%, hsl(258,80%,62%) 100%)',
  },
];
