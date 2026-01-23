import { useEffect } from 'react'
import { UISettings, DateFormat } from '../api'
import { DATE_FORMAT_OPTIONS } from '../utils/formatDate'

interface SettingsProps {
  settings: UISettings
  onSettingsChange: (settings: UISettings) => void
  onClose: () => void
}

export function Settings({ settings, onSettingsChange, onClose }: SettingsProps) {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold">Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">UI Settings</h3>

          <div className="space-y-3">
            <label className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Show monthly events view</span>
              <input
                type="checkbox"
                checked={settings.showMonthView}
                onChange={e => onSettingsChange({ ...settings, showMonthView: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </label>

            <label className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Show weekly events view</span>
              <input
                type="checkbox"
                checked={settings.showWeekView}
                onChange={e => onSettingsChange({ ...settings, showWeekView: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </label>

            <label className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Show MVP submission features</span>
              <input
                type="checkbox"
                checked={settings.showMvpFeatures}
                onChange={e => onSettingsChange({ ...settings, showMvpFeatures: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </label>
          </div>

          <h3 className="text-sm font-semibold text-gray-800 mt-6 mb-3">Speaker Bandwidth</h3>
          <p className="text-xs text-gray-500 mb-3">
            Set soft limits to help manage your speaking schedule. Set to 0 for no limit.
          </p>

          <div className="space-y-3">
            <label className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Max events per month</span>
              <input
                type="number"
                min="0"
                max="31"
                value={settings.maxEventsPerMonth}
                onChange={e => onSettingsChange({ ...settings, maxEventsPerMonth: parseInt(e.target.value) || 0 })}
                className="w-20 rounded border-gray-300 text-sm px-2 py-1"
              />
            </label>

            <label className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Max events per year</span>
              <input
                type="number"
                min="0"
                max="365"
                value={settings.maxEventsPerYear}
                onChange={e => onSettingsChange({ ...settings, maxEventsPerYear: parseInt(e.target.value) || 0 })}
                className="w-20 rounded border-gray-300 text-sm px-2 py-1"
              />
            </label>
          </div>

          <h3 className="text-sm font-semibold text-gray-800 mt-6 mb-3">Display</h3>

          <div className="space-y-3">
            <label className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Date format</span>
              <select
                value={settings.dateFormat}
                onChange={e => onSettingsChange({ ...settings, dateFormat: e.target.value as DateFormat })}
                className="rounded border-gray-300 text-sm px-2 py-1"
              >
                {DATE_FORMAT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label} ({opt.example})
                  </option>
                ))}
              </select>
            </label>
          </div>

          <h3 className="text-sm font-semibold text-gray-800 mt-6 mb-3">Export & Backup</h3>
          <p className="text-xs text-gray-500 mb-3">
            Download your data for backup or use in other applications.
          </p>

          <div className="space-y-2">
            <div className="flex gap-2">
              <a
                href="/api/export/json"
                download
                className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 text-center"
              >
                Backup All (JSON)
              </a>
            </div>
            <div className="flex gap-2">
              <a
                href="/api/export/events.csv"
                download
                className="flex-1 px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 text-center"
              >
                Events CSV
              </a>
              <a
                href="/api/export/sessions.csv"
                download
                className="flex-1 px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 text-center"
              >
                Sessions CSV
              </a>
              <a
                href="/api/export/submissions.csv"
                download
                className="flex-1 px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 text-center"
              >
                Submissions CSV
              </a>
            </div>
            <div className="flex gap-2">
              <a
                href="/api/export/events.ics"
                download
                className="flex-1 px-3 py-1.5 bg-blue-100 text-blue-700 text-sm rounded hover:bg-blue-200 text-center"
              >
                All Events iCal
              </a>
              <a
                href="/api/export/events.ics?selected=true"
                download
                className="flex-1 px-3 py-1.5 bg-blue-100 text-blue-700 text-sm rounded hover:bg-blue-200 text-center"
              >
                Confirmed Events iCal
              </a>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Tip: Right-click any event to export it individually to your calendar.
            </p>
          </div>
        </div>

        <div className="p-4 border-t bg-gray-50 rounded-b-lg">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
