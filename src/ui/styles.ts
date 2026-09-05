import { EventState, SubmissionState } from '../types'

export const submissionBadgeStyles: Record<SubmissionState, string> = {
  submitted: 'bg-amber-100 text-amber-800 ring-amber-200',
  selected: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
  rejected: 'bg-rose-100 text-rose-800 ring-rose-200',
  declined: 'bg-slate-100 text-slate-700 ring-slate-200',
  cancelled: 'bg-gray-200 text-gray-700 ring-gray-300'
}

export const submissionCardStyles: Record<SubmissionState, string> = {
  submitted: 'border-amber-200 bg-amber-50/60',
  selected: 'border-emerald-200 bg-emerald-50/70',
  rejected: 'border-rose-200 bg-rose-50/60',
  declined: 'border-slate-200 bg-slate-50',
  cancelled: 'border-gray-300 bg-gray-100/80'
}

export const submissionDotStyles: Record<SubmissionState, string> = {
  submitted: 'bg-amber-500', selected: 'bg-emerald-500', rejected: 'bg-rose-500',
  declined: 'bg-slate-400', cancelled: 'bg-gray-600'
}

export const eventCardStyles: Record<EventState, string> = {
  selected: 'border-emerald-200 bg-emerald-50',
  rejected: 'border-rose-200 bg-rose-50',
  pending: 'border-amber-200 bg-amber-50',
  declined: 'border-slate-200 bg-slate-50',
  cancelled: 'border-gray-300 bg-gray-100',
  none: 'border-slate-200 bg-white'
}

export const eventDotStyles: Record<EventState, string> = {
  selected: 'bg-emerald-500', rejected: 'bg-rose-500', pending: 'bg-amber-500',
  declined: 'bg-slate-400', cancelled: 'bg-gray-600', none: 'bg-slate-300'
}
