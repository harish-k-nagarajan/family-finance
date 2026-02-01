// Hardcoded bank name → domain mappings (used as offline fallback)
const bankDomains = {
  // US Banks
  'chase': 'chase.com',
  'bank of america': 'bankofamerica.com',
  'wells fargo': 'wellsfargo.com',
  'citi': 'citi.com',
  'citibank': 'citi.com',
  'capital one': 'capitalone.com',
  'pnc': 'pnc.com',
  'truist': 'truist.com',
  'td bank': 'td.com',
  'us bank': 'usbank.com',
  'fifth third': 'fifththirdbank.com',
  'citizens bank': 'citizensbank.com',
  'regions': 'regions.com',
  'ally': 'ally.com',
  'american express': 'americanexpress.com',
  'amex': 'americanexpress.com',
  'discover': 'discover.com',

  // European Banks
  'hsbc': 'hsbc.com',
  'barclays': 'barclays.com',
  'lloyds': 'lloyds.com',
  'natwest': 'natwest.com',
  'santander': 'santander.com',
  'deutsche bank': 'db.com',
  'bnp paribas': 'bnpparibas.com',
  'credit agricole': 'credit-agricole.com',
  'societe generale': 'societegenerale.com',
  'ing': 'ing.com',
  'abn amro': 'abnamro.com',
  'unicredit': 'unicredit.eu',
  'commerzbank': 'commerzbank.de',
  'rabobank': 'rabobank.com',

  // Czech Banks
  'csob': 'csob.cz',
  'csob cz': 'csob.cz',
  'csob czech': 'csob.cz',
  'ceska sporitelna': 'csas.cz',
  'komercni banka': 'kb.cz',
  'raiffeisen bank': 'rb.cz',
  'raiffeisen bank cz': 'rb.cz',
  'raiffeisen bank czech': 'rb.cz',
  'raiffeisenbank cz': 'rb.cz',
  'raiffeisenbank czech': 'rb.cz',
  'raiffeisen cz': 'rb.cz',
  'raiffeisen': 'raiffeisen.com',
  'raiffeisen austria': 'raiffeisen.at',
  'raiffeisen bank austria': 'raiffeisen.at',
  'raiffeisen at': 'raiffeisen.at',
  'moneta': 'moneta.cz',
  'unicredit bank': 'unicreditbank.cz',
  'fio banka': 'fio.cz',
  'air bank': 'airbank.cz',
  'equa bank': 'equabank.cz',

  // Indian Banks
  'hdfc': 'hdfcbank.com',
  'hdfc bank': 'hdfcbank.com',
  'icici': 'icicibank.com',
  'icici bank': 'icicibank.com',
  'sbi': 'sbi.co.in',
  'state bank of india': 'sbi.co.in',
  'axis bank': 'axisbank.com',
  'kotak': 'kotak.com',
  'kotak mahindra': 'kotak.com',
  'yes bank': 'yesbank.in',
  'indusind': 'indusind.com',
  'idfc first': 'idfcfirstbank.com',
  'pnb': 'pnbindia.in',
  'punjab national bank': 'pnbindia.in',
  'bank of baroda': 'bankofbaroda.in',

  // Investment Firms
  'fidelity': 'fidelity.com',
  'vanguard': 'vanguard.com',
  'charles schwab': 'schwab.com',
  'schwab': 'schwab.com',
  'etrade': 'etrade.com',
  'td ameritrade': 'tdameritrade.com',
  'robinhood': 'robinhood.com',
  'wealthfront': 'wealthfront.com',
  'betterment': 'betterment.com',
  'merrill': 'ml.com',
  'merrill lynch': 'ml.com',
  'morgan stanley': 'morganstanley.com',
  'interactive brokers': 'interactivebrokers.com',

  // UK Banks
  'nationwide': 'nationwide.co.uk',
  'halifax': 'halifax.co.uk',
  'tesco bank': 'tescobank.com',
  'metro bank': 'metrobankonline.co.uk',
  'monzo': 'monzo.com',
  'starling': 'starlingbank.com',
  'revolut': 'revolut.com',

  // Canadian Banks
  'rbc': 'rbc.com',
  'td canada': 'td.com',
  'scotiabank': 'scotiabank.com',
  'bmo': 'bmo.com',
  'cibc': 'cibc.com',

  // Australian Banks
  'commonwealth bank': 'commbank.com.au',
  'westpac': 'westpac.com.au',
  'anz': 'anz.com.au',
  'nab': 'nab.com.au',
};

function getBankDomain(institutionName) {
  const normalized = institutionName.toLowerCase().trim();

  // Direct match
  if (bankDomains[normalized]) {
    return bankDomains[normalized];
  }

  // Partial match — sort by key length descending so more specific matches win
  const sortedEntries = Object.entries(bankDomains).sort((a, b) => b[0].length - a[0].length);
  for (const [key, domain] of sortedEntries) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return domain;
    }
  }

  // Fallback: try appending .com
  return `${normalized.replace(/\s+/g, '')}.com`;
}

// Logo cache in localStorage (keyed by normalized institution name)
const CACHE_KEY_PREFIX = 'bank_logo_';
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days
const CACHE_SENTINEL = '__NO_LOGO__';

function getCachedLogo(nameKey) {
  try {
    const cached = localStorage.getItem(CACHE_KEY_PREFIX + nameKey);
    if (cached) {
      const { url, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_DURATION) {
        // Distinguish "cached as no-logo" from a real URL
        return url === CACHE_SENTINEL ? null : url;
      }
      localStorage.removeItem(CACHE_KEY_PREFIX + nameKey);
    }
  } catch (e) {
    console.warn('Failed to read logo cache:', e);
  }
  return undefined; // cache miss
}

function cacheLogo(nameKey, url) {
  try {
    localStorage.setItem(
      CACHE_KEY_PREFIX + nameKey,
      JSON.stringify({ url: url ?? CACHE_SENTINEL, timestamp: Date.now() })
    );
  } catch (e) {
    console.warn('Failed to cache logo:', e);
  }
}

// Fetch bank logo using Clearbit Autocomplete API (fuzzy match),
// falling back to hardcoded domain map + Clearbit Logo API.
export async function fetchBankLogo(institutionName) {
  const normalized = institutionName.toLowerCase().trim();

  // 1. Check cache
  const cached = getCachedLogo(normalized);
  if (cached !== undefined) return cached;

  // 2. Try Clearbit Autocomplete API (fuzzy company name search)
  try {
    const res = await fetch(
      `https://autocomplete.clearbit.com/v1/companies/suggest?query=${encodeURIComponent(normalized)}`
    );
    if (res.ok) {
      const results = await res.json();
      if (results.length > 0) {
        // Use results[0].logo if available, otherwise construct from domain
        const logoUrl = results[0].logo || `https://logo.clearbit.com/${results[0].domain}`;
        cacheLogo(normalized, logoUrl);
        return logoUrl;
      }
    }
  } catch (e) {
    console.warn('Clearbit autocomplete failed, falling back to hardcoded map:', e);
  }

  // 3. Fallback: hardcoded map → Clearbit Logo API
  const domain = getBankDomain(normalized);
  const fallbackUrl = `https://logo.clearbit.com/${domain}`;

  // Note: We don't fetch HEAD here because it often fails due to CORS in the browser.
  // The <img> tag in the UI will handle it, and we'll cache this URL as our best guess.
  cacheLogo(normalized, fallbackUrl);
  return fallbackUrl;

  // 4. No logo found
  cacheLogo(normalized, null);
  return null;
}
