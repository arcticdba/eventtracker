import { useState, useEffect, useRef } from 'react'
import { DateFormat } from '../api'

interface Props {
  value: string // ISO format YYYY-MM-DD
  onChange: (value: string) => void
  dateFormat: DateFormat
  className?: string
  required?: boolean
  placeholder?: string
}

interface FormatInfo {
  order: ('Y' | 'M' | 'D')[]
  separator: string
  lengths: number[]
}

function getFormatInfo(format: DateFormat): FormatInfo {
  switch (format) {
    case 'YYYY-MM-DD':
      return { order: ['Y', 'M', 'D'], separator: '-', lengths: [4, 2, 2] }
    case 'YYYY/MM/DD':
      return { order: ['Y', 'M', 'D'], separator: '/', lengths: [4, 2, 2] }
    case 'MM/DD/YYYY':
      return { order: ['M', 'D', 'Y'], separator: '/', lengths: [2, 2, 4] }
    case 'DD/MM/YYYY':
      return { order: ['D', 'M', 'Y'], separator: '/', lengths: [2, 2, 4] }
    case 'DD.MM.YYYY':
      return { order: ['D', 'M', 'Y'], separator: '.', lengths: [2, 2, 4] }
    case 'DD-MM-YYYY':
      return { order: ['D', 'M', 'Y'], separator: '-', lengths: [2, 2, 4] }
    default:
      return { order: ['Y', 'M', 'D'], separator: '-', lengths: [4, 2, 2] }
  }
}

function isoToDisplay(iso: string, format: DateFormat): string {
  if (!iso) return ''
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return iso

  const [, year, month, day] = match
  const { order, separator } = getFormatInfo(format)

  const parts = order.map(part => {
    if (part === 'Y') return year
    if (part === 'M') return month
    return day
  })

  return parts.join(separator)
}

function displayToIso(display: string, format: DateFormat): string {
  const { order, separator } = getFormatInfo(format)
  const parts = display.split(separator)

  if (parts.length !== 3) return ''

  let year = '', month = '', day = ''

  order.forEach((part, i) => {
    if (part === 'Y') year = parts[i]
    else if (part === 'M') month = parts[i]
    else day = parts[i]
  })

  // Validate lengths
  if (year.length !== 4 || month.length !== 2 || day.length !== 2) return ''

  // Validate ranges
  const y = parseInt(year, 10)
  const m = parseInt(month, 10)
  const d = parseInt(day, 10)

  if (isNaN(y) || isNaN(m) || isNaN(d)) return ''
  if (m < 1 || m > 12) return ''
  if (d < 1 || d > 31) return ''

  return `${year}-${month}-${day}`
}

export function DateInput({ value, onChange, dateFormat, className, required, placeholder }: Props) {
  const { separator, lengths } = getFormatInfo(dateFormat)
  const inputRef = useRef<HTMLInputElement>(null)

  // Display value in the user's format
  const [displayValue, setDisplayValue] = useState(() => isoToDisplay(value, dateFormat))

  // Update display when value prop changes (e.g., from parent)
  useEffect(() => {
    const newDisplay = isoToDisplay(value, dateFormat)
    if (newDisplay !== displayValue && value) {
      setDisplayValue(newDisplay)
    }
  }, [value, dateFormat])

  // Generate placeholder from format
  const formatPlaceholder = placeholder || dateFormat

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target
    const cursorPos = input.selectionStart || 0
    let newValue = e.target.value

    // Only allow digits and the separator
    const allowedChars = new RegExp(`[0-9${separator === '.' ? '\\.' : separator}]`, 'g')
    const filtered = newValue.match(allowedChars)?.join('') || ''

    // Remove all separators to work with just digits
    const digitsOnly = filtered.replace(new RegExp(`[${separator === '.' ? '\\.' : separator}]`, 'g'), '')

    // Auto-format with separators
    let formatted = ''
    let digitIndex = 0

    for (let partIndex = 0; partIndex < lengths.length && digitIndex < digitsOnly.length; partIndex++) {
      const partLength = lengths[partIndex]
      const partDigits = digitsOnly.slice(digitIndex, digitIndex + partLength)
      formatted += partDigits
      digitIndex += partDigits.length

      // Add separator if we've completed this part and there are more digits
      if (partDigits.length === partLength && digitIndex < digitsOnly.length && partIndex < lengths.length - 1) {
        formatted += separator
      }
    }

    setDisplayValue(formatted)

    // Convert to ISO and notify parent if complete
    const iso = displayToIso(formatted, dateFormat)
    if (iso) {
      onChange(iso)
    } else if (formatted === '') {
      onChange('')
    }

    // Adjust cursor position after React re-render
    requestAnimationFrame(() => {
      if (inputRef.current) {
        // Calculate new cursor position
        let newCursorPos = cursorPos

        // If we just completed a segment, move past the auto-inserted separator
        const oldDigitsBeforeCursor = displayValue.slice(0, cursorPos).replace(new RegExp(`[${separator === '.' ? '\\.' : separator}]`, 'g'), '').length

        // Find position in new string that corresponds to same digit count
        let digitCount = 0
        for (let i = 0; i <= formatted.length; i++) {
          if (digitCount === oldDigitsBeforeCursor + (newValue.length > displayValue.length ? 1 : 0)) {
            newCursorPos = i
            break
          }
          if (i < formatted.length && formatted[i] !== separator) {
            digitCount++
          }
        }

        inputRef.current.setSelectionRange(newCursorPos, newCursorPos)
      }
    })
  }

  const handleBlur = () => {
    // On blur, try to parse and reformat
    const iso = displayToIso(displayValue, dateFormat)
    if (iso) {
      setDisplayValue(isoToDisplay(iso, dateFormat))
      onChange(iso)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow: backspace, delete, tab, escape, enter, arrows
    if ([8, 46, 9, 27, 13, 37, 38, 39, 40].includes(e.keyCode)) {
      return
    }

    // Allow Ctrl/Cmd + A, C, V, X
    if ((e.ctrlKey || e.metaKey) && [65, 67, 86, 88].includes(e.keyCode)) {
      return
    }

    // Block if not a digit and not the separator
    const char = e.key
    if (!/^\d$/.test(char) && char !== separator) {
      e.preventDefault()
    }

    // Block if already at max length
    const maxLength = lengths.reduce((a, b) => a + b, 0) + 2 // digits + 2 separators
    if (displayValue.length >= maxLength && !/^\d$/.test(char) === false) {
      const input = e.target as HTMLInputElement
      const hasSelection = input.selectionStart !== input.selectionEnd
      if (!hasSelection && displayValue.length >= maxLength) {
        e.preventDefault()
      }
    }
  }

  return (
    <input
      ref={inputRef}
      type="text"
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className={className}
      required={required}
      placeholder={formatPlaceholder}
      autoComplete="off"
    />
  )
}
