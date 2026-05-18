import { useMemo, useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'

type Schedule = {
  id: string
  date: string // ISO date yyyy-mm-dd
  title: string
  description?: string
}

function formatDateISO(d: Date) {
  return d.toISOString().slice(0, 10)
}

function buildMonthGrid(year: number, month: number) {
  const first = new Date(year, month, 1)
  const startDay = first.getDay() // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const weeks: Array<Array<{ day: number | null; iso?: string }>> = []
  let week: Array<{ day: number | null; iso?: string }> = []
  // fill leading blanks
  for (let i = 0; i < startDay; i++) week.push({ day: null })
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = new Date(year, month, d).toISOString().slice(0, 10)
    week.push({ day: d, iso })
    if (week.length === 7) {
      weeks.push(week)
      week = []
    }
  }
  while (week.length < 7) {
    week.push({ day: null })
  }
  weeks.push(week)
  return weeks
}

function App() {
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState<string | null>(formatDateISO(today))
  const [modalOpen, setModalOpen] = useState(false)
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  const monthGrid = useMemo(() => buildMonthGrid(viewYear, viewMonth), [viewYear, viewMonth])

  function openAddModal(dateIso?: string) {
    setSelectedDate(dateIso ?? formatDateISO(new Date(viewYear, viewMonth, 1)))
    setTitle('')
    setDescription('')
    setModalOpen(true)
  }

  function saveSchedule() {
    if (!selectedDate) return
    const newItem: Schedule = {
      id: Math.random().toString(36).slice(2, 9),
      date: selectedDate,
      title: title || 'Untitled',
      description: description || undefined,
    }
    setSchedules((s) => [...s, newItem])
    setModalOpen(false)
  }

  function eventsFor(dateIso: string) {
    return schedules.filter((s) => s.date === dateIso)
  }

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear((y) => y - 1)
    } else setViewMonth((m) => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear((y) => y + 1)
    } else setViewMonth((m) => m + 1)
  }

  function connectGoogle() {
    // Placeholder: do not guess OAuth URLs here. Replace with real flow later.
    alert('Google Calendar integration not implemented. Provide OAuth flow URL to complete this action.')
  }
  function connectMicrosoft() {
    alert('Microsoft Calendar integration not implemented. Provide OAuth flow URL to complete this action.')
  }

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <header style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 18 }}>
        <img src={heroImg} width={64} height={64} alt="logo" />
        <h1 style={{ margin: 0 }}>Simple Calendar</h1>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button onClick={connectGoogle}>Connect Google Calendar</button>
          <button onClick={connectMicrosoft}>Connect Microsoft Calendar</button>
        </div>
      </header>

      <section style={{ display: 'flex', gap: 24 }}>
        <div style={{ minWidth: 320 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <button onClick={prevMonth}>&lt;</button>
            <strong style={{ width: 200, textAlign: 'center' }}>{viewYear} - {viewMonth + 1}</strong>
            <button onClick={nextMonth}>&gt;</button>
            <button style={{ marginLeft: 'auto' }} onClick={() => openAddModal(selectedDate ?? undefined)}>Add schedule</button>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                  <th key={d} style={{ padding: 6, borderBottom: '1px solid #ddd', textAlign: 'center' }}>{d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {monthGrid.map((week, wi) => (
                <tr key={wi}>
                  {week.map((cell, ci) => {
                    const isSelected = cell.iso === selectedDate
                    const events = cell.iso ? eventsFor(cell.iso) : []
                    return (
                      <td key={ci} style={{ verticalAlign: 'top', height: 80, borderRight: '1px solid #f3f3f3', padding: 6 }}>
                        {cell.day ? (
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <button onClick={() => setSelectedDate(cell.iso ?? null)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontWeight: isSelected ? '700' : '400' }}>{cell.day}</button>
                              <button onClick={() => openAddModal(cell.iso)} style={{ fontSize: 12 }}>+ add</button>
                            </div>
                            <div style={{ marginTop: 6 }}>
                              {events.slice(0, 2).map((e) => (
                                <div key={e.id} style={{ background: '#eef', padding: '2px 4px', borderRadius: 4, marginBottom: 4, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.title}</div>
                              ))}
                              {events.length > 2 && <div style={{ fontSize: 11, color: '#666' }}>+{events.length - 2} more</div>}
                            </div>
                          </div>
                        ) : null}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <aside style={{ width: 320 }}>
          <h3 style={{ marginTop: 0 }}>Selected date</h3>
          <div style={{ padding: 12, border: '1px solid #eee', borderRadius: 6, minHeight: 120 }}>
            {selectedDate ? (
              <>
                <div style={{ marginBottom: 8 }}><strong>{selectedDate}</strong></div>
                <div>
                  {eventsFor(selectedDate).length === 0 ? (
                    <div>No schedules</div>
                  ) : (
                    eventsFor(selectedDate).map((e) => (
                      <div key={e.id} style={{ padding: 8, borderBottom: '1px solid #f6f6f6' }}>
                        <div style={{ fontWeight: 600 }}>{e.title}</div>
                        {e.description && <div style={{ fontSize: 13 }}>{e.description}</div>}
                      </div>
                    ))
                  )}
                </div>
                <div style={{ marginTop: 8 }}>
                  <button onClick={() => openAddModal(selectedDate)}>Add schedule</button>
                </div>
              </>
            ) : (
              <div>No date selected</div>
            )}
          </div>
        </aside>
      </section>

      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', padding: 18, width: 420, borderRadius: 8 }}>
            <h3 style={{ marginTop: 0 }}>Add schedule</h3>
            <div style={{ marginBottom: 8 }}>
              <label style={{ display: 'block', fontSize: 13 }}>Date</label>
              <input type="date" value={selectedDate ?? ''} onChange={(e) => setSelectedDate(e.target.value)} />
            </div>
            <div style={{ marginBottom: 8 }}>
              <label style={{ display: 'block', fontSize: 13 }}>Title</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} style={{ width: '100%' }} />
            </div>
            <div style={{ marginBottom: 8 }}>
              <label style={{ display: 'block', fontSize: 13 }}>Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} style={{ width: '100%' }} />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setModalOpen(false)}>Cancel</button>
              <button onClick={saveSchedule}>Save</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: 28, color: '#999', fontSize: 13 }}>
        Tip: the Google/Microsoft buttons are placeholders — provide OAuth endpoints to implement real integration.
      </div>

    </div>
  )
}

export default App
