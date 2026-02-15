import { GoogleGenerativeAI } from '@google/generative-ai';
import { loadEnvConfig, loadConfig } from './config';
import { Article } from './rss';

const env = loadEnvConfig();
const config = loadConfig();

const genAI = env.geminiApiKey ? new GoogleGenerativeAI(env.geminiApiKey) : null;
const modelName = config.llm?.model || 'gemini-2.0-flash';

let quotaExceeded = false;

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function resetQuotaFlag(): void {
  quotaExceeded = false;
}

async function summarizeWithGemini(article: Article): Promise<string> {
  if (!genAI) return '';
  
  const model = genAI.getGenerativeModel({ model: modelName });

  const prompt = `Summarize the following article in 2-3 sentences. Focus on the key insight or value:

Title: ${article.title}
${article.contentSnippet || article.content?.substring(0, 500) || ''}

Summary:`;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      const response = result.response;
      return response.text().trim();
    } catch (error: any) {
      const status = error?.status;
      const errorMsg = error?.message || '';
      
      if (status === 429 || errorMsg.includes('quota') || errorMsg.includes('429')) {
        if (attempt < 3) {
          await sleep(attempt * 3000);
          continue;
        }
        return '';
      }
      
      if (attempt < 3) {
        await sleep(attempt * 2000);
      }
    }
  }
  return '';
}

async function summarizeWithOpenAI(article: Article): Promise<string> {
  if (!env.openaiApiKey) return '';
  
  const openaiModel = config.llm?.openai_model || 'gpt-4o-mini';
  
  const prompt = `Summarize the following article in 2-3 sentences. Focus on the key insight or value:

Title: ${article.title}
${article.contentSnippet || article.content?.substring(0, 500) || ''}

Summary:`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.openaiApiKey}`
      },
      body: JSON.stringify({
        model: openaiModel,
        messages: [
          { role: 'system', content: 'You are a helpful assistant that summarizes articles.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 100
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`OpenAI API error: ${response.status} - ${errorText}`);
      return '';
    }

    const data = await response.json() as any;
    return data.choices?.[0]?.message?.content?.trim() || '';
  } catch (error: any) {
    console.warn('OpenAI summarization error:', error?.message || error);
    return '';
  }
}

export async function summarizeArticle(article: Article): Promise<string> {
  // Try Gemini first
  const geminiSummary = await summarizeWithGemini(article);
  if (geminiSummary) return geminiSummary;
  
  // Fallback to OpenAI if Gemini fails
  const openaiSummary = await summarizeWithOpenAI(article);
  if (openaiSummary) return openaiSummary;
  
  // Final fallback to content snippet
  return article.contentSnippet?.substring(0, 150) || 'Summary unavailable';
}

export async function summarizeArticles(articles: Article[]): Promise<Map<string, string>> {
  const summaries = new Map<string, string>();

  // Process in smaller batches with longer delays
  const batchSize = 2;
  for (let i = 0; i < articles.length; i += batchSize) {
    const batch = articles.slice(i, i + batchSize);
    const promises = batch.map(async (article) => {
      const summary = await summarizeArticle(article);
      summaries.set(article.link, summary);
    });

    await Promise.all(promises);

    // Add delay between batches
    if (i + batchSize < articles.length) {
      await sleep(2000);
    }
  }

  return summaries;
}
