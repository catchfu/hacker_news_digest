import { Article } from './rss';

export interface FormattedArticle {
  title: string;
  summary: string;
  link: string;
  pubDate: string;
  source?: string;
}

export interface ReportData {
  title: string;
  period: string;
  articleCount: number;
  generatedAt: string;
  sections: {
    name: string;
    icon: string;
    articles: FormattedArticle[];
  }[];
}

export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function formatTimestamp(date: Date): string {
  return date.toISOString().replace('T', ' ').substring(0, 19) + 'Z';
}

export function createReportData(
  period: string,
  articlesPerCategory: number,
  categorizedArticles: Map<string, Article[]>,
  summaries: Map<string, string>
): ReportData {
  const sections: ReportData['sections'] = [];

  const categoryIcons: Record<string, string> = {
    'Top Stories': '🔥',
    'Newest': '✨',
    'Ask HN': '❓',
    'Show HN': '💡',
    Tech: '🖥️',
    Startup: '🚀',
  };

  for (const [category, articles] of categorizedArticles) {
    const formattedArticles: FormattedArticle[] = articles
      .slice(0, articlesPerCategory)
      .map((article) => ({
        title: article.title,
        summary: summaries.get(article.link) || article.contentSnippet?.substring(0, 150) || 'No summary available',
        link: article.link,
        pubDate: article.pubDate,
        source: article.source,
      }));

    sections.push({
      name: category,
      icon: categoryIcons[category] || '📰',
      articles: formattedArticles,
    });
  }

  return {
    title: 'Hacker News Digest',
    period,
    articleCount: articlesPerCategory,
    generatedAt: formatTimestamp(new Date()),
    sections,
  };
}

export function toMarkdown(data: ReportData): string {
  let md = `# ${data.title}\n\n`;
  md += `**Period:** Last ${data.period} | **Articles per section:** ${data.articleCount}\n`;
  md += `**Generated:** ${data.generatedAt}\n\n---\n\n`;

  for (const section of data.sections) {
    if (section.articles.length === 0) continue;

    md += `### ${section.icon} ${section.name}\n\n`;

    for (const article of section.articles) {
      md += `**${article.title}**\n\n`;
      md += `> ${article.summary}\n\n`;
      md += `[Read more](${article.link})\n\n`;
      md += `---\n\n`;
    }
  }

  md += `\n---\n*Generated automatically by Hacker News Digest*\n`;

  return md;
}

export function toHtml(data: ReportData): string {
  let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background: #f5f5f5; }
    .header { background: #ff6600; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0; }
    .meta { font-size: 14px; opacity: 0.9; }
    .section { background: white; margin: 10px 0; padding: 20px; border-radius: 8px; }
    .section h2 { margin-top: 0; color: #333; }
    .article { border-bottom: 1px solid #eee; padding: 15px 0; }
    .article:last-child { border-bottom: none; }
    .article h3 { margin: 0 0 10px 0; }
    .article h3 a { color: #ff6600; text-decoration: none; }
    .article h3 a:hover { text-decoration: underline; }
    .summary { color: #555; margin: 10px 0; }
    .footer { text-align: center; color: #888; font-size: 12px; padding: 20px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${data.title}</h1>
    <div class="meta">Period: Last ${data.period} | Articles: ${data.articleCount} per section | Generated: ${data.generatedAt}</div>
  </div>
`;

  for (const section of data.sections) {
    if (section.articles.length === 0) continue;

    html += `  <div class="section">
    <h2>${section.icon} ${section.name}</h2>
`;

    for (const article of section.articles) {
      html += `    <div class="article">
      <h3><a href="${article.link}">${article.title}</a></h3>
      <div class="summary">${article.summary}</div>
    </div>
`;
    }

    html += `  </div>\n`;
  }

  html += `  <div class="footer">Generated automatically by Hacker News Digest</div>
</body>
</html>`;

  return html;
}
