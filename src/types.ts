export type SubmissionState = 'submitted' | 'selected' | 'rejected' | 'declined'

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
  callForContentUrl: string
  callForContentLastDate: string
  loginTool: string
  travel: TravelBooking[]
  hotels: HotelBooking[]
  mvpSubmission: boolean
}

export interface Session {
  id: string
  name: string
  alternateNames: string[]
  level: string
  abstract: string
  summary: string
  goals: string
  elevatorPitch: string
  retired: boolean
}

export interface Submission {
  id: string
  sessionId: string
  eventId: string
  state: SubmissionState
  nameUsed: string
}

export type EventState = 'selected' | 'rejected' | 'declined' | 'pending' | 'none'
