export interface SessionizeLocation {
  city: string
  country: string
}

function decodeHtml(value: string): string {
  const namedEntities: Record<string, string> = {
    amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', nbsp: ' '
  }
  return value.replace(/&(#x[\da-f]+|#\d+|\w+);/gi, (entity, code: string) => {
    if (code[0] === '#') {
      const hexadecimal = code[1].toLowerCase() === 'x'
      const number = Number.parseInt(code.slice(hexadecimal ? 2 : 1), hexadecimal ? 16 : 10)
      return Number.isFinite(number) ? String.fromCodePoint(number) : entity
    }
    return namedEntities[code.toLowerCase()] ?? entity
  })
}

function textContent(html: string): string {
  return decodeHtml(html.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim()
}

export function extractSessionizeLocation(html: string): SessionizeLocation {
  const locationSection = html.match(/location\s*<\/div>\s*<h2[^>]*>([\s\S]*?)<\/h2>/i)
  if (!locationSection) return { city: '', country: '' }

  // Sessionize commonly emits an empty first span and the useful location in
  // the final span. Some pages omit spans, so retain the h2 text as a fallback.
  const locationLines = [...locationSection[1].matchAll(/<span[^>]*>([\s\S]*?)<\/span>/gi)]
    .map(match => textContent(match[1]))
    .filter(Boolean)
  const location = locationLines.at(-1) ?? textContent(locationSection[1])
  if (!location) return { city: '', country: '' }

  const parts = location.split(',').map(part => part.trim()).filter(Boolean)
  if (parts.length === 1) return { city: parts[0], country: '' }
  return { city: parts[0], country: parts.at(-1) ?? '' }
}
