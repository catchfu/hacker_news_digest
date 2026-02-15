import { loadConfig, loadEnvConfig, parsePeriod } from './config';
import { fetchAllFeeds, filterByPeriod, filterByCategories, Article } from './rss';
import { summarizeArticles, resetQuotaFlag } from './gemini';
import { createReportData, toMarkdown, ReportData } from './formatter';
import { sendDigestEmail } from './email';

interface CLIArgs {
  period?: string;
  articles?: number;
  config?: string;
  sendEmail?: boolean;
}

function parseArgs(): CLIArgs {
  const args: CLIArgs = {};
  const periodArg = process.argv.find((a) => a.startsWith('--period='));
  const articlesArg = process.argv.find((a) => a.startsWith('--articles='));
  const configArg = process.argv.find((a) => a.startsWith('--config='));
  const sendEmailArg = process.argv.find((a) => a === '--send-email');

  if (periodArg) args.period = periodArg.split('=')[1];
  if (articlesArg) args.articles = parseInt(articlesArg.split('=')[1], 10);
  if (configArg) args.config = configArg.split('=')[1];
  if (sendEmailArg) args.sendEmail = true;

  return args;
}

function categorizeArticles(articles: Article[], config: ReturnType<typeof loadConfig>): Map<string, Article[]> {
  const categorized = new Map<string, Article[]>();

  // Get all articles sorted by date
  const sortedArticles = [...articles].sort((a, b) => {
    const dateA = a.isoDate ? new Date(a.isoDate).getTime() : 0;
    const dateB = b.isoDate ? new Date(b.isoDate).getTime() : 0;
    return dateB - dateA;
  });

  // Top Stories (from frontpage feed)
  const frontpageFeed = sortedArticles.slice(0, 30);
  categorized.set('Top Stories', frontpageFeed);

  // Tech category
  const techArticles = filterByCategories(articles, config.categories.tech);
  categorized.set('Tech', techArticles.slice(0, 20));

  // Startup category
  const startupArticles = filterByCategories(articles, config.categories.startup);
  categorized.set('Startup', startupArticles.slice(0, 20));

  // Ask HN
  const askHN = articles.filter((a) => a.title?.toLowerCase().includes('ask hn'));
  categorized.set('Ask HN', askHN.slice(0, 10));

  // Show HN
  const showHN = articles.filter((a) => a.title?.toLowerCase().includes('show hn'));
  categorized.set('Show HN', showHN.slice(0, 10));

  return categorized;
}

async function main() {
  console.log('🚀 Starting Hacker News Digest Generator...\n');

  const args = parseArgs();
  const config = loadConfig(args.config);

  const period = args.period || config.period;
  const articlesPerCategory = args.articles || config.articles_per_category;

  console.log(`📅 Period: ${period}`);
  console.log(`📊 Articles per category: ${articlesPerCategory}\n`);

  // Fetch all feeds
  console.log('📥 Fetching RSS feeds...');
  const feeds = await fetchAllFeeds();

  // Collect all articles
  const allArticles: Article[] = [];
  for (const feed of feeds) {
    const filtered = filterByPeriod(feed.items, period);
    allArticles.push(...filtered.map((a) => ({ ...a, source: feed.title })));
  }

  console.log(`   Found ${allArticles.length} articles\n`);

  // Categorize articles
  console.log('📂 Categorizing articles...');
  const categorized = categorizeArticles(allArticles, config);

  // Get top articles for summarization
  const articlesToSummarize: Article[] = [];
  for (const [, articles] of categorized) {
    articlesToSummarize.push(...articles.slice(0, articlesPerCategory));
  }

  // Reset quota flag and summarize with Gemini
  resetQuotaFlag();
  console.log('🤖 Summarizing articles with Gemini...');
  const summaries = await summarizeArticles(articlesToSummarize);

  // Create report data
  console.log('📝 Generating report...\n');
  const reportData: ReportData = {
    title: 'Hacker News Digest',
    period,
    articleCount: articlesPerCategory,
    generatedAt: new Date().toISOString().replace('T', ' ').substring(0, 19) + 'Z',
    sections: [],
  };

  for (const [category, articles] of categorized) {
    const formattedArticles = articles
      .slice(0, articlesPerCategory)
      .map((article) => ({
        title: article.title,
        summary: summaries.get(article.link) || article.contentSnippet?.substring(0, 150) || 'No summary',
        link: article.link,
        pubDate: article.pubDate,
        source: article.source,
      }));

    reportData.sections.push({
      name: category,
      icon: category === 'Top Stories' ? '🔥' : category === 'Tech' ? '🖥️' : category === 'Startup' ? '🚀' : category === 'Ask HN' ? '❓' : category === 'Show HN' ? '💡' : '📰',
      articles: formattedArticles,
    });
  }

  // Output markdown
  const markdown = toMarkdown(reportData);
  console.log(markdown);

  // Save to file
  const fs = require('fs');
  const date = new Date().toISOString().split('T')[0];
  fs.writeFileSync(`digest-${date}.md`, markdown);
  console.log(`\n💾 Saved to digest-${date}.md`);

  // Send email if requested
  if (args.sendEmail) {
    console.log('\n📧 Sending email...');
    await sendDigestEmail(reportData);
  }

  console.log('\n✅ Done!');
}

main().catch(console.error);
