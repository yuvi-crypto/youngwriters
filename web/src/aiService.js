import { FALLBACK_PROMPTS, getRandomFeedback, getRandomNudge, getAgeBand } from './constants';
import { GEMINI_API_KEY } from './config';

// ── Gemini AI Service ────────────────────────────────────────
// Uses Gemini API if key is present, falls back to curated content
let genAI = null;

async function getGenAI() {
  if (genAI) return genAI;
  if (GEMINI_API_KEY) {
    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    } catch (e) {
      console.warn('Gemini SDK not available, using fallback prompts');
    }
  }
  return genAI;
}

// ── Generate Writing Prompts ─────────────────────────────────
export async function generatePrompts(age, format) {
  const ageBand = getAgeBand(age);
  const ai = await getGenAI();

  if (ai) {
    try {
      const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const prompt = `You are a creative writing coach for children.
Generate exactly 3 short, inspiring writing prompts for a ${age}-year-old child.
Format: "${format}" writing.
Rules:
- Each prompt must be 1 sentence, playful and imaginative
- Age-appropriate (${ageBand.label} years old)
- No violence, no politics, no religion
- Return ONLY a JSON array of 3 strings, nothing else
Example: ["Prompt 1", "Prompt 2", "Prompt 3"]`;
      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();
      const match = text.match(/\[.*\]/s);
      if (match) {
        const parsed = JSON.parse(match[0]);
        if (Array.isArray(parsed) && parsed.length === 3) return parsed;
      }
    } catch (e) {
      console.warn('Gemini prompt gen failed, using fallback:', e.message);
    }
  }

  // Fallback to curated prompts
  const band = ageBand.id === 'early' ? 'early' : ageBand.id === 'teen' ? 'teen' : 'middle';
  const pool = FALLBACK_PROMPTS[format]?.[band] || FALLBACK_PROMPTS[format]?.middle || FALLBACK_PROMPTS.story.middle;
  // Return 3 random unique prompts
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3);
}

// ── Generate AI Feedback ─────────────────────────────────────
export async function generateFeedback(text, format, age) {
  const ai = await getGenAI();

  if (ai && text.length > 30) {
    try {
      const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const prompt = `You are an encouraging creative writing coach for children.
Read this ${format} written by a ${age}-year-old:
---
${text.slice(0, 500)}
---
Write 1-2 sentences of GENUINE, SPECIFIC positive feedback. 
Rules:
- Be warm, encouraging, and specific to what's actually written
- NEVER mention grammar, spelling, or punctuation
- Focus on imagination, emotion, ideas, or voice
- Sound like a kind, enthusiastic teacher
- Keep it to 1-2 sentences max
Return ONLY the feedback text, nothing else.`;
      const result = await model.generateContent(prompt);
      return result.response.text().trim();
    } catch (e) {
      console.warn('Gemini feedback gen failed, using fallback:', e.message);
    }
  }

  return getRandomFeedback();
}

// ── Generate Growth Nudge ────────────────────────────────────
export async function generateNudge(text, format) {
  const ai = await getGenAI();

  if (ai && text.length > 50) {
    try {
      const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const prompt = `You are a gentle creative writing coach for children.
Read this ${format}:
---
${text.slice(0, 400)}
---
Give ONE gentle, specific suggestion to improve the ${format} structurally (NOT grammar/spelling).
Start with "One thing to try next time: "
Keep it to 1 sentence. Be kind and encouraging.
Return ONLY the nudge text.`;
      const result = await model.generateContent(prompt);
      return result.response.text().trim();
    } catch (e) {
      console.warn('Gemini nudge gen failed, using fallback:', e.message);
    }
  }

  return getRandomNudge(format);
}

// ── Moderate Comment ─────────────────────────────────────────
export async function moderateComment(text) {
  const negativePhrases = [
    'bad', 'terrible', 'awful', 'hate', 'stupid', 'dumb', 'ugly',
    'boring', 'worst', 'sucks', 'trash', 'garbage', 'horrible',
  ];
  const lower = text.toLowerCase();
  const hasNegative = negativePhrases.some((p) => lower.includes(p));
  if (hasNegative) return { safe: false, reason: 'Contains negative language' };
  if (text.length < 3) return { safe: false, reason: 'Too short' };
  if (text.length > 280) return { safe: false, reason: 'Too long' };
  return { safe: true };
}

// ── Generate AI Assignment Ideas ─────────────────────────────
export async function generateAssignmentIdeas(topic, format, ageBand) {
  const ai = await getGenAI();

  if (ai) {
    try {
      const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const prompt = `You are a creative writing pedagogy assistant helping a teacher create a writing assignment.
Generate exactly 3 creative, engaging assignment ideas for students in the age band "${ageBand}".
Writing format: "${format}".
Topic/Theme: "${topic}".

Rules:
1. Provide a title, clear instructions, and a specific writing prompt for each.
2. For essays or opinion pieces, provide a "scaffold" property containing an array of 3-4 section labels (e.g. ["Introduction", "My Argument", "Counter-argument", "Conclusion"]). For story/poem formats, set "scaffold" to null.
3. Keep the tone inspiring and age-appropriate for ${ageBand}.
4. Return ONLY a valid JSON array containing exactly 3 objects. Do not include any markdown wrappers or additional text outside the JSON.

Expected JSON Structure:
[
  {
    "title": "Title of Assignment 1",
    "instructions": "Detailed instructions on what to write.",
    "prompt": "The actual writing prompt/starting line.",
    "scaffold": ["Introduction", "My View", "Conclusion"] (or null)
  },
  ...
]`;
      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();
      const match = text.match(/\[\s*\{[\s\S]*\}\s*\]/s);
      if (match) {
        const parsed = JSON.parse(match[0]);
        if (Array.isArray(parsed) && parsed.length === 3) return parsed;
      }
    } catch (e) {
      console.warn('Gemini assignment gen failed, using fallback:', e.message);
    }
  }

  // Curated Fallbacks
  return [
    {
      title: `Exploring ${topic} in a ${format}`,
      instructions: `Write a creative ${format} about ${topic}. Focus on your thoughts and details.`,
      prompt: `Think about ${topic}. How does it make you feel, and what does it look like?`,
      scaffold: format === 'essay' || format === 'opinion' ? ['Introduction', 'Body Paragraph', 'Conclusion'] : null
    },
    {
      title: `The Mystery of ${topic}`,
      instructions: `Let your imagination run wild! Write a ${format} themed around ${topic}.`,
      prompt: `Suddenly, the world was filled with ${topic}...`,
      scaffold: format === 'essay' || format === 'opinion' ? ['Setting the Scene', 'The Event', 'The Resolution'] : null
    },
    {
      title: `My Opinion on ${topic}`,
      instructions: `Express your personal views about ${topic}. What do you think about it?`,
      prompt: `Why is ${topic} important to us today?`,
      scaffold: format === 'essay' || format === 'opinion' ? ['My Claim', 'First Reason', 'Second Reason', 'Conclusion'] : null
    }
  ];
}
