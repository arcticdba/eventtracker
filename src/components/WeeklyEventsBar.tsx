import { useMemo, useState } from 'react'
import { CalendarSelection, Event, Submission } from '../types'
import { computeEventState } from '../utils/computeEventState'
import { getOverlappingEvents } from '../utils/getOverlappingEvents'
import { formatDate } from '../utils/formatDate'
import { DateFormat } from '../api'

interface Props {
  events: Event[]
  submissions: Submission[]
  maxEventsPerMonth: number
  selectedMonth: CalendarSelection | null
  onMonthSelect: (month: CalendarSelection | null) => void
  dateFormat: DateFormat
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function parseDateOnly(value: string): Date {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  return match
    ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    : new Date(value)
}

function formatLocalDate(date: Date, dateFormat: DateFormat): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return formatDate(`${year}-${month}-${day}`, dateFormat)
}

function getWeekNumber(date: Date): number {
  const startOfYear = new Date(date.getFullYear(), 0, 1)
  const days = Math.floor((date.getTime() - startOfYear.getTime()) / 86400000)
  return Math.ceil((days + startOfYear.getDay() + 1) / 7)
}

function getWeekStart(year: number, week: number): Date {
  const startOfYear = new Date(year, 0, 1)
  return new Date(year, 0, 1 + (week - 1) * 7 - startOfYear.getDay())
}

function getEventDotColor(event: Event, submissions: Submission[]): string {
  switch (computeEventState(event.id, submissions)) {
    case 'selected': return 'bg-green-500'
    case 'pending': return 'bg-yellow-500'
    case 'rejected': return 'bg-red-500'
    default: return 'bg-gray-400'
  }
}

export function WeeklyEventsBar({ events, submissions, maxEventsPerMonth, selectedMonth, onMonthSelect, dateFormat }: Props) {
  const [hoveredCell, setHoveredCell] = useState<string | null>(null)
  const [hoveredRect, setHoveredRect] = useState<DOMRect | null>(null)
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentWeek = getWeekNumber(now)

  const visibleYears = useMemo(() => {
    const years = new Set([currentYear - 1, currentYear, currentYear + 1])
    events.forEach(event => {
      const year = parseDateOnly(event.dateStart).getFullYear()
      if (year > currentYear) years.add(year)
    })
    return [...years].sort((a, b) => a - b)
  }, [events, currentYear])

  const overlapCells = useMemo(() => {
    const cells = new Set<string>()
    events.forEach(event => {
      const date = parseDateOnly(event.dateStart)
      if (!visibleYears.includes(date.getFullYear())) return
      const state = computeEventState(event.id, submissions)
      if (state === 'rejected' || state === 'declined' || state === 'cancelled') return
      if (getOverlappingEvents(event, events, submissions).length > 0) {
        cells.add(`${date.getFullYear()}-${getWeekNumber(date)}`)
      }
    })
    return cells
  }, [events, submissions, visibleYears])

  const selectMonth = (year: number, month: number) => {
    onMonthSelect(selectedMonth?.year === year && selectedMonth.month === month ? null : { year, month })
  }

  return (
    <div className="bg-white rounded-lg shadow px-4 py-3 mb-4 flex-shrink-0">
      <div className="flex items-center gap-2 mb-2">
        <h3 className="text-sm font-medium text-gray-700">Weekly View</h3>
        <span className="text-xs text-gray-500">{visibleYears[0]}–{visibleYears[visibleYears.length - 1]}</span>
        <span className="text-xs text-gray-400">·</span>
        <span className="text-xs text-gray-500">Week {currentWeek}</span>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[560px] space-y-2">
          {visibleYears.map(year => {
            const weekCount = getWeekNumber(new Date(year, 11, 31))
            const eventsByWeek: Event[][] = Array.from({ length: weekCount }, () => [])
            const eventsByMonth: number[] = Array(12).fill(0)
            const yearEvents = events.filter(event => parseDateOnly(event.dateStart).getFullYear() === year)

            yearEvents.forEach(event => {
              const date = parseDateOnly(event.dateStart)
              eventsByWeek[getWeekNumber(date) - 1]?.push(event)
              const state = computeEventState(event.id, submissions)
              if (state === 'pending' || state === 'selected') eventsByMonth[date.getMonth()]++
            })
            eventsByWeek.forEach(weekEvents => weekEvents.sort((a, b) => a.dateStart.localeCompare(b.dateStart)))
            const getWeekMonth = (week: number) => getWeekStart(year, week).getMonth()

            return (
              <div key={year}>
                <div className="flex items-center">
                  <div className={`w-12 shrink-0 text-xs ${year === currentYear ? 'font-bold text-blue-600' : 'font-medium text-gray-600'}`}>
                    {year}<span className="block text-[9px] font-normal text-gray-400">{yearEvents.length} total</span>
                  </div>
                  <div className="flex flex-1 gap-px">
                    {Array.from({ length: weekCount }, (_, index) => index + 1).map(week => {
                      const key = `${year}-${week}`
                      const weekEvents = eventsByWeek[week - 1]
                      const month = getWeekMonth(week)
                      const monthCount = eventsByMonth[month]
                      const exceedsLimit = maxEventsPerMonth > 0 && monthCount > maxEventsPerMonth
                      const atLimit = maxEventsPerMonth > 0 && monthCount === maxEventsPerMonth
                      const current = year === currentYear && week === currentWeek
                      const hovered = hoveredCell === key
                      const selected = selectedMonth?.year === year && selectedMonth.month === month
                      const monthStart = week === 1 || month !== getWeekMonth(week - 1)
                      const monthEnd = week === weekCount || month !== getWeekMonth(week + 1)

                      return (
                        <div key={key} className="flex-1 relative"
                          onMouseEnter={event => { setHoveredCell(key); setHoveredRect(event.currentTarget.getBoundingClientRect()) }}
                          onMouseLeave={() => { setHoveredCell(null); setHoveredRect(null) }}
                          onClick={() => selectMonth(year, month)}>
                          <div className={`h-6 flex items-center justify-center cursor-pointer transition-colors relative
                            ${!selected ? 'border-r border-gray-100 last:border-r-0' : ''}
                            ${monthStart && !selected ? 'border-l-2 border-l-gray-300' : ''}
                            ${selected ? 'bg-blue-100 border-t-2 border-b-2 border-t-blue-500 border-b-blue-500' : ''}
                            ${selected && monthStart ? 'border-l-2 border-l-blue-500' : ''}
                            ${selected && monthEnd ? 'border-r-2 border-r-blue-500' : ''}
                            ${!selected && exceedsLimit ? 'bg-red-100' : ''}
                            ${!selected && !exceedsLimit && atLimit ? 'bg-amber-50' : ''}
                            ${!selected && !exceedsLimit && !atLimit && current ? 'bg-blue-50' : ''}
                            ${!selected && !exceedsLimit && !atLimit && !current && hovered ? 'bg-gray-100' : ''}`}>
                            {overlapCells.has(key) && <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-amber-400 ring-1 ring-white" />}
                            {weekEvents.length > 0 && <div className="flex gap-px">
                              {weekEvents.slice(0, 2).map(event => <div key={event.id} className={`w-1.5 h-1.5 rounded-full ${getEventDotColor(event, submissions)}`} />)}
                              {weekEvents.length > 2 && <span className="text-[8px] text-gray-500">+</span>}
                            </div>}
                          </div>

                          {hovered && hoveredRect && <div className="fixed z-50 pointer-events-none" style={{
                            top: hoveredRect.bottom + 4,
                            left: Math.max(8, Math.min(window.innerWidth - 248, hoveredRect.left + hoveredRect.width / 2 - 120))
                          }}>
                            <div className="bg-gray-900 text-white rounded-lg shadow-lg p-2 min-w-[180px] max-w-[240px]">
                              <div className="text-xs font-medium mb-1">Week {week}, {year}<span className="text-gray-400 font-normal ml-1">({formatLocalDate(getWeekStart(year, week), dateFormat)})</span></div>
                              {exceedsLimit && <div className="mb-1 px-2 py-0.5 bg-red-500/20 rounded text-[10px] text-red-300">Month exceeds limit ({monthCount} pending/accepted/{maxEventsPerMonth} max)</div>}
                              {overlapCells.has(key) && <div className="mb-1 px-2 py-0.5 bg-amber-500/20 rounded text-[10px] text-amber-300">Contains overlapping events</div>}
                              {weekEvents.length ? <ul className="space-y-1">{weekEvents.map(event => <li key={event.id} className="text-[10px]">
                                <div className="font-medium text-gray-100 truncate">{event.name}</div>
                                <div className="text-gray-400">{formatDate(event.dateStart, dateFormat)} · {event.city}</div>
                              </li>)}</ul> : <p className="text-[10px] text-gray-400">No events</p>}
                              <div className={`absolute -top-1 w-2 h-2 bg-gray-900 rotate-45 ${week <= 8 ? 'left-3' : week >= weekCount - 7 ? 'right-3' : 'left-1/2 -translate-x-1/2'}`} />
                            </div>
                          </div>}
                        </div>
                      )
                    })}
                  </div>
                </div>
                <div className="relative h-4 mt-1 ml-12">{MONTHS.map((month, index) => {
                  const position = Math.round(index * (weekCount / 12))
                  return <span key={month} className="absolute text-[10px] text-gray-500" style={{ left: `${position / weekCount * 100}%` }}>{month}</span>
                })}</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
