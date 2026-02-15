# Hacker News Digest Generator

Generate daily Hacker News and X.com digest reports with AI-powered summarization using Gemini.

## Features

- 📰 Fetches articles from Hacker News RSS feeds and X.com (via RSS-bridge)
- 🤖 Uses Google Gemini for AI-powered article summarization
- 📧 Sends formatted HTML email reports
- ⏰ Scheduled via GitHub Actions (daily at midnight UTC)
- 🔧 Configurable: time period, article count, categories

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/catchfu/hacker_news_digest.git
cd hacker_news_digest
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Edit `.env`:
- `GEMINI_API_KEY` - Get from [Google AI Studio](https://aistudio.google.com/app/apikey)
- `EMAIL_TO` - Recipient email
- `EMAIL_FROM` - Your Gmail address
- `EMAIL_PASSWORD` - [App password](https://support.google.com/accounts/answer/185833) (not your regular password)

### 4. Configure (optional)

Edit `config.yaml` to customize:
- `period`: Time period (24h, 72h, etc.)
- `articles_per_category`: Number of articles per section
- `categories`: Tech and Startup keywords to filter

## Usage

### Generate digest locally

```bash
# Default (24h, 5 articles)
npm start

# Custom period and article count
npm start -- --period 72h --articles 10

# Generate and send email
npm start -- --send-email

# Use custom config
npm start -- --config my-config.yaml
```

### GitHub Actions

The workflow runs automatically daily at midnight UTC. You can also trigger manually:

1. Go to **Actions** > **Hacker News Digest**
2. Click **Run workflow**
3. Customize period, articles count, and email options
4. Click **Run workflow**

## GitHub Secrets

Add these in **Settings > Secrets and variables > Actions**:

| Secret | Description |
|--------|-------------|
| `GEMINI_API_KEY` | Google Gemini API key |
| `EMAIL_TO` | Recipient email address |
| `EMAIL_FROM` | Sender Gmail address |
| `EMAIL_PASSWORD` | Gmail app password |

## Example Output

```
# Hacker News Digest

**Period:** Last 24h | **Articles per section:** 5
**Generated:** 2026-02-15 00:00:00Z

---

### 🔥 Top Stories

**Building LLM Applications**
> A practical guide to creating production LLM apps with proper architecture.
[Read more](https://news.ycombinator.com/item?id=123)

---
```

## Tech Stack

- **Runtime:** Node.js + TypeScript
- **RSS Parsing:** rss-parser
- **LLM:** Google Gemini API
- **Email:** Nodemailer + Gmail SMTP
- **Scheduling:** GitHub Actions

## License

MIT
