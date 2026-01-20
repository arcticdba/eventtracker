interface UISettings {
  showMonthView: boolean
  showWeekView: boolean
  showMvpFeatures: boolean
}

interface SettingsProps {
  settings: UISettings
  onSettingsChange: (settings: UISettings) => void
  onClose: () => void
}

export function Settings({ settings, onSettingsChange, onClose }: SettingsProps) {
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

export type { UISettings }
