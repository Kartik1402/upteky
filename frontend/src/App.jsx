import React, { useEffect, useState } from 'react'
import './styles.css'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export default function App() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [rating, setRating] = useState(5)
  const [feedbacks, setFeedbacks] = useState([])
  const [stats, setStats] = useState({ total: 0, avgRating: 0, positive: 0, negative: 0 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchAll()
    fetchStats()
  }, [])

  async function fetchAll() {
    try {
      setLoading(true)
      const res = await fetch(`${API_BASE}/api/feedback`)
      const data = await res.json()
      setFeedbacks(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function fetchStats() {
    try {
      const res = await fetch(`${API_BASE}/api/stats`)
      const data = await res.json()
      setStats(data)
    } catch (err) {
      console.error(err)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!name.trim() || !message.trim()) {
      setError('Name and message are required')
      return
    }
    try {
      const res = await fetch(`${API_BASE}/api/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message, rating: Number(rating) })
      })
      if (!res.ok) {
        const err = await res.json()
        setError(err.error || 'Failed to submit')
        return
      }
      await fetchAll()
      await fetchStats()
      setName('')
      setEmail('')
      setMessage('')
      setRating(5)
    } catch (err) {
      console.error(err)
      setError('Failed to submit')
    }
  }

  function downloadCsvFromRows(rows) {
    const headers = ['id','name','email','rating','message','createdAt']
    const escape = (val) => {
      if (val === null || val === undefined) return ''
      const s = String(val)
      // escape double quotes
      return '"' + s.replace(/"/g, '""') + '"'
    }
    const csv = [headers.join(',')]
    for (const r of rows) {
      csv.push([r.id, r.name, r.email, r.rating, r.message, r.createdAt].map(escape).join(','))
    }
    const blob = new Blob([csv.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `feedbacks_${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  async function handleExport() {
    // If we already have feedbacks in state, export client-side
    if (feedbacks && feedbacks.length) {
      downloadCsvFromRows(feedbacks)
      return
    }
    // Otherwise fetch from API and export
    try {
      const res = await fetch(`${API_BASE}/api/feedback`)
      const rows = await res.json()
      downloadCsvFromRows(rows)
    } catch (err) {
      console.error('Export failed', err)
      alert('Failed to export CSV')
    }
  }

  return (
    <div className="app">
      <div className="header">
        <div className="brand">
          <img src="/logo.svg" className="logo" alt="Feedback logo" />
          <div>
            <h1>Feedback Dashboard</h1>
            <div className="tagline">Turn feedback into action</div>
          </div>
        </div>
      </div>

      <div className="layout">
        <div className="panel">
          <section>
            <h2>Submit Feedback</h2>
            <img src="/illustration.svg" className="hero-img" alt="Illustration" />
            <form className="feedback-form" onSubmit={handleSubmit}>
              <label>Name*</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Name*" />
              <label>Email</label>
              <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" />
              <label>Message*</label>
              <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Message*" rows={4} />
              <label>Rating</label>
              <select value={rating} onChange={e => setRating(e.target.value)}>
                {[5,4,3,2,1].map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              {error && <div className="error">{error}</div>}
              <button type="submit">Send Feedback</button>
            </form>
          </section>

          <section style={{ marginTop: 18 }}>
            <h2>All Feedbacks</h2>
            {loading ? <div className="empty">Loading...</div> : (
              feedbacks.length === 0 ? <div className="empty">No feedbacks yet</div> : (
              <table className="feedback-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Rating</th>
                    <th>Message</th>
                    <th>CreatedAt</th>
                  </tr>
                </thead>
                <tbody>
                  {feedbacks.map(f => (
                    <tr key={f.id}>
                      <td>{f.name}</td>
                      <td>{f.email}</td>
                      <td>{f.rating}</td>
                      <td>{f.message}</td>
                      <td>{new Date(f.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ))}
          </section>
        </div>

        <aside className="panel">
          <section className="analytics">
            <h2>Analytics</h2>
            <div className="cards">
              <div className="card">
                <strong>Total</strong>
                <div className="value">{stats.total}</div>
              </div>
              <div className="card">
                <strong>Avg Rating</strong>
                <div className="value">{Number(stats.avgRating || 0).toFixed(2)}</div>
              </div>
              <div className="card">
                <strong>Positive (4+)</strong>
                <div className="value">{stats.positive}</div>
              </div>
              <div className="card">
                <strong>Negative (&lt;3)</strong>
                <div className="value">{stats.negative}</div>
              </div>
            </div>
            <div className="export-row">
              <button className="export-btn" onClick={handleExport}>Export CSV</button>
              <div className="small">Exports current results to CSV (client-side)</div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}
