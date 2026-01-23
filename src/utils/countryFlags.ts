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

// Map ISO codes to canonical country names
const codeToCanonicalName: Record<string, string> = {
  'US': 'United States',
  'CA': 'Canada',
  'MX': 'Mexico',
  'GB': 'United Kingdom',
  'DE': 'Germany',
  'FR': 'France',
  'ES': 'Spain',
  'IT': 'Italy',
  'NL': 'Netherlands',
  'BE': 'Belgium',
  'SE': 'Sweden',
  'NO': 'Norway',
  'DK': 'Denmark',
  'FI': 'Finland',
  'PL': 'Poland',
  'AT': 'Austria',
  'CH': 'Switzerland',
  'IE': 'Ireland',
  'PT': 'Portugal',
  'CZ': 'Czechia',
  'HU': 'Hungary',
  'RO': 'Romania',
  'GR': 'Greece',
  'HR': 'Croatia',
  'SI': 'Slovenia',
  'SK': 'Slovakia',
  'BG': 'Bulgaria',
  'RS': 'Serbia',
  'UA': 'Ukraine',
  'LT': 'Lithuania',
  'LV': 'Latvia',
  'EE': 'Estonia',
  'IS': 'Iceland',
  'MT': 'Malta',
  'LU': 'Luxembourg',
  'CY': 'Cyprus',
  'JP': 'Japan',
  'CN': 'China',
  'KR': 'South Korea',
  'IN': 'India',
  'SG': 'Singapore',
  'TH': 'Thailand',
  'VN': 'Vietnam',
  'MY': 'Malaysia',
  'ID': 'Indonesia',
  'PH': 'Philippines',
  'TW': 'Taiwan',
  'HK': 'Hong Kong',
  'IL': 'Israel',
  'AE': 'United Arab Emirates',
  'SA': 'Saudi Arabia',
  'QA': 'Qatar',
  'TR': 'Turkey',
  'AU': 'Australia',
  'NZ': 'New Zealand',
  'BR': 'Brazil',
  'AR': 'Argentina',
  'CL': 'Chile',
  'CO': 'Colombia',
  'PE': 'Peru',
  'UY': 'Uruguay',
  'ZA': 'South Africa',
  'EG': 'Egypt',
  'NG': 'Nigeria',
  'KE': 'Kenya',
  'MA': 'Morocco',
  '🌐': 'Online',
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

// Normalize country name to canonical form
// Returns the canonical name if recognized, otherwise returns the original input
export function normalizeCountryName(country: string): string {
  if (!country) return country
  const normalized = country.toLowerCase().trim()
  const code = countryToCode[normalized]
  if (!code) return country // Keep original if not recognized
  return codeToCanonicalName[code] || country
}
