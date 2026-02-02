/**
 * Parse raw insights text from Perplexity API into clean bullet points.
 * Expects 5 plain-text lines from the API.
 */

const TITLES = [
  'US Markets',
  'EU & Asian Markets',
  'Gold & Silver',
  'Global Events',
  'Recommended Action'
];

export function parseInsights(rawText) {
  if (!rawText) return null;

  // Clean: remove citation markers, markdown, numbering, bullet markers
  const cleaned = rawText
    .replace(/\[(\d+)\]/g, '')
    .replace(/\*\*/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // strip markdown links
    .trim();

  // Split into non-empty lines
  const lines = cleaned
    .split('\n')
    .map(l => l.replace(/^\s*[\d]+[\.\)]\s*/, '').replace(/^[-•]\s*/, '').trim())
    .filter(l => l.length > 10);

  // Map to suggestions with fixed titles
  const suggestions = lines.slice(0, 5).map((line, idx) => ({
    title: TITLES[idx] || `Insight ${idx + 1}`,
    description: line
  }));

  return { suggestions };
}
