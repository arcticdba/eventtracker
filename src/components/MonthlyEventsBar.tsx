import { useMemo, useState } from 'react'
import { CalendarSelection, Event, Submission } from '../types'
import { computeEventState } from '../utils/computeEventState'
import { getOverlappingEvents, groupSubmissionsByEvent } from '../utils/getOverlappingEvents'
import { formatDate } from '../utils/formatDate'
import { DateFormat } from '../api'
import { MONTHS, parseDateOnly } from '../utils/date'
import { eventDotStyles } from '../ui/styles'

interface Props {
  events: Event[]
  submissions: Submission[]
  selectedMonth: CalendarSelection | null
  onMonthSelect: (month: CalendarSelection | null) => void
  maxEventsPerMonth: number
  dateFormat: DateFormat
}

function getEventDotColor(event: Event, submissions: Submission[], isPast: boolean): string {
  const state = computeEventState(event.id, submissions)
  return `${eventDotStyles[state]} ${isPast ? 'opacity-60' : ''}`
}

export function MonthlyEventsBar({ events, submissions, selectedMonth, onMonthSelect, maxEventsPerMonth, dateFormat }: Props) {
  const [hoveredCell, setHoveredCell] = useState<string | null>(null)
  const [hoveredRect, setHoveredRect] = useState<DOMRect | null>(null)
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()

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
    const submissionsByEvent = groupSubmissionsByEvent(submissions)
    events.forEach(event => {
      const date = parseDateOnly(event.dateStart)
      if (!visibleYears.includes(date.getFullYear())) return
      const state = computeEventState(event.id, submissions)
      if (state === 'rejected' || state === 'declined' || state === 'cancelled') return
      if (getOverlappingEvents(event, events, submissions, submissionsByEvent).length > 0) {
        cells.add(`${date.getFullYear()}-${date.getMonth()}`)
      }
    })
    return cells
  }, [events, submissions, visibleYears])

  const selectMonth = (year: number, month: number) => {
    onMonthSelect(selectedMonth?.year === year && selectedMonth.month === month ? null : { year, month })
  }

  return (
    <div className="ui-card mb-4 flex-shrink-0 px-4 py-3">
      <div className="flex items-center gap-2 mb-2">
        <h3 className="text-sm font-medium text-gray-700">Monthly View</h3>
        <span className="text-xs text-gray-500">{visibleYears[0]}–{visibleYears[visibleYears.length - 1]}</span>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[560px] space-y-2">
          {visibleYears.map(year => {
            const eventsByMonth: Event[][] = Array.from({ length: 12 }, () => [])
            const yearEvents = events.filter(event => parseDateOnly(event.dateStart).getFullYear() === year)
            yearEvents.forEach(event => eventsByMonth[parseDateOnly(event.dateStart).getMonth()].push(event))
            eventsByMonth.forEach(monthEvents => monthEvents.sort((a, b) => a.dateStart.localeCompare(b.dateStart)))

            return (
              <div key={year} className="flex items-start">
                <div className={`w-12 shrink-0 pt-3 text-xs ${year === currentYear ? 'font-bold text-blue-600' : 'font-medium text-gray-600'}`}>
                  {year}<span className="block text-[9px] font-normal text-gray-400">{yearEvents.length} total</span>
                </div>
                <div className="flex flex-1">
                  {MONTHS.map((monthName, month) => {
                    const key = `${year}-${month}`
                    const monthEvents = eventsByMonth[month]
                    const bandwidthCount = monthEvents.filter(event => {
                      const state = computeEventState(event.id, submissions)
                      return state === 'pending' || state === 'selected'
                    }).length
                    const selected = selectedMonth?.year === year && selectedMonth.month === month
                    const current = year === currentYear && month === currentMonth
                    const past = year < currentYear || (year === currentYear && month < currentMonth)
                    const hovered = hoveredCell === key
                    const exceedsLimit = maxEventsPerMonth > 0 && bandwidthCount > maxEventsPerMonth
                    const atLimit = maxEventsPerMonth > 0 && bandwidthCount === maxEventsPerMonth
                    const hasOverlap = overlapCells.has(key)

                    return (
                      <div key={key} className="flex-1 relative"
                        onMouseEnter={event => { setHoveredCell(key); setHoveredRect(event.currentTarget.getBoundingClientRect()) }}
                        onMouseLeave={() => { setHoveredCell(null); setHoveredRect(null) }}
                        onClick={() => selectMonth(year, month)}>
                        <div className={`h-12 border-r border-gray-200 last:border-r-0 flex items-center justify-center cursor-pointer transition-colors relative
                          ${selected ? 'bg-blue-100 ring-2 ring-blue-500 ring-inset' : ''}
                          ${!selected && exceedsLimit ? 'bg-red-100' : ''}
                          ${!selected && !exceedsLimit && atLimit ? 'bg-amber-50' : ''}
                          ${!selected && !exceedsLimit && !atLimit && current ? 'bg-blue-50' : ''}
                          ${!selected && !exceedsLimit && !atLimit && !current && hovered ? 'bg-gray-100' : ''}`}>
                          {hasOverlap && <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-400 ring-1 ring-white" />}
                          {monthEvents.length ? <div className="flex flex-wrap gap-0.5 justify-center max-w-[40px]">
                            {monthEvents.slice(0, 6).map(event => <div key={event.id} className={`w-2 h-2 rounded-full ${getEventDotColor(event, submissions, past)}`} />)}
                            {monthEvents.length > 6 && <span className="text-[10px] text-gray-500">+{monthEvents.length - 6}</span>}
                          </div> : <div className="w-2 h-0.5 bg-gray-200 rounded" />}
                        </div>
                        <div className={`text-center text-xs mt-1 ${current ? 'font-bold text-blue-600' : 'text-gray-500'}`}>{monthName}</div>

                        {hovered && hoveredRect && <div className="fixed z-50 pointer-events-none" style={{
                          top: hoveredRect.bottom + 8,
                          left: Math.max(8, Math.min(window.innerWidth - 288, hoveredRect.left + hoveredRect.width / 2 - 140))
                        }}>
                          <div className="bg-gray-900 text-white rounded-lg shadow-lg p-3 min-w-[200px] max-w-[280px]">
                            <div className="text-sm font-medium mb-2">{monthName} {year}<span className="text-gray-400 font-normal ml-2">
                              {monthEvents.length} event{monthEvents.length !== 1 ? 's' : ''}{maxEventsPerMonth > 0 && ` (${bandwidthCount} pending/accepted / ${maxEventsPerMonth} max)`}
                            </span></div>
                            {exceedsLimit && <div className="mb-2 px-2 py-1 bg-red-500/20 rounded text-xs text-red-300">Exceeds monthly limit by {bandwidthCount - maxEventsPerMonth}</div>}
                            {hasOverlap && <div className="mb-2 px-2 py-1 bg-amber-500/20 rounded text-xs text-amber-300">Contains overlapping events</div>}
                            {monthEvents.length ? <ul className="space-y-1.5">{monthEvents.map(event => {
                              const date = event.dateStart === event.dateEnd || !event.dateEnd
                                ? formatDate(event.dateStart, dateFormat)
                                : `${formatDate(event.dateStart, dateFormat)} - ${formatDate(event.dateEnd, dateFormat)}`
                              return <li key={event.id} className="text-xs"><div className="font-medium text-gray-100 truncate">{event.name}</div><div className="text-gray-400">{date} · {event.city}</div></li>
                            })}</ul> : <p className="text-xs text-gray-400">No events scheduled</p>}
                            <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-gray-900 rotate-45" />
                          </div>
                        </div>}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
