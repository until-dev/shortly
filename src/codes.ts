import { randomInt } from 'node:crypto';

const ALPHABET = 'abcdefghijkmnpqrstuvwxyz23456789';

export const CODE_LENGTH = 6;

// newCode returns a random short code. The alphabet leaves out characters
// that are easy to confuse when read aloud: l, o, 0 and 1.
export function newCode(): string {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += ALPHABET[randomInt(ALPHABET.length)];
  }
  return code;
}
