import { DateFormat } from '../types'

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const

/** Parse the app's YYYY-MM-DD values in local time, never as UTC. */
export function parseDateOnly(value: string): Date {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  return match
    ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    : new Date(value)
}

export function toDateOnly(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function formatDateOnly(value: string, format: DateFormat): string {
  if (!value) return ''
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return value
  const [, year, month, day] = match
  switch (format) {
    case 'YYYY-MM-DD': return `${year}-${month}-${day}`
    case 'MM/DD/YYYY': return `${month}/${day}/${year}`
    case 'DD/MM/YYYY': return `${day}/${month}/${year}`
    case 'DD.MM.YYYY': return `${day}.${month}.${year}`
    case 'DD-MM-YYYY': return `${day}-${month}-${year}`
    case 'YYYY/MM/DD': return `${year}/${month}/${day}`
  }
}

export function compareDateOnly(a: string, b: string): number {
  return a.localeCompare(b)
}

export function getISOWeek(date: Date): { year: number; week: number } {
  const thursday = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const day = thursday.getUTCDay() || 7
  thursday.setUTCDate(thursday.getUTCDate() + 4 - day)
  const year = thursday.getUTCFullYear()
  const yearStart = new Date(Date.UTC(year, 0, 1))
  const week = Math.ceil((((thursday.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  return { year, week }
}

export function getISOWeekStart(year: number, week: number): Date {
  const januaryFourth = new Date(year, 0, 4)
  const day = januaryFourth.getDay() || 7
  return new Date(year, 0, 4 - (day - 1) + (week - 1) * 7)
}

export function getISOWeeksInYear(year: number): number {
  return getISOWeek(new Date(year, 11, 28)).week
}
