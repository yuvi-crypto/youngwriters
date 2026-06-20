# 📘 Young Writers Platform — Claude.md
## Full Build Plan, Architecture, and Implementation Flow
**Version**: 2.0 | **Market**: Hyderabad-First, India → Global  
**Planned Tech Stack**: React (Web) + Flutter (Mobile) | Node.js + Express (API) | Firebase (Auth) | PostgreSQL (Data) | AI APIs  
**Actual Tech Stack (Current Implementation)**: React (Web) communicating directly via `@supabase/supabase-js` (Supabase Auth & Database / PostgreSQL Cloud) and the Gemini API client (`@google/generative-ai` on frontend). Stubbed/unused Firebase.

---

## 🎯 Vision & Mission (from PRD)

**Vision**: A world where every child thinks deeply, imagines boldly, and expresses fearlessly.  
**Mission**: Help children 5–17 unlock the power of their thoughts through storytelling, essays, opinion writing, and poetry — building writers, critical thinkers, and compassionate leaders.

**Core Values**:
- No judgment, no red-pen corrections
- Safe haven for creativity
- Confidence-first, growth-oriented feedback
- Multilingual from day one (English / Telugu / Hindi)
- Zero ads, ever

---

## 👥 Users

| Type | Role |
|------|------|
| **Children (5–17)** | Primary — write stories, poems, essays, opinion pieces |
| **Parents** | Secondary — monitor, encourage, consent |
| **Teachers** | Third — assign prompts, track classroom progress |

**India-specific context**:
- CBSE / ICSE / Telangana Board alignment for essay prompts
- Shared Android device assumption (low bandwidth, low spec)
- Telugu/Hindi as primary feel at home languages

---

## 📝 Content Pillars (6 Types)

| # | Format | Age Range | Core Skill |
|---|--------|-----------|------------|
| 1 | **Stories** | 5–17 | Imagination, narrative |
| 2 | **Poems** | 5–17 | Rhythm, emotion, brevity |
| 3 | **Essays** | 8–17 | Structured argument, evidence |
| 4 | **Opinion Pieces** | 8–17 | Critical thinking, perspective-taking |
| 5 | **Contest Entries** | 8–17 | All above, with stakes |
| 6 | **Lab Activities** | 5–17 | Critical thinking, logical deduction, observation, perspective-taking |

---

## 🏗️ System Architecture

```
Mobile App (Flutter — iOS + Android)
  ↕ REST/GraphQL
Web Platform (React + Vite)
  ↕
API Gateway (Node.js + Express)
  ↕ Internal Services
  ├── Writing Service      — CRUD for pieces, drafts, editor state
  ├── Community Service    — Feed, comments, reactions
  ├── AI Service           — Prompts, feedback, growth nudges, art gen
  ├── Gamify Service       — Badges, streaks, XP
  ├── Trust & Safety Svc   — Moderation queue, crisis classifier
  ├── Contest Service      — Entry windows, plagiarism checks, judging
  └── Localization Service — EN/TE/HI content + UI strings
  ↕ Data Layer
  ├── Firebase Auth        — Auth (email, Google, parent-linked)
  ├── PostgreSQL           — Core relational data
  ├── S3/Blob Storage      — Images, AI art, file uploads
  ├── LLM API              — Prompt gen, feedback, growth nudges
  ├── Plagiarism API       — Contest integrity checks
  └── Identity Verify API  — Parental consent verification (DPDP Act)
```

---

## 🗂️ Feature List (15 Features)

### Phase 1 — Core MVP (Months 1–2)

| # | Feature | Description |
|---|---------|-------------|
| F1 | **Distraction-Free Writing Editor** | Clean editor, no grammar check, no red pen, auto-save drafts |
| F2 | **AI Creative Prompt Generator** | 3 prompts per session, age/format aware, mind map starter |
| F3 | **Safe Community Feedback** | Age-filtered feed, positive-only comments, ❤️ reactions |
| F4 | **Parent Dashboard** | View pieces, badges, AI theme summaries (no diagnosis) |
| F5 | **Teacher Classroom Dashboard** | Assign prompts, view submissions, literacy growth indicator |
| F6 | **Gamification System** | Badges (Brave Writer, Poet, etc.), streaks, XP points |

### Phase 2 — Literacy & Safety (Months 2–3)

| # | Feature | Description |
|---|---------|-------------|
| F7 | **AI Art & Decoration** | Decorate poems with AI generated art, rate-limited on free tier |
| F8 | **Mind Map Tool** | Visual brainstorm tool for story planning |
| F9 | **Essay Scaffolding Tool** | Soft 3-section guide: "What I think / Why / Example" |
| F10 | **"See the Other Side" Opinion Tool** | Counter-argument prompt before publishing |
| F11 | **Growth Nudges (Balanced Feedback Engine)** | Opt-in single tip, never grammar-focused |

### Phase 3 — Trust, Contests, Compliance (Months 3–4)

| # | Feature | Description |
|---|---------|-------------|
| F12 | **Global Contest Module** | Entry windows, age+format banding, plagiarism check, vetted judging |
| F13 | **Trust & Safety / Human Moderation Layer** | Crisis classifier, human review queue, SLA-bound response |
| F14 | **Verified Parental Consent Flow** | DPDP Act aligned, separate contest re-consent |
| F15 | **Regional Language & Accessibility Support** | EN/TE/HI, dyslexia font, TTS, high-contrast, offline drafts |

### Phase 4 — Critical Thinking & Creativity Lab (Months 4–5)

| # | Feature | Description |
|---|---------|-------------|
| F16 | **Perspective Switch** | Write a scene from someone else's perspective (e.g. teacher, mother, dog) to build viewpoint agility |
| F17 | **Observation Challenge** | Analyze character, setting, mood, conflict, and hidden details in an image before writing |
| F18 | **Story Dice** | Roll for random character, location, problem combos (Premium: emotion, twist, theme) |
| F19 | **Book Cover Creator** | AI generates covers, titles, and summaries for kids to customize |
| F20 | **Mystery Solver** | Interactive mini detective deduction games (Junior Detective badge) |
| F21 | **Story Structure Puzzle** | "N-Queens for Writers" arranging beginning, conflict, climax, resolution chronologically |
| F22 | **Logic Grid Puzzles** | Deductive logic puzzles matching characters to properties |
| F23 | **Argument Arena** | Interactive debate game (write opinion, receive opposing AI view, respond) |
| F24 | **What Happens Next?** | Predict story completion and justify prediction before actual ending is revealed |
| F25 | **Spot the Weak Argument** | Identify logical fallacies (false assumption, emotional reasoning, lack of evidence) for ages 13-17 |

---

## 🔄 Detailed Use Case Flows

### UC1 — Safe Story Writing
```
1. Child opens app → "Write" screen
2. AI prompt: "What if trees could talk?"
3. Distraction-free editor (no red-pen, auto-save)
4. Submit → stored to journal
5. AI: 1-2 positive comments + optional Growth Nudge (F11)
6. Parent/teacher see piece in dashboard
7. Child earns "Brave Writer" badge
```

### UC2 — Creative Poetry Creation
```
1. Child selects "Poetry" mode
2. AI suggests format: "Write a 4-line poem about your day"
3. Child writes in simple interface
4. AI generates decorated version (art + text) [F7]
5. Publish → age-filtered community (5–7 / 8–12 / 13–17)
6. Positive comments only, no downvotes
7. Child earns "Poet" badge
```

### UC3 — Parent Monitoring & Encouragement
```
1. Parent opens dashboard
2. Views: pieces count, badges, growth chart
3. AI summary of themes (no diagnosis/labels)
4. Short parent guide with encouragement tips
5. Parent sends encouraging message → child sees it
6. T&S escalation (if triggered) surfaces here, not buried in email
```

### UC4 — Teacher Classroom Integration
```
1. Teacher opens "Classroom" dashboard
2. Create Assignment → pick prompt + format + deadline
3. Prompt delivered in-app in student's preferred language
4. Students write & submit
5. Teacher sees: submissions, progress graph, literacy-growth indicator
6. Teacher gives positive, growth-oriented feedback (no grades)
7. Students earn "Class Writer" badge
```

### UC5 — AI-Powered Prompts
```
1. Child clicks "Need Inspiration?"
2. AI generates 3 prompts (age + format aware):
   - 5–7: "What if your toy could talk?"
   - 8–12: "Write about a day you felt brave" / "Should kids choose their bedtime?"
   - 13–17: "What if schools had no walls?" / "Is social media good or bad?"
3. Child picks prompt
4. AI suggests starting structure (mind map / claim-evidence-reasoning)
5. System logs prompt → piece completion rate for product analytics
```

### UC6 — Community Feedback (Safe Only)
```
1. Child selects piece → "Share"
2. System confirms age-band (5–7 / 8–12 / 13–17)
3. Piece published to that band only
4. Feedback: positive comments only / ❤️ reaction
5. AI filters negative words → human spot-check of flagged batches
6. Child sees: "5 comments + 12 ❤️s"
7. Child earns "Community Writer" badge
```

### UC7 — Essay with Scaffold
```
1. Child selects "Essay" mode
2. Editor shows 3 soft sections: "What I think / Why / An example"
3. Sections are guides, not gates (can submit partial)
4. AI: 1 positive comment + opt-in Growth Nudge (structure, not grammar)
5. Save to journal → share to community / submit to teacher
```

### UC8 — Opinion Piece with "See the Other Side"
```
1. Child selects "Opinion" mode → age-appropriate curated prompts
   (no real-world politics, elections, religious controversy)
2. Child writes their view freely
3. Before publishing: "Can you write 2–3 sentences on what someone who 
   disagrees might say?"
4. Counter-argument required to publish (optional to save privately)
5. AI moderation (separate opinion-specific ruleset)
6. Published to age-filtered community, positive-only feedback
7. Parent dashboard flags opinion pieces specifically
```

### UC9 — Global Writing Contest
```
1. Child sees contest: theme + age category + deadline + criteria upfront
2. Parent shown separate consent screen:
   - What's shared publicly
   - Who judges it
   - What winning means (no cash prizes)
3. Child submits existing or new piece within contest window
4. Automated plagiarism/AI-detection check before entry accepted
5. Judged by vetted, child-safety-trained panel (within age band + language)
6. Every entrant gets a personalized note (not just winners)
7. Winners: certificates, platform features, printed anthology
8. Results + judging rationale published publicly
```

### UC10 — Trust & Safety Escalation
```
1. Child writes piece with signs of distress / self-harm / abuse disclosure
2. Crisis classifier (separate from trolling filter) flags for priority review
3. Trained T&S reviewer assesses within defined SLA
4. Response options (severity-dependent):
   - Private supportive message to child
   - Parent/guardian notified via dashboard
   - Acute risk → guidance to local emergency/crisis services
5. Piece never deleted punitively; response is care-first, not moderation-first
```

---

## 🤖 AI Service Details

### LLM Usage Strategy

| Task | Model Tier | Reason |
|------|-----------|--------|
| Moderation filter (trolling/profanity) | Small/cheap | Low creative demand |
| Growth Nudge generation | Small/cheap | Templated, predictable |
| Story/poem/essay prompt generation | Medium | Needs creativity |
| Crisis classifier | Strong | Safety-critical |
| Contest judging support | Strong | High stakes |
| AI art generation | Specialized (image) | Rate-limited on free tier |

### AI Cost Mitigation
1. **Cache prompts** by age band + format (don't call LLM fresh per child)
2. **Small model** for moderation + nudges
3. **Rate-limit AI art**: 1/week on free tier
4. **Track cost-per-active-user** monthly from week 1 of beta

### Growth Nudge Logic
- Only shown if child explicitly taps "Get a tip"
- Never about grammar or spelling
- Single suggestion per piece
- Always framed gently: "One thing to try next time…"
- Never phrased as correction

---

## 🏆 Gamification System

| Badge | Trigger |
|-------|---------|
| Brave Writer | First story submitted |
| Poet | First poem submitted |
| Essay Explorer | First essay submitted |
| Critical Thinker | Opinion piece with counter-argument |
| Community Writer | First piece shared to community |
| Class Writer | First teacher assignment completed |
| Contest Star | First contest entry submitted |
| Streak Keeper | 7-day writing streak |
| Word Wizard | Vocabulary diversity milestone |
| Perspective Master | Complete first Perspective Switch challenge |
| Empathy Explorer | Complete 3 different Perspective Switch characters |
| Junior Detective | Solve a mystery in Mystery Solver |
| Critical Thinker Pro | Defend ideas successfully in Argument Arena |

---

## 🛡️ Trust & Safety Architecture

### Layered Moderation Stack
```
Layer 1: AI moderation (auto) — trolling, profanity, negative words
Layer 2: Human spot-check — AI-flagged batches reviewed by moderator
Layer 3: Crisis classifier — separate model tuned for distress signals
Layer 4: Trained T&S reviewer — human, not generic mod, for crisis flags
Layer 5: Parent/guardian notification — via dashboard, not cold email
Layer 6: Emergency escalation — local emergency/crisis service guidance
```

### What Triggers Each Layer
- **L1**: Any submitted comment or published piece
- **L2**: Pieces flagged by L1 at rate > threshold
- **L3**: Pieces that contain distress signals (even in private/draft state)
- **L4**: Any L3 flag
- **L5 + L6**: Severity assessment by L4 reviewer

### SLA Targets
- L3 crisis flag → human review: < 4 hours (target: < 1 hour during business hours)
- Parent notification after human review decision: < 15 minutes

---

## 🏅 Global Contests Module

### Contest Cadence
- **Frequency**: Quarterly
- **Themes**: e.g., "Stories of Kindness", "My City in 2050"
- **Age bands**: 8–10 / 11–13 / 14–17 (judged separately)
- **Format bands**: Story / Essay / Opinion / Poem (judged separately)

### Entry Flow
1. Contest announced with full criteria upfront
2. Parental consent re-collected (contest-specific, plain language)
3. Child submits piece
4. Automated plagiarism + AI-detection check
5. Vetted judging panel reviews within age + format band + language

### Prizes (No Cash to Minors)
- Digital certificates
- Platform features (homepage spotlight)
- Printed anthology sent to schools
- Scholarship/grant paid to verified institution (not directly to minor)

### Integrity Rules
- Multilingual judging (EN/TE/HI at launch)
- Published judging criteria before contest opens
- Published results + rationale after
- Every entrant receives a personalized note

---

## 🧠 Critical Thinking & Creativity Lab (New Module)

The lab is a specialized content pillar designed to help children develop observation, logical reasoning, perspective-taking, pattern recognition, and creative thinking skills through interactive games and structured writing challenges.

### 🗂️ Lab Feature Clusters

To provide clean navigation and progression, the 10 lab features are organized into three dedicated clusters:

#### 1. 🌌 Creative Story Catalyst (Visuals & Sparks)
*Goal: Spark imagination and visual observation skills to construct rich narrative worlds.*
- **F3: Story Dice (Story Building)**: AI randomly generates story starters: Character, Location, Problem (e.g., *Astronaut + Underwater city + Lost communication*). Children practice adaptability. (Premium: includes Emotion, Plot Twist, Theme).
- **F2: Observation Challenge (Painting → Story Elements)**: Visual storytelling prep. Children analyze a curated image (like a rainy street with a single umbrella) by answering guided questions (*Who owns it? Why is someone missing? What happened 5 mins earlier?*) to practice evidence-based inference before writing.
- **F4: Book Cover Creator**: The publishing climax. AI generates covers, titles, and back cover summaries for completed stories, letting kids choose, edit, and export their covers to feel like published authors.

#### 2. 🧩 Logic & Detective Hub (Reasoning & Puzzles)
*Goal: Train logical deduction, sequence planning, and pattern recognition.*
- **F5: Mystery Solver (Deductive Game)**: Interactive detective cases (e.g., "Three children enter, only one leaves with a wet jacket - why?") where children analyze clues and choose the deduction path. Earns *Junior Detective* badge.
- **F7: Logic Grid Puzzles**: Grid-based deduction game (e.g., mapping Maya, Ravi, Ali to pets based on clues) to build deductive reasoning foundational for structured writing.
- **F6: Story Structure Puzzle (N-Queens for Writers)**: Narrative organization puzzle. Arrange story segments (*Beginning, Conflict, Climax, Resolution*) in the correct chronological order to win.
- **F9: What Happens Next? (Predictive Reasoning)**: Prediction training. Reads half a story (e.g., "Maya opened the old box and froze...") and asks children to predict outcomes and justify them before showing the original ending.

#### 3. ⚔️ Perspective & Debate Arena (Critical Voices)
*Goal: Develop empathy, point-of-view agility, and structured argumentation.*
- **F1: Perspective Switch (Role Playing)**: Perspective shifting challenge. Rewrites a standard scene/story from a different character's viewpoint (e.g., teacher, mother, dog) to explore voice and empathy. Earns *Perspective Master* or *Empathy Explorer* badge.
- **F8: Argument Arena (Opinion Prep)**: Real-time debate. The child writes their opinion on a prompt (e.g., *Should homework be optional?*), the system generates an opposing view, and the child must write a rebutting response. Earns *Critical Thinker Pro* badge.
- **F10: Spot the Weak Argument (Logical Fallacies)**: Critical reading. Designed for ages 13-17, children identify logical fallacies in statements (e.g., "All successful people wake up at 5 AM") selecting from options like false assumptions, emotional reasoning, or lack of evidence.

---

### 🗺️ Easy Navigation Design

To ensure kids can easily navigate these activities, we introduce a structured path:

1. **Top-Level Tab (🧠 Lab)**: Added to the main website/app header navigation (alongside Write, Community, Journal, etc.).
2. **Dashboard Quick Access**: A prominent card/section on the student homepage: `"Welcome to the Lab! 🧠 Ready to flex your brain muscles?"` with three main cards representing the three clusters.
3. **In-Editor Contextual Prompts**: When working on an opinion piece or story, a small nudge button can suggest: `"Need a perspective check? Try the Perspective Switch Challenge!"` or `"Stuck? Roll the Story Dice!"`
4. **Sub-navigation / Dashboard**:
   - The Lab Homepage (`/lab`) displays the 3 Cluster Cards.
   - Clicking a cluster card opens a sub-menu showing the available games/activities in that cluster.
   - Each activity card displays:
     - **Status**: Locked/Unlocked (based on age-appropriateness or free/premium tier)
     - **Reward**: Badges to earn (e.g., *Perspective Master*, *Junior Detective*, *Critical Thinker Pro*)
     - **Difficulty level**: Easy, Medium, Hard.

---

## 🌐 Localization & Accessibility

### Languages at Launch
- English (default)
- Telugu
- Hindi
- One-tap language switch

### Accessibility Features
- Dyslexia-friendly font (OpenDyslexic) + adjustable letter/line spacing
- Text-to-speech for any piece (especially 5–7 age group)
- High-contrast mode
- Large-text mode

### Device Reality Mode
- Low-bandwidth mode: text-first, deferred image/art loading
- Offline draft writing with sync-on-connect
- Optimized for low-cost Android devices

---

## 💰 Monetization

### Revenue Streams

| Stream | Free Tier | Premium Tier (~₹299/month) |
|--------|-----------|---------------------------|
| Writing + community | ✅ Unlimited | ✅ Unlimited |
| AI prompts | ✅ 3/day | ✅ Unlimited |
| AI art generation | 1/week | ✅ Unlimited |
| Growth Nudges | ✅ Basic | ✅ Advanced |
| Contest entries | ✅ 1 active | ✅ Unlimited |
| Teacher dashboards | ✅ Limited | ✅ Full analytics |
| School tier | — | Custom pricing (B2B) |

### Ads Policy
**Zero ads, ever.** Not even on free tier. Revenue comes from premium only.

---

## ⚖️ Regulatory Compliance

### Applicable Frameworks

| Framework | Jurisdiction | Priority |
|-----------|-------------|---------|
| **DPDP Act 2023** | India | 🔴 Must-have (home market) |
| **COPPA** | USA | 🟡 Phase 4 |
| **GDPR-K / UK AADC** | EU/UK | 🟡 Phase 4 |

### Build Rules
1. Verified parental consent flow built to DPDP Act standard first
2. All child accounts default to most private settings
3. No behavioral tracking or targeted advertising — ever
4. Indian users' data stored in India-region infrastructure (latency + DPDP)
5. Parental consent re-collected for each contest (separate, plain language)
6. Child's IP stays with child/guardian; platform gets limited display license

---

## 📊 Success Metrics (KPIs)

### Engagement KPIs
- MAU / DAU ratio (target: >40%)
- Pieces submitted per active user per week
- 7-day and 30-day retention rates
- Time spent in editor per session

### Literacy & Critical Thinking KPIs (NEW)
- Vocabulary diversity per child, trending over time
- Readability score progression per child
- % of opinion pieces that include a genuine counter-argument
- Growth Nudge engagement rate (opt-in, not forced)

### Trust & Safety KPIs (NEW)
- Time-to-human-review for crisis flags (target: < 4 hours)
- False positive rate on moderation classifier
- Parent dashboard engagement rate (monthly active parents)

### Community KPIs
- Positive comment rate (target: 100% — zero negative)
- Contest entry rate among eligible users
- Cross-age-band safety incidents (target: 0)

---

## 🗺️ Go-to-Market Phases

| Phase | Timeline | Geography | Key Actions |
|-------|----------|-----------|------------|
| **Phase 1** | Months 1–3 | Hyderabad Pilot | 5 schools, WhatsApp parent communities, Telugu/English launch |
| **Phase 2** | Months 4–6 | Telangana / South India | CBSE board outreach, literacy NGO partnerships |
| **Phase 3** | Months 7–12 | Pan-India | Hindi launch, national contest, school B2B sales |
| **Phase 4** | Year 2+ | Global | International judging panels, global contest categories |

### Marketing Channels
- WhatsApp (primary for Hyderabad parents)
- Instagram (secondary)
- School partnerships (directly to teacher/principal)
- Literacy-focused NGOs
- Telangana State Board teacher networks

---

## 📅 Sprint Plan (First 4 Months)

### Sprint 1–2 (Weeks 1–4): Foundation
- [ ] GitHub repo setup
- [ ] Firebase project (auth, free tier)
- [ ] PostgreSQL schema design
- [ ] Node.js API skeleton + Express routes
- [ ] React web app scaffold (Vite)
- [ ] Flutter mobile app scaffold
- [ ] Core auth flows (child, parent, teacher roles)
- [ ] Distraction-free writing editor (F1)

### Sprint 3–4 (Weeks 5–8): Writing Core
- [ ] Story / Poem writing flows
- [ ] Draft auto-save
- [ ] Journal / piece storage
- [ ] AI prompt generator integration (F2)
- [ ] Basic gamification (F6) — badges + XP
- [ ] Parent dashboard (F4) — basic view
- [ ] Telugu / Hindi string loading (F15 foundation)

### Sprint 5–6 (Weeks 9–12): Community & Feedback
- [ ] Age-filtered community feed (F3)
- [ ] Positive-only comment system
- [ ] ❤️ reaction system
- [ ] AI moderation layer (Layer 1) — comment filter
- [ ] Teacher classroom dashboard (F5)
- [ ] Assignment flow
- [ ] Growth Nudge engine (F11)
- [ ] Essay Scaffolding Tool (F9)
- [ ] "See the Other Side" Opinion Tool (F10)

### Sprint 7–8 (Weeks 13–16): Contests, Safety, Compliance
- [ ] AI Art generation + rate limiting (F7)
- [ ] Mind Map Tool (F8)
- [ ] Trust & Safety classifier (Layer 3) — crisis signals (F13)
- [ ] Human moderation queue (Layer 4)
- [ ] Parent T&S notification flow
- [ ] Verified parental consent flow (F14) — DPDP aligned
- [ ] Contest module (F12) — entry, plagiarism check, judging queue
- [ ] Accessibility: dyslexia font, TTS, high-contrast (F15)
- [ ] Low-bandwidth mode + offline drafts

### Sprint 9–10 (Weeks 17–20): Critical Thinking & Creativity Lab
- [ ] Creative Story Catalyst (F18 Story Dice, F17 Observation Challenge, F19 Book Cover Creator)
- [ ] Logic & Detective Hub (F20 Mystery Solver, F22 Logic Grid Puzzles, F21 Story Structure Puzzle, F24 What Happens Next?)
- [ ] Perspective & Debate Arena (F16 Perspective Switch, F23 Argument Arena, F25 Spot the Weak Argument)

---

## 🗃️ Database Schema (PostgreSQL)

### Core Tables

```sql
-- Users
users (id, email, role [child|parent|teacher], age, preferred_language, created_at)
parent_child_links (parent_id, child_id, consent_verified_at, consent_method)

-- Writing
pieces (id, author_id, type [story|poem|essay|opinion], title, content, language,
        status [draft|private|community|contest], word_count, created_at, updated_at)
drafts (id, piece_id, author_id, content_snapshot, saved_at)

-- Community
community_posts (id, piece_id, age_band, published_at)
reactions (id, post_id, user_id, type [heart], created_at)
comments (id, post_id, author_id, content, moderation_status, created_at)

-- Gamification
badges (id, name, description, icon_url)
user_badges (user_id, badge_id, earned_at)
user_xp (user_id, xp_total, streak_days, last_active_date)

-- AI
ai_prompts (id, age_band_min, age_band_max, format, language, prompt_text, cached_at)
growth_nudges (id, piece_id, user_id, nudge_text, shown_at, clicked_at)

-- Classroom
classrooms (id, teacher_id, name, school, created_at)
classroom_students (classroom_id, student_id)
assignments (id, classroom_id, prompt, format, language, due_at, created_at)
submissions (id, assignment_id, student_id, piece_id, submitted_at)

-- Contests
contests (id, theme, start_at, end_at, age_band_min, age_band_max, format, status)
contest_entries (id, contest_id, piece_id, user_id, submitted_at, plagiarism_status)
contest_judges (id, contest_id, judge_user_id, language_competency)
contest_results (id, contest_id, entry_id, rank, judge_note, published_at)

-- Moderation
moderation_flags (id, content_type, content_id, flag_type [troll|crisis], 
                  severity, status [pending|reviewed|resolved], created_at)
moderation_reviews (id, flag_id, reviewer_id, decision, notes, reviewed_at)

-- Consent
parental_consents (id, parent_id, child_id, consent_type [platform|contest],
                   verified_method, verified_at, revoked_at)
```

---

## 🔌 API Endpoints (Key Routes)

```
POST   /auth/register          — child/parent/teacher registration
POST   /auth/login             — login
POST   /auth/parent-verify     — verify parental consent

GET    /pieces                  — list user's pieces
POST   /pieces                  — create new piece
GET    /pieces/:id              — get piece
PUT    /pieces/:id              — update piece
DELETE /pieces/:id              — soft delete

POST   /ai/prompt               — get AI writing prompts
POST   /ai/feedback             — get AI positive feedback
POST   /ai/nudge                — get Growth Nudge (opt-in)
POST   /ai/art                  — generate AI art decoration

GET    /community/feed          — age-filtered community feed
POST   /community/:id/react     — add ❤️ reaction
POST   /community/:id/comment   — add positive comment

GET    /parent/dashboard/:childId  — child summary for parent
GET    /teacher/classroom/:id      — classroom view
POST   /teacher/assignment         — create assignment
GET    /teacher/assignment/:id/submissions — view submissions

GET    /contests                    — list active contests
POST   /contests/:id/enter          — submit contest entry
GET    /contests/:id/results        — contest results

POST   /moderation/flag             — internal: T&S flag
GET    /moderation/queue            — internal: review queue
PUT    /moderation/:id/resolve      — internal: resolve flag
```

---

## 🎨 UI Screens to Build

### Child App
1. **Onboarding** — age selection, language preference, parent email
2. **Home / Dashboard** — recent pieces, badges, streak, "Write Today" CTA
3. **Write Screen** — format selector (story/poem/essay/opinion) + distraction-free editor
4. **Prompt Screen** — 3 AI prompts, pick one, mind map starter
5. **Community Feed** — age-filtered pieces, ❤️ + comment
6. **My Journal** — all pieces, filter by type
7. **Badges & Progress** — gamification hub
8. **Contest Board** — active contests, entry flow
9. **Settings** — language, accessibility (font, TTS, contrast)

### Parent App
1. **Parent Dashboard** — child overview (pieces, badges, growth chart)
2. **Piece Viewer** — read child's writing, AI theme summary
3. **Consent Center** — manage consents (platform + per-contest)
4. **Notifications** — T&S alerts, encouraging message from teacher

### Teacher App
1. **Classroom Dashboard** — class overview, literacy growth indicators
2. **Create Assignment** — prompt picker, format, language, deadline
3. **Submissions Viewer** — all submissions, filter by student
4. **Student Progress** — individual growth tracking

---

## 🚀 Immediate Next Steps (Week 1)

- [ ] Create GitHub repo: `young-writers-platform`
- [ ] Set up Firebase project (free tier)
- [ ] Design 4 UI mockups: writing screen, community feed, parent dashboard, essay/opinion scaffold
- [ ] Book lawyer consult (India DPDP Act — before building consent flow)
- [ ] WhatsApp community + Instagram presence created
- [ ] Post 3 example pieces (story, poem, opinion with counter-argument) for parent preview
- [ ] Share with 5 parent friends — ask: "What would make you trust the safety promise?"

---

## 🚨 Key Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| AI costs spike at scale | Rate-limit art gen; cache prompts; use small model for moderation |
| Crisis escalation gaps | SLA-bound T&S; trained reviewers (not generic mods) |
| Contest fraud (ChatGPT essays) | Plagiarism + AI-detection before judging |
| Regulatory non-compliance (DPDP) | Lawyer consult before building consent flow |
| Low-bandwidth device failures | Offline drafts; text-first mode as first-class option |
| Language disadvantage in contests | Native-language judging; no machine-translation of submitted pieces |
| Parental consent spoofing | Lightweight identity verification step (not just email) |

---

*Last updated: June 2026 | Based on Young Writers Platform PRD v2*
