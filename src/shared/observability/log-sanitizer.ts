const REDACTED = '[REDACTED]';
const MAX_STRING_LENGTH = 600;
const MAX_ARRAY_LENGTH = 25;
const MAX_OBJECT_KEYS = 60;
const MAX_DEPTH = 6;

const SENSITIVE_KEYS = new Set([
  'authorization',
  'cookie',
  'set-cookie',
  'password',
  'confirmPassword',
  'currentPassword',
  'newPassword',
  'token',
  'accessToken',
  'refreshToken',
  'refresh_token',
  'jwt',
  'secret',
]);

export function sanitizeForLog(value: unknown): unknown {
  return sanitizeValue(value, 0);
}

function sanitizeValue(value: unknown, depth: number): unknown {
  if (value == null) {
    return value;
  }

  if (typeof value === 'string') {
    return truncate(value);
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'bigint') {
    return value.toString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: truncate(value.stack ?? ''),
    };
  }

  if (depth >= MAX_DEPTH) {
    return '[MaxDepth]';
  }

  if (Array.isArray(value)) {
    const items = value
      .slice(0, MAX_ARRAY_LENGTH)
      .map((item) => sanitizeValue(item, depth + 1));
    if (value.length > MAX_ARRAY_LENGTH) {
      items.push(`[${value.length - MAX_ARRAY_LENGTH} more items]`);
    }
    return items;
  }

  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const entries = Object.entries(record).slice(0, MAX_OBJECT_KEYS);
    const sanitized: Record<string, unknown> = {};

    for (const [key, item] of entries) {
      sanitized[key] = isSensitiveKey(key)
        ? REDACTED
        : sanitizeValue(item, depth + 1);
    }

    const omittedKeys = Object.keys(record).length - entries.length;
    if (omittedKeys > 0) {
      sanitized.__omittedKeys = omittedKeys;
    }

    return sanitized;
  }

  return String(value);
}

function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEYS.has(key) || SENSITIVE_KEYS.has(key.toLowerCase());
}

function truncate(value: string): string {
  if (value.length <= MAX_STRING_LENGTH) {
    return value;
  }

  return `${value.slice(0, MAX_STRING_LENGTH)}...[truncated ${
    value.length - MAX_STRING_LENGTH
  } chars]`;
}
