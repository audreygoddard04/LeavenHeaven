import { loafProducts } from '../data/products'

const STATUS_ORDER = ['pending_payment', 'paid', 'pending', 'confirmed', 'ready', 'completed']
const STATUS_LABELS = {
  pending_payment: 'Awaiting Payment',
  paid: 'Paid (Stripe)',
  pending: 'Pending',
  confirmed: 'Confirmed',
  ready: 'Ready for pickup',
  completed: 'Completed',
}
const STATUS_NEXT = {
  pending_payment: null,   // payment not confirmed yet — no action
  paid: 'confirmed',
  pending: 'confirmed',
  confirmed: 'ready',
  ready: 'completed',
}
const STATUS_NEXT_LABEL = {
  paid: 'Mark confirmed',
  pending: 'Mark confirmed',
  confirmed: 'Mark ready',
  ready: 'Mark completed',
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  })
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function formatPickupDate(dateStr) {
  if (!dateStr) return null
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'short', day: 'numeric',
  })
}

function itemSummary(items) {
  return items.map((item) => {
    if (item.productId === 'custom') {
      const c = item.custom
      const parts = [c?.flour, ...(c?.sweetInclusions ?? []).map(i => i.label), ...(c?.savoryInclusions ?? []).map(i => i.label)].filter(Boolean)
      return `${item.quantity}× Custom ${item.size === 'mini' ? 'Mini' : ''} Loaf${parts.length ? ` (${parts.slice(0, 3).join(', ')})` : ''}`
    }
    const product = loafProducts.find((p) => p.id === item.productId)
    const name = product?.name ?? item.productId
    return `${item.quantity}× ${item.size === 'mini' ? 'Mini ' : ''}${name}`
  }).join(', ')
}

function bakeCount(orders) {
  const counts = {}
  orders
    .filter((o) => o.status !== 'completed')
    .forEach((order) => {
      order.items.forEach((item) => {
        const key = item.productId === 'custom'
          ? `Custom (${item.size === 'mini' ? 'Mini' : 'Full'})`
          : `${loafProducts.find((p) => p.id === item.productId)?.name ?? item.productId}${item.size === 'mini' ? ' (Mini)' : ''}`
        counts[key] = (counts[key] ?? 0) + item.quantity
      })
    })
  return Object.entries(counts).sort((a, b) => b[1] - a[1])
}

export function AdminPage({ orders, profiles, onUpdateStatus, onRefresh, lotwProductId, onUpdateLotw }) {
  const activeOrders = orders.filter((o) => o.status !== 'completed')
  const completedOrders = orders.filter((o) => o.status === 'completed')
  const bake = bakeCount(orders)

  return (
    <div className="admin-page">
      <div className="section-heading">
        <div>
          <div className="section-label">Admin</div>
          <div className="section-title">Order dashboard</div>
        </div>
        <button type="button" className="btn-small btn-secondary" onClick={onRefresh}>
          Refresh
        </button>
      </div>

      {/* Loaf of the week picker */}
      <div className="admin-lotw-wrap">
        <div className="admin-lotw-header">
          <span className="admin-lotw-title">Loaf of the Week</span>
          <span className="admin-lotw-hint">Shown as a featured card on the Loaves page</span>
        </div>
        <select
          className="admin-lotw-select"
          value={lotwProductId ?? ''}
          onChange={(e) => onUpdateLotw(e.target.value || null)}
        >
          <option value="">Auto-rotate (by week number)</option>
          {loafProducts.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {/* Bake summary */}
      {bake.length > 0 && (
        <div className="admin-bake-summary">
          <h3 className="admin-section-title">What to bake ({activeOrders.length} active orders)</h3>
          <div className="admin-bake-grid">
            {bake.map(([name, qty]) => (
              <div key={name} className="admin-bake-item">
                <span className="admin-bake-qty">{qty}</span>
                <span className="admin-bake-name">{name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active orders by status */}
      {STATUS_ORDER.filter((s) => s !== 'completed').map((status) => {
        const group = orders.filter((o) => o.status === status)
        if (group.length === 0) return null
        return (
          <div key={status} className="admin-order-group">
            <h3 className="admin-section-title">
              {STATUS_LABELS[status]}
              <span className="admin-count">{group.length}</span>
            </h3>
            <div className="admin-orders-list">
              {group.map((order) => (
                <div key={order.id} className="admin-order-card">
                  <div className="admin-order-header">
                    <div className="admin-order-meta">
                      <span className="admin-order-customer">{profiles[order.user_id] ?? 'Customer'}</span>
                      <span className="admin-order-date">Ordered {formatDate(order.created_at)} at {formatTime(order.created_at)}</span>
                      {order.pickup_date && (
                        <span className="admin-order-pickup">Pickup: {formatPickupDate(order.pickup_date)}</span>
                      )}
                    </div>
                    <div className="admin-order-right">
                      {order.total_cents > 0 && (
                        <span className="admin-order-total">${(order.total_cents / 100).toFixed(2)}</span>
                      )}
                      <span className={`order-status order-status--${status}`}>{STATUS_LABELS[status]}</span>
                    </div>
                  </div>
                  <div className="admin-order-items">{itemSummary(order.items)}</div>
                  {order.include_sample && (
                    <div className="admin-order-note">+ Free sampler slice</div>
                  )}
                  {STATUS_NEXT[status] && (
                    <div className="admin-order-actions">
                      <button
                        type="button"
                        className="btn-small"
                        onClick={() => onUpdateStatus(order.id, STATUS_NEXT[status])}
                      >
                        {STATUS_NEXT_LABEL[status]}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {activeOrders.length === 0 && (
        <p className="account-summary">No active orders right now.</p>
      )}

      {/* Completed orders (collapsed) */}
      {completedOrders.length > 0 && (
        <details className="admin-order-group admin-order-group--completed">
          <summary className="admin-section-title">
            Completed <span className="admin-count">{completedOrders.length}</span>
          </summary>
          <div className="admin-orders-list" style={{ marginTop: '0.75rem' }}>
            {completedOrders.map((order) => (
              <div key={order.id} className="admin-order-card admin-order-card--completed">
                <div className="admin-order-header">
                  <div className="admin-order-meta">
                    <span className="admin-order-customer">{profiles[order.user_id] ?? 'Customer'}</span>
                    <span className="admin-order-date">{formatDate(order.created_at)}</span>
                    {order.pickup_date && (
                      <span className="admin-order-pickup">Pickup: {formatPickupDate(order.pickup_date)}</span>
                    )}
                  </div>
                  {order.total_cents > 0 && (
                    <span className="admin-order-total">${(order.total_cents / 100).toFixed(2)}</span>
                  )}
                </div>
                <div className="admin-order-items">{itemSummary(order.items)}</div>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  )
}
