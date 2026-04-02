import { LOAF_IMAGES, MINI_LOAF_PRICE, getLoafPriceForProduct } from '../data/products'

function HeartIcon({ filled }) {
  return (
    <svg className="icon-heart" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}

function QtyOrAdd({ item, onUpdate, onAdd, price, label, secondary, disabled }) {
  if (item) {
    return (
      <div className="loaf-qty-control">
        <button type="button" className="loaf-qty-btn" onClick={() => onUpdate(item.key, -1)} aria-label="Decrease">−</button>
        <span className="loaf-qty-num">{item.quantity}</span>
        <button type="button" className="loaf-qty-btn" onClick={() => onUpdate(item.key, 1)} aria-label="Increase">+</button>
      </div>
    )
  }
  return (
    <div className="add-btn-with-price">
      <button type="button" className={`btn-small btn-add${secondary ? ' btn-secondary' : ''}`} onClick={onAdd} disabled={disabled}>
        {label}
      </button>
      <div className="add-btn-price">${price}</div>
    </div>
  )
}

export function LoafCard({ product, isFavorite, loafCartItem, miniCartItem, onToggleFavorite, onUpdateQuantity, onAddToCart, showBanner, isOutOfSeason = false }) {
  const classes = ['loaf-card']
  if (showBanner) classes.push('loaf-card--has-banner')
  if (isOutOfSeason) classes.push('loaf-card--out-of-season')
  if (product.soldOut) classes.push('loaf-card--sold-out')

  return (
    <div className={classes.join(' ')}>
      {showBanner && <span className="loaf-season-banner">Limited edition</span>}
      {product.soldOut && <span className="loaf-sold-out-banner">Sold out</span>}
      {LOAF_IMAGES[product.id] && (
        <div className="loaf-image-wrap">
          <img src={LOAF_IMAGES[product.id]} alt="" className="loaf-image" />
        </div>
      )}
      <div className="loaf-header">
        <div className="loaf-name-row">
          <div className="loaf-name">{product.name}</div>
        </div>
        <button
          type="button"
          className={`fav-toggle${isFavorite ? ' fav-toggle--active' : ''}`}
          onClick={() => onToggleFavorite(product.id)}
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <HeartIcon filled={isFavorite} />
        </button>
      </div>
      <p className="loaf-details">
        {product.description}{product.inclusion ? ` It includes ${product.inclusion}.` : ''}
      </p>
      <div className="loaf-actions">
        {(product.soldOut || isOutOfSeason) && !loafCartItem && !miniCartItem ? (
          <div className="loaf-sold-out">
            {product.soldOut ? 'Sold out' : 'Out of season'}
          </div>
        ) : (
          <>
            <QtyOrAdd
              item={loafCartItem}
              onUpdate={onUpdateQuantity}
              onAdd={() => onAddToCart(product.id, 'loaf')}
              price={getLoafPriceForProduct(product)}
              label="Add Loaf"
              disabled={product.soldOut || isOutOfSeason}
            />
            <QtyOrAdd
              item={miniCartItem}
              onUpdate={onUpdateQuantity}
              onAdd={() => onAddToCart(product.id, 'mini')}
              price={MINI_LOAF_PRICE}
              label="Add Mini"
              secondary
              disabled={product.soldOut || isOutOfSeason}
            />
          </>
        )}
      </div>
    </div>
  )
}
