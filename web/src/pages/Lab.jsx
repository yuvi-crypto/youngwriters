import { useState, useRef, useEffect } from 'react';
import { useAuthStore, useAppStore } from '../store';
import { trackBadgeEarned } from '../analytics';
import { generateFeedback } from '../aiService';
import toast from 'react-hot-toast';
import {
  FiBookOpen,
  FiZap,
  FiAward,
  FiShuffle,
  FiHelpCircle,
  FiTarget,
  FiCheckCircle,
  FiAlertCircle,
  FiArrowLeft,
  FiCheck,
  FiAlertTriangle,
  FiPlay,
  FiActivity
} from 'react-icons/fi';
import './Lab.css';

// ── DICE STORY POOLS ─────────────────────────────────────────
const DICE_POOLS = {
  easy: {
    characters: [
      { name: 'Friendly Dragon 🐉', text: 'a friendly dragon who is afraid of fire', emoji: '🐉' },
      { name: 'Helper Robot 🤖', text: 'a helpful household robot who loves cooking', emoji: '🤖' },
      { name: 'Talking Puppy 🐶', text: 'a playful puppy who can speak to birds', emoji: '🐶' }
    ],
    locations: [
      { name: 'Treehouse 🏠', text: 'a multi-story treehouse high in a giant redwood', emoji: '🏠' },
      { name: 'Candy Island 🍭', text: 'a colorful island where the rivers are milkshakes', emoji: '🍭' },
      { name: 'Magic Forest 🌲', text: 'a glowing forest where trees whisper secrets', emoji: '🌲' }
    ],
    problems: [
      { name: 'Lost Toy 🧸', text: 'they lost their favorite teddy bear', emoji: '🧸' },
      { name: 'Forgot the Way 🗺️', text: 'they forgot how to get back home', emoji: '🗺️' },
      { name: 'Stuck Zipper 🧥', text: 'their winter jacket zipper gets stuck closed', emoji: '🧥' }
    ]
  },
  medium: {
    characters: [
      { name: 'Astronaut 👨‍🚀', text: 'a brave astronaut on their first space walk', emoji: '👨‍🚀' },
      { name: 'Deep-sea Diver 🤿', text: 'a marine biologist exploring the twilight zone', emoji: '🤿' },
      { name: 'Archaeologist 🤠', text: 'a history professor searching for lost temples', emoji: '🤠' }
    ],
    locations: [
      { name: 'Underwater City 🏙️', text: 'a glass-domed city at the bottom of the ocean', emoji: '🏙️' },
      { name: 'Floating Castle 🏰', text: 'a stone castle floating high above the clouds', emoji: '🏰' },
      { name: 'Dinosaur Jungle 🦖', text: 'a prehistoric valley forgotten by time', emoji: '🦖' }
    ],
    problems: [
      { name: 'No Signal 📡', text: 'their communication device stops working', emoji: '📡' },
      { name: 'Broken Compass 🧭', text: 'their navigation compass points in circles', emoji: '🧭' },
      { name: 'Strange Footprint 👣', text: 'they discover a massive, unknown footprint', emoji: '👣' }
    ]
  },
  teen: {
    characters: [
      { name: 'AI Scientist 💻', text: 'a computer scientist building a sentient AI', emoji: '💻' },
      { name: 'Time Traveler ⏳', text: 'a historian stuck in the wrong decade', emoji: '⏳' },
      { name: 'Secret Agent 🕵️', text: 'a field agent decrypting a compromised drive', emoji: '🕵️' }
    ],
    locations: [
      { name: 'Cyberpunk Alley 🌆', text: 'a neon-drenched alleyway in Neo-Hyderabad', emoji: '🌆' },
      { name: 'Mars Colony 🚀', text: 'a research dome on the dusty red plains of Mars', emoji: '🚀' },
      { name: 'Forgotten Library 📚', text: 'a underground vault containing ancient books', emoji: '📚' }
    ],
    problems: [
      { name: 'Memory Leak 💾', text: 'the AI system starts losing its oldest memories', emoji: '💾' },
      { name: 'Time Fracture ⏱️', text: 'a rift causes the last 5 minutes to repeat over and over', emoji: '⏱️' },
      { name: 'Security Breach 🔐', text: 'a firewall alert shows a remote breach in progress', emoji: '🔐' }
    ],
    emotions: ['Anxiety', 'Excitement', 'Guilt'],
    twists: [
      'A key helper is revealed to be an AI projection',
      'Gravity begins to fluctuate and reverse',
      'The character realizes they have been here before'
    ],
    themes: ['Legacy', 'Identity', 'Sacrifice']
  }
};

const RANDOM_CHAR_EMOJIS = ['🐉', '🤖', '🐶', '👨‍🚀', '🤿', '🤠', '💻', '⏳', '🕵️', '🦊', '🦄', '🧙'];
const RANDOM_LOC_EMOJIS = ['🏠', '🍭', '🌲', '🏙️', '🏰', '🦖', '🌆', '🚀', '📚', '🌋', '🛸', '🎪'];
const RANDOM_PROB_EMOJIS = ['🧸', '🗺️', '🧥', '📡', '🧭', '👣', '💾', '⏱️', '🔐', '🔑', '⛈️', '🎈'];

// ── MYSTERY CASES ───────────────────────────────────────────
const MYSTERIES = [
  {
    title: 'The Wet Jacket Mystery',
    difficulty: 'Easy',
    xpReward: 30,
    narrative: `Three children entered a museum gallery. A few minutes later, only Charlie left with a wet jacket, even though it wasn't raining outside, there was no sink in the gallery, and no one else was wet. What happened?`,
    clues: [
      { label: 'Charlie\'s Bag', text: 'Charlie was carrying a canvas backpack when he entered.' },
      { label: 'Exhibit Theme', text: 'The gallery was hosting a temporary exhibition on arctic ice sculptures.' },
      { label: 'Backpack Leak', text: 'The bottom of Charlie\'s backpack was dripping wet.' }
    ],
    options: [
      { id: 'A', text: 'He was hiding a secret water balloon in his hood.' },
      { id: 'B', text: 'He put ice sculpture fragments in his bag to keep, which melted.' },
      { id: 'C', text: 'The museum roof was leaking directly over Charlie\'s head.' }
    ],
    correctId: 'B',
    explanation: 'Charlie tried to sneak out a souvenir from the arctic ice sculpture exhibit. The ice melted in his canvas backpack, soaking the back of his jacket!'
  },
  {
    title: 'The Safe Passcode Riddle',
    difficulty: 'Medium',
    xpReward: 40,
    narrative: `A security safe at the research center requires a 4-letter code. The prompt reads: 'First of September, third of December, second of April, fourth of January'. What code opens the safe?`,
    clues: [
      { label: 'Month Order', text: 'September is month 9, December is month 12, April is month 4, January is month 1.' },
      { label: 'Spelling Clue', text: 'Look at the actual letters that make up the words of the months.' },
      { label: 'Letter Position', text: 'Count from the beginning of each month name to find the letter.' }
    ],
    options: [
      { id: 'A', text: 'S-D-A-J (First letters of the months)' },
      { id: 'B', text: 'S-C-P-U (Letters at the specified positions)' },
      { id: 'C', text: 'E-C-P-N (The vowels in the names)' }
    ],
    correctId: 'B',
    explanation: `Taking the letters at the specified positions:
- 1st of September = "S"
- 3rd of December = "c" (DeCember)
- 2nd of April = "p" (APril)
- 4th of January = "u" (JanUary)
Hence, the code is S-C-P-U!`
  }
];

// ── FALLACY CHALLENGES ──────────────────────────────────────
const FALLACIES = [
  {
    statement: `“All successful writers wake up at 5 AM. If you don't wake up at 5 AM, you will never write a good book.”`,
    difficulty: 'Medium',
    xpReward: 25,
    options: [
      { id: 'A', label: 'False Assumption / Hasty Generalization', text: 'It assumes a single habit is the sole cause of success based on insufficient evidence.' },
      { id: 'B', label: 'Emotional Appeal', text: 'It uses threats or flattery to convince people rather than logical evidence.' },
      { id: 'C', label: 'Circular Reasoning', text: 'It restates the conclusion in the premise without proving anything.' }
    ],
    correctId: 'A',
    explanation: 'This statement is a Hasty Generalization/False Assumption. Many successful writers work at night or during the day; sleep schedules do not guarantee writing talent.'
  },
  {
    statement: `“If we let students choose their own reading books in school, they will only choose comic books, then they will stop reading text altogether, fail their exams, and never get into university!”`,
    difficulty: 'Hard',
    xpReward: 35,
    options: [
      { id: 'A', label: 'False Analogy', text: 'It compares two things that are not actually alike to draw a conclusion.' },
      { id: 'B', label: 'Slippery Slope Fallacy', text: 'It claims that a small first step will inevitably lead to extreme, negative consequences without any proof.' },
      { id: 'C', label: 'Ad Hominem', text: 'It attacks the character of the speaker rather than their argument.' }
    ],
    correctId: 'B',
    explanation: 'This is a Slippery Slope fallacy. It assumes a chain reaction of worst-case scenarios from a simple starting point (letting kids pick books) without supporting evidence.'
  }
];

// ── STORY CARDS FOR ORDERING ─────────────────────────────────
const STORY_CARDS_INITIAL = [
  { id: 'A', role: 'Beginning', content: 'Oliver found a dusty brass key inside an old hollow oak tree in his backyard.' },
  { id: 'B', role: 'Conflict', content: 'He tried it on the locked trapdoor in the attic, but the key snapped in half inside the rusty keyhole.' },
  { id: 'C', role: 'Climax', content: 'Oliver used a strong bar magnet from his science kit to pull the broken half out and turned the lock with pliers.' },
  { id: 'D', role: 'Resolution', content: 'The trapdoor clicked open, revealing a chest of hand-written journals from 1920.' }
];

// ── PERSPECTIVE SWITCH SCENARIOS ──────────────────────────────
const PERSPECTIVE_SCENARIOS = [
  {
    title: 'The Forgotten Homework',
    narrative: 'Charlie arrived at school and realized his math folder was left on the dining table. He froze as the teacher approached to collect it...',
    perspectives: [
      { id: 'teacher', role: 'Mrs. Gable (Strict Teacher)', avatar: '👩‍🏫', hint: 'Write about keeping classroom rules, responsibility, but also describe your feelings if you notice Charlie\'s pale face.' },
      { id: 'mother', role: 'Charlie\'s Mom', avatar: '👩', hint: 'You just found the math folder on the dining table. Rushing to the car, you get caught in a traffic jam.' },
      { id: 'dog', role: 'Buster (Family Dog)', avatar: '🐶', hint: 'The paper smells like pencil and bacon. You decided it makes a great chew toy under the sofa.' }
    ]
  },
  {
    title: 'The Giant Pumpkin Heist',
    narrative: 'Grandma won 1st prize at the village fair for her massive pumpkin. But at midnight, the pumpkin vanished from the display stand...',
    perspectives: [
      { id: 'grandma', role: 'Grandma Clara', avatar: '👩‍🌾', hint: 'Heartbroken and furious! You worked all summer on it. You suspect rival farmer Pete.' },
      { id: 'ribbon', role: 'The Gold Ribbon', avatar: '🏆', hint: 'You are left hanging on the empty stand. Tell what you saw at midnight—footprints, shadows, and weird slime.' },
      { id: 'raccoon', role: 'Rocky the Raccoon', avatar: '🦝', hint: 'Explain the details of your master pumpkin heist with your forest buddies.' }
    ]
  }
];

export default function Lab() {
  const { profile } = useAuthStore();
  const { addXP, awardBadge, addPiece } = useAppStore();

  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard | dice | mystery | fallacy | structure | perspective

  // ── STORY DICE STATE ──
  const [complexity, setComplexity] = useState('medium');
  const [diceRolled, setDiceRolled] = useState(false);
  const [rolling, setRolling] = useState(false);
  const [rolledData, setRolledData] = useState(null);
  const [cycleEmojis, setCycleEmojis] = useState({ char: '❓', loc: '❓', prob: '❓' });
  const [storyTitle, setStoryTitle] = useState('');
  const [storyContent, setStoryContent] = useState('');
  const [diceFeedback, setDiceFeedback] = useState('');
  const [submittingStory, setSubmittingStory] = useState(false);

  // ── MYSTERY STATE ──
  const [mysteryIndex, setMysteryIndex] = useState(0);
  const [selectedClues, setSelectedClues] = useState([false, false, false]);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [mysterySubmitted, setMysterySubmitted] = useState(false);
  const [mysterySuccess, setMysterySuccess] = useState(false);

  // ── FALLACY STATE ──
  const [fallacyIndex, setFallacyIndex] = useState(0);
  const [selectedFallacyOpt, setSelectedFallacyOpt] = useState('');
  const [fallacySubmitted, setFallacySubmitted] = useState(false);
  const [fallacySuccess, setFallacySuccess] = useState(false);

  // ── STRUCTURE PUZZLE STATE ──
  const [puzzleCards, setPuzzleCards] = useState([...STORY_CARDS_INITIAL].sort(() => Math.random() - 0.5));
  const [puzzleChecked, setPuzzleChecked] = useState(false);
  const [puzzleSuccess, setPuzzleSuccess] = useState(false);

  // ── PERSPECTIVE SWITCH STATE ──
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [selectedPerspId, setSelectedPerspId] = useState('');
  const [perspContent, setPerspContent] = useState('');
  const [perspSubmitted, setPerspSubmitted] = useState(false);
  const [perspFeedback, setPerspFeedback] = useState('');
  const [submittingPersp, setSubmittingPersp] = useState(false);

  // ── ROLL DICE HANDLER (Animated Slot-Machine) ──
  const rollDice = () => {
    setRolling(true);
    setDiceFeedback('');
    setStoryContent('');
    setStoryTitle('');
    setDiceRolled(false);

    // Emojis cycling intervals
    const interval = setInterval(() => {
      setCycleEmojis({
        char: RANDOM_CHAR_EMOJIS[Math.floor(Math.random() * RANDOM_CHAR_EMOJIS.length)],
        loc: RANDOM_LOC_EMOJIS[Math.floor(Math.random() * RANDOM_LOC_EMOJIS.length)],
        prob: RANDOM_PROB_EMOJIS[Math.floor(Math.random() * RANDOM_PROB_EMOJIS.length)]
      });
    }, 80);

    setTimeout(() => {
      clearInterval(interval);
      const pool = DICE_POOLS[complexity];
      const randomChar = pool.characters[Math.floor(Math.random() * pool.characters.length)];
      const randomLoc = pool.locations[Math.floor(Math.random() * pool.locations.length)];
      const randomProb = pool.problems[Math.floor(Math.random() * pool.problems.length)];

      let data = {
        character: randomChar,
        location: randomLoc,
        problem: randomProb
      };

      if (complexity === 'teen') {
        data.emotion = pool.emotions[Math.floor(Math.random() * pool.emotions.length)];
        data.twist = pool.twists[Math.floor(Math.random() * pool.twists.length)];
        data.theme = pool.themes[Math.floor(Math.random() * pool.themes.length)];
      }

      setCycleEmojis({
        char: randomChar.emoji || '🐉',
        loc: randomLoc.emoji || '🏠',
        prob: randomProb.emoji || '🧸'
      });
      setRolledData(data);
      setDiceRolled(true);
      setRolling(false);
    }, 1200);
  };

  // ── SUBMIT DICE STORY ──
  const submitDiceStory = async (e) => {
    e.preventDefault();
    if (!storyContent.trim()) return;

    setSubmittingStory(true);
    try {
      const savedPiece = {
        id: crypto.randomUUID(),
        authorId: profile?.uid || 'anonymous',
        type: 'story',
        title: storyTitle || 'My Dice Story',
        content: storyContent,
        language: profile?.language || 'en',
        status: 'private',
        wordCount: storyContent.trim().split(/\s+/).filter(Boolean).length,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      addPiece(savedPiece);

      const aiFeedback = await generateFeedback(storyContent, 'story', profile?.age || 12);
      setDiceFeedback(aiFeedback);

      addXP(50);
      awardBadge({
        id: 'story_dicemaster',
        name: 'Story Dicemaster 🎲',
        emoji: '🎲',
        desc: 'Rolled the Story Dice and constructed an adaptable story!'
      });
      toast.success('Nice story! +50 XP and Story Dicemaster Badge Earned!');
    } catch (err) {
      toast.error('Could not analyze story. Saved draft.');
    } finally {
      setSubmittingStory(false);
    }
  };

  // ── MYSTERY SUBMIT HANDLER ──
  const checkMysteryAnswer = () => {
    if (!selectedAnswer) return;
    const current = MYSTERIES[mysteryIndex];
    const isCorrect = selectedAnswer === current.correctId;
    setMysterySuccess(isCorrect);
    setMysterySubmitted(true);

    if (isCorrect) {
      addXP(current.xpReward);
      awardBadge({
        id: 'junior_detective',
        name: 'Junior Detective 🔍',
        emoji: '🔍',
        desc: 'Solved a critical thinking mystery case in the Lab!'
      });
      toast.success(`Correct! +${current.xpReward} XP & Junior Detective Badge!`);
    } else {
      toast.error('Oops! That was not the right clue link. Try again!');
    }
  };

  // ── FALLACY SUBMIT HANDLER ──
  const checkFallacyAnswer = () => {
    if (!selectedFallacyOpt) return;
    const current = FALLACIES[fallacyIndex];
    const isCorrect = selectedFallacyOpt === current.correctId;
    setFallacySuccess(isCorrect);
    setFallacySubmitted(true);

    if (isCorrect) {
      addXP(current.xpReward);
      awardBadge({
        id: 'critical_thinker_pro',
        name: 'Critical Thinker Pro 🧠',
        emoji: '🧠',
        desc: 'Successfully spotted logical fallacies in statements!'
      });
      toast.success(`Spot on! +${current.xpReward} XP & Critical Thinker Pro Badge!`);
    } else {
      toast.error('Not quite! Check the explanation to see why.');
    }
  };

  // ── PUZZLE HANDLERS ──
  const moveCard = (index, direction) => {
    const nextIdx = index + direction;
    if (nextIdx < 0 || nextIdx >= puzzleCards.length) return;
    const updated = [...puzzleCards];
    const temp = updated[index];
    updated[index] = updated[nextIdx];
    updated[nextIdx] = temp;
    setPuzzleCards(updated);
    setPuzzleChecked(false);
  };

  const checkPuzzleOrder = () => {
    const isCorrect = puzzleCards.every((card, idx) => {
      const correctIdx = STORY_CARDS_INITIAL.findIndex(c => c.id === card.id);
      return correctIdx === idx;
    });

    setPuzzleSuccess(isCorrect);
    setPuzzleChecked(true);

    if (isCorrect) {
      addXP(20);
      toast.success('Perfect ordering! +20 XP awarded.');
    } else {
      toast.error('The chronology feels off. Rearrange and try again!');
    }
  };

  const resetPuzzle = () => {
    setPuzzleCards([...STORY_CARDS_INITIAL].sort(() => Math.random() - 0.5));
    setPuzzleChecked(false);
    setPuzzleSuccess(false);
  };

  // ── PERSPECTIVE SUBMIT HANDLER ──
  const submitPerspective = async (e) => {
    e.preventDefault();
    if (!perspContent.trim() || !selectedPerspId) return;

    setSubmittingPersp(true);
    try {
      const scenario = PERSPECTIVE_SCENARIOS[scenarioIndex];
      const character = scenario.perspectives.find(p => p.id === selectedPerspId);
      
      const savedPiece = {
        id: crypto.randomUUID(),
        authorId: profile?.uid || 'anonymous',
        type: 'story',
        title: `${scenario.title} (${character.role})`,
        content: perspContent,
        language: profile?.language || 'en',
        status: 'private',
        wordCount: perspContent.trim().split(/\s+/).filter(Boolean).length,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      addPiece(savedPiece);

      // Call AI coach feedback helper
      const aiFeedback = await generateFeedback(
        `[Perspective: ${character.role}] Original Scenario: ${scenario.narrative} Writing: ${perspContent}`,
        'story',
        profile?.age || 12
      );
      setPerspFeedback(aiFeedback);

      addXP(40);
      awardBadge({
        id: 'perspective_master',
        name: 'Perspective Master 🎭',
        emoji: '🎭',
        desc: 'Adopted alternative character viewpoints in the Lab!'
      });
      toast.success('Excellent perspective writing! +40 XP & Badge Earned!');
      setPerspSubmitted(true);
    } catch (err) {
      toast.error('Failed to submit. Draft saved.');
    } finally {
      setSubmittingPersp(false);
    }
  };

  return (
    <div className="lab-page container">
      {/* ─── Back Button (Sub-Activities) ─── */}
      {activeTab !== 'dashboard' && (
        <button className="lab-back-btn" onClick={() => setActiveTab('dashboard')}>
          <FiArrowLeft /> Back to Lab Dashboard
        </button>
      )}

      {/* ─── TAB 1: DASHBOARD ─── */}
      {activeTab === 'dashboard' && (
        <div className="lab-dashboard animate-fade-in">
          <div className="lab-header">
            <div className="lab-header-icon">🧠</div>
            <div>
              <h1>Critical Thinking & Creativity Lab</h1>
              <p>Train your logical deduction, perspective-taking, and narrative mechanics with interactive lab tools.</p>
            </div>
          </div>

          <div className="lab-clusters">
            {/* Cluster A */}
            <div className="lab-cluster-card animate-slide-up">
              <div className="cluster-header">
                <span className="cluster-emoji">🌌</span>
                <h3>Creative Story Catalyst</h3>
              </div>
              <p className="cluster-desc">Kickstart writing flow, build imagery, and structure beautiful story cover graphics.</p>
              <div className="activity-list">
                <button className="activity-item-btn" onClick={() => setActiveTab('dice')}>
                  <span className="btn-icon">🎲</span>
                  <div className="btn-info">
                    <strong>Story Dice Roller</strong>
                    <span>Roll plot parameters & draft a story</span>
                  </div>
                  <span className="btn-arrow">→</span>
                </button>
                <div className="activity-item-btn locked">
                  <span className="btn-icon">👁️</span>
                  <div className="btn-info">
                    <strong>Observation challenge</strong>
                    <span>Answer details on paintings before writing</span>
                  </div>
                  <span className="badge-locked">Image Sprint</span>
                </div>
              </div>
            </div>

            {/* Cluster B */}
            <div className="lab-cluster-card animate-slide-up">
              <div className="cluster-header">
                <span className="cluster-emoji">🧩</span>
                <h3>Logic & Detective Hub</h3>
              </div>
              <p className="cluster-desc">Flex your deduction, clues analysis, and chronological narrative sequencing skills.</p>
              <div className="activity-list">
                <button className="activity-item-btn" onClick={() => setActiveTab('mystery')}>
                  <span className="btn-icon">🔍</span>
                  <div className="btn-info">
                    <strong>Mystery Solver Game</strong>
                    <span>Investigate clues to solve mini-cases</span>
                  </div>
                  <span className="btn-arrow">→</span>
                </button>
                <button className="activity-item-btn" onClick={() => { resetPuzzle(); setActiveTab('structure'); }}>
                  <span className="btn-icon">🥞</span>
                  <div className="btn-info">
                    <strong>Story Structure Puzzle</strong>
                    <span>Arrange segments chronologically</span>
                  </div>
                  <span className="btn-arrow">→</span>
                </button>
              </div>
            </div>

            {/* Cluster C */}
            <div className="lab-cluster-card animate-slide-up">
              <div className="cluster-header">
                <span className="cluster-emoji">⚔️</span>
                <h3>Perspective & Debate Arena</h3>
              </div>
              <p className="cluster-desc">Understand other viewpoints, write opposing perspectives, and spot logical fallacies.</p>
              <div className="activity-list">
                <button className="activity-item-btn" onClick={() => setActiveTab('perspective')}>
                  <span className="btn-icon">🎭</span>
                  <div className="btn-info">
                    <strong>Perspective Switch</strong>
                    <span>Write a scene from a character's viewpoint</span>
                  </div>
                  <span className="btn-arrow">→</span>
                </button>
                <button className="activity-item-btn" onClick={() => setActiveTab('fallacy')}>
                  <span className="btn-icon">💡</span>
                  <div className="btn-info">
                    <strong>Spot the Weak Argument</strong>
                    <span>Identify fallacies in common opinions</span>
                  </div>
                  <span className="btn-arrow">→</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: STORY DICE ─── */}
      {activeTab === 'dice' && (
        <div className="lab-activity-container animate-fade-in">
          <div className="activity-title-bar">
            <h2>🎲 Story Dice Roller</h2>
            <div className="complexity-selector">
              <button className={complexity === 'easy' ? 'active' : ''} onClick={() => setComplexity('easy')}>Easy</button>
              <button className={complexity === 'medium' ? 'active' : ''} onClick={() => setComplexity('medium')}>Medium</button>
              <button className={complexity === 'teen' ? 'active' : ''} onClick={() => setComplexity('teen')}>Teen (Adv)</button>
            </div>
          </div>

          <div className="dice-intro">
            <p>Roll the physical-style creative dice to get a random plot. Combine them into an adventure!</p>
            <button className="btn btn-primary dice-roll-btn animate-pulse-glow" onClick={rollDice} disabled={rolling}>
              <FiShuffle /> {rolling ? 'Rolling...' : 'Roll Dice!'}
            </button>
          </div>

          {/* Dice rolling layout */}
          <div className="dice-container-panel">
            <div className={`die-face ${rolling ? 'rolling-die' : ''}`}>
              <div className="die-tag">CHARACTER</div>
              <div className="die-emoji">{rolling ? cycleEmojis.char : (rolledData ? cycleEmojis.char : '👤')}</div>
              <div className="die-title">{rolledData && !rolling ? rolledData.character.name : 'Ready...'}</div>
            </div>
            <div className={`die-face location-die ${rolling ? 'rolling-die' : ''}`}>
              <div className="die-tag">LOCATION</div>
              <div className="die-emoji">{rolling ? cycleEmojis.loc : (rolledData ? cycleEmojis.loc : '📍')}</div>
              <div className="die-title">{rolledData && !rolling ? rolledData.location.name : 'Ready...'}</div>
            </div>
            <div className={`die-face problem-die ${rolling ? 'rolling-die' : ''}`}>
              <div className="die-tag">PROBLEM</div>
              <div className="die-emoji">{rolling ? cycleEmojis.prob : (rolledData ? cycleEmojis.prob : '⚠️')}</div>
              <div className="die-title">{rolledData && !rolling ? rolledData.problem.name : 'Ready...'}</div>
            </div>
          </div>

          {diceRolled && !rolling && rolledData && (
            <div className="dice-details-panel animate-fade-in">
              <div className="details-header">Rolled Parameters:</div>
              <ul>
                <li><strong>Character:</strong> {rolledData.character.text}</li>
                <li><strong>Location:</strong> {rolledData.location.text}</li>
                <li><strong>Problem:</strong> {rolledData.problem.text}</li>
                {complexity === 'teen' && (
                  <>
                    <li><strong>Emotion Indicator:</strong> 🎭 {rolledData.emotion}</li>
                    <li><strong>Required Plot Twist:</strong> 🌀 {rolledData.twist}</li>
                    <li><strong>Core Theme:</strong> 🌱 {rolledData.theme}</li>
                  </>
                )}
              </ul>
            </div>
          )}

          {diceRolled && !rolling && rolledData && (
            <form onSubmit={submitDiceStory} className="dice-editor card animate-fade-in mt-4">
              <h3>Draft Your Dice Story</h3>
              <div className="form-group">
                <label>Story Title</label>
                <input
                  type="text"
                  placeholder="E.g., The Midnight Signal"
                  value={storyTitle}
                  onChange={(e) => setStoryTitle(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Your Story Content</label>
                <textarea
                  placeholder="Combine the three dice parameters into a creative story..."
                  rows={8}
                  value={storyContent}
                  onChange={(e) => setStoryContent(e.target.value)}
                  required
                />
              </div>
              {!diceFeedback ? (
                <button type="submit" className="btn btn-primary" disabled={submittingStory}>
                  <FiZap /> {submittingStory ? 'Evaluating...' : 'Submit Story for Coaching Feedback'}
                </button>
              ) : (
                <div className="dice-feedback-box animate-fade-in">
                  <div className="feedback-header">
                    <h4>💡 AI Writing Coach Feedback</h4>
                  </div>
                  <p>{diceFeedback}</p>
                  <button type="button" className="btn btn-secondary mt-3" onClick={() => { setDiceRolled(false); rollDice(); }}>
                    Roll Again!
                  </button>
                </div>
              )}
            </form>
          )}
        </div>
      )}

      {/* ─── TAB 3: MYSTERY SOLVER ─── */}
      {activeTab === 'mystery' && (
        <div className="lab-activity-container animate-fade-in">
          <div className="activity-title-bar">
            <h2>🔍 Mystery Solver Case #{mysteryIndex + 1}</h2>
            <span className="difficulty-badge">{MYSTERIES[mysteryIndex].difficulty}</span>
          </div>

          <div className="mystery-card card">
            <div className="mystery-question">
              <h3>{MYSTERIES[mysteryIndex].title}</h3>
              <p className="narrative-text">{MYSTERIES[mysteryIndex].narrative}</p>
            </div>

            <div className="mystery-clues-section">
              <h4>Examine Clues (Tap to unlock evidence)</h4>
              <div className="clues-list">
                {MYSTERIES[mysteryIndex].clues.map((clue, idx) => (
                  <div key={idx} className={`clue-bubble ${selectedClues[idx] ? 'unlocked' : ''}`} onClick={() => {
                    const next = [...selectedClues];
                    next[idx] = true;
                    setSelectedClues(next);
                  }}>
                    <div className="clue-label">🔎 {clue.label}</div>
                    {selectedClues[idx] ? <p className="clue-content animate-fade-in">{clue.text}</p> : <span className="clue-placeholder">Click to inspect</span>}
                  </div>
                ))}
              </div>
            </div>

            <div className="mystery-options-section">
              <h4>Select Your Deduction Answer</h4>
              <div className="options-grid">
                {MYSTERIES[mysteryIndex].options.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    className={`option-btn ${selectedAnswer === opt.id ? 'selected' : ''}`}
                    onClick={() => setSelectedAnswer(opt.id)}
                    disabled={mysterySubmitted}
                  >
                    <span className="option-letter">{opt.id}</span>
                    <span className="option-text">{opt.text}</span>
                  </button>
                ))}
              </div>

              {!mysterySubmitted ? (
                <button className="btn btn-primary mt-4" onClick={checkMysteryAnswer} disabled={!selectedAnswer}>
                  Check Deduction
                </button>
              ) : (
                <div className={`mystery-result animate-fade-in ${mysterySuccess ? 'success' : 'fail'}`}>
                  <div className="result-header">
                    {mysterySuccess ? <FiCheckCircle /> : <FiAlertCircle />}
                    <h4>{mysterySuccess ? 'Correct Deduction!' : 'Incorrect Clue Association'}</h4>
                  </div>
                  <p className="explanation-text">{MYSTERIES[mysteryIndex].explanation}</p>
                  <div className="flex gap-3 mt-4">
                    <button className="btn btn-ghost" onClick={() => {
                      setMysterySubmitted(false);
                      setSelectedAnswer('');
                      setSelectedClues([false, false, false]);
                    }}>Try Case Again</button>
                    {mysteryIndex < MYSTERIES.length - 1 && (
                      <button className="btn btn-primary" onClick={() => {
                        setMysteryIndex(prev => prev + 1);
                        setMysterySubmitted(false);
                        setSelectedAnswer('');
                        setSelectedClues([false, false, false]);
                      }}>Next Case</button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 4: SPOT THE WEAK ARGUMENT ─── */}
      {activeTab === 'fallacy' && (
        <div className="lab-activity-container animate-fade-in">
          <div className="activity-title-bar">
            <h2>💡 Spot the Weak Argument</h2>
            <span className="difficulty-badge">{FALLACIES[fallacyIndex].difficulty}</span>
          </div>

          <div className="fallacy-card card">
            <div className="fallacy-statement">
              <span className="quote-icon">“</span>
              <p>{FALLACIES[fallacyIndex].statement}</p>
            </div>

            <div className="fallacy-options">
              <h4>What is the primary flaw in this argument?</h4>
              <div className="fallacy-options-list">
                {FALLACIES[fallacyIndex].options.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    className={`fallacy-opt-btn ${selectedFallacyOpt === opt.id ? 'selected' : ''}`}
                    onClick={() => setSelectedFallacyOpt(opt.id)}
                    disabled={fallacySubmitted}
                  >
                    <span className="opt-letter">{opt.id}</span>
                    <div className="opt-text">
                      <strong>{opt.label}</strong>
                      <p>{opt.text}</p>
                    </div>
                  </button>
                ))}
              </div>

              {!fallacySubmitted ? (
                <button className="btn btn-primary mt-4" onClick={checkFallacyAnswer} disabled={!selectedFallacyOpt}>
                  Submit Classification
                </button>
              ) : (
                <div className={`fallacy-result animate-fade-in ${fallacySuccess ? 'success' : 'fail'}`}>
                  <div className="result-header">
                    {fallacySuccess ? <FiCheckCircle /> : <FiAlertCircle />}
                    <h4>{fallacySuccess ? 'Fallacy Identified!' : 'Wrong Classification'}</h4>
                  </div>
                  <p className="explanation-text">{FALLACIES[fallacyIndex].explanation}</p>
                  <div className="flex gap-3 mt-4">
                    <button className="btn btn-ghost" onClick={() => {
                      setFallacySubmitted(false);
                      setSelectedFallacyOpt('');
                    }}>Try Again</button>
                    {fallacyIndex < FALLACIES.length - 1 && (
                      <button className="btn btn-primary" onClick={() => {
                        setFallacyIndex(prev => prev + 1);
                        setFallacySubmitted(false);
                        setSelectedFallacyOpt('');
                      }}>Next Fallacy</button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 5: STORY STRUCTURE PUZZLE ─── */}
      {activeTab === 'structure' && (
        <div className="lab-activity-container animate-fade-in">
          <div className="activity-title-bar">
            <h2>🥞 Story Structure Puzzle (N-Queens for Writers)</h2>
            <span className="difficulty-badge">Easy</span>
          </div>

          <div className="structure-card card">
            <p className="instructions">
              The segments of this story are scrambled! Arrange them in the correct narrative sequence: 
              <strong> Beginning → Conflict → Climax → Resolution</strong>.
            </p>

            <div className="cards-sequence-list">
              {puzzleCards.map((card, idx) => (
                <div key={card.id} className="sequence-item-card">
                  <div className="item-position">#{idx + 1}</div>
                  <div className="item-body">
                    <span className="item-role">{card.role} Card</span>
                    <p>{card.content}</p>
                  </div>
                  <div className="item-controls">
                    <button className="control-arrow" onClick={() => moveCard(idx, -1)} disabled={idx === 0}>▲</button>
                    <button className="control-arrow" onClick={() => moveCard(idx, 1)} disabled={idx === puzzleCards.length - 1}>▼</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="puzzle-action-buttons">
              {!puzzleChecked ? (
                <button className="btn btn-primary" onClick={checkPuzzleOrder}>
                  Validate Chronology
                </button>
              ) : (
                <div className={`puzzle-result animate-fade-in ${puzzleSuccess ? 'success' : 'fail'}`}>
                  <div className="result-header">
                    {puzzleSuccess ? <FiCheckCircle /> : <FiAlertCircle />}
                    <h4>{puzzleSuccess ? 'Perfect Sequence!' : 'Sequence is Incorrect'}</h4>
                  </div>
                  <p className="explanation-text">
                    {puzzleSuccess 
                      ? 'Excellent job! You correctly built the story skeleton.' 
                      : 'The transition between beginning, conflict, and climax does not feel chronological. Check the arrows and re-order!'}
                  </p>
                  <div className="flex gap-3 mt-4">
                    <button className="btn btn-secondary" onClick={resetPuzzle}>Reshuffle</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 6: PERSPECTIVE SWITCH ─── */}
      {activeTab === 'perspective' && (
        <div className="lab-activity-container animate-fade-in">
          <div className="activity-title-bar">
            <h2>🎭 Perspective Switch Challenge</h2>
            <div className="scenario-selector">
              {PERSPECTIVE_SCENARIOS.map((sc, idx) => (
                <button
                  key={idx}
                  className={scenarioIndex === idx ? 'active' : ''}
                  onClick={() => {
                    setScenarioIndex(idx);
                    setSelectedPerspId('');
                    setPerspContent('');
                    setPerspSubmitted(false);
                    setPerspFeedback('');
                  }}
                >
                  Case #{idx + 1}
                </button>
              ))}
            </div>
          </div>

          <div className="perspective-layout card">
            <div className="scenario-details mb-4">
              <h3>Original Scenario: {PERSPECTIVE_SCENARIOS[scenarioIndex].title}</h3>
              <p className="narrative-text">{PERSPECTIVE_SCENARIOS[scenarioIndex].narrative}</p>
            </div>

            <div className="perspectives-selection mb-4">
              <h4>Choose a Perspective to Adopt:</h4>
              <div className="persp-avatars-grid">
                {PERSPECTIVE_SCENARIOS[scenarioIndex].perspectives.map((persp) => (
                  <button
                    key={persp.id}
                    type="button"
                    className={`persp-avatar-btn ${selectedPerspId === persp.id ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedPerspId(persp.id);
                      setPerspFeedback('');
                      setPerspSubmitted(false);
                    }}
                    disabled={perspSubmitted}
                  >
                    <span className="avatar-emoji">{persp.avatar}</span>
                    <strong className="avatar-role">{persp.role}</strong>
                  </button>
                ))}
              </div>
            </div>

            {selectedPerspId && (
              <div className="persp-writing-box animate-fade-in">
                <div className="persp-hint-bubble">
                  💡 <strong>Writing Hint:</strong> {PERSPECTIVE_SCENARIOS[scenarioIndex].perspectives.find(p => p.id === selectedPerspId).hint}
                </div>

                <form onSubmit={submitPerspective} className="mt-4">
                  <div className="form-group">
                    <label>Rewrite the scene from your chosen perspective:</label>
                    <textarea
                      placeholder={`Put yourself in the shoes of ${PERSPECTIVE_SCENARIOS[scenarioIndex].perspectives.find(p => p.id === selectedPerspId).role}. How do they experience this moment?`}
                      rows={7}
                      value={perspContent}
                      onChange={(e) => setPerspContent(e.target.value)}
                      required
                      disabled={perspSubmitted || submittingPersp}
                    />
                  </div>

                  {!perspSubmitted ? (
                    <button type="submit" className="btn btn-primary" disabled={submittingPersp || !perspContent.trim()}>
                      {submittingPersp ? 'Coaching Evaluation...' : 'Submit Perspective Piece'}
                    </button>
                  ) : (
                    <div className="persp-feedback-box success animate-fade-in mt-3">
                      <div className="result-header">
                        <FiCheckCircle />
                        <h4>Story Evaluated! +40 XP Awarded</h4>
                      </div>
                      <p className="explanation-text">{perspFeedback}</p>
                      <button
                        type="button"
                        className="btn btn-secondary mt-3"
                        onClick={() => {
                          setSelectedPerspId('');
                          setPerspContent('');
                          setPerspSubmitted(false);
                          setPerspFeedback('');
                        }}
                      >
                        Try Another Viewpoint
                      </button>
                    </div>
                  )}
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
