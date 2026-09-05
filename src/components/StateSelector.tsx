import { SubmissionState } from '../types'
import { submissionBadgeStyles } from '../ui/styles'

interface Props {
  value: SubmissionState
  onChange: (state: SubmissionState) => void
}

export function StateSelector({ value, onChange }: Props) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value as SubmissionState)}
      className={`cursor-pointer rounded-lg px-2 py-1 text-sm font-medium ring-1 ${submissionBadgeStyles[value]}`}
    >
      <option value="submitted">Submitted</option>
      <option value="selected">Selected</option>
      <option value="rejected">Rejected</option>
      <option value="declined">Declined</option>
      <option value="cancelled">Cancelled</option>
    </select>
  )
}
