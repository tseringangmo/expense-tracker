const express = require('express')
const router = express.Router()
const Groq = require('groq-sdk')
const Transaction = require('../models/Transaction')
const { protect } = require('../middleware/authMiddleware')

router.get('/insights', protect, async (req, res) => {
  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

    const transactions = await Transaction.find({ user: req.user._id })

    if (transactions.length === 0) {
      return res.status(200).json({ 
        insight: 'Add some transactions first and I will analyse your spending patterns!' 
      })
    }

    const totalIncome = Math.round(
      transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0)
    )

    const totalExpense = Math.round(
      transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0)
    )

    const categoryBreakdown = {}
    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        categoryBreakdown[t.category] = 
          (categoryBreakdown[t.category] || 0) + t.amount
      })

    const prompt = `
You are a personal finance advisor. Analyze this user's spending data and give helpful, specific advice in 3-4 sentences. Be friendly and direct.

Financial Summary:
- Total Income: ₹${totalIncome}
- Total Expenses: ₹${totalExpense}
- Balance: ₹${totalIncome - totalExpense}
- Number of transactions: ${transactions.length}

Expense breakdown by category:
${Object.entries(categoryBreakdown)
  .map(([cat, amt]) => `- ${cat}: ₹${Math.round(amt)}`)
  .join('\n')}

Give specific actionable advice based on this data. Mention specific categories where they can improve.
`

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.1-8b-instant',
      max_tokens: 300
    })

    const insight = completion.choices[0].message.content

    res.status(200).json({ insight })

  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

module.exports = router