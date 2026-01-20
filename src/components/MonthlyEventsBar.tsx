import { useState } from 'react'
import { Event, Submission } from '../types'
import { computeEventState } from '../utils/computeEventState'

interface MonthlyEventsBarProps {
  events: Event[]
  submissions: Submission[]
  selectedMonth: number | null
  onMonthSelect: (month: number | null) => void
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function getEventDotColor(event: Event, submissions: Submission[], isPast: boolean): string {
  const state = computeEventState(event.id, submissions)

  if (isPast) {
    // Muted colors for past events
    switch (state) {
      case 'selected': return 'bg-green-300'
      case 'pending': return 'bg-yellow-300'
      case 'rejected': return 'bg-red-300'
      case 'declined': return 'bg-gray-300'
      default: return 'bg-gray-300'
    }
  }

  // Bright colors for current/future events
  switch (state) {
    case 'selected': return 'bg-green-500'
    case 'pending': return 'bg-yellow-500'
    case 'rejected': return 'bg-red-500'
    case 'declined': return 'bg-gray-400'
    default: return 'bg-gray-400'
  }
}

export function MonthlyEventsBar({ events, submissions, selectedMonth, onMonthSelect }: MonthlyEventsBarProps) {
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null)
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth()

  const handleMonthClick = (month: number) => {
    if (selectedMonth === month) {
      onMonthSelect(null) // Deselect if clicking the same month
    } else {
      onMonthSelect(month)
    }
  }

  // Group events by month for the current year
  const eventsByMonth: Event[][] = Array.from({ length: 12 }, () => [])

  events.forEach(event => {
    const date = new Date(event.dateStart)
    if (date.getFullYear() === currentYear) {
      eventsByMonth[date.getMonth()].push(event)
    }
  })

  // Sort events within each month by date
  eventsByMonth.forEach(monthEvents => {
    monthEvents.sort((a, b) => new Date(a.dateStart).getTime() - new Date(b.dateStart).getTime())
  })

  return (
    <div className="bg-white rounded-lg shadow px-4 py-3 mb-4 flex-shrink-0">
      <div className="flex items-center gap-2 mb-2">
        <h3 className="text-sm font-medium text-gray-700">Events {currentYear}</h3>
        <span className="text-xs text-gray-500">
          ({events.filter(e => new Date(e.dateStart).getFullYear() === currentYear).length} total)
        </span>
      </div>

      <div className="flex">
        {MONTHS.map((month, index) => {
          const monthEvents = eventsByMonth[index]
          const count = monthEvents.length
          const isCurrentMonth = index === currentMonth
          const isPast = index < currentMonth
          const isHovered = hoveredMonth === index
          const isSelected = selectedMonth === index

          return (
            <div
              key={month}
              className="flex-1 relative"
              onMouseEnter={() => setHoveredMonth(index)}
              onMouseLeave={() => setHoveredMonth(null)}
              onClick={() => handleMonthClick(index)}
            >
              {/* Month cell */}
              <div
                className={`
                  h-12 border-r border-gray-200 last:border-r-0 flex items-center justify-center cursor-pointer
                  transition-colors
                  ${isSelected ? 'bg-blue-100 ring-2 ring-blue-500 ring-inset' : ''}
                  ${!isSelected && isCurrentMonth ? 'bg-blue-50' : ''}
                  ${!isSelected && isHovered ? 'bg-gray-100' : ''}
                `}
              >
                {/* Event dots/indicators */}
                <div className="flex flex-col gap-0.5 items-center">
                  {count > 0 ? (
                    <div className="flex flex-wrap gap-0.5 justify-center max-w-[40px]">
                      {monthEvents.slice(0, 6).map(event => (
                        <div
                          key={event.id}
                          className={`w-2 h-2 rounded-full ${getEventDotColor(event, submissions, isPast)}`}
                        />
                      ))}
                      {count > 6 && (
                        <span className="text-[10px] text-gray-500">+{count - 6}</span>
                      )}
                    </div>
                  ) : (
                    <div className="w-2 h-0.5 bg-gray-200 rounded" />
                  )}
                </div>
              </div>

              {/* Month label */}
              <div className={`text-center text-xs mt-1 ${
                isCurrentMonth ? 'font-bold text-blue-600' : 'text-gray-500'
              }`}>
                {month}
              </div>

              {/* Hover popover */}
              {isHovered && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50">
                  <div className="bg-gray-900 text-white rounded-lg shadow-lg p-3 min-w-[200px] max-w-[280px]">
                    <div className="text-sm font-medium mb-2">
                      {MONTHS[index]} {currentYear}
                      <span className="text-gray-400 font-normal ml-2">
                        {count} event{count !== 1 ? 's' : ''}
                      </span>
                    </div>
                    {count > 0 ? (
                      <ul className="space-y-1.5">
                        {monthEvents.map(event => {
                          const startDate = new Date(event.dateStart)
                          const endDate = new Date(event.dateEnd)
                          const dateStr = startDate.getTime() === endDate.getTime()
                            ? startDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
                            : `${startDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} - ${endDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}`

                          return (
                            <li key={event.id} className="text-xs">
                              <div className="font-medium text-gray-100 truncate">{event.name}</div>
                              <div className="text-gray-400">{dateStr} · {event.city}</div>
                            </li>
                          )
                        })}
                      </ul>
                    ) : (
                      <p className="text-xs text-gray-400">No events scheduled</p>
                    )}
                    {/* Arrow */}
                    <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-gray-900 rotate-45" />
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
