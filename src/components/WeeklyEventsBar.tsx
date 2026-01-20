import { useState } from 'react'
import { Event, Submission } from '../types'
import { computeEventState } from '../utils/computeEventState'

interface WeeklyEventsBarProps {
  events: Event[]
  submissions: Submission[]
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

export function WeeklyEventsBar({ events, submissions }: WeeklyEventsBarProps) {
  const [hoveredWeek, setHoveredWeek] = useState<number | null>(null)
  const currentYear = new Date().getFullYear()
  const currentWeek = getWeekNumber(new Date())

  // Group events by week for the current year
  const eventsByWeek: Event[][] = Array.from({ length: 53 }, () => [])

  events.forEach(event => {
    const date = new Date(event.dateStart)
    if (date.getFullYear() === currentYear) {
      const week = getWeekNumber(date)
      if (week >= 1 && week <= 53) {
        eventsByWeek[week - 1].push(event)
      }
    }
  })

  // Sort events within each week by date
  eventsByWeek.forEach(weekEvents => {
    weekEvents.sort((a, b) => new Date(a.dateStart).getTime() - new Date(b.dateStart).getTime())
  })

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

          return (
            <div
              key={week}
              className="flex-1 relative"
              onMouseEnter={() => setHoveredWeek(week)}
              onMouseLeave={() => setHoveredWeek(null)}
            >
              {/* Week cell */}
              <div
                className={`
                  h-6 flex items-center justify-center cursor-pointer transition-colors border-r border-gray-100 last:border-r-0
                  ${isCurrentWeek ? 'bg-blue-50' : ''}
                  ${isHovered && !isCurrentWeek ? 'bg-gray-100' : ''}
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
                    {count > 0 ? (
                      <ul className="space-y-1">
                        {weekEvents.map(event => {
                          const startDate = new Date(event.dateStart)
                          return (
                            <li key={event.id} className="text-[10px]">
                              <div className="font-medium text-gray-100 truncate">{event.name}</div>
                              <div className="text-gray-400">
                                {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {event.city}
                              </div>
                            </li>
                          )
                        })}
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
