export interface LogMeta {
  [key: string]: any;
}

const REDACTED_KEYS = new Set([
  'password',
  'token',
  'authorization',
  'key',
  'apikey',
  'secret',
  'gemini_api_key',
  'service_role',
  'supabase_service_role_key',
]);

function sanitizeMeta(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeMeta);

  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (REDACTED_KEYS.has(key.toLowerCase())) {
      clean[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      clean[key] = sanitizeMeta(value);
    } else {
      clean[key] = value;
    }
  }
  return clean;
}

export const logger = {
  info(message: string, meta?: LogMeta) {
    const timestamp = new Date().toISOString();
    console.log(JSON.stringify({ level: 'info', timestamp, message, ...(meta ? sanitizeMeta(meta) : {}) }));
  },
  warn(message: string, meta?: LogMeta) {
    const timestamp = new Date().toISOString();
    console.warn(JSON.stringify({ level: 'warn', timestamp, message, ...(meta ? sanitizeMeta(meta) : {}) }));
  },
  error(message: string, error?: any, meta?: LogMeta) {
    const timestamp = new Date().toISOString();
    const errorDetails = error instanceof Error 
      ? { message: error.message, stack: process.env.NODE_ENV === 'development' ? error.stack : undefined }
      : error;
    console.error(JSON.stringify({
      level: 'error',
      timestamp,
      message,
      error: errorDetails,
      ...(meta ? sanitizeMeta(meta) : {}),
    }));
  },
  debug(message: string, meta?: LogMeta) {
    if (process.env.NODE_ENV === 'development') {
      const timestamp = new Date().toISOString();
      console.log(JSON.stringify({ level: 'debug', timestamp, message, ...(meta ? sanitizeMeta(meta) : {}) }));
    }
  },
};

