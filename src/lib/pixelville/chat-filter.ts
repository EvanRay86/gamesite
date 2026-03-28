// PixelVille — Basic chat word filter for moderation

const BLOCKED_PATTERNS: RegExp[] = [
  // Slurs and hate speech (basic set — extend as needed)
  /\bn[i1l][g9][g9]+[e3]r/i,
  /\bf[a@]g+[o0]t/i,
  /\bk[i1]k[e3]/i,
  /\br[e3]t[a@]rd/i,
  // Severe profanity
  /\bc[u\*]nt/i,
];

const SOFT_FILTER_PATTERNS: RegExp[] = [
  /\bf+u+c+k+/i,
  /\bs+h+[i1]+t+/i,
  /\ba+s+s+h+o+l+e+/i,
  /\bb+[i1]+t+c+h+/i,
  /\bd+[a@]+m+n+/i,
];

export function containsBlockedContent(text: string): boolean {
  return BLOCKED_PATTERNS.some((p) => p.test(text));
}

export function filterMessage(text: string): string {
  let filtered = text;
  for (const pattern of BLOCKED_PATTERNS) {
    filtered = filtered.replace(pattern, "***");
  }
  for (const pattern of SOFT_FILTER_PATTERNS) {
    filtered = filtered.replace(pattern, (match) => "*".repeat(match.length));
  }
  return filtered;
}

export function isValidMessage(text: string): boolean {
  if (text.trim().length === 0) return false;
  if (text.length > 200) return false;
  if (containsBlockedContent(text)) return false;
  return true;
}
