import { SubmissionState } from '../types'

interface Props {
  value: SubmissionState
  onChange: (state: SubmissionState) => void
}

const stateColors: Record<SubmissionState, string> = {
  submitted: 'bg-blue-100 text-blue-800',
  selected: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  declined: 'bg-gray-100 text-gray-800'
}

export function StateSelector({ value, onChange }: Props) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value as SubmissionState)}
      className={`px-2 py-1 rounded text-sm font-medium cursor-pointer ${stateColors[value]}`}
    >
      <option value="submitted">Submitted</option>
      <option value="selected">Selected</option>
      <option value="rejected">Rejected</option>
      <option value="declined">Declined</option>
    </select>
  )
}
