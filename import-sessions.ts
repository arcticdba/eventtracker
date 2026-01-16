import { readFileSync } from 'fs'
import { parseStringPromise } from 'xml2js'

interface XMLSession {
  Retired?: string[]
  SessionID?: string[]
  SessionName?: string[]
  SessionAbstract?: string[]
  SessionLevel?: string[]
  Goals?: string[]
  'Elevator_x0020_pitch'?: string[]
  Summary?: string[]
}

interface XMLRoot {
  dataroot: {
    Sessions: XMLSession[]
  }
}

async function importSessions() {
  // Read and parse XML
  const xmlContent = readFileSync('./sessions.xml', 'utf-8')
  const parsed: XMLRoot = await parseStringPromise(xmlContent)

  const sessions = parsed.dataroot.Sessions

  console.log(`Found ${sessions.length} sessions to import`)

  let imported = 0
  let skipped = 0

  for (const session of sessions) {
    const name = session.SessionName?.[0]?.trim()
    if (!name) {
      console.log('Skipping session with no name')
      skipped++
      continue
    }

    const sessionData = {
      name,
      level: session.SessionLevel?.[0] || '100',
      abstract: session.SessionAbstract?.[0]?.trim() || '',
      summary: session.Summary?.[0]?.trim() || '',
      goals: session.Goals?.[0]?.trim() || '',
      elevatorPitch: session['Elevator_x0020_pitch']?.[0]?.trim() || '',
      retired: session.Retired?.[0] === '1'
    }

    try {
      const response = await fetch('http://localhost:3001/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData)
      })

      if (response.ok) {
        console.log(`✓ Imported: ${name}`)
        imported++
      } else {
        console.log(`✗ Failed to import: ${name}`)
        skipped++
      }
    } catch (error) {
      console.log(`✗ Error importing: ${name}`, error)
      skipped++
    }
  }

  console.log(`\nDone! Imported: ${imported}, Skipped: ${skipped}`)
}

importSessions().catch(console.error)
