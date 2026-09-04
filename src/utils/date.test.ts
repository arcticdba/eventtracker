import { describe, expect, it } from 'vitest'
import { formatDateOnly, getISOWeek, getISOWeeksInYear, getISOWeekStart, parseDateOnly } from './date'

describe('date-only helpers', () => {
  it('parses a date without a UTC timezone shift', () => {
    const date = parseDateOnly('2026-09-04')
    expect([date.getFullYear(), date.getMonth(), date.getDate()]).toEqual([2026, 8, 4])
  })

  it('formats every supported setting', () => {
    expect(formatDateOnly('2026-09-04', 'YYYY-MM-DD')).toBe('2026-09-04')
    expect(formatDateOnly('2026-09-04', 'MM/DD/YYYY')).toBe('09/04/2026')
    expect(formatDateOnly('2026-09-04', 'DD/MM/YYYY')).toBe('04/09/2026')
    expect(formatDateOnly('2026-09-04', 'DD.MM.YYYY')).toBe('04.09.2026')
    expect(formatDateOnly('2026-09-04', 'DD-MM-YYYY')).toBe('04-09-2026')
    expect(formatDateOnly('2026-09-04', 'YYYY/MM/DD')).toBe('2026/09/04')
  })
})

describe('ISO weeks', () => {
  it('starts each week on Monday', () => {
    expect(getISOWeekStart(2026, 1).getDay()).toBe(1)
    expect(getISOWeekStart(2026, 1).getDate()).toBe(29)
    expect(getISOWeekStart(2026, 1).getMonth()).toBe(11)
  })

  it('assigns New Year dates to the correct week-year', () => {
    expect(getISOWeek(parseDateOnly('2026-01-01'))).toEqual({ year: 2026, week: 1 })
    expect(getISOWeek(parseDateOnly('2027-01-01'))).toEqual({ year: 2026, week: 53 })
  })

  it('returns 52 or 53 weeks as appropriate', () => {
    expect(getISOWeeksInYear(2025)).toBe(52)
    expect(getISOWeeksInYear(2026)).toBe(53)
  })
})
