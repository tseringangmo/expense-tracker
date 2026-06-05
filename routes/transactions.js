const express = require('express')
const router = express.Router()
const Transaction = require('../models/Transaction')
const { protect } = require('../middleware/authMiddleware')

// Add transaction
router.post('/', protect, async (req, res) => {
  try {
    const { title, amount, type, category, date, note } = req.body

    const transaction = await Transaction.create({
      user: req.user._id,
      title,
      amount,
      type,
      category,
      date,
      note
    })

    res.status(201).json(transaction)

  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Get all transactions for logged in user
router.get('/', protect, async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user._id })
      .sort({ date: -1 })

    res.status(200).json(transactions)

  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Delete transaction
router.delete('/:id', protect, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' })
    }

    if (transaction.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' })
    }

    await transaction.deleteOne()

    res.status(200).json({ message: 'Transaction deleted' })

  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Get summary
router.get('/summary', protect, async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user._id })

    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)

    const expense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)

    const balance = income - expense

    res.status(200).json({ income, expense, balance })

  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

module.exports = router  