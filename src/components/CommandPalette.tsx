import { useState, useEffect, useCallback, useRef } from 'react'
import { Event, Submission } from '../types'
import { computeEventState } from '../utils/computeEventState'

interface Command {
  id: string
  label: string
  shortcut?: string
  action: () => void
  category: 'navigation' | 'action' | 'filter'
}

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
  events: Event[]
  submissions: Submission[]
  selectedEvent: Event | null
  onNewEvent: () => void
  onNewSession: () => void
  onAddSessionToEvent: () => void
  onOpenSettings: () => void
  onSelectEvent: (event: Event) => void
  onTabChange: (tab: 'events' | 'sessions' | 'statistics') => void
}

export function CommandPalette({
  isOpen,
  onClose,
  events,
  submissions,
  selectedEvent,
  onNewEvent,
  onNewSession,
  onAddSessionToEvent,
  onOpenSettings,
  onSelectEvent,
  onTabChange
}: CommandPaletteProps) {
  const [search, setSearch] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Get events by state for quick navigation
  const pendingEvents = events.filter(e => computeEventState(e.id, submissions) === 'pending')
  const selectedEvents = events.filter(e => computeEventState(e.id, submissions) === 'selected')
  const upcomingEvents = events
    .filter(e => {
      const date = new Date(e.dateStart)
      date.setHours(0, 0, 0, 0)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return date >= today
    })
    .sort((a, b) => a.dateStart.localeCompare(b.dateStart))

  // Build commands list
  const commands: Command[] = [
    // Actions
    { id: 'new-event', label: 'New Event', shortcut: 'N', category: 'action', action: () => { onNewEvent(); onClose() } },
    { id: 'new-session', label: 'New Session', shortcut: 'S', category: 'action', action: () => { onNewSession(); onClose() } },
    ...(selectedEvent ? [{
      id: 'add-session-to-event',
      label: `Submit Session to ${selectedEvent.name}`,
      shortcut: 'U',
      category: 'action' as const,
      action: () => { onAddSessionToEvent(); onClose() }
    }] : []),
    { id: 'settings', label: 'Open Settings', shortcut: ',', category: 'action', action: () => { onOpenSettings(); onClose() } },
    { id: 'export', label: 'Export All Data (JSON)', category: 'action', action: () => { window.location.href = '/api/export/json'; onClose() } },

    // Navigation
    { id: 'tab-events', label: 'Go to Events', category: 'navigation', action: () => { onTabChange('events'); onClose() } },
    { id: 'tab-sessions', label: 'Go to Sessions', category: 'navigation', action: () => { onTabChange('sessions'); onClose() } },
    { id: 'tab-stats', label: 'Go to Statistics', category: 'navigation', action: () => { onTabChange('statistics'); onClose() } },

    // Quick jumps
    ...(pendingEvents.length > 0 ? [{
      id: 'next-pending',
      label: `Jump to Pending Event (${pendingEvents.length})`,
      category: 'navigation' as const,
      action: () => {
        onTabChange('events')
        onSelectEvent(pendingEvents[0])
        onClose()
      }
    }] : []),
    ...(selectedEvents.length > 0 ? [{
      id: 'next-selected',
      label: `Jump to Selected Event (${selectedEvents.length})`,
      category: 'navigation' as const,
      action: () => {
        onTabChange('events')
        onSelectEvent(selectedEvents[0])
        onClose()
      }
    }] : []),
    ...(upcomingEvents.length > 0 ? [{
      id: 'next-upcoming',
      label: `Jump to Next Upcoming Event`,
      category: 'navigation' as const,
      action: () => {
        onTabChange('events')
        onSelectEvent(upcomingEvents[0])
        onClose()
      }
    }] : []),

    // Event quick access (first 5 events matching search)
    ...events
      .filter(e => e.name.toLowerCase().includes(search.toLowerCase()) && search.length > 0)
      .slice(0, 5)
      .map(e => ({
        id: `event-${e.id}`,
        label: `→ ${e.name}`,
        category: 'navigation' as const,
        action: () => {
          onTabChange('events')
          onSelectEvent(e)
          onClose()
        }
      }))
  ]

  // Filter commands based on search
  const filteredCommands = commands.filter(cmd =>
    cmd.label.toLowerCase().includes(search.toLowerCase())
  )

  // Reset selection when search changes
  useEffect(() => {
    setSelectedIndex(0)
  }, [search])

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setSearch('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [isOpen])

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selectedElement = listRef.current.querySelector(`[data-index="${selectedIndex}"]`)
      selectedElement?.scrollIntoView({ block: 'nearest' })
    }
  }, [selectedIndex])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(i => Math.min(i + 1, filteredCommands.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(i => Math.max(i - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action()
        }
        break
      case 'Escape':
        e.preventDefault()
        onClose()
        break
    }
  }, [filteredCommands, selectedIndex, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center pt-[20vh] z-50" onClick={onClose}>
      <div
        className="bg-white rounded-lg shadow-2xl w-full max-w-lg overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-3 border-b">
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search..."
            className="w-full px-3 py-2 text-lg outline-none"
          />
        </div>

        <div ref={listRef} className="max-h-80 overflow-y-auto">
          {filteredCommands.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No commands found</div>
          ) : (
            <>
              {['action', 'navigation', 'filter'].map(category => {
                const categoryCommands = filteredCommands.filter(c => c.category === category)
                if (categoryCommands.length === 0) return null

                return (
                  <div key={category}>
                    <div className="px-3 py-1.5 text-xs font-medium text-gray-400 uppercase bg-gray-50">
                      {category === 'action' ? 'Actions' : category === 'navigation' ? 'Navigation' : 'Filters'}
                    </div>
                    {categoryCommands.map(cmd => {
                      const index = filteredCommands.indexOf(cmd)
                      return (
                        <div
                          key={cmd.id}
                          data-index={index}
                          onClick={() => cmd.action()}
                          className={`px-3 py-2 cursor-pointer flex items-center justify-between ${
                            index === selectedIndex ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'
                          }`}
                        >
                          <span>{cmd.label}</span>
                          {cmd.shortcut && (
                            <kbd className="px-1.5 py-0.5 text-xs bg-gray-100 rounded border">
                              ⌘{cmd.shortcut}
                            </kbd>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </>
          )}
        </div>

        <div className="p-2 border-t bg-gray-50 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border">↑↓</kbd>
            <span>navigate</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border">↵</kbd>
            <span>select</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border">esc</kbd>
            <span>close</span>
          </div>
        </div>
      </div>
    </div>
  )
}
