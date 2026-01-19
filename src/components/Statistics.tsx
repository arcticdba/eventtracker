import { useState } from 'react'
import { Event, Submission } from '../types'

interface Props {
  events: Event[]
  submissions: Submission[]
}

// Map country names to regions
const countryToRegion: Record<string, string> = {
  // Europe
  'United Kingdom': 'Europe', 'UK': 'Europe', 'England': 'Europe', 'Scotland': 'Europe', 'Wales': 'Europe',
  'Germany': 'Europe', 'France': 'Europe', 'Spain': 'Europe', 'Italy': 'Europe', 'Netherlands': 'Europe',
  'The Netherlands': 'Europe', 'Belgium': 'Europe', 'Sweden': 'Europe', 'Norway': 'Europe', 'Denmark': 'Europe',
  'Finland': 'Europe', 'Poland': 'Europe', 'Austria': 'Europe', 'Switzerland': 'Europe', 'Ireland': 'Europe',
  'Portugal': 'Europe', 'Czech Republic': 'Europe', 'Czechia': 'Europe', 'Hungary': 'Europe', 'Romania': 'Europe',
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

export function Statistics({ events, submissions }: Props) {
  const [selectedYear, setSelectedYear] = useState<number | null>(null)

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
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10)

  // Cities with events (excluding remote)
  const citiesWithEvents = eventsWithSelected
    .filter(e => e.city && !e.remote)
    .map(e => ({ city: e.city, country: e.country, name: e.name, date: e.dateStart }))

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
                .sort((a, b) => b[1] - a[1])
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
                    ? `${data.count} event${data.count !== 1 ? 's' : ''}:\n${data.events.map(e => `${e.name} (${e.date})`).join('\n')}`
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
                title={data.events.map(e => `${e.name} (${e.date})`).join('\n')}
              >
                {country}: <strong>{data.count}</strong>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-sm">No selected events yet</p>
        )}
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
