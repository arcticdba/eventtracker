// Map country names to ISO 3166-1 alpha-2 codes
const countryToCode: Record<string, string> = {
  // North America
  'united states': 'US',
  'usa': 'US',
  'us': 'US',
  'america': 'US',
  'canada': 'CA',
  'mexico': 'MX',

  // Europe
  'united kingdom': 'GB',
  'uk': 'GB',
  'great britain': 'GB',
  'england': 'GB',
  'scotland': 'GB',
  'wales': 'GB',
  'northern ireland': 'GB',
  'germany': 'DE',
  'france': 'FR',
  'spain': 'ES',
  'italy': 'IT',
  'netherlands': 'NL',
  'the netherlands': 'NL',
  'holland': 'NL',
  'belgium': 'BE',
  'sweden': 'SE',
  'norway': 'NO',
  'denmark': 'DK',
  'finland': 'FI',
  'poland': 'PL',
  'austria': 'AT',
  'switzerland': 'CH',
  'ireland': 'IE',
  'portugal': 'PT',
  'czechia': 'CZ',
  'czech republic': 'CZ',
  'hungary': 'HU',
  'romania': 'RO',
  'greece': 'GR',
  'croatia': 'HR',
  'slovenia': 'SI',
  'slovakia': 'SK',
  'bulgaria': 'BG',
  'serbia': 'RS',
  'ukraine': 'UA',
  'lithuania': 'LT',
  'latvia': 'LV',
  'estonia': 'EE',
  'iceland': 'IS',
  'malta': 'MT',
  'luxembourg': 'LU',
  'cyprus': 'CY',

  // Asia
  'japan': 'JP',
  'china': 'CN',
  'south korea': 'KR',
  'korea': 'KR',
  'india': 'IN',
  'singapore': 'SG',
  'thailand': 'TH',
  'vietnam': 'VN',
  'malaysia': 'MY',
  'indonesia': 'ID',
  'philippines': 'PH',
  'taiwan': 'TW',
  'hong kong': 'HK',

  // Middle East
  'israel': 'IL',
  'uae': 'AE',
  'united arab emirates': 'AE',
  'saudi arabia': 'SA',
  'qatar': 'QA',
  'turkey': 'TR',

  // Oceania
  'australia': 'AU',
  'new zealand': 'NZ',

  // South America
  'brazil': 'BR',
  'argentina': 'AR',
  'chile': 'CL',
  'colombia': 'CO',
  'peru': 'PE',
  'uruguay': 'UY',

  // Africa
  'south africa': 'ZA',
  'egypt': 'EG',
  'nigeria': 'NG',
  'kenya': 'KE',
  'morocco': 'MA',

  // Online/Remote
  'online': '🌐',
  'remote': '🌐',
}

// Convert ISO 3166-1 alpha-2 code to flag emoji
function isoToFlagEmoji(countryCode: string): string {
  if (countryCode === '🌐') return countryCode
  return countryCode
    .toUpperCase()
    .split('')
    .map(char => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join('')
}

// Get flag emoji from country name
export function getCountryFlag(country: string): string | null {
  if (!country) return null
  const normalized = country.toLowerCase().trim()
  const code = countryToCode[normalized]
  if (!code) return null
  return isoToFlagEmoji(code)
}

// Get flag emoji, returning empty string if not found (for display purposes)
export function getCountryFlagOrEmpty(country: string): string {
  return getCountryFlag(country) || ''
}
