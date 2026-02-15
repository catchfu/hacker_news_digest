import Parser from 'rss-parser';
import { loadConfig, parsePeriod } from './config';

export interface Article {
  title: string;
  link: string;
  pubDate: string;
  content?: string;
  contentSnippet?: string;
  creator?: string;
  categories?: string[];
  isoDate?: string;
  source?: string;
}

export interface ParsedFeed {
  title: string;
  feedUrl: string;
  items: Article[];
}

const parser = new Parser({
  customFields: {
    item: [
      ['hn:comments', 'comments'],
      ['media:content', 'media'],
    ],
  },
  timeout: 10000,
});

const HN_API_BASE = 'https://hacker-news.firebaseio.com/v0';

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchHNItem(id: number): Promise<any> {
  const res = await fetch(`${HN_API_BASE}/item/${id}.json`);
  if (!res.ok) return null;
  return res.json();
}

export async function fetchHNTopStories(limit = 50): Promise<Article[]> {
  try {
    const res = await fetch(`${HN_API_BASE}/topstories.json`);
    if (!res.ok) throw new Error('Failed to fetch top stories');
    const ids = await res.json() as number[];
    
    const items = await Promise.all(
      ids.slice(0, limit).map(id => fetchHNItem(id))
    );
    
    return items
      .filter(item => item && item.url)
      .map(item => ({
        title: item.title || 'Untitled',
        link: item.url || `https://news.ycombinator.com/item?id=${item.id}`,
        pubDate: new Date(item.time * 1000).toISOString(),
        contentSnippet: item.text || '',
        creator: item.by,
        categories: [] as string[],
        isoDate: new Date(item.time * 1000).toISOString(),
        source: 'Hacker News',
      }));
  } catch (error) {
    console.error('Error fetching HN top stories:', error);
    return [];
  }
}

export async function fetchHNNewStories(limit = 50): Promise<Article[]> {
  try {
    const res = await fetch(`${HN_API_BASE}/newstories.json`);
    if (!res.ok) throw new Error('Failed to fetch new stories');
    const ids = await res.json() as number[];
    
    const items = await Promise.all(
      ids.slice(0, limit).map(id => fetchHNItem(id))
    );
    
    return items
      .filter(item => item && item.url)
      .map(item => ({
        title: item.title || 'Untitled',
        link: item.url || `https://news.ycombinator.com/item?id=${item.id}`,
        pubDate: new Date(item.time * 1000).toISOString(),
        contentSnippet: item.text || '',
        creator: item.by,
        categories: [] as string[],
        isoDate: new Date(item.time * 1000).toISOString(),
        source: 'Hacker News',
      }));
  } catch (error) {
    console.error('Error fetching HN new stories:', error);
    return [];
  }
}

export async function fetchHNAskStories(limit = 30): Promise<Article[]> {
  try {
    const res = await fetch(`${HN_API_BASE}/askstories.json`);
    if (!res.ok) throw new Error('Failed to fetch ask stories');
    const ids = await res.json() as number[];
    
    const items = await Promise.all(
      ids.slice(0, limit).map(id => fetchHNItem(id))
    );
    
    return items
      .filter(item => item)
      .map(item => ({
        title: item.title || 'Untitled',
        link: item.url || `https://news.ycombinator.com/item?id=${item.id}`,
        pubDate: new Date(item.time * 1000).toISOString(),
        contentSnippet: item.text || '',
        creator: item.by,
        categories: [] as string[],
        isoDate: new Date(item.time * 1000).toISOString(),
        source: 'Hacker News',
      }));
  } catch (error) {
    console.error('Error fetching HN ask stories:', error);
    return [];
  }
}

export async function fetchHNShowStories(limit = 30): Promise<Article[]> {
  try {
    const res = await fetch(`${HN_API_BASE}/showstories.json`);
    if (!res.ok) throw new Error('Failed to fetch show stories');
    const ids = await res.json() as number[];
    
    const items = await Promise.all(
      ids.slice(0, limit).map(id => fetchHNItem(id))
    );
    
    return items
      .filter(item => item)
      .map(item => ({
        title: item.title || 'Untitled',
        link: item.url || `https://news.ycombinator.com/item?id=${item.id}`,
        pubDate: new Date(item.time * 1000).toISOString(),
        contentSnippet: item.text || '',
        creator: item.by,
        categories: [] as string[],
        isoDate: new Date(item.time * 1000).toISOString(),
        source: 'Hacker News',
      }));
  } catch (error) {
    console.error('Error fetching HN show stories:', error);
    return [];
  }
}

export async function fetchFeed(feedUrl: string, retries = 3): Promise<ParsedFeed> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const feed = await parser.parseURL(feedUrl);
      return {
        title: feed.title || 'Unknown Feed',
        feedUrl: feedUrl,
        items: feed.items.map((item) => ({
          title: item.title || 'Untitled',
          link: item.link || '',
          pubDate: item.pubDate || '',
          content: item.content,
          contentSnippet: item.contentSnippet,
          creator: item.creator,
          categories: item.categories,
          isoDate: item.isoDate,
        })),
      };
    } catch (error: any) {
      const statusCode = error?.response?.statusCode || error?.statusCode;
      if (attempt < retries && (statusCode === 429 || statusCode >= 500)) {
        console.warn(`Rate limited (${statusCode}), retrying in ${attempt * 2}s...`);
        await sleep(attempt * 2000);
      } else {
        console.error(`Error fetching feed ${feedUrl}:`, error?.message || error);
        return { title: feedUrl, feedUrl, items: [] };
      }
    }
  }
  return { title: feedUrl, feedUrl, items: [] };
}

export async function fetchAllFeeds(): Promise<ParsedFeed[]> {
  const feeds: ParsedFeed[] = [];

  // Use HN Firebase API (more reliable than RSS)
  console.log('   Fetching HN Top Stories...');
  const topStories = await fetchHNTopStories(50);
  if (topStories.length > 0) {
    feeds.push({
      title: 'Hacker News - Top Stories',
      feedUrl: 'hn:top',
      items: topStories,
    });
  }

  console.log('   Fetching HN New Stories...');
  const newStories = await fetchHNNewStories(50);
  if (newStories.length > 0) {
    feeds.push({
      title: 'Hacker News - New',
      feedUrl: 'hn:new',
      items: newStories,
    });
  }

  console.log('   Fetching HN Ask Stories...');
  const askStories = await fetchHNAskStories(30);
  if (askStories.length > 0) {
    feeds.push({
      title: 'Hacker News - Ask',
      feedUrl: 'hn:ask',
      items: askStories,
    });
  }

  console.log('   Fetching HN Show Stories...');
  const showStories = await fetchHNShowStories(30);
  if (showStories.length > 0) {
    feeds.push({
      title: 'Hacker News - Show',
      feedUrl: 'hn:show',
      items: showStories,
    });
  }

  // Try RSS as fallback (but likely rate limited)
  const config = loadConfig();
  
  for (const url of config.rss_sources.hn) {
    console.log(`   Fetching RSS: ${url}`);
    const feed = await fetchFeed(url);
    if (feed.items.length > 0) {
      feeds.push(feed);
    }
    await sleep(1000);
  }

  for (const url of config.rss_sources.x) {
    console.log(`   Fetching RSS: ${url}`);
    const feed = await fetchFeed(url);
    if (feed.items.length > 0) {
      feeds.push(feed);
    }
    await sleep(1000);
  }

  // Fetch custom RSS feeds (e.g., Andrej Karpathy curated)
  if (config.rss_sources.custom) {
    for (const url of config.rss_sources.custom) {
      console.log(`   Fetching custom RSS: ${url}`);
      const feed = await fetchFeed(url);
      if (feed.items.length > 0) {
        feeds.push(feed);
      }
      await sleep(1000);
    }
  }

  return feeds;
}

export function filterByPeriod(articles: Article[], periodStr: string): Article[] {
  const periodMs = parsePeriod(periodStr);
  const cutoffTime = new Date(Date.now() - periodMs);

  return articles.filter((article) => {
    const articleDate = article.isoDate ? new Date(article.isoDate) : new Date(article.pubDate);
    return articleDate >= cutoffTime;
  });
}

export function filterByCategories(articles: Article[], categories: string[]): Article[] {
  if (!categories || categories.length === 0) return articles;

  const lowerCategories = categories.map((c) => c.toLowerCase());

  return articles.filter((article) => {
    const titleLower = (article.title || '').toLowerCase();
    const contentLower = (article.contentSnippet || '').toLowerCase();
    const articleCategories = (article.categories || []).map((c) => c.toLowerCase());

    return lowerCategories.some(
      (cat) =>
        titleLower.includes(cat) ||
        contentLower.includes(cat) ||
        articleCategories.includes(cat)
    );
  });
}
