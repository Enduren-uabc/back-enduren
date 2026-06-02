const AMBIGUOUS_CHARS = 'O0Il1';
const CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.replace(
  new RegExp(`[${AMBIGUOUS_CHARS}]`, 'g'),
  '',
);

export function generateTrainerCode(): string {
  const chars = Array.from(
    { length: 6 },
    () => CHARSET[Math.floor(Math.random() * CHARSET.length)], // sonarqube:prng-safe-context
  ).join('');
  return `END-${chars}`;
}
