/**
 * evaluationService.js
 *
 * Evaluates a piece of writing against a 5-dimension rubric.
 * Primary: Gemini 1.5 Flash (uses VITE_GEMINI_API_KEY)
 * Fallback: Rule-based scoring using text analytics
 *
 * Rubric dimensions (each scored 1-4):
 *   1. Structure      — beginning/middle/end, logical flow
 *   2. Vocabulary     — word variety, precise choices
 *   3. Creativity     — originality, unexpected details
 *   4. Prompt Adherence — addressed the actual prompt
 *   5. Voice          — personality, authentic expression
 *
 * Score labels:
 *   1 = Starting Out  🌱
 *   2 = Building Up   🌿
 *   3 = Shining       ✨
 *   4 = Superstar     🌟
 */

import { GEMINI_API_KEY } from '../config';

// ── Gemini instance (lazy-loaded) ─────────────────────────────
let _genAI = null;
async function getGenAI() {
  if (_genAI) return _genAI;
  if (!GEMINI_API_KEY) return null;
  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    _genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    return _genAI;
  } catch {
    return null;
  }
}

// ── Score labels ──────────────────────────────────────────────
export const SCORE_LABELS = {
  1: { label: 'Starting Out', emoji: '🌱', color: 'hsl(32,90%,55%)' },
  2: { label: 'Building Up',  emoji: '🌿', color: 'hsl(160,60%,45%)' },
  3: { label: 'Shining',      emoji: '✨', color: 'hsl(258,70%,60%)' },
  4: { label: 'Superstar',    emoji: '🌟', color: 'hsl(45,95%,50%)' },
};

// ── Rule-based fallback scorer ────────────────────────────────
function ruleBasedScore(text, format, age, promptContext) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const uniqueWords = new Set(words.map(w => w.toLowerCase().replace(/[^a-z]/g, ''))).size;
  const uniqueRatio = uniqueWords / Math.max(wordCount, 1);
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 3).length;
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim()).length;
  const avgWordsPerSentence = wordCount / Math.max(sentences, 1);

  let structure;
  let vocabulary;
  let creativity;
  let voice;

  if (format === 'poem') {
    const lines = text.split('\n').filter(l => l.trim().length > 0).length;
    structure = lines >= 6 ? 4 : lines >= 4 ? 3 : lines >= 2 ? 2 : 1;

    vocabulary = (wordCount >= 30 && uniqueRatio > 0.75) ? 4
      : (wordCount >= 15 && uniqueRatio > 0.65) ? 3 : 2;

    const hasEmotional = /felt|wonder|magic|dream|suddenly|imagine|silent|whisper|sky|heart|shadow/i.test(text);
    creativity = (wordCount >= 30 && hasEmotional) ? 4
      : (wordCount >= 15) ? 3 : 2;

    const hasFirstPerson = /\bi\b|\bmy\b|\bme\b/i.test(text);
    voice = (hasFirstPerson || wordCount > 20) ? 4 : 3;
  } else {
    // Structure: checks for multi-paragraph, reasonable sentence length
    structure = paragraphs >= 3 ? 4
      : paragraphs >= 2 ? 3
      : sentences >= 4 ? 2 : 1;

    // Vocabulary: unique word ratio
    vocabulary = uniqueRatio > 0.7 ? 4
      : uniqueRatio > 0.55 ? 3
      : uniqueRatio > 0.4 ? 2 : 1;

    // Creativity: length + exclamation/question use + descriptive indicators
    const hasQuestions = (text.match(/\?/g) || []).length > 0;
    const hasEmotional = /felt|wonder|magic|dream|suddenly|imagine/i.test(text);
    creativity = (wordCount > 100 && hasEmotional) ? 4
      : (wordCount > 60 && (hasQuestions || hasEmotional)) ? 3
      : wordCount > 30 ? 2 : 1;

    // Voice: sentence variety + first-person usage
    const hasFirstPerson = /\bi\b|\bmy\b|\bme\b/i.test(text);
    const hasVariedLength = avgWordsPerSentence > 6 && avgWordsPerSentence < 25;
    voice = (hasFirstPerson && hasVariedLength && wordCount > 50) ? 4
      : (hasFirstPerson || hasVariedLength) ? 3 : 2;
  }

  // Prompt Adherence: simple keyword overlap with prompt
  let promptAdherence = 2; // default middle
  if (promptContext) {
    const promptWords = new Set(promptContext.toLowerCase().split(/\s+/).map(w => w.replace(/[^a-z]/g, '')));
    const overlap = words.filter(w => promptWords.has(w.toLowerCase())).length;
    promptAdherence = overlap > 5 ? 4 : overlap > 2 ? 3 : 2;
  }

  const overall = ((structure + vocabulary + creativity + promptAdherence + voice) / 5);
  const overallRounded = Math.round(overall * 2) / 2; // round to 0.5

  const strengths = [];
  if (structure >= 3) strengths.push('Clear structure 📖');
  if (vocabulary >= 3) strengths.push('Varied vocabulary 📚');
  if (creativity >= 3) strengths.push('Creative ideas 💡');
  if (voice >= 3) strengths.push('Strong voice 🎤');
  if (promptAdherence >= 3) strengths.push('On-topic 🎯');

  return {
    structure, vocabulary, creativity,
    prompt_adherence: promptAdherence, voice,
    overall: overallRounded,
    feedback: 'Great effort on this piece! Keep writing and your skills will grow every day. ✨',
    growth_nudge: 'One thing to try next time: add more details to help the reader picture the scene.',
    strengths: strengths.slice(0, 3),
    fallback_used: true,
  };
}

// ── Main evaluation function ──────────────────────────────────
/**
 * Evaluates a student's writing.
 * @param {string} text - The full text of the piece
 * @param {string} format - 'story' | 'poem' | 'essay' | 'opinion' | 'image'
 * @param {number} age - Student's age
 * @param {string} [promptContext] - The original assignment prompt (for adherence scoring)
 * @returns {Promise<EvaluationResult>}
 */
export async function evaluatePiece(text, format, age, promptContext = '') {
  if (!text || text.trim().length < 10) {
    return ruleBasedScore(text || '', format, age, promptContext);
  }

  const ai = await getGenAI();

  if (ai) {
    try {
      const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });

      let structureDesc = 'Does it have a clear beginning, middle, end? Does it flow logically?';
      let vocabularyDesc = 'Word variety, precise or evocative word choices?';
      let voiceDesc = 'Personality, authenticity, does it sound like a real child?';

      if (format === 'poem') {
        structureDesc = 'Line breaks, layout, rhythm, stanzas, and musical flow instead of narrative structure.';
        vocabularyDesc = 'Imagery, sound patterns (rhyme, alliteration), word economy, and precise emotional word choices.';
        voiceDesc = 'Emotional resonance, mood, authentic self-expression, and personal poetic style.';
      } else if (format === 'essay') {
        structureDesc = 'Clear introduction/thesis statement, body paragraphs supporting the claim, and a conclusion. Logical transitions.';
        vocabularyDesc = 'Clarity of explanation, informative or argumentative vocabulary, and formal/academic word variety.';
        voiceDesc = 'Author\'s confidence, stance, logic, and persuasive tone.';
      } else if (format === 'opinion') {
        structureDesc = 'Clear statement of the opinion, clear supporting reasons, and acknowledgment/response to the opposing viewpoint ("See the Other Side").';
        vocabularyDesc = 'Persuasive vocabulary, transitions (e.g., "however", "therefore"), and logical clarity.';
        voiceDesc = 'Conviction, individual perspective, and reasoning logic.';
      }

      const systemPrompt = `You are an expert children's writing evaluator for the Young Writers Platform.
Evaluate this ${format} written by a ${age}-year-old student.

RUBRIC (score each dimension 1-4, half-points allowed e.g. 2.5):
1=Starting Out, 2=Building Up, 3=Shining, 4=Superstar

DIMENSIONS:
- structure: ${structureDesc}
- vocabulary: ${vocabularyDesc}
- creativity: Originality, unexpected details or ideas?
- prompt_adherence: Did it address the prompt "${promptContext || 'free writing'}"?
- voice: ${voiceDesc}

IMPORTANT RULES:
- NEVER mention grammar, spelling, or punctuation errors
- Be warm, encouraging, and age-appropriate (${age} years old)
- feedback: 2-3 sentences of specific, genuine positive feedback
- growth_nudge: ONE gentle, specific suggestion (start with "One thing to try:")
- strengths: Array of 2-3 short strength chips (max 4 words each)

STUDENT'S WRITING:
---
${text.slice(0, 1200)}
---

Return ONLY valid JSON matching this exact schema:
{
  "structure": <number 1-4>,
  "vocabulary": <number 1-4>,
  "creativity": <number 1-4>,
  "prompt_adherence": <number 1-4>,
  "voice": <number 1-4>,
  "overall": <number 1-4, average of above>,
  "feedback": "<2-3 warm encouraging sentences>",
  "growth_nudge": "<One gentle suggestion>",
  "strengths": ["<chip 1>", "<chip 2>", "<chip 3 optional>"]
}`;

      const result = await model.generateContent(systemPrompt);
      const responseText = result.response.text().trim();

      // Extract JSON from response (handles markdown code blocks)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON in response');

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate all required fields exist
      const required = ['structure', 'vocabulary', 'creativity', 'prompt_adherence', 'voice', 'overall', 'feedback', 'growth_nudge', 'strengths'];
      for (const field of required) {
        if (parsed[field] === undefined) throw new Error(`Missing field: ${field}`);
      }

      return { ...parsed, fallback_used: false };
    } catch (e) {
      console.warn('[EvaluationService] Gemini evaluation failed, using fallback:', e.message);
    }
  }

  // Fallback: rule-based scoring
  return ruleBasedScore(text, format, age, promptContext);
}

// ── Save evaluation to Supabase ───────────────────────────────
/**
 * Saves evaluation results to the evaluations table.
 * @param {string} submissionId - UUID of the submission
 * @param {EvaluationResult} scores - Result from evaluatePiece()
 * @param {string} [pieceId] - Optional: for self-directed pieces
 */
export async function saveEvaluation(supabaseClient, submissionId, scores, pieceId = null) {
  try {
    const { error } = await supabaseClient
      .from('evaluations')
      .upsert({
        submission_id: submissionId,
        piece_id: pieceId,
        evaluator: scores.fallback_used ? 'rule-based' : 'gemini-2.5-flash',
        structure_score: scores.structure,
        vocabulary_score: scores.vocabulary,
        creativity_score: scores.creativity,
        prompt_adherence_score: scores.prompt_adherence,
        voice_score: scores.voice,
        overall_score: scores.overall,
        feedback_text: scores.feedback,
        growth_nudge: scores.growth_nudge,
        strengths: scores.strengths,
        fallback_used: scores.fallback_used,
        evaluated_at: new Date().toISOString(),
      }, { onConflict: 'submission_id' });

    if (error) console.warn('[EvaluationService] Save failed:', error.message);
  } catch (e) {
    console.warn('[EvaluationService] Save exception:', e.message);
  }
}
