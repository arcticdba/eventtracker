import { useEffect, useState } from 'react'
import * as api from '../api'
import { DEFAULT_UI_SETTINGS, UISettings } from '../types'

export function useUISettings() {
  const [settings, setSettings] = useState<UISettings>(DEFAULT_UI_SETTINGS)

  useEffect(() => {
    let active = true
    api.fetchSettings().then(loaded => {
      if (active) setSettings(loaded)
    })
    return () => { active = false }
  }, [])

  const updateSettings = async (next: UISettings) => {
    setSettings(next)
    await api.saveSettings(next)
  }

  return { settings, updateSettings }
}
