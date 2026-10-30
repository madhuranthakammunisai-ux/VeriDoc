import { test, describe } from 'node:test';
import assert from 'node:assert';
import { sanitizeFilename, maskAccountNumber } from './sanitize.js';

describe('Sanitization & Security Utilities', () => {
  test('sanitizeFilename prevents path traversal and removes malicious characters', () => {
    assert.strictEqual(sanitizeFilename('../../etc/passwd'), 'passwd');
    assert.strictEqual(sanitizeFilename('..\\..\\windows\\system32\\cmd.exe'), 'cmd.exe');
    assert.strictEqual(sanitizeFilename('invoice #123 (final).pdf'), 'invoice__123__final_.pdf');
    assert.strictEqual(sanitizeFilename('.hidden_file.pdf'), 'hidden_file.pdf');
  });

  test('maskAccountNumber masks bank account numbers securely', () => {
    assert.strictEqual(maskAccountNumber('123456789012'), '••••••••9012');
    assert.strictEqual(maskAccountNumber('987654321'), '•••••4321');
    assert.strictEqual(maskAccountNumber('1234'), '••••1234');
    assert.strictEqual(maskAccountNumber(''), '');
  });
});

