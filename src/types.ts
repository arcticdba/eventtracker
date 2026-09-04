export type SubmissionState = 'submitted' | 'selected' | 'rejected' | 'declined' | 'cancelled'

export type TravelType = 'flight' | 'train' | 'bus' | 'car' | 'other'

export interface TravelBooking {
  id: string
  type: TravelType
  reference: string
}

export interface HotelBooking {
  id: string
  name: string
  reference: string
}

export interface Event {
  id: string
  name: string
  country: string
  city: string
  dateStart: string
  dateEnd: string
  remote: boolean
  url: string
  callForContentUrl: string
  callForContentLastDate: string
  loginTool: string
  travel: TravelBooking[]
  hotels: HotelBooking[]
  eventHandlesTravel: boolean
  eventHandlesHotel: boolean
  mvpSubmission: boolean
  notes: string
  seriesId?: string
}

export interface EventSeries {
  id: string
  name: string
}

export type TargetAudience = 'Developer' | 'IT Pro' | 'Business Decision Maker' | 'Technical Decision Maker' | 'Student' | 'Other'

export type SessionType = 'Session (45-60 min)' | 'Workshop (full day)' | 'Short session (20 min)' | 'Lightning Talk (5-10 min)' | 'Keynote'

export interface Session {
  id: string
  name: string
  alternateNames: string[]
  sessionType: SessionType
  level: string
  abstract: string
  summary: string
  goals: string
  elevatorPitch: string
  retired: boolean
  materialsUrl: string
  targetAudience: TargetAudience[]
  primaryTechnology: string
  additionalTechnology: string
  equipmentNotes: string
}

export interface Submission {
  id: string
  sessionId: string
  eventId: string
  state: SubmissionState
  nameUsed: string
  notes: string
}

export type EventState = 'selected' | 'rejected' | 'declined' | 'cancelled' | 'pending' | 'none'

export interface CalendarSelection {
  year: number
  month: number
}

export type DateFormat = 'YYYY-MM-DD' | 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'DD.MM.YYYY' | 'DD-MM-YYYY' | 'YYYY/MM/DD'

export interface UISettings {
  showMonthView: boolean
  showWeekView: boolean
  showMvpFeatures: boolean
  showSessionPerformance: boolean
  maxEventsPerMonth: number
  maxEventsPerYear: number
  dateFormat: DateFormat
}

export const DEFAULT_UI_SETTINGS: UISettings = {
  showMonthView: true,
  showWeekView: true,
  showMvpFeatures: true,
  showSessionPerformance: true,
  maxEventsPerMonth: 0,
  maxEventsPerYear: 0,
  dateFormat: 'YYYY-MM-DD'
}
