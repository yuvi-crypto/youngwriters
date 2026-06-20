# Literacy & Critical-Thinking Rubric

> **Internal use only.** This rubric is for monthly reviewer sampling.
> It is never shown to children, parents, or teachers.

## Purpose

Validate that the platform's automated proxy metrics (vocabulary diversity, reading-level trend, counter-argument %) actually correlate with real literacy development. Done by blind-scoring a monthly sample and comparing against the automated scores.

---

## Scoring Dimensions (1–4)

### 1. Structural Clarity
Does the piece have a recognisable beginning, middle, and end? Does it progress logically?

| Score | Description |
|---|---|
| 1 | No clear structure; thoughts disconnected |
| 2 | Basic sequence present but transitions weak |
| 3 | Clear structure with some effective transitions |
| 4 | Polished structure; deliberate pacing and flow |

---

### 2. Vocabulary Range
Does the child use a variety of words, including some that are specific, precise, or evocative?

| Score | Description |
|---|---|
| 1 | Repetitive or very basic vocabulary throughout |
| 2 | Some variety but frequent repetition of simple words |
| 3 | Noticeably varied vocabulary; some precise word choices |
| 4 | Rich, intentional vocabulary; words chosen for effect |

*Automated proxy: vocabulary diversity score (unique lemmas ÷ total words)*

---

### 3. Perspective-Taking
Does the piece show awareness of another character's, reader's, or opposing viewpoint?
(Weight doubled for opinion format.)

| Score | Description |
|---|---|
| 1 | Single viewpoint; no acknowledgement of others |
| 2 | Brief mention of another perspective without exploration |
| 3 | Other perspectives shown with some empathy or logic |
| 4 | Multiple perspectives explored; nuanced understanding |

*Automated proxy: counter-argument completion rate (opinion format)*

---

### 4. Sensory / Emotional Specificity
Does the piece evoke something concrete — a detail, feeling, image, or sensation?

| Score | Description |
|---|---|
| 1 | Abstract throughout; no grounding details |
| 2 | Some details present but generic |
| 3 | Several specific, effective sensory or emotional details |
| 4 | Consistently vivid; reader can picture or feel the content |

---

### 5. Growth-Nudge Uptake
(Where a nudge was offered) Did the child demonstrably incorporate the nudge's suggestion?

| Score | Description |
|---|---|
| N/A | No nudge was offered or child chose not to use it |
| 1 | Nudge offered; no evidence of uptake |
| 2 | Minor traces of uptake |
| 3 | Clear incorporation of nudge guidance |
| 4 | Sophisticated integration; child made it their own |

*Automated proxy: word count after nudge event vs. before*

---

## Monthly Process

### Sample
- ~20 pieces per active age band (5–7, 8–12, 13–17)
- Stratified by format (story, poem, essay, opinion, image sprint)
- Blind-scored: reviewer sees text only, not child's profile, school, or prior scores

### Inter-Rater Process
1. Reviewer A and Reviewer B score independently
2. For each dimension: if scores differ by ≤1 → average
3. If scores differ by ≥2 → discusson, log reasoning, reach consensus
4. If persistent disagreement → escalate to rubric working session, revise wording

### Automated Metric Calibration
After scoring the monthly sample, compare automated proxy values against human scores:

| Automated Metric | Target Correlation | Action if Below |
|---|---|---|
| Vocabulary diversity | r > 0.6 | Retrain threshold |
| Counter-argument completion | r > 0.7 | Adjust detection logic |
| Word count post-nudge | r > 0.5 | Review nudge quality |
| Reading level trend | r > 0.55 | Adjust Flesch-Kincaid parameters |

### Never Surface as Grades
These scores are internal calibration tools only. They must never be:
- Shown to children, parents, or teachers
- Stored against a child's profile
- Used for ranking or competitive comparison

---

## Change Log

| Date | Change | Author |
|---|---|---|
| 2026-06-20 | Initial rubric created | Antigravity agent |
