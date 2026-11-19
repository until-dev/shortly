// parseTarget returns the URL to shorten, or an error message for the
// person who typed it. Only http and https links can be shortened.
export function parseTarget(input: string): { url: string } | { error: string } {
  const trimmed = input.trim();
  if (trimmed === '') {
    return { error: 'Enter a link to shorten.' };
  }
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { error: `${trimmed} is not a link. Links start with https://.` };
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { error: 'Only http and https links can be shortened.' };
  }
  return { url: parsed.toString() };
}
