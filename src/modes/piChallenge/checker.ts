import { piDigits } from '../../config/piDigits';

/** The digit of pi after the decimal point at a 0-based position, or null past the stored digits. */
export function expectedDigit(index: number): string | null {
  return index >= 0 && index < piDigits.length ? (piDigits[index] as string) : null;
}

export function checkDigit(index: number, digit: string): boolean {
  return expectedDigit(index) === digit;
}
