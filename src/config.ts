import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import * as dotenv from 'dotenv';

dotenv.config();

export interface Config {
  period: string;
  articles_per_category: number;
  categories: {
    tech: string[];
    startup: string[];
  };
  rss_sources: {
    hn: string[];
    x: string[];
    custom: string[];
  };
  email: {
    smtp_host: string;
    smtp_port: number;
  };
  llm: {
    provider: string;
    model: string;
    openai_model?: string;
  };
}

export interface EnvConfig {
  geminiApiKey: string;
  openaiApiKey: string;
  emailTo: string;
  emailFrom: string;
  emailPassword: string;
  smtpHost: string;
  smtpPort: number;
}

let config: Config | null = null;
let envConfig: EnvConfig | null = null;

export function loadConfig(configPath?: string): Config {
  if (config) return config;

  const defaultPath = path.join(process.cwd(), 'config.yaml');
  const filePath = configPath || defaultPath;

  const fileContents = fs.readFileSync(filePath, 'utf8');
  config = yaml.load(fileContents) as Config;
  return config;
}

export function loadEnvConfig(): EnvConfig {
  if (envConfig) return envConfig;

  envConfig = {
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    emailTo: process.env.EMAIL_TO || '',
    emailFrom: process.env.EMAIL_FROM || '',
    emailPassword: process.env.EMAIL_PASSWORD || '',
    smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
    smtpPort: parseInt(process.env.SMTP_PORT || '587', 10),
  };

  return envConfig;
}

export function parsePeriod(periodStr: string): number {
  const match = periodStr.match(/^(\d+)([dh])$/);
  if (!match) {
    throw new Error('Invalid period format. Use format like "24h" or "72h"');
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  if (unit === 'h') {
    return value * 60 * 60 * 1000; // hours to ms
  } else if (unit === 'd') {
    return value * 24 * 60 * 60 * 1000; // days to ms
  }

  return value * 60 * 60 * 1000;
}
