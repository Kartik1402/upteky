require('dotenv').config()
const express = require('express')
const cors = require('cors')
const mysql = require('mysql2/promise')

const app = express()
app.use(cors())
app.use(express.json())

const DB_HOST = process.env.DB_HOST || 'localhost'
const DB_PORT = parseInt(process.env.DB_PORT || '3306', 10)
const DB_USER = process.env.DB_USER || 'root'
const DB_PASSWORD = process.env.DB_PASSWORD || 'Kartikjaju123@'
const DB_NAME = process.env.DB_NAME || 'feedback'

let pool

async function initDb() {
  // Create database if not exists
  const createConn = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD
  })
  try {
    await createConn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\``)
  } catch (err) {
    console.error('Error creating database:', err.message || err)
    throw err
  } finally {
    await createConn.end()
  }

  pool = mysql.createPool({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: 10
  })

  // Create table if not exists
  const createTableSql = `
    CREATE TABLE IF NOT EXISTS feedbacks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255),
      message TEXT NOT NULL,
      rating INT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `
  try {
    await pool.query(createTableSql)
  } catch (err) {
    console.error('Error creating feedbacks table:', err.message || err)
    throw err
  }
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() })
})

app.post('/api/feedback', async (req, res) => {
  try {
    const { name, email, message, rating } = req.body
    if (!name || !message) {
      return res.status(400).json({ error: 'Name and message are required' })
    }
    if (!pool) {
      return res.status(503).json({ error: 'Database not initialized' })
    }
    const sql = 'INSERT INTO feedbacks (name, email, message, rating) VALUES (?, ?, ?, ?)'
    const [result] = await pool.execute(sql, [name, email || null, message, rating || null])
    const insertedId = result.insertId
    const [rows] = await pool.execute('SELECT * FROM feedbacks WHERE id = ?', [insertedId])
    res.status(201).json(rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

app.get('/api/feedback', async (req, res) => {
  try {
    if (!pool) {
      return res.status(503).json({ error: 'Database not initialized' })
    }
    const [rows] = await pool.execute('SELECT * FROM feedbacks ORDER BY createdAt DESC')
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

app.get('/api/stats', async (req, res) => {
  try {
    if (!pool) {
      return res.status(503).json({ error: 'Database not initialized' })
    }
    const [totalsRows] = await pool.query('SELECT COUNT(*) AS total, AVG(rating) AS avgRating FROM feedbacks')
    const totals = (totalsRows && totalsRows[0]) || { total: 0, avgRating: 0 }

    const [posNegRows] = await pool.query(
      `SELECT
         SUM(CASE WHEN rating >= 4 THEN 1 ELSE 0 END) AS positive,
         SUM(CASE WHEN rating < 3 THEN 1 ELSE 0 END) AS negative
       FROM feedbacks`
    )
    const posNeg = (posNegRows && posNegRows[0]) || { positive: 0, negative: 0 }

    res.json({ total: totals.total || 0, avgRating: totals.avgRating || 0, positive: posNeg.positive || 0, negative: posNeg.negative || 0 })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// Export feedbacks as CSV (server-side)
app.get('/api/feedback/export', async (req, res) => {
  try {
    if (!pool) return res.status(503).json({ error: 'Database not initialized' })
    const [rows] = await pool.execute('SELECT id, name, email, rating, message, createdAt FROM feedbacks ORDER BY createdAt DESC')

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', 'attachment; filename="feedbacks.csv"')

    const escape = (v) => {
      if (v === null || v === undefined) return ''
      const s = String(v)
      return '"' + s.replace(/"/g, '""') + '"'
    }
    const header = ['id','name','email','rating','message','createdAt']
    const lines = [header.join(',')]
    for (const r of rows) {
      lines.push([r.id, r.name, r.email, r.rating, r.message, r.createdAt].map(escape).join(','))
    }
    res.send(lines.join('\n'))
  } catch (err) {
    console.error('CSV export error', err)
    res.status(500).json({ error: 'Export failed' })
  }
})

const port = process.env.PORT || 4000
initDb()
  .then(() => {
    app.listen(port, () => {
      console.log(`Feedback backend listening on http://localhost:${port}`)
    })
  })
  .catch(err => {
    console.error('Failed to initialize database', err)
    process.exit(1)
  })
