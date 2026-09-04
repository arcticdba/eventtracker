import { useMemo, useState } from 'react'
import { DateFormat, Event, EventSeries, Session, Submission, SubmissionState } from '../types'
import { parseDateOnly } from '../utils/date'
import { formatDate } from '../utils/formatDate'
import { getCountryFlagOrEmpty } from '../utils/countryFlags'

interface Props { events: Event[]; eventSeries: EventSeries[]; sessions: Session[]; submissions: Submission[]; dateFormat: DateFormat }
type FormatFilter = 'all' | 'in-person' | 'remote'
type EventOutcome = SubmissionState

const outcomeLabels: Record<EventOutcome, string> = { submitted: 'Awaiting decision', selected: 'Accepted', rejected: 'Rejected', declined: 'Declined by you', cancelled: 'Cancelled' }
const outcomeColors: Record<EventOutcome, string> = { submitted: 'bg-amber-500', selected: 'bg-emerald-500', rejected: 'bg-rose-500', declined: 'bg-slate-400', cancelled: 'bg-gray-700' }

const countryRegions: Record<string, string> = {
  'United Kingdom': 'Europe', UK: 'Europe', England: 'Europe', Scotland: 'Europe', Wales: 'Europe',
  Germany: 'Europe', France: 'Europe', Spain: 'Europe', Italy: 'Europe', Netherlands: 'Europe', 'The Netherlands': 'Europe', Belgium: 'Europe', Sweden: 'Europe', Norway: 'Europe', Denmark: 'Europe', Finland: 'Europe', Poland: 'Europe', Austria: 'Europe', Switzerland: 'Europe', Ireland: 'Europe', Portugal: 'Europe', Czechia: 'Europe', Hungary: 'Europe', Romania: 'Europe', Greece: 'Europe', Croatia: 'Europe', Slovenia: 'Europe', Slovakia: 'Europe', Bulgaria: 'Europe', Serbia: 'Europe', Ukraine: 'Europe', Lithuania: 'Europe', Latvia: 'Europe', Estonia: 'Europe', Iceland: 'Europe', Malta: 'Europe',
  'United States': 'North America', USA: 'North America', US: 'North America', Canada: 'North America', Mexico: 'North America', Guatemala: 'North America',
  Brazil: 'South America', Argentina: 'South America', Chile: 'South America', Colombia: 'South America', Peru: 'South America', Venezuela: 'South America', Ecuador: 'South America', Uruguay: 'South America',
  Japan: 'Asia', China: 'Asia', 'South Korea': 'Asia', Korea: 'Asia', India: 'Asia', Singapore: 'Asia', Thailand: 'Asia', Vietnam: 'Asia', Malaysia: 'Asia', Indonesia: 'Asia', Philippines: 'Asia', Taiwan: 'Asia', 'Hong Kong': 'Asia',
  Israel: 'Middle East', UAE: 'Middle East', 'United Arab Emirates': 'Middle East', 'Saudi Arabia': 'Middle East', Qatar: 'Middle East', Turkey: 'Middle East',
  Australia: 'Oceania', 'New Zealand': 'Oceania',
  'South Africa': 'Africa', Egypt: 'Africa', Nigeria: 'Africa', Kenya: 'Africa', Morocco: 'Africa'
}

function isOnlineLocation(value: string): boolean { return value.trim().toLowerCase() === 'online' }
function getRegion(event: Event): string {
  if (event.remote || isOnlineLocation(event.country)) return 'Remote'
  return countryRegions[event.country] || 'Other'
}
function getSeason(event: Event): string {
  const month = parseDateOnly(event.dateStart).getMonth()
  if (month >= 2 && month <= 4) return 'Spring'
  if (month >= 5 && month <= 7) return 'Summer'
  if (month >= 8 && month <= 10) return 'Fall'
  return 'Winter'
}
function getEventOutcome(related: Submission[]): EventOutcome {
  if (related.some(item => item.state === 'selected')) return 'selected'
  if (related.some(item => item.state === 'submitted')) return 'submitted'
  if (related.some(item => item.state === 'rejected')) return 'rejected'
  if (related.some(item => item.state === 'declined')) return 'declined'
  return 'cancelled'
}

export function StatisticsLab({ events, eventSeries, sessions, submissions, dateFormat }: Props) {
  const [year, setYear] = useState('all')
  const [format, setFormat] = useState<FormatFilter>('all')
  const [expandedOutcome, setExpandedOutcome] = useState<EventOutcome | null>(null)
  const [expandedCountry, setExpandedCountry] = useState<string | null>(null)
  const eventById = useMemo(() => new Map(events.map(event => [event.id, event])), [events])
  const sessionById = useMemo(() => new Map(sessions.map(session => [session.id, session])), [sessions])
  const availableYears = useMemo(() => [...new Set(events.map(event => parseDateOnly(event.dateStart).getFullYear()))].sort((a, b) => b - a), [events])

  const eventStats = useMemo(() => {
    const grouped = new Map<string, Submission[]>()
    submissions.forEach(item => grouped.set(item.eventId, [...(grouped.get(item.eventId) ?? []), item]))
    return [...grouped.entries()].map(([eventId, related]) => {
      const event = eventById.get(eventId)
      if (!event || (year !== 'all' && parseDateOnly(event.dateStart).getFullYear() !== Number(year))) return null
      if (format === 'remote' && !event.remote) return null
      if (format === 'in-person' && event.remote) return null
      return { event, related, outcome: getEventOutcome(related) }
    }).filter((item): item is { event: Event; related: Submission[]; outcome: EventOutcome } => item !== null)
      .sort((a, b) => a.event.dateStart.localeCompare(b.event.dateStart) || a.event.name.localeCompare(b.event.name))
  }, [submissions, eventById, year, format])

  const counts = useMemo(() => {
    const result: Record<EventOutcome, number> = { submitted: 0, selected: 0, rejected: 0, declined: 0, cancelled: 0 }
    eventStats.forEach(item => result[item.outcome]++)
    return result
  }, [eventStats])
  const decided = counts.selected + counts.rejected
  const acceptanceRate = decided ? Math.round(counts.selected / decided * 100) : null
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const selectedEvents = eventStats.filter(item => item.outcome === 'selected').map(item => item.event)
  const completedEngagements = selectedEvents.filter(event => parseDateOnly(event.dateEnd || event.dateStart) < today).length
  const upcomingEngagements = selectedEvents.length - completedEngagements

  const countryStats = useMemo(() => {
    const grouped = new Map<string, typeof eventStats>()
    eventStats.forEach(item => {
      const country = item.event.remote || isOnlineLocation(item.event.country) ? 'Online' : item.event.country || 'Unknown'
      grouped.set(country, [...(grouped.get(country) ?? []), item])
    })
    return [...grouped.entries()].map(([country, countryEvents]) => {
      const accepted = countryEvents.filter(item => item.outcome === 'selected').length
      const rejected = countryEvents.filter(item => item.outcome === 'rejected').length
      const pending = countryEvents.filter(item => item.outcome === 'submitted').length
      const decisions = accepted + rejected
      return { country, events: countryEvents, accepted, rejected, pending, decisions, acceptance: decisions ? Math.round(accepted / decisions * 100) : null }
    }).sort((a, b) => b.accepted - a.accepted || b.decisions - a.decisions || a.country.localeCompare(b.country))
  }, [eventStats])

  const seriesStats = useMemo(() => eventSeries.map(series => {
    const instances = eventStats.filter(item => item.event.seriesId === series.id)
    const accepted = instances.filter(item => item.outcome === 'selected').length
    const rejected = instances.filter(item => item.outcome === 'rejected').length
    const pending = instances.filter(item => item.outcome === 'submitted').length
    const decisions = accepted + rejected
    return { series, instances, accepted, rejected, pending, decisions, acceptance: decisions ? Math.round(accepted / decisions * 100) : null }
  }).filter(item => item.instances.length).sort((a, b) => b.accepted - a.accepted || b.decisions - a.decisions || a.series.name.localeCompare(b.series.name)), [eventSeries, eventStats])

  const summarizeGroups = (getGroup: (item: typeof eventStats[number]) => string) => {
    const grouped = new Map<string, typeof eventStats>()
    eventStats.forEach(item => {
      const group = getGroup(item)
      grouped.set(group, [...(grouped.get(group) ?? []), item])
    })
    return [...grouped.entries()].map(([name, groupEvents]) => {
      const accepted = groupEvents.filter(item => item.outcome === 'selected').length
      const rejected = groupEvents.filter(item => item.outcome === 'rejected').length
      const pending = groupEvents.filter(item => item.outcome === 'submitted').length
      const decisions = accepted + rejected
      return { name, total: groupEvents.length, accepted, rejected, pending, acceptance: decisions ? Math.round(accepted / decisions * 100) : null }
    })
  }
  const regionStats = summarizeGroups(item => getRegion(item.event)).sort((a, b) => b.total - a.total || a.name.localeCompare(b.name))
  const seasonOrder = ['Spring', 'Summer', 'Fall', 'Winter']
  const seasonStats = summarizeGroups(item => getSeason(item.event)).sort((a, b) => seasonOrder.indexOf(a.name) - seasonOrder.indexOf(b.name))

  const yearStats = useMemo(() => availableYears.map(itemYear => {
    const yearEventIds = new Set(events.filter(event => parseDateOnly(event.dateStart).getFullYear() === itemYear && (format === 'all' || (format === 'remote' ? event.remote : !event.remote))).map(event => event.id))
    const grouped = new Map<string, Submission[]>()
    submissions.filter(item => yearEventIds.has(item.eventId)).forEach(item => grouped.set(item.eventId, [...(grouped.get(item.eventId) ?? []), item]))
    const outcomes = [...grouped.values()].map(getEventOutcome)
    const accepted = outcomes.filter(item => item === 'selected').length
    const rejected = outcomes.filter(item => item === 'rejected').length
    const pending = outcomes.filter(item => item === 'submitted').length
    const decisions = accepted + rejected
    return { year: itemYear, total: outcomes.length, accepted, rejected, pending, acceptance: decisions ? Math.round(accepted / decisions * 100) : null }
  }), [availableYears, events, submissions, format])

  const countries = new Set(selectedEvents.filter(event => !event.remote && event.country && !isOnlineLocation(event.country)).map(event => event.country)).size
  const cities = new Set(selectedEvents.filter(event => !event.remote && event.city && !isOnlineLocation(event.city) && !isOnlineLocation(event.country)).map(event => event.city)).size
  const remoteEngagements = selectedEvents.filter(event => event.remote).length
  const maxYearTotal = Math.max(1, ...yearStats.map(item => item.total))
  const visitedCities = useMemo(() => {
    const grouped = new Map<string, Event[]>()
    selectedEvents.filter(event => !event.remote && event.city && !isOnlineLocation(event.city) && !isOnlineLocation(event.country)).forEach(event => {
      const location = event.country ? `${event.city}, ${event.country}` : event.city
      grouped.set(location, [...(grouped.get(location) ?? []), event])
    })
    return [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [selectedEvents])
  const outcomeEvents = expandedOutcome ? eventStats.filter(item => item.outcome === expandedOutcome) : []

  const eventDetails = (item: typeof eventStats[number]) => <div key={item.event.id} className="border-b border-gray-200 py-3 first:pt-0 last:border-0 last:pb-0">
    <div className="mb-1 flex flex-col sm:flex-row sm:items-baseline sm:justify-between"><span className="font-semibold text-gray-900">{item.event.name}</span><span className="text-xs text-gray-500">{formatDate(item.event.dateStart, dateFormat)} · {item.event.remote ? 'Online' : [item.event.city, item.event.country].filter(Boolean).join(', ')}</span></div>
    <div className="space-y-1 pl-3">{item.related.map(submission => { const session = sessionById.get(submission.sessionId); const alias = submission.nameUsed && submission.nameUsed !== session?.name ? submission.nameUsed : ''; return <div key={submission.id} className="flex flex-col text-sm text-gray-700 sm:flex-row sm:justify-between"><span>{session?.name ?? 'Unknown session'}{alias && <span className="ml-2 text-xs italic text-gray-500">submitted as “{alias}”</span>}</span><span className="text-xs text-gray-500">{outcomeLabels[submission.state]}</span></div> })}</div>
  </div>

  return <div className="space-y-5 pb-8">
    <div className="rounded-xl bg-gradient-to-r from-slate-900 to-blue-900 p-5 text-white shadow-lg"><div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><div className="mb-1 text-xs font-semibold uppercase tracking-widest text-blue-200">Experimental view</div><h2 className="text-2xl font-bold">Event performance</h2><p className="mt-1 text-sm text-blue-100">How often do event submissions turn into speaking engagements?</p></div><div className="flex flex-wrap gap-2 text-sm text-gray-900"><select value={year} onChange={event => setYear(event.target.value)} className="rounded-lg border-0 px-3 py-2"><option value="all">All event years</option>{availableYears.map(item => <option key={item} value={item}>{item}</option>)}</select><select value={format} onChange={event => setFormat(event.target.value as FormatFilter)} className="rounded-lg border-0 px-3 py-2"><option value="all">All formats</option><option value="in-person">In person</option><option value="remote">Remote</option></select></div></div></div>

    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5"><Metric label="Events submitted" value={eventStats.length} detail="Each event counted once" /><Metric label="Events accepted" value={counts.selected} detail={`${counts.submitted} awaiting`} color="text-emerald-600" /><Metric label="Events rejected" value={counts.rejected} detail={`${decided} decided events`} color="text-rose-600" /><Metric label="Acceptance" value={acceptanceRate === null ? '—' : `${acceptanceRate}%`} detail={decided ? `${counts.selected} of ${decided} decided events` : 'No decisions yet'} color="text-blue-600" /><Metric label="Engagements" value={selectedEvents.length} detail={`${completedEngagements} completed · ${upcomingEngagements} upcoming`} color="text-purple-600" /></div>

    <section className="rounded-xl bg-white p-4 shadow"><div className="mb-4"><h3 className="text-lg font-semibold">Event outcomes</h3><p className="text-sm text-gray-500">Every event appears once. Expand an outcome to see its events and submitted sessions.</p></div><div className="grid gap-2 sm:grid-cols-5">{(Object.keys(outcomeLabels) as EventOutcome[]).map(outcome => <button key={outcome} onClick={() => setExpandedOutcome(expandedOutcome === outcome ? null : outcome)} className={`rounded-lg border p-3 text-left transition hover:border-blue-300 ${expandedOutcome === outcome ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}><div className="flex items-center gap-2 text-sm text-gray-600"><span className={`h-2.5 w-2.5 rounded-full ${outcomeColors[outcome]}`} />{outcomeLabels[outcome]}</div><div className="mt-1 text-2xl font-bold">{counts[outcome]}</div></button>)}</div>{expandedOutcome && <div className="mt-4 max-h-72 overflow-y-auto rounded-lg bg-gray-50 p-3">{outcomeEvents.length ? outcomeEvents.map(eventDetails) : <div className="text-sm text-gray-500">No events with this outcome.</div>}</div>}</section>

    <section className="rounded-xl bg-white p-4 shadow"><h3 className="text-lg font-semibold">Acceptance by country</h3><p className="mb-4 text-sm text-gray-500">Accepted events divided by accepted plus rejected events. Click a country to see its events.</p><div className="max-h-[32rem] overflow-y-auto">{countryStats.map(item => <div key={item.country} className="border-b last:border-0"><button onClick={() => setExpandedCountry(expandedCountry === item.country ? null : item.country)} className={`grid w-full grid-cols-[minmax(0,1fr)_auto] gap-3 py-3 text-left ${expandedCountry === item.country ? 'text-blue-800' : ''}`}><div className="min-w-0"><div className="font-medium">{item.country !== 'Online' && getCountryFlagOrEmpty(item.country)}{item.country !== 'Online' && getCountryFlagOrEmpty(item.country) ? ' ' : ''}{item.country}</div><div className="text-xs text-gray-400">{item.events.length} submitted event{item.events.length === 1 ? '' : 's'}</div><div className="mt-1 text-xs"><span className="font-medium text-emerald-600">{item.accepted} accepted</span><span className="text-gray-400"> · {item.rejected} rejected · {item.pending} pending</span></div></div><div className="self-center text-right"><div className="text-lg font-bold">{item.acceptance === null ? '—' : `${item.acceptance}%`}</div><div className="whitespace-nowrap text-xs text-gray-400">{item.decisions ? `${item.accepted} of ${item.decisions}` : 'no decisions'}</div></div></button>{expandedCountry === item.country && <div className="mb-3 rounded-lg bg-blue-50 px-3 py-2">{item.events.map(eventItem => <div key={eventItem.event.id} className="flex flex-col gap-2 border-b border-blue-100 py-2 first:pt-0 last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><div className="font-medium text-gray-900">{eventItem.event.name}</div><div className="text-xs text-gray-500">{formatDate(eventItem.event.dateStart, dateFormat)}{eventItem.event.city && !isOnlineLocation(eventItem.event.city) ? ` · ${eventItem.event.city}` : ''}</div></div><OutcomeBadge outcome={eventItem.outcome} /></div>)}</div>}</div>)}{!countryStats.length && <div className="py-8 text-center text-sm text-gray-500">No countries match these filters.</div>}</div></section>

    <div className="grid gap-5 lg:grid-cols-2">
      <GroupBreakdown title="Events by region" description="Submitted event performance grouped by geographic region." stats={regionStats} />
      <GroupBreakdown title="Events by season" description="Submitted event performance grouped by event start date." stats={seasonStats} />
    </div>

    <section className="rounded-xl bg-white p-4 shadow"><h3 className="text-lg font-semibold">Acceptance by event series</h3><p className="mb-4 text-sm text-gray-500">Performance across recurring editions. Each event instance counts once.</p>{seriesStats.length ? <div className="grid gap-3 md:grid-cols-2">{seriesStats.map(item => <div key={item.series.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 rounded-lg border border-gray-200 p-3"><div className="min-w-0"><div className="font-semibold">{item.series.name}</div><div className="text-xs text-gray-400">{item.instances.length} submitted edition{item.instances.length === 1 ? '' : 's'}</div><div className="mt-1 text-xs"><span className="font-medium text-emerald-600">{item.accepted} accepted</span><span className="text-gray-400"> · {item.rejected} rejected · {item.pending} pending</span></div><div className="mt-1 truncate text-xs text-gray-400" title={item.instances.map(instance => instance.event.name).join('\n')}>{item.instances.map(instance => instance.event.name).join(' · ')}</div></div><div className="self-center text-right"><div className="text-xl font-bold text-blue-700">{item.acceptance === null ? '—' : `${item.acceptance}%`}</div><div className="whitespace-nowrap text-xs text-gray-400">{item.decisions ? `${item.accepted} of ${item.decisions}` : 'no decisions'}</div></div></div>)}</div> : <div className="rounded-lg bg-gray-50 py-6 text-center text-sm text-gray-500">Assign a series in the event editor to compare recurring editions.</div>}</section>

    <div className="grid gap-5 lg:grid-cols-3"><section className="rounded-xl bg-white p-4 shadow lg:col-span-2"><h3 className="text-lg font-semibold">Performance by event year</h3><p className="mb-4 text-sm text-gray-500">Every event is counted once in its start year.</p><div className="space-y-3">{yearStats.map(item => <button key={item.year} onClick={() => setYear(String(item.year))} className="grid w-full grid-cols-[3rem_1fr_5rem] items-center gap-3 text-left"><span className="text-sm font-medium">{item.year}</span><div className="h-7 overflow-hidden rounded bg-gray-100"><div className="flex h-full" style={{ width: `${item.total / maxYearTotal * 100}%` }}><div className="bg-emerald-500" style={{ width: `${item.total ? item.accepted / item.total * 100 : 0}%` }} /><div className="bg-rose-400" style={{ width: `${item.total ? item.rejected / item.total * 100 : 0}%` }} /><div className="bg-amber-300" style={{ width: `${item.total ? item.pending / item.total * 100 : 0}%` }} /><div className="flex-1 bg-gray-300" /></div></div><span className="text-right text-sm font-semibold">{item.acceptance === null ? '—' : `${item.acceptance}%`}</span></button>)}</div></section><section className="rounded-xl bg-white p-4 shadow"><h3 className="text-lg font-semibold">Speaking footprint</h3><p className="mb-4 text-sm text-gray-500">Based on accepted events in this view.</p><div className="grid grid-cols-2 gap-3"><SmallMetric label="Unique events" value={selectedEvents.length} /><SmallMetric label="Countries" value={countries} /><SmallMetric label="Cities" value={cities} /><SmallMetric label="Remote" value={remoteEngagements} /></div><div className="mt-4 border-t pt-4"><h4 className="mb-2 text-sm font-semibold">Cities visited ({visitedCities.length})</h4>{visitedCities.length ? <div className="flex max-h-44 flex-wrap content-start gap-2 overflow-y-auto">{visitedCities.map(([location, locationEvents]) => { const country = locationEvents[0]?.country ?? ''; return <span key={location} className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-700" title={locationEvents.map(event => `${event.name} (${formatDate(event.dateStart, dateFormat)})`).join('\n')}>{getCountryFlagOrEmpty(country)}{getCountryFlagOrEmpty(country) && ' '}{location} {locationEvents.length > 1 && <strong>×{locationEvents.length}</strong>}</span> })}</div> : <p className="text-sm text-gray-400">No in-person cities in this view.</p>}</div></section></div>
    <p className="text-center text-xs text-gray-400">Statistics Lab is an experimental alternative. The original Statistics tab remains unchanged.</p>
  </div>
}

function Metric({ label, value, detail, color = 'text-gray-900' }: { label: string; value: string | number; detail: string; color?: string }) { return <div className="rounded-xl bg-white p-4 shadow"><div className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</div><div className={`mt-1 text-3xl font-bold ${color}`}>{value}</div><div className="mt-1 text-xs text-gray-500">{detail}</div></div> }
function SmallMetric({ label, value }: { label: string; value: number }) { return <div className="rounded-lg bg-gray-50 p-3"><div className="text-2xl font-bold text-blue-700">{value}</div><div className="text-xs text-gray-500">{label}</div></div> }
function OutcomeBadge({ outcome }: { outcome: EventOutcome }) {
  const colors: Record<EventOutcome, string> = { selected: 'bg-emerald-100 text-emerald-800 ring-emerald-200', rejected: 'bg-rose-100 text-rose-800 ring-rose-200', submitted: 'bg-amber-100 text-amber-800 ring-amber-200', declined: 'bg-slate-100 text-slate-700 ring-slate-200', cancelled: 'bg-gray-200 text-gray-700 ring-gray-300' }
  return <span className={`inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wide ring-1 ${colors[outcome]}`}><span className={`h-2 w-2 rounded-full ${outcomeColors[outcome]}`} />{outcomeLabels[outcome]}</span>
}
function GroupBreakdown({ title, description, stats }: { title: string; description: string; stats: Array<{ name: string; total: number; accepted: number; rejected: number; pending: number; acceptance: number | null }> }) {
  const maxTotal = Math.max(1, ...stats.map(item => item.total))
  return <section className="rounded-xl bg-white p-4 shadow"><h3 className="text-lg font-semibold">{title}</h3><p className="mb-4 text-sm text-gray-500">{description}</p>{stats.length ? <div className="space-y-3">{stats.map(item => <div key={item.name}><div className="mb-1 flex items-baseline justify-between gap-3"><span className="font-medium text-gray-800">{item.name}</span><span className="text-sm font-bold">{item.acceptance === null ? '—' : `${item.acceptance}%`}</span></div><div className="h-5 overflow-hidden rounded-full bg-gray-100"><div className="flex h-full" style={{ width: `${item.total / maxTotal * 100}%` }}><div className="bg-emerald-500" style={{ width: `${item.total ? item.accepted / item.total * 100 : 0}%` }} /><div className="bg-rose-400" style={{ width: `${item.total ? item.rejected / item.total * 100 : 0}%` }} /><div className="bg-amber-300" style={{ width: `${item.total ? item.pending / item.total * 100 : 0}%` }} /><div className="flex-1 bg-gray-300" /></div></div><div className="mt-1 text-xs text-gray-400">{item.total} event{item.total === 1 ? '' : 's'} · {item.accepted} accepted · {item.rejected} rejected · {item.pending} pending</div></div>)}</div> : <div className="py-6 text-center text-sm text-gray-500">No events match these filters.</div>}</section>
}
