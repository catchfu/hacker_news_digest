# Hacker News Digest Generator Skill

## Overview

A skill that generates a formatted daily/periodic digest report from Hacker News RSS feeds and X.com (via RSS-bridge), uses Gemini LLM to summarize articles, and can be scheduled via GitHub Actions to send email reports.

## Triggers

- "generate hacker news digest", "create HN digest", "HN daily report"
- "run digest with [24h/72h] period"
- "send digest email"

## Features

### 1. Data Sources
- **Hacker News RSS**: `https://hnrss.org/frontpage`, `https://hnrss.org/newest`, `https://hnrss.org/ask`, `https://hnrss.org/show`
- **X.com via RSS-bridge**: `https://rss-bridge.org/bridge01/?action=display&bridge=TwitterBridge&context=By+user&u=karpathy&format=Atom`
- Configurable RSS sources via YAML/JSON config

### 2. Time Period Support
- `24h` (last 24 hours) - default
- `72h` (last 72 hours)
- Custom period via CLI argument `--period=48h`

### 3. Configurable Article Count
- Default: 5 articles per category
- Configurable via `--articles=10` or config file
- Categories:
  - Tech: ML, AI, LLMs, Coding, Systems
  - Startup: Startup, Funding, Product, Growth
  - Also include: Top, Show, Ask, New from HN

### 4. LLM Summarization (Gemini)
- Uses Google Gemini API for article summarization
- Configurable via `GEMINI_API_KEY` env var
- Summary format: 2-3 sentence concise summary
- Preserves original article link

### 5. Report Formatting
- Markdown format output
- Sections:
  - Header with date, period, article count
  - Each category with bullet list:
    - Article title
    - Summary (LLM-generated)
    - Original link
    - Points/comments count (from HN)
  - Footer with generated timestamp

### 6. GitHub Actions Scheduling
- Workflow file: `.github/workflows/digest.yml`
- Schedule options: `cron: "0 0 * * *"` (daily midnight UTC)
- Manual trigger via `workflow_dispatch`
- Environment variables:
  - `GEMINI_API_KEY`
  - `EMAIL_TO`
  - `EMAIL_FROM`
  - `EMAIL_PASSWORD` (app password)
  - `SMTP_HOST`
  - `SMTP_PORT`

### 7. Email Delivery (Gmail SMTP)
- Uses nodemailer for SMTP sending
- HTML-formatted email with links
- Configurable from/to emails

## File Structure

```
hacker_news_digest/
├── config.yaml
├── package.json
├── src/
│   ├── index.ts          # Main entry
│   ├── rss.ts            # RSS fetching
│   ├── gemini.ts         # LLM summarization
│   ├── formatter.ts      # Report formatting
│   ├── email.ts          # Email sending
│   └── scheduler.ts      # GitHub Actions workflow
├── .github/
│   └── workflows/
│       └── digest.yml
├── README.md
└── .env.example
```

## Configuration (config.yaml)

```yaml
period: 24h
articles_per_category: 5
categories:
  tech:
    - ML
    - AI
    - LLMs
    - Coding
    - Systems
  startup:
    - Startup
    - Funding
    - Product
    - Growth
rss_sources:
  hn:
    - https://hnrss.org/frontpage
    - https://hnrss.org/newest
    - https://hnrss.org/ask
    - https://hnrss.org/show
  x:
    - https://rss-bridge.org/bridge01/?action=display&bridge=TwitterBridge&context=By+user&u=karpathy&format=Atom
email:
  smtp_host: smtp.gmail.com
  smtp_port: 587
llm:
  provider: gemini
  model: gemini-2.0-flash
```

## Usage

```bash
# Generate digest
npm start -- --period 72h --articles 10

# Run with custom config
npm start -- --config my-config.yaml

# Generate and send email
npm start -- --send-email
```

## Dependencies

- `feedparser` or `rss-parser` - RSS parsing
- `@google/generative-ai` - Gemini SDK
- `nodemailer` - Email sending
- `dotenv` - Environment config
- `js-yaml` - Config parsing

## Output Example

```
# Hacker News Digest - Feb 15, 2026
## Period: Last 24 hours | 5 articles per category

### 🔥 Top Stories
1. **Building LLM Applications** - A practical guide to creating production LLM apps with proper architecture patterns and error handling.
   [Read more](https://news.ycombinator.com/item?id=123) | ⬆️ 450 | 💬 89

2. **Show HN: New ML Framework** - Introducing a faster, memory-efficient ML framework for training large models.
   [Read more](https://news.ycombinator.com/item?id=124) | ⬆️ 320 | 💬 45

...

### 💡 Ask HN
...

---
Generated at 2026-02-15T00:00:00Z
```
