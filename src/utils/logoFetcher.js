/**
 * Logo Fetcher Utility
 * Automatically fetches institution logos from logo.dev and converts them to base64 data URLs
 */

/**
 * Domain mapping for common financial institutions
 * Maps institution names (case-insensitive) to their primary domains
 */
const INSTITUTION_DOMAIN_MAP = {
  // US Banks
  'chase': 'chase.com',
  'bank of america': 'bankofamerica.com',
  'wells fargo': 'wellsfargo.com',
  'citibank': 'citi.com',
  'citi': 'citi.com',
  'capital one': 'capitalone.com',
  'ally': 'ally.com',
  'discover': 'discover.com',
  'us bank': 'usbank.com',
  'pnc': 'pnc.com',
  'truist': 'truist.com',
  'td bank': 'td.com',
  'td': 'td.com',
  'bank of the west': 'bankofthewest.com',
  'citizens bank': 'citizensbank.com',
  'fifth third': '53.com',
  'regions': 'regions.com',
  'bb&t': 'bbt.com',
  'suntrust': 'suntrust.com',
  'huntington': 'huntington.com',
  'key bank': 'key.com',
  'keybank': 'key.com',
  'navy federal': 'navyfederal.org',
  'usaa': 'usaa.com',

  // Investment Brokerages
  'fidelity': 'fidelity.com',
  'vanguard': 'vanguard.com',
  'charles schwab': 'schwab.com',
  'schwab': 'schwab.com',
  'e*trade': 'etrade.com',
  'etrade': 'etrade.com',
  'td ameritrade': 'tdameritrade.com',
  'robinhood': 'robinhood.com',
  'webull': 'webull.com',
  'merrill': 'merrilledge.com',
  'merrill edge': 'merrilledge.com',
  'interactive brokers': 'interactivebrokers.com',
  'betterment': 'betterment.com',
  'wealthfront': 'wealthfront.com',
  'm1 finance': 'm1.com',
  'sofi': 'sofi.com',
  'public': 'public.com',
  'acorns': 'acorns.com',
  'stash': 'stash.com',

  // Credit Cards
  'amex': 'americanexpress.com',
  'american express': 'americanexpress.com',
  'chase sapphire': 'chase.com',
  'barclays': 'barclays.com',
  'synchrony': 'synchrony.com',

  // Czech Banks
  'csob': 'csob.cz',
  'ceska sporitelna': 'csas.cz',
  'česká spořitelna': 'csas.cz',
  'komercni banka': 'kb.cz',
  'komerční banka': 'kb.cz',
  'moneta': 'moneta.cz',
  'raiffeisenbank': 'rb.cz',
  'raiffeisen': 'rb.cz',
  'unicredit': 'unicreditbank.cz',
  'air bank': 'airbank.cz',
  'equa bank': 'equabank.cz',
  'fio': 'fio.cz',
  'fio banka': 'fio.cz',
  'mbank': 'mbank.cz',

  // European Banks & Platforms
  'trading212': 'trading212.com',
  'trading 212': 'trading212.com',
  'degiro': 'degiro.com',
  'revolut': 'revolut.com',
  'wise': 'wise.com',
  'transferwise': 'wise.com',
  'n26': 'n26.com',
  'monzo': 'monzo.com',
  'starling': 'starlingbank.com',
  'bunq': 'bunq.com',
  'ing': 'ing.com',
  'bnp paribas': 'bnpparibas.com',
  'credit agricole': 'credit-agricole.com',
  'societe generale': 'societegenerale.com',
  'santander': 'santander.com',
  'bbva': 'bbva.com',
  'deutsche bank': 'db.com',
  'commerzbank': 'commerzbank.com',
  'barclays': 'barclays.co.uk',
  'hsbc': 'hsbc.com',
  'lloyds': 'lloydsbank.com',
  'natwest': 'natwest.com',

  // Crypto Exchanges
  'coinbase': 'coinbase.com',
  'binance': 'binance.com',
  'kraken': 'kraken.com',
  'gemini': 'gemini.com',
  'crypto.com': 'crypto.com',
  'ftx': 'ftx.com',
  'bitstamp': 'bitstamp.net',
  'bitfinex': 'bitfinex.com',
  'kucoin': 'kucoin.com',

  // Other Financial Services
  'paypal': 'paypal.com',
  'venmo': 'venmo.com',
  'cash app': 'cash.app',
  'square': 'squareup.com',
  'stripe': 'stripe.com',
  'klarna': 'klarna.com',
  'affirm': 'affirm.com',
  'chime': 'chime.com',

  // Mortgage & Loan Lenders
  'quicken loans': 'quickenloans.com',
  'rocket mortgage': 'rocketmortgage.com',
  'better.com': 'better.com',
  'better': 'better.com',
  'loanDepot': 'loandepot.com',
  'guaranteed rate': 'guaranteedrate.com',
  'united wholesale mortgage': 'uwm.com',
  'newrez': 'newrez.com',
  'pennymac': 'pennymac.com',
  'caliber home loans': 'caliberhomeloans.com',
  'freedom mortgage': 'freedommortgage.com',
  'mr. cooper': 'mrcooper.com',
  'flagstar bank': 'flagstar.com',

  // Student Loan Lenders
  'sallie mae': 'salliemae.com',
  'navient': 'navient.com',
  'nelnet': 'nelnet.com',
  'great lakes': 'mygreatlakes.org',
  'fedloan': 'myfedloan.org',
  'mohela': 'mohela.com',
  'earnest': 'earnest.com',
  'commonbond': 'commonbond.co',
  'laurel road': 'laurelroad.com',

  // Auto Loan Lenders
  'toyota financial': 'toyotafinancial.com',
  'honda financial': 'hondafinancialservices.com',
  'ford credit': 'credit.ford.com',
  'gm financial': 'gmfinancial.com',
  'carmax': 'carmax.com',
  'carvana': 'carvana.com',
  'lightstream': 'lightstream.com',

  // Personal Loan Lenders
  'sofi': 'sofi.com',
  'marcus': 'marcus.com',
  'upstart': 'upstart.com',
  'prosper': 'prosper.com',
  'lending club': 'lendingclub.com',
  'best egg': 'bestegg.com',
  'avant': 'avant.com',
  'upgrade': 'upgrade.com',
  'onemain': 'onemainfinancial.com',
  'onemain financial': 'onemainfinancial.com',

  // Czech Lenders
  'ceska sporitelna': 'csas.cz',
  'komercni banka': 'kb.cz',
  'erste': 'erstegroup.com',
};

const LOGO_DEV_TOKEN = import.meta.env.VITE_LOGO_DEV_API_KEY;

/**
 * Normalize institution name for lookup
 * @param {string} name - Institution name
 * @returns {string} Normalized name
 */
function normalizeInstitutionName(name) {
  return name.toLowerCase().trim();
}

/**
 * Get domain for institution from mapping or guess from name
 * @param {string} institutionName - Institution name
 * @returns {string|null} Domain or null
 */
function getDomainForInstitution(institutionName) {
  const normalized = normalizeInstitutionName(institutionName);

  // Try exact match first
  if (INSTITUTION_DOMAIN_MAP[normalized]) {
    return INSTITUTION_DOMAIN_MAP[normalized];
  }

  // Try partial match (e.g., "Chase Checking" → "chase")
  for (const [key, domain] of Object.entries(INSTITUTION_DOMAIN_MAP)) {
    if (normalized.includes(key) || key.includes(normalized.split(' ')[0])) {
      return domain;
    }
  }

  // Fallback: Try appending .com to the first word
  const firstWord = normalized.split(' ')[0];
  if (firstWord && firstWord.length > 2) {
    return `${firstWord}.com`;
  }

  return null;
}

/**
 * Get logo URL from logo.dev for an institution
 * Returns the direct URL (not base64) for real-time preview
 * @param {string} institutionName - Institution name
 * @returns {string|null} Logo URL or null if not found
 */
export function getInstitutionLogoUrl(institutionName) {
  if (!institutionName || institutionName.trim().length === 0) {
    return null;
  }

  const domain = getDomainForInstitution(institutionName);
  if (!domain) {
    console.log(`[Logo Fetcher] No domain mapping found for: ${institutionName}`);
    return null;
  }

  // Return direct logo.dev URL for real-time preview
  // Using PNG format with 128px size for consistent display
  const url = `https://img.logo.dev/${domain}?token=${LOGO_DEV_TOKEN}&format=png&size=128`;
  console.log(`[Logo Fetcher] Generated logo URL for ${institutionName}: ${domain}`);

  return url;
}
