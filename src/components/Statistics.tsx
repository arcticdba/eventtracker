import { useState } from 'react'
import { Event, Session, Submission } from '../types'
import { formatDate } from '../utils/formatDate'
import { DateFormat } from '../api'

interface Props {
  events: Event[]
  sessions: Session[]
  submissions: Submission[]
  dateFormat: DateFormat
}

// Map country names to regions
const countryToRegion: Record<string, string> = {
  // Europe
  'United Kingdom': 'Europe', 'UK': 'Europe', 'England': 'Europe', 'Scotland': 'Europe', 'Wales': 'Europe',
  'Germany': 'Europe', 'France': 'Europe', 'Spain': 'Europe', 'Italy': 'Europe', 'Netherlands': 'Europe',
  'The Netherlands': 'Europe', 'Belgium': 'Europe', 'Sweden': 'Europe', 'Norway': 'Europe', 'Denmark': 'Europe',
  'Finland': 'Europe', 'Poland': 'Europe', 'Austria': 'Europe', 'Switzerland': 'Europe', 'Ireland': 'Europe',
  'Portugal': 'Europe', 'Czechia': 'Europe', 'Hungary': 'Europe', 'Romania': 'Europe',
  'Greece': 'Europe', 'Croatia': 'Europe', 'Slovenia': 'Europe', 'Slovakia': 'Europe', 'Bulgaria': 'Europe',
  'Serbia': 'Europe', 'Ukraine': 'Europe', 'Lithuania': 'Europe', 'Latvia': 'Europe', 'Estonia': 'Europe',
  'Iceland': 'Europe', 'Malta': 'Europe',
  // North America
  'United States': 'North America', 'USA': 'North America', 'US': 'North America',
  'Canada': 'North America', 'Mexico': 'North America', 'Guatemala': 'North America',
  // Remote
  'Online': 'Remote',
  // South America
  'Brazil': 'South America', 'Argentina': 'South America', 'Chile': 'South America', 'Colombia': 'South America',
  'Peru': 'South America', 'Venezuela': 'South America', 'Ecuador': 'South America', 'Uruguay': 'South America',
  // Asia
  'Japan': 'Asia', 'China': 'Asia', 'South Korea': 'Asia', 'Korea': 'Asia', 'India': 'Asia',
  'Singapore': 'Asia', 'Thailand': 'Asia', 'Vietnam': 'Asia', 'Malaysia': 'Asia', 'Indonesia': 'Asia',
  'Philippines': 'Asia', 'Taiwan': 'Asia', 'Hong Kong': 'Asia',
  // Middle East
  'Israel': 'Middle East', 'UAE': 'Middle East', 'United Arab Emirates': 'Middle East',
  'Saudi Arabia': 'Middle East', 'Qatar': 'Middle East', 'Turkey': 'Middle East',
  // Oceania
  'Australia': 'Oceania', 'New Zealand': 'Oceania',
  // Africa
  'South Africa': 'Africa', 'Egypt': 'Africa', 'Nigeria': 'Africa', 'Kenya': 'Africa', 'Morocco': 'Africa',
}

function getRegion(country: string): string {
  return countryToRegion[country] || 'Other'
}

function getSeason(dateStr: string): string {
  const month = new Date(dateStr).getMonth()
  if (month >= 2 && month <= 4) return 'Spring'
  if (month >= 5 && month <= 7) return 'Summer'
  if (month >= 8 && month <= 10) return 'Fall'
  return 'Winter'
}

function getYear(dateStr: string): number {
  return new Date(dateStr).getFullYear()
}

function getMonth(dateStr: string): number {
  return new Date(dateStr).getMonth()
}

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function Statistics({ events, sessions, submissions, dateFormat }: Props) {
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [showRetiredSessions, setShowRetiredSessions] = useState(false)
  const [compareYear1, setCompareYear1] = useState<number | null>(null)
  const [compareYear2, setCompareYear2] = useState<number | null>(null)

  // Get events with selected sessions
  const selectedSubmissions = submissions.filter(s => s.state === 'selected')
  const allEventsWithSelected = events.filter(e =>
    selectedSubmissions.some(s => s.eventId === e.id)
  )

  // Events by year (always show all years for the chart)
  const eventsByYear: Record<number, number> = {}
  allEventsWithSelected.forEach(e => {
    const year = getYear(e.dateStart)
    eventsByYear[year] = (eventsByYear[year] || 0) + 1
  })
  const years = Object.keys(eventsByYear).map(Number).sort((a, b) => b - a)

  // Filter events by selected year for all other stats
  const eventsWithSelected = selectedYear
    ? allEventsWithSelected.filter(e => getYear(e.dateStart) === selectedYear)
    : allEventsWithSelected

  // Filter submissions by selected year
  const filteredSubmissions = selectedYear
    ? submissions.filter(s => {
        const event = events.find(e => e.id === s.eventId)
        return event && getYear(event.dateStart) === selectedYear
      })
    : submissions

  const filteredSelectedSubmissions = selectedYear
    ? selectedSubmissions.filter(s => {
        const event = events.find(e => e.id === s.eventId)
        return event && getYear(event.dateStart) === selectedYear
      })
    : selectedSubmissions

  // Events by region
  const eventsByRegion: Record<string, number> = {}
  eventsWithSelected.forEach(e => {
    const region = getRegion(e.country)
    eventsByRegion[region] = (eventsByRegion[region] || 0) + 1
  })

  // Events by season
  const eventsBySeason: Record<string, number> = { Spring: 0, Summer: 0, Fall: 0, Winter: 0 }
  eventsWithSelected.forEach(e => {
    const season = getSeason(e.dateStart)
    eventsBySeason[season] = (eventsBySeason[season] || 0) + 1
  })

  // Events by country (with event details for tooltip)
  // Remote events are always counted as "Online" regardless of country field
  const eventsByCountry: Record<string, { count: number; events: { name: string; date: string }[] }> = {}
  eventsWithSelected.forEach(e => {
    const country = e.remote ? 'Online' : e.country
    if (country) {
      if (!eventsByCountry[country]) {
        eventsByCountry[country] = { count: 0, events: [] }
      }
      eventsByCountry[country].count++
      eventsByCountry[country].events.push({ name: e.name, date: e.dateStart })
    }
  })
  // Sort events within each country by date descending
  Object.values(eventsByCountry).forEach(data => {
    data.events.sort((a, b) => b.date.localeCompare(a.date))
  })
  const topCountries = Object.entries(eventsByCountry)
    .sort((a, b) => {
      // Sort "Online" last
      if (a[0] === 'Online') return 1
      if (b[0] === 'Online') return -1
      return b[1].count - a[1].count
    })
    .slice(0, 10)

  // Cities with events (excluding remote)
  const citiesWithEvents = eventsWithSelected
    .filter(e => e.city && !e.remote)
    .map(e => ({ city: e.city, country: e.country, name: e.name, date: e.dateStart }))

  // Countries visited (excluding remote)
  const countriesVisited = [...new Set(eventsWithSelected.filter(e => !e.remote && e.country).map(e => e.country))].sort()

  // Overall stats
  const totalEventsWithSelected = eventsWithSelected.length

  // Calculate acceptance rate based on events, not sessions
  const eventsWithSubmissions = new Set(filteredSubmissions.map(s => s.eventId))
  const eventsAccepted = new Set(filteredSelectedSubmissions.map(s => s.eventId))
  const totalEventsSubmitted = eventsWithSubmissions.size
  const acceptanceRate = totalEventsSubmitted > 0
    ? Math.round((eventsAccepted.size / totalEventsSubmitted) * 100)
    : 0

  const uniqueCountries = new Set(eventsWithSelected.filter(e => !e.remote).map(e => e.country).filter(Boolean)).size
  const uniqueCities = new Set(eventsWithSelected.filter(e => !e.remote).map(e => e.city).filter(Boolean)).size

  // Remote vs in-person
  const remoteEvents = eventsWithSelected.filter(e => e.remote).length
  const inPersonEvents = totalEventsWithSelected - remoteEvents

  // Events by month (for heat map)
  const eventsByMonth: Record<number, { count: number; events: { name: string; date: string }[] }> = {}
  for (let i = 0; i < 12; i++) {
    eventsByMonth[i] = { count: 0, events: [] }
  }
  eventsWithSelected.forEach(e => {
    const month = getMonth(e.dateStart)
    eventsByMonth[month].count++
    eventsByMonth[month].events.push({ name: e.name, date: e.dateStart })
  })
  // Sort events within each month by date descending
  Object.values(eventsByMonth).forEach(data => {
    data.events.sort((a, b) => b.date.localeCompare(a.date))
  })
  const maxByMonth = Math.max(...Object.values(eventsByMonth).map(d => d.count), 1)

  const maxByYear = Math.max(...Object.values(eventsByYear), 1)
  const maxByRegion = Math.max(...Object.values(eventsByRegion), 1)
  const maxBySeason = Math.max(...Object.values(eventsBySeason), 1)

  // Session performance statistics
  const sessionStats = sessions
    .filter(s => showRetiredSessions || !s.retired)
    .map(session => {
      const sessionSubs = filteredSubmissions.filter(sub => sub.sessionId === session.id)
      const submitted = sessionSubs.length
      const selected = sessionSubs.filter(s => s.state === 'selected').length
      const rejected = sessionSubs.filter(s => s.state === 'rejected').length
      const declined = sessionSubs.filter(s => s.state === 'declined').length
      const pendingSubs = sessionSubs.filter(s => s.state === 'submitted')
      const pending = pendingSubs.length
      const pendingEventNames = pendingSubs
        .map(sub => events.find(e => e.id === sub.eventId)?.name)
        .filter(Boolean) as string[]
      // Acceptance rate: selected / (selected + rejected) - only count submissions where conference made a decision
      const decided = selected + rejected
      const acceptanceRate = decided > 0 ? Math.round((selected / decided) * 100) : null
      return {
        session,
        submitted,
        selected,
        rejected,
        declined,
        pending,
        pendingEventNames,
        decided,
        acceptanceRate
      }
    })
    .filter(s => s.submitted > 0)
    .sort((a, b) => {
      // Sort by acceptance rate descending, then by number of selections
      if (a.acceptanceRate === null && b.acceptanceRate === null) return b.selected - a.selected
      if (a.acceptanceRate === null) return 1
      if (b.acceptanceRate === null) return -1
      if (a.acceptanceRate !== b.acceptanceRate) return b.acceptanceRate - a.acceptanceRate
      return b.selected - a.selected
    })

  // Acceptance rate by level
  const levelStats: Record<string, { submitted: number; selected: number; rejected: number; declined: number }> = {}
  const levels = ['100', '200', '300', '400', '500']
  levels.forEach(level => {
    levelStats[level] = { submitted: 0, selected: 0, rejected: 0, declined: 0 }
  })

  sessions.filter(s => showRetiredSessions || !s.retired).forEach(session => {
    const level = session.level
    if (!levels.includes(level)) return
    const sessionSubs = filteredSubmissions.filter(sub => sub.sessionId === session.id)
    levelStats[level].submitted += sessionSubs.length
    levelStats[level].selected += sessionSubs.filter(s => s.state === 'selected').length
    levelStats[level].rejected += sessionSubs.filter(s => s.state === 'rejected').length
    levelStats[level].declined += sessionSubs.filter(s => s.state === 'declined').length
  })

  // Categorize sessions by performance (using selected + rejected as the denominator)
  const highPerforming = sessionStats.filter(s => s.acceptanceRate !== null && s.acceptanceRate >= 50 && s.decided >= 2)
  const needsRework = sessionStats.filter(s => s.acceptanceRate !== null && s.acceptanceRate < 30 && s.decided >= 3)

  return (
    <div className="space-y-6">
      {/* Year Filter Indicator */}
      {selectedYear && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 flex items-center justify-between">
          <span className="text-sm text-blue-700">
            Showing statistics for <strong>{selectedYear}</strong>
          </span>
          <button
            onClick={() => setSelectedYear(null)}
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            Show all years
          </button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-3xl font-bold text-blue-600">{totalEventsWithSelected}</div>
          <div className="text-sm text-gray-500">Events Spoken At</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-3xl font-bold text-green-600">{totalEventsSubmitted}</div>
          <div className="text-sm text-gray-500">Events Submitted To</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-3xl font-bold text-orange-600">{acceptanceRate}%</div>
          <div className="text-sm text-gray-500">Acceptance Rate</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-3xl font-bold text-purple-600">{uniqueCountries}</div>
          <div className="text-sm text-gray-500">Countries</div>
        </div>
      </div>

      {/* Year-over-Year Trends */}
      {!selectedYear && years.length >= 2 && (() => {
        const currentYear = new Date().getFullYear()
        // Initialize compare years if not set
        const year1 = compareYear1 ?? currentYear
        const year2 = compareYear2 ?? (years.includes(currentYear - 1) ? currentYear - 1 : years.find(y => y !== year1) ?? currentYear - 1)

        // Calculate stats for each year
        const getYearStats = (year: number) => {
          const yearEvents = allEventsWithSelected.filter(e => getYear(e.dateStart) === year)
          const yearSubmissions = submissions.filter(s => {
            const event = events.find(e => e.id === s.eventId)
            return event && getYear(event.dateStart) === year
          })
          const yearSelectedSubs = yearSubmissions.filter(s => s.state === 'selected')
          const eventsSubmittedTo = new Set(yearSubmissions.map(s => s.eventId)).size
          const eventsAccepted = new Set(yearSelectedSubs.map(s => s.eventId)).size
          const acceptRate = eventsSubmittedTo > 0 ? Math.round((eventsAccepted / eventsSubmittedTo) * 100) : 0
          const countries = new Set(yearEvents.filter(e => !e.remote && e.country).map(e => e.country)).size
          const cities = new Set(yearEvents.filter(e => !e.remote && e.city).map(e => e.city)).size

          return {
            events: yearEvents.length,
            submitted: eventsSubmittedTo,
            acceptRate,
            countries,
            cities
          }
        }

        const stats1 = getYearStats(year1)
        const stats2 = getYearStats(year2)

        const getTrend = (current: number, previous: number) => {
          if (previous === 0) return current > 0 ? { direction: 'up' as const, change: current } : { direction: 'same' as const, change: 0 }
          const change = current - previous
          const pct = Math.round((change / previous) * 100)
          if (change > 0) return { direction: 'up' as const, change: pct }
          if (change < 0) return { direction: 'down' as const, change: Math.abs(pct) }
          return { direction: 'same' as const, change: 0 }
        }

        const eventsTrend = getTrend(stats1.events, stats2.events)
        const acceptTrend = getTrend(stats1.acceptRate, stats2.acceptRate)
        const countriesTrend = getTrend(stats1.countries, stats2.countries)

        const TrendIndicator = ({ trend }: { trend: { direction: 'up' | 'down' | 'same'; change: number } }) => {
          if (trend.direction === 'same') return <span className="text-gray-400 text-xs">→ same</span>
          const color = trend.direction === 'up' ? 'text-green-600' : 'text-red-600'
          const arrow = trend.direction === 'up' ? '↑' : '↓'
          return <span className={`${color} text-xs font-medium`}>{arrow} {trend.change}%</span>
        }

        // Get all years with data for the dropdown (include years with no data too for flexibility)
        const allYearsForDropdown = [...new Set([...years, currentYear, currentYear - 1])].sort((a, b) => b - a)

        return (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Year-over-Year Comparison</h3>
              <div className="flex items-center gap-2 text-sm">
                <select
                  value={year1}
                  onChange={e => setCompareYear1(Number(e.target.value))}
                  className="rounded border-gray-300 text-sm py-1 px-2"
                >
                  {allYearsForDropdown.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                <span className="text-gray-400">vs</span>
                <select
                  value={year2}
                  onChange={e => setCompareYear2(Number(e.target.value))}
                  className="rounded border-gray-300 text-sm py-1 px-2"
                >
                  {allYearsForDropdown.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-xs text-gray-500 mb-1">Events Spoken</div>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-2xl font-bold text-blue-600">{stats1.events}</span>
                  <span className="text-gray-400 text-sm">vs {stats2.events}</span>
                </div>
                <TrendIndicator trend={eventsTrend} />
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500 mb-1">Acceptance Rate</div>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-2xl font-bold text-orange-600">{stats1.acceptRate}%</span>
                  <span className="text-gray-400 text-sm">vs {stats2.acceptRate}%</span>
                </div>
                <TrendIndicator trend={acceptTrend} />
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500 mb-1">Countries</div>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-2xl font-bold text-purple-600">{stats1.countries}</span>
                  <span className="text-gray-400 text-sm">vs {stats2.countries}</span>
                </div>
                <TrendIndicator trend={countriesTrend} />
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500 mb-1">Cities</div>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-2xl font-bold text-teal-600">{stats1.cities}</span>
                  <span className="text-gray-400 text-sm">vs {stats2.cities}</span>
                </div>
                <TrendIndicator trend={getTrend(stats1.cities, stats2.cities)} />
              </div>
            </div>
          </div>
        )
      })()}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Events by Year */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Events by Year</h3>
            {selectedYear && (
              <button
                onClick={() => setSelectedYear(null)}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Clear filter
              </button>
            )}
          </div>
          {years.length > 0 ? (
            <div className="space-y-2">
              {years.map(year => (
                <div
                  key={year}
                  className={`flex items-center gap-2 cursor-pointer rounded p-1 -ml-1 transition ${
                    selectedYear === year ? 'bg-blue-50 ring-2 ring-blue-300' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedYear(selectedYear === year ? null : year)}
                >
                  <span className={`w-12 text-sm ${selectedYear === year ? 'font-semibold text-blue-700' : 'text-gray-600'}`}>
                    {year}
                  </span>
                  <div className="flex-1 bg-gray-200 rounded-full h-6 overflow-hidden">
                    <div
                      className={`h-full rounded-full flex items-center justify-end pr-2 ${
                        selectedYear === year ? 'bg-blue-600' : 'bg-blue-500'
                      }`}
                      style={{ width: `${(eventsByYear[year] / maxByYear) * 100}%` }}
                    >
                      <span className="text-xs text-white font-medium">{eventsByYear[year]}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No selected events yet</p>
          )}
        </div>

        {/* Events by Region */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold mb-4">Events by Region</h3>
          {Object.keys(eventsByRegion).length > 0 ? (
            <div className="space-y-2">
              {Object.entries(eventsByRegion)
                .sort((a, b) => {
                  // Sort "Remote" last
                  if (a[0] === 'Remote') return 1
                  if (b[0] === 'Remote') return -1
                  return b[1] - a[1]
                })
                .map(([region, count]) => (
                  <div key={region} className="flex items-center gap-2">
                    <span className="w-28 text-sm text-gray-600 truncate">{region}</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-6 overflow-hidden">
                      <div
                        className="bg-purple-500 h-full rounded-full flex items-center justify-end pr-2"
                        style={{ width: `${(count / maxByRegion) * 100}%` }}
                      >
                        <span className="text-xs text-white font-medium">{count}</span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No selected events yet</p>
          )}
        </div>

        {/* Events by Season */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold mb-4">Events by Season</h3>
          <div className="space-y-2">
            {['Spring', 'Summer', 'Fall', 'Winter'].map(season => (
              <div key={season} className="flex items-center gap-2">
                <span className="w-16 text-sm text-gray-600">{season}</span>
                <div className="flex-1 bg-gray-200 rounded-full h-6 overflow-hidden">
                  <div
                    className={`h-full rounded-full flex items-center justify-end pr-2 ${
                      season === 'Spring' ? 'bg-green-500' :
                      season === 'Summer' ? 'bg-yellow-500' :
                      season === 'Fall' ? 'bg-orange-500' : 'bg-blue-400'
                    }`}
                    style={{ width: maxBySeason > 0 ? `${(eventsBySeason[season] / maxBySeason) * 100}%` : '0%' }}
                  >
                    {eventsBySeason[season] > 0 && (
                      <span className="text-xs text-white font-medium">{eventsBySeason[season]}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Event Format */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold mb-4">Event Format</h3>
          <div className="flex gap-8">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{inPersonEvents}</div>
              <div className="text-sm text-gray-500">In-Person</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{remoteEvents}</div>
              <div className="text-sm text-gray-500">Remote</div>
            </div>
          </div>
          {totalEventsWithSelected > 0 && (
            <div className="mt-3 h-4 bg-gray-200 rounded-full overflow-hidden flex">
              <div className="bg-blue-500" style={{ width: `${(inPersonEvents / totalEventsWithSelected) * 100}%` }}></div>
              <div className="bg-purple-500" style={{ width: `${(remoteEvents / totalEventsWithSelected) * 100}%` }}></div>
            </div>
          )}
        </div>
      </div>

      {/* Monthly Heat Map */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold mb-4">Events by Month</h3>
        <div className="flex justify-between items-end gap-2 px-2">
          {monthNames.map((month, index) => {
            const data = eventsByMonth[index]
            const minSize = 24
            const maxSize = 64
            const size = data.count > 0
              ? minSize + ((data.count / maxByMonth) * (maxSize - minSize))
              : minSize
            const opacity = data.count > 0
              ? 0.3 + ((data.count / maxByMonth) * 0.7)
              : 0.1

            return (
              <div key={month} className="flex flex-col items-center gap-2">
                <div
                  className="flex items-center justify-center rounded-full bg-teal-500 text-white font-medium cursor-default transition-transform hover:scale-110"
                  style={{
                    width: size,
                    height: size,
                    opacity,
                    fontSize: size > 40 ? '14px' : '12px'
                  }}
                  title={data.count > 0
                    ? `${data.count} event${data.count !== 1 ? 's' : ''}:\n${data.events.map(e => `${e.name} (${formatDate(e.date, dateFormat)})`).join('\n')}`
                    : 'No events'
                  }
                >
                  {data.count > 0 && data.count}
                </div>
                <span className="text-xs text-gray-500">{month}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Top Countries */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold mb-4">Top Countries</h3>
        {topCountries.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {topCountries.map(([country, data]) => (
              <span
                key={country}
                className="px-3 py-1 bg-gray-100 rounded-full text-sm cursor-default"
                title={data.events.map(e => `${e.name} (${formatDate(e.date, dateFormat)})`).join('\n')}
              >
                {country}: <strong>{data.count}</strong>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-sm">No selected events yet</p>
        )}
      </div>

      {/* Countries Visited */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold mb-4">Countries Visited ({uniqueCountries})</h3>
        {countriesVisited.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {countriesVisited.map(country => (
              <span key={country} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                {country}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-sm">No countries visited yet</p>
        )}
      </div>

      {/* Session Performance Section */}
      <div className="border-t pt-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Session Performance</h2>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showRetiredSessions}
              onChange={e => setShowRetiredSessions(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span>Include retired sessions</span>
          </label>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Acceptance Rate by Level */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold mb-4">Acceptance Rate by Level</h3>
            <div className="space-y-3">
              {levels.map(level => {
                const stats = levelStats[level]
                const decided = stats.selected + stats.rejected
                const rate = decided > 0 ? Math.round((stats.selected / decided) * 100) : null

                return (
                  <div key={level} className="flex items-center gap-3">
                    <span className={`w-20 text-sm font-medium px-2 py-0.5 rounded ${
                      level === '100' ? 'bg-green-100 text-green-700' :
                      level === '200' ? 'bg-teal-100 text-teal-700' :
                      level === '300' ? 'bg-yellow-100 text-yellow-700' :
                      level === '400' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {level}
                    </span>
                    <div className="flex-1">
                      {decided > 0 ? (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${rate! >= 50 ? 'bg-green-500' : rate! >= 30 ? 'bg-yellow-500' : 'bg-red-500'}`}
                              style={{ width: `${rate}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium w-12 text-right">{rate}%</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">No data</span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 w-24">
                      {stats.selected}/{decided} accepted
                    </span>
                  </div>
                )
              })}
            </div>
            <p className="text-xs text-gray-400 mt-3">Based on sessions with selections (selected or rejected)</p>
          </div>

          {/* High Performing vs Needs Rework */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold mb-4">Session Health</h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-3 h-3 rounded-full bg-green-500"></span>
                  <span className="text-sm font-medium text-gray-700">High Performing ({highPerforming.length})</span>
                  <span className="text-xs text-gray-400">≥50% rate, 2+ selections</span>
                </div>
                {highPerforming.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {highPerforming.slice(0, 8).map(s => (
                      <span key={s.session.id} className="px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs" title={`${s.acceptanceRate}% (${s.selected}/${s.decided})`}>
                        {s.session.name.length > 25 ? s.session.name.slice(0, 25) + '...' : s.session.name}
                      </span>
                    ))}
                    {highPerforming.length > 8 && (
                      <span className="px-2 py-0.5 text-gray-400 text-xs">+{highPerforming.length - 8} more</span>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">No high performing sessions yet</p>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-3 h-3 rounded-full bg-red-500"></span>
                  <span className="text-sm font-medium text-gray-700">Needs Rework ({needsRework.length})</span>
                  <span className="text-xs text-gray-400">&lt;30% rate, 3+ selections</span>
                </div>
                {needsRework.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {needsRework.map(s => (
                      <span key={s.session.id} className="px-2 py-0.5 bg-red-50 text-red-700 rounded text-xs" title={`${s.acceptanceRate}% (${s.selected}/${s.decided})`}>
                        {s.session.name.length > 25 ? s.session.name.slice(0, 25) + '...' : s.session.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">No sessions need rework</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Session Acceptance Rates Table */}
        <div className="bg-white rounded-lg shadow p-4 mt-6">
          <h3 className="text-lg font-semibold mb-4">Session Acceptance Rates</h3>
          {sessionStats.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 font-medium text-gray-600">Session</th>
                    <th className="pb-2 font-medium text-gray-600 text-center w-16">Level</th>
                    <th className="pb-2 font-medium text-gray-600 text-center w-20">Submitted</th>
                    <th className="pb-2 font-medium text-gray-600 text-center w-20">Selected</th>
                    <th className="pb-2 font-medium text-gray-600 text-center w-20">Rejected</th>
                    <th className="pb-2 font-medium text-gray-600 text-center w-24">Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {sessionStats.map(s => (
                    <tr key={s.session.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2">
                        <div className="flex items-center gap-2">
                          <span className="truncate max-w-[200px]" title={s.session.name}>{s.session.name}</span>
                          {s.session.retired && (
                            <span className="flex-shrink-0 px-1.5 py-0.5 text-xs rounded bg-gray-200 text-gray-600">Retired</span>
                          )}
                          {s.pending > 0 && (
                            <span className="flex-shrink-0 px-1.5 py-0.5 text-xs rounded bg-yellow-100 text-yellow-700" title={`Pending: ${s.pendingEventNames.join(', ')}`}>
                              {s.pending} pending
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2 text-center">
                        <span className={`px-1.5 py-0.5 rounded text-xs ${
                          s.session.level === '100' ? 'bg-green-100 text-green-700' :
                          s.session.level === '200' ? 'bg-teal-100 text-teal-700' :
                          s.session.level === '300' ? 'bg-yellow-100 text-yellow-700' :
                          s.session.level === '400' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {s.session.level}
                        </span>
                      </td>
                      <td className="py-2 text-center text-gray-600">{s.decided}</td>
                      <td className="py-2 text-center text-green-600 font-medium">{s.selected}</td>
                      <td className="py-2 text-center text-red-600">{s.rejected}</td>
                      <td className="py-2 text-center">
                        {s.acceptanceRate !== null ? (
                          <span className={`font-medium ${s.acceptanceRate >= 50 ? 'text-green-600' : s.acceptanceRate >= 30 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {s.acceptanceRate}%
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No session submissions yet</p>
          )}
        </div>
      </div>

      {/* Cities List */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold mb-4">Cities Visited ({uniqueCities})</h3>
        {citiesWithEvents.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {[...new Set(citiesWithEvents.map(c => `${c.city}, ${c.country}`))].sort().map(location => (
              <span key={location} className="text-sm text-gray-600">
                {location}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-sm">No selected events with cities yet</p>
        )}
      </div>
    </div>
  )
}
