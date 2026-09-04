import { DateFormat } from '../types'
import { formatDateOnly } from './date'

export function formatDate(dateStr: string, format: DateFormat): string {
  return formatDateOnly(dateStr, format)
}

export const DATE_FORMAT_OPTIONS: { value: DateFormat; label: string; example: string }[] = [
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD', example: '2026-01-22' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY', example: '01/22/2026' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY', example: '22/01/2026' },
  { value: 'DD.MM.YYYY', label: 'DD.MM.YYYY', example: '22.01.2026' },
  { value: 'DD-MM-YYYY', label: 'DD-MM-YYYY', example: '22-01-2026' },
  { value: 'YYYY/MM/DD', label: 'YYYY/MM/DD', example: '2026/01/22' },
]
