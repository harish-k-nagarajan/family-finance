/**
 * Parse raw insights text from Perplexity API into structured data
 * Extracts country inference, suggestions, disclaimer, and removes citations
 */

export function parseInsights(rawText) {
  if (!rawText) return null;

  // Remove citation markers like [1], [2], [3], etc.
  let cleanText = rawText.replace(/\[(\d+)\]/g, '').trim();

  // Extract country inference (everything before the first numbered item)
  const firstNumberMatch = cleanText.match(/^([\s\S]*?)(?=\n\n?\d+\.)/);
  let countryInference = null;

  if (firstNumberMatch) {
    const inferenceText = firstNumberMatch[1].trim();
    // Remove markdown bold markers and extract the text
    countryInference = inferenceText
      .replace(/\*\*/g, '')
      .replace(/^Likely tax country:\s*/i, '')
      .trim();
  }

  // Extract suggestions (numbered list 1-4)
  const suggestions = [];

  // Split by numbered items (1., 2., 3., 4.)
  const sections = cleanText.split(/\n\n?(\d+)\.\s+/);

  for (let i = 1; i < sections.length; i += 2) {
    const number = parseInt(sections[i]);
    const content = sections[i + 1];

    if (content) {
      // Extract title (first bold text) and description
      const titleMatch = content.match(/\*\*([^*]+)\*\*/);
      const title = titleMatch ? titleMatch[1].trim() : '';

      // Get description (everything after the title)
      const description = content
        .replace(/\*\*[^*]+\*\*/, '')
        .replace(/Not financial advice.*/i, '')
        .trim();

      if (title && description) {
        suggestions.push({
          number,
          title,
          description
        });
      }
    }
  }

  // Extract disclaimer (typically at the end)
  const disclaimerMatch = cleanText.match(/Not financial advice[^.]*\./i);
  const disclaimer = disclaimerMatch ? disclaimerMatch[0].trim() : 'Not financial advice—consult local expert.';

  return {
    countryInference,
    suggestions,
    disclaimer
  };
}
