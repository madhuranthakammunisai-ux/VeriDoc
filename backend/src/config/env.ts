import dotenv from 'dotenv';
dotenv.config();

export interface EnvConfig {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  CLIENT_ORIGINS: string[];
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  GEMINI_API_KEY?: string;
  GEMINI_MODEL?: string;
  ENABLE_IN_PROCESS_AI_WORKER?: boolean;
  MAX_FILE_SIZE_MB: number;
  MAX_UPLOAD_FILES: number;
}

const rawOrigins = process.env.CLIENT_ORIGINS || 'http://localhost:5173';
const clientOrigins = rawOrigins
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

export const env: EnvConfig = {
  NODE_ENV: (process.env.NODE_ENV as any) || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  CLIENT_ORIGINS: clientOrigins.length > 0 ? clientOrigins : ['http://localhost:5173'],
  SUPABASE_URL: process.env.SUPABASE_URL || 'https://placeholder.supabase.co',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || 'placeholder-anon-key',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
  ENABLE_IN_PROCESS_AI_WORKER: process.env.ENABLE_IN_PROCESS_AI_WORKER !== 'false',
  MAX_FILE_SIZE_MB: parseInt(process.env.MAX_FILE_SIZE_MB || '25', 10),
  MAX_UPLOAD_FILES: parseInt(process.env.MAX_UPLOAD_FILES || '10', 10),
};

