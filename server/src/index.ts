import express from 'express'
import cors from 'cors'
import { ordersRouter } from './routes/orders.js'
import { billingRouter } from './routes/billing.js'
import { webhookRouter } from './routes/webhook.js'

const app = express()
const PORT = process.env.PORT ?? 3001

app.use(cors({ origin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173' }))

// Webhook needs raw body for Stripe signature verification
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }), webhookRouter)

app.use(express.json())
app.use('/api/orders', ordersRouter)
app.use('/api/billing', billingRouter)

app.get('/health', (_req, res) => res.json({ ok: true }))

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
