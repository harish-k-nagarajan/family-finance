/**
 * Wealth Radar API Route
 * Generates AI-powered financial insights using Perplexity API
 */

// Country inference based on currency and institution names
const inferCountry = (household, accounts, investments) => {
  // Collect all institution names
  const allInstitutions = [
    ...accounts.map(a => a.institution?.toLowerCase() || ''),
    ...investments.map(i => i.institution?.toLowerCase() || '')
  ].filter(Boolean);

  // Check for country-specific institutions (priority)
  // United States
  if (allInstitutions.some(i =>
    /chase|wells fargo|bank of america|bofa|citibank|capital one|us bank|pnc|td bank|citizens bank|fifth third|ally|schwab|fidelity|vanguard/i.test(i)
  )) {
    return "United States";
  }

  // United Kingdom
  if (allInstitutions.some(i =>
    /hsbc uk|barclays|lloyds|natwest|nationwide|santander uk|tsb|metro bank|first direct|monzo|starling|revolut uk/i.test(i)
  )) {
    return "United Kingdom";
  }

  // Canada
  if (allInstitutions.some(i =>
    /td canada|rbc|scotiabank|bmo|cibc|national bank of canada|tangerine|pc financial|simplii/i.test(i)
  )) {
    return "Canada";
  }

  // Australia
  if (allInstitutions.some(i =>
    /commonwealth bank|westpac|anz|nab|macquarie|ing australia|bankwest/i.test(i)
  )) {
    return "Australia";
  }

  // Czech Republic
  if (allInstitutions.some(i =>
    /česká spořitelna|čsob|komerční banka|moneta|raiffeisenbank|unicredit|fio banka|air bank|equa bank/i.test(i)
  )) {
    return "Czech Republic";
  }

  // Germany
  if (allInstitutions.some(i =>
    /deutsche bank|commerzbank|ing-diba|n26|sparkasse|volksbank|postbank|dkb|comdirect/i.test(i)
  )) {
    return "Germany";
  }

  // France
  if (allInstitutions.some(i =>
    /bnp paribas|société générale|crédit agricole|crédit mutuel|la banque postale|lcl|boursorama/i.test(i)
  )) {
    return "France";
  }

  // Fallback to currency mapping
  const currencyMap = {
    USD: "United States",
    GBP: "United Kingdom",
    EUR: "Europe",
    CAD: "Canada",
    AUD: "Australia",
    CZK: "Czech Republic",
    JPY: "Japan",
    CHF: "Switzerland",
    INR: "India",
    CNY: "China",
    SGD: "Singapore",
    HKD: "Hong Kong",
    NZD: "New Zealand"
  };

  const currency = household?.currency || 'USD';
  return currencyMap[currency] || "your region";
};

// Get currency symbol
const getCurrencySymbol = (currency) => {
  const symbolMap = {
    USD: '$',
    GBP: '£',
    EUR: '€',
    CZK: 'Kč',
    JPY: '¥',
    CHF: 'CHF',
    INR: '₹',
    CNY: '¥',
    CAD: 'C$',
    AUD: 'A$',
    SGD: 'S$',
    HKD: 'HK$',
    NZD: 'NZ$'
  };
  return symbolMap[currency] || currency;
};

// Build the prompt using user's exact template
const buildPrompt = (data) => {
  const { household, accounts, investments, mortgage, snapshots } = data;

  const currency = household?.currency || 'USD';
  const currencySymbol = getCurrencySymbol(currency);

  // Combine accounts and investments for display
  const allAccounts = [
    ...accounts.map(a => `${a.institution} (${a.accountType || 'N/A'})`),
    ...investments.map(i => `${i.institution} (${i.accountType || 'Investment'})`)
  ];
  const accountsList = allAccounts.join(', ');

  // Check mortgage and format details
  const hasMortgage = mortgage && mortgage.length > 0;
  const mortgageDetails = hasMortgage
    ? `yes (loan details: ${mortgage[0].currentBalance}, ${mortgage[0].interestRate}%)`
    : 'no';

  // Get last 12 snapshots for trend analysis
  const recentSnapshots = snapshots.slice(-12).map(s => ({
    date: s.date,
    netWorth: s.netWorth
  }));

  // Build exact prompt from user's template
  const prompt = `You are a concise financial insights engine for a personal finance app. Analyze this user's portfolio and current markets.

User Data:
Currency: ${currency} (${currencySymbol})
Accounts: ${accountsList}
Mortgage: ${mortgageDetails}
Recent net worth trend (12 months): ${JSON.stringify(recentSnapshots)}

Respond with EXACTLY 5 lines, one per insight. No numbering, no bullet markers, no markdown, no bold, no links, no citations. Just plain sentences.

Line 1: US markets — mention S&P 500, Nasdaq, or Dow with a specific number or percentage and what it means for this user.
Line 2: EU & Asian markets — one key development from STOXX 600, FTSE, Nikkei, Hang Seng, or Sensex relevant to this user.
Line 3: Gold & Silver — current trend with a price or percentage and whether this user should adjust allocation.
Line 4: Global events — one geopolitical or macro event (rate decision, trade policy, conflict) impacting this user's holdings.
Line 5: Recommended action — one specific step this user should take this week.

Keep each line to 1-2 sentences max. Use specific numbers. No disclaimers, no sources, no extra text.`;

  return prompt;
};

// Helper to send JSON response (Node.js HTTP style)
const sendJSON = (res, statusCode, data) => {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
};

// Main API handler
export default async function handler(req, res) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return sendJSON(res, 405, {
      success: false,
      error: 'Method not allowed'
    });
  }

  // Validate API key
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) {
    console.error('PERPLEXITY_API_KEY not configured');
    return sendJSON(res, 500, {
      success: false,
      error: 'Server configuration error. Please contact support.'
    });
  }

  try {
    // Extract and validate request data
    const { household, accounts, investments, mortgage, snapshots } = req.body;

    if (!household || !Array.isArray(accounts)) {
      return sendJSON(res, 400, {
        success: false,
        error: 'Invalid request data. Missing required fields.'
      });
    }

    // Infer country from data
    const inferredCountry = inferCountry(
      household,
      accounts || [],
      investments || []
    );

    // Build prompt
    const prompt = buildPrompt({
      household,
      accounts: accounts || [],
      investments: investments || [],
      mortgage: mortgage || [],
      snapshots: snapshots || []
    });

    // Call Perplexity API with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    let response;
    try {
      response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'sonar',
          messages: [
            {
              role: 'system',
              content: 'You are a financial advisor providing actionable insights.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 1500,
          web_search_options: {
            search_recency_filter: 'week'
          }
        }),
        signal: controller.signal
      });

      clearTimeout(timeout);

    } catch (fetchError) {
      clearTimeout(timeout);

      if (fetchError.name === 'AbortError') {
        return sendJSON(res, 504, {
          success: false,
          error: 'Request timed out. Please try again.'
        });
      }

      throw fetchError;
    }

    // Handle non-200 responses
    if (!response.ok) {
      // Log the error response for debugging
      const errorText = await response.text();
      console.error('Perplexity API Error Response:', errorText);

      if (response.status === 429) {
        return sendJSON(res, 429, {
          success: false,
          error: 'Rate limit exceeded. Please try again in a few moments.'
        });
      }

      if (response.status === 401) {
        console.error('Perplexity API authentication failed');
        return sendJSON(res, 500, {
          success: false,
          error: 'Service authentication error. Please contact support.'
        });
      }

      if (response.status === 400) {
        return sendJSON(res, 500, {
          success: false,
          error: `Invalid request to Perplexity API: ${errorText}`
        });
      }

      throw new Error(`Perplexity API returned status ${response.status}`);
    }

    // Parse Perplexity response
    const perplexityData = await response.json();

    if (!perplexityData.choices || !perplexityData.choices[0]) {
      throw new Error('Invalid response from Perplexity API');
    }

    const content = perplexityData.choices[0].message.content;
    const citations = perplexityData.citations || [];

    if (!content || content.trim().length === 0) {
      throw new Error('No insights generated. Please try again.');
    }

    // Return success response with plain text content and citations
    return sendJSON(res, 200, {
      success: true,
      data: {
        content: content.trim(),
        citations,
        inferredCountry,
        generatedAt: Date.now()
      }
    });

  } catch (error) {
    console.error('Wealth Radar API Error:', error);

    return sendJSON(res, 500, {
      success: false,
      error: error.message || 'Failed to generate insights. Please try again later.'
    });
  }
}
