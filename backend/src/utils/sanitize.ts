import path from 'path';

/**
 * Sanitizes uploaded filenames to prevent directory traversal
 * and remove unsafe characters.
 */
export function sanitizeFilename(filename: string): string {
  // Extract basename to prevent path traversal like ../../
  const base = path.basename(filename);
  
  // Replace all characters except alphanumeric, periods, dashes, and underscores
  const clean = base.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  
  // Prevent leading periods (hidden files)
  const trimmed = clean.replace(/^\.+/, '');
  
  return trimmed || `document_${Date.now()}.pdf`;
}

/**
 * Masks bank account numbers so full numbers are never exposed in logs or UI.
 * e.g., "123456789012" -> "••••••••9012"
 */
export function maskAccountNumber(accountNumber: string | null | undefined): string {
  if (!accountNumber) return '';
  const str = String(accountNumber).trim();
  if (str.length <= 4) return '••••' + str;
  return '•'.repeat(Math.max(str.length - 4, 4)) + str.slice(-4);
}

