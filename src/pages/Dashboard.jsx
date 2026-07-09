import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import API from '../api/axios'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const Dashboard = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [transactions, setTransactions] = useState([])
  const [summary, setSummary] = useState({ income: 0, expense: 0, balance: 0 })
  const [loading, setLoading] = useState(true)
  const [insight, setInsight] = useState('')
  const [insightLoading, setInsightLoading] = useState(false)
  const [categoryLoading, setCategoryLoading] = useState(false)
  const [form, setForm] = useState({
    title: '',
    amount: '',
    type: 'expense',
    category: 'food',
    note: ''
  })
  const [error, setError] = useState('')

  const fetchData = async () => {
    try {
      const [transRes, summaryRes] = await Promise.all([
        API.get('/transactions'),
        API.get('/transactions/summary')
      ])
      setTransactions(transRes.data)
      setSummary(summaryRes.data)
    } catch (err) {
      console.log(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchInsight = async () => {
    setInsightLoading(true)
    try {
      const res = await API.get('/ai/insights')
      setInsight(res.data.insight)
    } catch (err) {
      console.log(err)
    } finally {
      setInsightLoading(false)
    }
  }
  const handleSuggestCategory = async () => {
    if (!form.title) return
    setCategoryLoading(true)
    try {
      const res = await API.post('/ai/suggest-category', { title: form.title })
      setForm({ ...form, category: res.data.category })
    } catch (err) {
      console.log(err)
    } finally {
      setCategoryLoading(false)
    }
  }
  useEffect(() => {
    fetchData()
  }, [])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (Number(form.amount) <= 0) {
      setError('Amount must be greater than 0')
      return
    }
    try {
      await API.post('/transactions', {
        ...form,
        amount: Number(form.amount)
      })
      setForm({ title: '', amount: '', type: 'expense', category: 'food', note: '' })
      fetchData()
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong')
    }
  }

  const handleDelete = async (id) => {
    try {
      await API.delete(`/transactions/${id}`)
      fetchData()
    } catch (err) {
      console.log(err)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  if (loading) return <div className="loading">Loading...</div>

  return (
    <div className="dashboard">
      <nav className="navbar">
        <h1>💰 Expense Tracker</h1>
        <div>
          <span>Hi, {user?.name}</span>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </nav>

      <div className="dashboard-content">
        <div className="summary-cards">
          <div className="card income-card">
            <p>Total Income</p>
            <h2>₹{summary.income}</h2>
          </div>
          <div className="card expense-card">
            <p>Total Expense</p>
            <h2>₹{summary.expense}</h2>
          </div>
          <div className="card balance-card">
            <p>Balance</p>
            <h2>₹{summary.balance}</h2>
          </div>
        </div>

        <div className="chart-section">
          <h3>Income vs Expense</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Income', value: summary.income },
                  { name: 'Expense', value: summary.expense }
                ]}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="value"
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
              >
                <Cell fill="#10b981" />
                <Cell fill="#ef4444" />
              </Pie>
              <Tooltip formatter={(value) => `₹${value}`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="ai-section">
          <h3>🤖 AI Spending Insights</h3>
          {insight ? (
            <p className="insight-text">{insight}</p>
          ) : (
            <button onClick={fetchInsight} disabled={insightLoading}>
              {insightLoading ? 'Analysing your spending...' : '✨ Get AI Insights'}
            </button>
          )}
        </div>

        <div className="dashboard-grid">
          <div className="form-section">
            <h3>Add Transaction</h3>
            {error && <p className="error">{error}</p>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Title</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="e.g. Grocery shopping"
                  required
                  style={{flex: 1 }}
                />
                <button
                type="button"
                onClick={handleSuggestCategory}
                disabled={!form.title || categoryLoading}
                style={{ width: 'auto', padding: '0 12px', fontSize: '12px' }}
              >
                {categoryLoading ? '...' : '🤖 Auto'}
              </button>
          </div>
        </div>
              <div className="form-group">
                <label>Amount (₹)</label>
                <input
                  type="number"
                  name="amount"
                  value={form.amount}
                  onChange={handleChange}
                  placeholder="Enter amount"
                  required
                />
              </div>
              <div className="form-group">
                <label>Type</label>
                <select name="type" value={form.type} onChange={handleChange}>
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>
              <div className="form-group">
                <label>Category</label>
                <select name="category" value={form.category} onChange={handleChange}>
                  <option value="food">Food</option>
                  <option value="rent">Rent</option>
                  <option value="salary">Salary</option>
                  <option value="entertainment">Entertainment</option>
                  <option value="transport">Transport</option>
                  <option value="shopping">Shopping</option>
                  <option value="health">Health</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Note (optional)</label>
                <input
                  type="text"
                  name="note"
                  value={form.note}
                  onChange={handleChange}
                  placeholder="Any extra detail"
                />
              </div>
              <button type="submit">Add Transaction</button>
            </form>
          </div>

          <div className="transactions-section">
            <h3>Recent Transactions</h3>
            {transactions.length === 0 ? (
              <p className="no-transactions">No transactions yet. Add one!</p>
            ) : (
              transactions.map(t => (
                <div key={t._id} className={`transaction-item ${t.type}`}>
                  <div className="transaction-info">
                    <h4>{t.title}</h4>
                    <p>{t.category} • {new Date(t.date).toLocaleDateString()}</p>
                    {t.note && <p className="note">{t.note}</p>}
                  </div>
                  <div className="transaction-right">
                    <span className={`amount ${t.type}`}>
                      {t.type === 'income' ? '+' : '-'}₹{t.amount}
                    </span>
                    <button
                      onClick={() => handleDelete(t._id)}
                      className="delete-btn"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard