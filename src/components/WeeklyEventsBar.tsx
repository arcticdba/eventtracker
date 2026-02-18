import { useState } from 'react'
import { Event, Submission } from '../types'
import { computeEventState } from '../utils/computeEventState'
import { formatDate } from '../utils/formatDate'
import { DateFormat } from '../api'

interface WeeklyEventsBarProps {
  events: Event[]
  submissions: Submission[]
  maxEventsPerMonth: number  // 0 = no limit
  selectedMonth: number | null
  onMonthSelect: (month: number | null) => void
  dateFormat: DateFormat
}

function getWeekNumber(date: Date): number {
  const startOfYear = new Date(date.getFullYear(), 0, 1)
  const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000))
  return Math.ceil((days + startOfYear.getDay() + 1) / 7)
}

function getWeekStart(year: number, week: number): Date {
  const startOfYear = new Date(year, 0, 1)
  const daysOffset = (week - 1) * 7 - startOfYear.getDay()
  return new Date(year, 0, 1 + daysOffset)
}

function getEventDotColor(event: Event, submissions: Submission[]): string {
  const state = computeEventState(event.id, submissions)
  switch (state) {
    case 'selected': return 'bg-green-500'
    case 'pending': return 'bg-yellow-500'
    case 'rejected': return 'bg-red-500'
    case 'declined': return 'bg-gray-400'
    default: return 'bg-gray-400'
  }
}

export function WeeklyEventsBar({ events, submissions, maxEventsPerMonth, selectedMonth, onMonthSelect, dateFormat }: WeeklyEventsBarProps) {
  const [hoveredWeek, setHoveredWeek] = useState<number | null>(null)
  const currentYear = new Date().getFullYear()
  const currentWeek = getWeekNumber(new Date())

  const handleWeekClick = (weekMonth: number) => {
    if (selectedMonth === weekMonth) {
      onMonthSelect(null) // Deselect if clicking the same month
    } else {
      onMonthSelect(weekMonth)
    }
  }

  // Group events by week for the current year
  const eventsByWeek: Event[][] = Array.from({ length: 53 }, () => [])

  // Group events by month for bandwidth checking
  const eventsByMonth: number[] = Array(12).fill(0)

  events.forEach(event => {
    const date = new Date(event.dateStart)
    if (date.getFullYear() === currentYear) {
      const week = getWeekNumber(date)
      if (week >= 1 && week <= 53) {
        eventsByWeek[week - 1].push(event)
      }
      const state = computeEventState(event.id, submissions)
      if (state === 'pending' || state === 'selected') {
        eventsByMonth[date.getMonth()]++
      }
    }
  })

  // Sort events within each week by date
  eventsByWeek.forEach(weekEvents => {
    weekEvents.sort((a, b) => new Date(a.dateStart).getTime() - new Date(b.dateStart).getTime())
  })

  // Get the primary month for a given week
  const getWeekMonth = (week: number): number => {
    const weekStart = getWeekStart(currentYear, week)
    return weekStart.getMonth()
  }

  return (
    <div className="bg-white rounded-lg shadow px-4 py-3 mb-4 flex-shrink-0">
      <div className="flex items-center gap-2 mb-2">
        <h3 className="text-sm font-medium text-gray-700">Weekly View {currentYear}</h3>
        <span className="text-xs text-gray-500">
          ({events.filter(e => new Date(e.dateStart).getFullYear() === currentYear).length} total)
        </span>
        <span className="text-xs text-gray-400">·</span>
        <span className="text-xs text-gray-500">Week {currentWeek}</span>
      </div>

      <div className="flex gap-px">
        {Array.from({ length: 52 }, (_, i) => i + 1).map(week => {
          const weekEvents = eventsByWeek[week - 1]
          const count = weekEvents.length
          const isCurrentWeek = week === currentWeek
          const isHovered = hoveredWeek === week
          const weekMonth = getWeekMonth(week)
          const monthEventCount = eventsByMonth[weekMonth]
          const exceedsLimit = maxEventsPerMonth > 0 && monthEventCount > maxEventsPerMonth
          const atLimit = maxEventsPerMonth > 0 && monthEventCount === maxEventsPerMonth
          // Check if this week starts a new month (compare with previous week)
          const prevWeekMonth = week > 1 ? getWeekMonth(week - 1) : -1
          const nextWeekMonth = week < 52 ? getWeekMonth(week + 1) : -1
          const isMonthStart = week === 1 || weekMonth !== prevWeekMonth
          const isMonthEnd = week === 52 || weekMonth !== nextWeekMonth
          const isSelected = selectedMonth === weekMonth
          const isSelectedMonthStart = isSelected && isMonthStart
          const isSelectedMonthEnd = isSelected && isMonthEnd

          return (
            <div
              key={week}
              className="flex-1 relative"
              onMouseEnter={() => setHoveredWeek(week)}
              onMouseLeave={() => setHoveredWeek(null)}
              onClick={() => handleWeekClick(weekMonth)}
            >
              {/* Week cell */}
              <div
                className={`
                  h-6 flex items-center justify-center cursor-pointer transition-colors
                  ${!isSelected ? 'border-r border-gray-100 last:border-r-0' : ''}
                  ${isMonthStart && !isSelected ? 'border-l-2 border-l-gray-300' : ''}
                  ${isSelected ? 'bg-blue-100 border-t-2 border-b-2 border-t-blue-500 border-b-blue-500' : ''}
                  ${isSelectedMonthStart ? 'border-l-2 border-l-blue-500' : ''}
                  ${isSelectedMonthEnd ? 'border-r-2 border-r-blue-500' : ''}
                  ${!isSelected && exceedsLimit ? 'bg-red-100' : ''}
                  ${!isSelected && !exceedsLimit && atLimit ? 'bg-amber-50' : ''}
                  ${!isSelected && !exceedsLimit && !atLimit && isCurrentWeek ? 'bg-blue-50' : ''}
                  ${!isSelected && !exceedsLimit && !atLimit && !isCurrentWeek && isHovered ? 'bg-gray-100' : ''}
                `}
              >
                {count > 0 && (
                  <div className="flex gap-px">
                    {weekEvents.slice(0, 2).map(event => (
                      <div
                        key={event.id}
                        className={`w-1.5 h-1.5 rounded-full ${getEventDotColor(event, submissions)}`}
                      />
                    ))}
                    {count > 2 && (
                      <span className="text-[8px] text-gray-500">+</span>
                    )}
                  </div>
                )}
              </div>

              {/* Hover popover */}
              {isHovered && (
                <div className={`absolute top-full mt-1 z-50 ${
                  week <= 8 ? 'left-0' : week >= 45 ? 'right-0' : 'left-1/2 -translate-x-1/2'
                }`}>
                  <div className="bg-gray-900 text-white rounded-lg shadow-lg p-2 min-w-[180px] max-w-[240px]">
                    <div className="text-xs font-medium mb-1">
                      Week {week}
                      <span className="text-gray-400 font-normal ml-1">
                        ({getWeekStart(currentYear, week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})
                      </span>
                    </div>
                    {exceedsLimit && (
                      <div className="mb-1 px-2 py-0.5 bg-red-500/20 rounded text-[10px] text-red-300">
                        Month exceeds limit ({monthEventCount} pending/accepted/{maxEventsPerMonth} max)
                      </div>
                    )}
                    {count > 0 ? (
                      <ul className="space-y-1">
                        {weekEvents.map(event => (
                            <li key={event.id} className="text-[10px]">
                              <div className="font-medium text-gray-100 truncate">{event.name}</div>
                              <div className="text-gray-400">
                                {formatDate(event.dateStart, dateFormat)} · {event.city}
                              </div>
                            </li>
                          ))}
                      </ul>
                    ) : (
                      <p className="text-[10px] text-gray-400">No events</p>
                    )}
                    <div className={`absolute -top-1 w-2 h-2 bg-gray-900 rotate-45 ${
                      week <= 8 ? 'left-3' : week >= 45 ? 'right-3' : 'left-1/2 -translate-x-1/2'
                    }`} />
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Month labels - positioned at approximate week boundaries */}
      <div className="relative h-4 mt-1">
        {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, i) => {
          // Approximate week position for each month start (52 weeks / 12 months ≈ 4.33 weeks per month)
          const weekPosition = Math.round(i * (52 / 12))
          const leftPercent = (weekPosition / 52) * 100
          return (
            <span
              key={month}
              className="absolute text-[10px] text-gray-500"
              style={{ left: `${leftPercent}%` }}
            >
              {month}
            </span>
          )
        })}
      </div>
    </div>
  )
}
