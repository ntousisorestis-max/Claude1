/**
 * The leaderboard's shareable code: six characters, one alphabet, everywhere.
 *
 * Pure and Firebase-free for the same reason days.ts is — firestore.rules
 * has its own copy of the format check written in its own language, and this
 * is what the client uses to generate a code and to clean up whatever a
 * person typed in before asking the server about it.
 */

/** No 0/O, 1/I/L — the characters people actually mishear or mistype. */
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const LENGTH = 6;

export function randomFriendCode(): string {
  let code = '';
  for (let i = 0; i < LENGTH; i++) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return code;
}

/** Upper-cases and strips whitespace, so "abc 123" and "ABC123" match. */
export function normalizeFriendCode(input: string): string {
  return input.trim().toUpperCase().replace(/\s+/g, '');
}

export function isValidFriendCode(code: string): boolean {
  return /^[A-Z0-9]{6}$/.test(code);
}
