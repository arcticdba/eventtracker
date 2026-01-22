import { DateFormat } from '../api'

export function formatDate(dateStr: string, format: DateFormat): string {
  if (!dateStr) return ''

  // Parse the YYYY-MM-DD format
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return dateStr

  const [, year, month, day] = match

  switch (format) {
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`
    case 'MM/DD/YYYY':
      return `${month}/${day}/${year}`
    case 'DD/MM/YYYY':
      return `${day}/${month}/${year}`
    case 'DD.MM.YYYY':
      return `${day}.${month}.${year}`
    case 'DD-MM-YYYY':
      return `${day}-${month}-${year}`
    case 'YYYY/MM/DD':
      return `${year}/${month}/${day}`
    default:
      return dateStr
  }
}

export const DATE_FORMAT_OPTIONS: { value: DateFormat; label: string; example: string }[] = [
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD', example: '2026-01-22' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY', example: '01/22/2026' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY', example: '22/01/2026' },
  { value: 'DD.MM.YYYY', label: 'DD.MM.YYYY', example: '22.01.2026' },
  { value: 'DD-MM-YYYY', label: 'DD-MM-YYYY', example: '22-01-2026' },
  { value: 'YYYY/MM/DD', label: 'YYYY/MM/DD', example: '2026/01/22' },
]
