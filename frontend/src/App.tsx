import { useMemo, useState } from 'react'
import heroImg from './assets/hero.png'
import './App.css'

type Schedule = {
  id: string
  // start and end are local datetime-local strings, e.g. "2026-05-23T09:00"
  start: string
  end: string
  title: string
  description?: string
  category: 'appointment' | 'competition' | 'schedule'
}

type ScheduleApi = {
  id: number | string
  start: string
  end: string
  title: string
  description?: string | null
  category?: Schedule['category']
}

function formatDateISO(d: Date) {
  return d.toISOString().slice(0, 10)
}

function formatTimeLocal(dtLocal?: string) {
  if (!dtLocal) return ''
  // dtLocal expected in local "YYYY-MM-DDTHH:MM" or ISO; create Date and format hh:mm
  const date = new Date(dtLocal)
  if (isNaN(date.getTime())) return dtLocal.slice(11, 16)
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
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
  // load schedules from backend
  useMemo(() => {
    fetch('/schedules')
      .then((r) => r.ok ? r.json() : Promise.resolve([]))
      .then((data: ScheduleApi[]) => {
        // convert backend items (start/end ISO) to frontend Schedule shape
        setSchedules(data.map((d) => ({
          id: String(d.id),
          start: d.start,
          end: d.end,
          title: d.title,
          description: d.description ?? undefined,
          category: d.category ?? 'appointment',
        })))
      })
      .catch(() => {})
  }, [])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startLocal, setStartLocal] = useState('')
  const [endLocal, setEndLocal] = useState('')
  const [category, setCategory] = useState<Schedule['category']>('appointment')

  const monthGrid = useMemo(() => buildMonthGrid(viewYear, viewMonth), [viewYear, viewMonth])

  function openAddModal(dateIso?: string) {
    const date = dateIso ?? formatDateISO(new Date(viewYear, viewMonth, 1))
    // default times: 09:00 - 10:00 local
    const defaultStart = `${date}T09:00`
    const defaultEnd = `${date}T10:00`
    setSelectedDate(date)
    setTitle('')
    setDescription('')
    setStartLocal(defaultStart)
    setEndLocal(defaultEnd)
    setCategory('appointment')
    setModalOpen(true)
  }

  function saveSchedule() {
    if (!startLocal || !endLocal) return
    // basic validation
    if (new Date(endLocal) <= new Date(startLocal)) {
      alert('종료 시간은 시작 시간보다 이후여야 합니다.')
      return
    }
    const payload = { start: startLocal, end: endLocal, title: title || 'Untitled', description: description || undefined, category }
    fetch('/schedules', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      .then((r) => {
        if (!r.ok) return r.json().then((j) => Promise.reject(j))
        return r.json()
      })
      .then((saved) => {
        const savedItem: Schedule = { id: String(saved.id), start: saved.start, end: saved.end, title: saved.title, description: saved.description, category: saved.category }
        setSchedules((s) => [...s, savedItem])
        setModalOpen(false)
      })
      .catch((err) => {
        alert('저장 중 오류가 발생했습니다: ' + (err?.detail || err))
      })
  }

  function eventsFor(dateIso: string) {
    // return events that overlap the date (local date)
    const dayStart = new Date(dateIso + 'T00:00:00')
    const dayEnd = new Date(dateIso + 'T23:59:59.999')
    return schedules.filter((ev) => {
      const evStart = new Date(ev.start)
      const evEnd = new Date(ev.end)
      return evStart <= dayEnd && evEnd >= dayStart
    })
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
                                <div key={e.id} style={{ background: '#eef', padding: '2px 4px', borderRadius: 4, marginBottom: 4, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  <strong style={{ marginRight: 6 }}>{formatTimeLocal(e.start)}</strong>{e.title} <em style={{ marginLeft: 6, fontSize: 11 }}>{e.category === 'appointment' ? '약속' : e.category === 'competition' ? '대회' : '스케줄'}</em>
                                </div>
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
                        <div style={{ fontSize: 13 }}>{formatTimeLocal(e.start)} — {formatTimeLocal(e.end)} <span style={{ marginLeft: 8, color: '#666' }}>{e.category === 'appointment' ? '약속' : e.category === 'competition' ? '대회' : '스케줄'}</span></div>
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
          <div style={{ background: 'white', padding: 18, width: 460, borderRadius: 8 }}>
            <h3 style={{ marginTop: 0 }}>Add schedule</h3>
            <div style={{ marginBottom: 8 }}>
              <label style={{ display: 'block', fontSize: 13 }}>Start</label>
              <input type="datetime-local" value={startLocal} onChange={(e) => setStartLocal(e.target.value)} style={{ width: '100%' }} />
            </div>
            <div style={{ marginBottom: 8 }}>
              <label style={{ display: 'block', fontSize: 13 }}>End</label>
              <input type="datetime-local" value={endLocal} onChange={(e) => setEndLocal(e.target.value)} style={{ width: '100%' }} />
            </div>
            <div style={{ marginBottom: 8 }}>
              <label style={{ display: 'block', fontSize: 13 }}>Title</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} style={{ width: '100%' }} />
            </div>
            <div style={{ marginBottom: 8 }}>
              <label style={{ display: 'block', fontSize: 13 }}>Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value as Schedule['category'])}>
                <option value="appointment">약속</option>
                <option value="competition">대회</option>
                <option value="schedule">스케줄</option>
              </select>
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
