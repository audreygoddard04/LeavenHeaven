import { loafProducts, LOAF_IMAGES } from '../data/products'

export function FavoritesList({ favorites, onToggleFavorite }) {
  if (favorites.length === 0) return null

  return (
    <div className="fav-cards">
      {favorites.map((id) => {
        if (id === 'custom') {
          return (
            <div key={id} className="fav-card">
              <div className="fav-card-img-placeholder" />
              <span className="fav-card-name">Custom loaf</span>
              <button className="fav-card-remove" onClick={() => onToggleFavorite(id)} aria-label="Remove from favorites">×</button>
            </div>
          )
        }
        const product = loafProducts.find((p) => p.id === id)
        if (!product) return null
        const img = LOAF_IMAGES[id]
        return (
          <div key={id} className="fav-card">
            {img
              ? <img src={img} alt={product.name} className="fav-card-img" />
              : <div className="fav-card-img-placeholder" />
            }
            <span className="fav-card-name">{product.name}</span>
            <button className="fav-card-remove" onClick={() => onToggleFavorite(id)} aria-label="Remove from favorites">×</button>
          </div>
        )
      })}
    </div>
  )
}
