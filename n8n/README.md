# n8n Integration Guide — Young Writers Platform

## Existing Workflows

### 1. `n8n_streak_risk_nudge.json`
**Trigger**: Nightly CRON (11 PM IST)  
**What it does**: Queries Supabase for children who have a ≥3-day streak but haven't written today → sends an in-app + WhatsApp nudge  
**Key nodes**: Supabase → Filter (streak ≥ 3 AND last_piece_date < today) → WhatsApp Cloud API  

### 2. `n8n_weekly_parent_digest.json`
**Trigger**: Every Friday at 6 PM IST  
**What it does**: Queries Supabase for the week's pieces per child → generates summary → sends email to parent address on file  
**Key nodes**: Supabase → Format Digest (Function node) → SendGrid → Log to sheet  

---

## Next 5 Workflows to Build

### 3. Safety Flag Alert (Priority: HIGH)
**Trigger**: Webhook from backend (POST `/n8n/webhooks/safety-flag`)  
**Payload**: `{ flag_id, severity, age_band, time_utc }`  
**What it does**:
- **high severity**: Immediate Slack message to `#safety-alerts` + email to reviewer on-call
- **medium severity**: Slack message only
- **low severity**: Queued daily digest email

**SLA targets**:
- High: 1-hour response
- Medium: 4-hour response
- Low: 24-hour response

**Node sequence**: Webhook → Switch (severity) → [Slack + Email] | [Slack] | [Batch daily digest]

---

### 4. School Onboarding Drip (Priority: MEDIUM)
**Trigger**: Webhook from Supabase (INSERT into `schools` table)  
**What it does**: 5-email onboarding sequence over 10 days  

| Day | Email | Goal |
|---|---|---|
| 0 | Welcome + portal access | First login |
| 2 | "Set up your first class" | Class creation |
| 5 | Consent collection guide | 100% consent rate |
| 7 | Best practices for young writers | Engagement |
| 10 | Success story from another school | Retention |

**Node sequence**: Webhook → Supabase (get school details) → Wait nodes → SendGrid

---

### 5. Contest Entry Routing (Priority: MEDIUM)
**Trigger**: Webhook (POST `/n8n/webhooks/contest-entry`)  
**What it does**:
1. Plagiarism check — compare against existing DB entries (cosine similarity via Supabase pgvector)
2. If pass → add to judge queue in Supabase
3. If flag → route to Trust & Safety queue with `reason: plagiarism_check`
4. Email confirmation to writer's parent

**Node sequence**: Webhook → Supabase (pgvector similarity) → If node → [Add to judge queue] | [Safety flag] → SendGrid (parent)

---

### 6. Nightly KPI Sync (Priority: LOW)
**Trigger**: CRON `0 1 * * *` (1 AM IST daily)  
**What it does**: Pulls 5 core metrics from Supabase → writes to Google Sheet (admin dashboard)

**Metrics synced**:
- Total active users (DAU)
- Pieces submitted today
- Safety flags raised today
- New schools onboarded this week
- Weekly Completing Writers (WCW) — rolling 7-day

**Node sequence**: CRON → Supabase (5 queries) → Google Sheets → (optional) Slack summary

---

### 7. Referral Reward Trigger (Priority: LOW)
**Trigger**: Webhook (POST `/n8n/webhooks/referral-confirmed`)  
**What it does**:
1. Verify referral is not self-referral (different user IDs)
2. Credit `REFERRAL` badge + XP to referrer in Supabase
3. Send "You helped a friend join!" email to referrer

**Node sequence**: Webhook → Supabase (verify + credit) → SendGrid

---

## Environment Variables

```
SUPABASE_URL=https://[project].supabase.co
SUPABASE_SERVICE_KEY=[service key — never anon key]
SENDGRID_API_KEY=[sendgrid key]
SLACK_WEBHOOK_URL=[safety alerts channel webhook]
WHATSAPP_TOKEN=[Meta Cloud API token]
N8N_BASIC_AUTH_USER=[restrict webhook access]
N8N_BASIC_AUTH_PASSWORD=[restrict webhook access]
```

---

## Security Notes

- All n8n webhooks must be protected with basic auth or HMAC header verification
- Supabase queries use the **service role key** — keep this in n8n credentials only, never in frontend
- Children's content is never processed in n8n — only metadata (user ID, timestamp, word count)
- Raw flagged text stays in Supabase only; n8n carries only the `flag_id` reference
