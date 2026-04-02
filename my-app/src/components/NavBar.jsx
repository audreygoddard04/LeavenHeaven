import { useRef, useEffect } from 'react'
import { loafProducts, LOAF_IMAGES, MOST_POPULAR_IDS, DEFAULT_MORE_IDS } from '../data/products'

const SearchIcon = () => (
  <svg className="icon-search" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
)

const CartIcon = () => (
  <svg className="icon-cart" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <path d="M16 10a4 4 0 0 1-8 0" />
  </svg>
)

const HeartIcon = () => (
  <svg className="icon-heart-nav" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
)

const UserIcon = () => (
  <svg className="icon-user" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
  </svg>
)

export function NavBar({
  currentPage,
  cartCount,
  searchOpen,
  searchQuery,
  navOpen,
  onNavigate,
  onToggleNav,
  onSearchToggle,
  onSearchClose,
  onSearchChange,
  onFavoritesNav,
}) {
  const searchRef = useRef(null)

  useEffect(() => {
    if (!searchOpen) return
    const handleEscape = (e) => { if (e.key === 'Escape') onSearchClose() }
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) onSearchClose()
    }
    document.addEventListener('keydown', handleEscape)
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [searchOpen, onSearchClose])

  const searchResults = searchQuery.trim() === ''
    ? [...MOST_POPULAR_IDS, ...DEFAULT_MORE_IDS].map((id) => loafProducts.find((p) => p.id === id)).filter(Boolean)
    : loafProducts.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))

  const navLinks = [
    { page: 'home', label: 'Home' },
    { page: 'loaves', label: 'Loaves' },
    { page: 'customize', label: 'Customize your loaf' },
  ]

  return (
    <header className="header">
      <button type="button" className="logo-block" onClick={() => onNavigate('home')} aria-label="Go to home">
        <div className="logo-mark">Macro Friendly Bakery</div>
        <div className="logo-name">Leaven Heaven</div>
      </button>

      <div className="header-right">
        <div className="header-controls">
          <nav className="main-nav main-nav--desktop">
            {navLinks.map(({ page, label }) => (
              <button
                key={page}
                type="button"
                className={currentPage === page ? 'is-active' : ''}
                onClick={() => onNavigate(page)}
              >
                {label}
              </button>
            ))}

            <div className="nav-search-wrap" ref={searchRef}>
              {searchOpen && (
                <input
                  type="search"
                  className="nav-search-input"
                  placeholder="Search loaves..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  autoFocus
                  aria-label="Search loaves"
                />
              )}
              <button
                type="button"
                className={`nav-search${searchOpen ? ' nav-search--active' : ''}`}
                onClick={onSearchToggle}
                aria-label="Search"
                aria-expanded={searchOpen}
              >
                <SearchIcon />
              </button>
              {searchOpen && (
                <div className="search-dropdown">
                  <div className="search-dropdown-results">
                    {searchResults.length === 0 ? (
                      <div className="search-dropdown-empty">No loaves found</div>
                    ) : (
                      searchResults.map((product) => (
                        <button
                          key={product.id}
                          type="button"
                          className="search-dropdown-item"
                          onClick={() => { onNavigate('loaves'); onSearchClose(); onSearchChange('') }}
                        >
                          {LOAF_IMAGES[product.id] && (
                            <img src={LOAF_IMAGES[product.id]} alt="" className="search-dropdown-item-img" />
                          )}
                          <span className="search-dropdown-item-name">{product.name}</span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              className="nav-cart"
              onClick={() => onNavigate('preorder')}
              aria-label={cartCount > 0 ? `Open pre-order cart (${cartCount} items)` : 'Open pre-order cart'}
            >
              <span className="nav-cart-icon-wrap">
                <CartIcon />
                {cartCount > 0 && <span className="nav-cart-count" aria-hidden="true">{cartCount}</span>}
              </span>
            </button>
            <button type="button" className="nav-favorites" onClick={onFavoritesNav} aria-label="View favorites">
              <HeartIcon />
            </button>
            <button type="button" className="nav-user" onClick={() => onNavigate('account')} aria-label="My account">
              <UserIcon />
            </button>
          </nav>

          <button
            type="button"
            className="nav-toggle"
            onClick={onToggleNav}
            aria-label="Toggle navigation"
          >
            <span /><span /><span />
          </button>
        </div>

        {navOpen && (
          <nav className="main-nav main-nav--mobile">
            {navLinks.map(({ page, label }) => (
              <button
                key={page}
                type="button"
                className={currentPage === page ? 'is-active' : ''}
                onClick={() => onNavigate(page)}
              >
                {label}
              </button>
            ))}
            <button type="button" className="nav-search" onClick={onSearchToggle} aria-label="Search">
              <SearchIcon />
            </button>
            <button
              type="button"
              className="nav-cart"
              onClick={() => onNavigate('preorder')}
              aria-label={cartCount > 0 ? `Open pre-order cart (${cartCount} items)` : 'Open pre-order cart'}
            >
              <span className="nav-cart-icon-wrap">
                <CartIcon />
                {cartCount > 0 && <span className="nav-cart-count" aria-hidden="true">{cartCount}</span>}
              </span>
            </button>
            <button type="button" className="nav-favorites" onClick={onFavoritesNav} aria-label="View favorites">
              <HeartIcon />
            </button>
            <button type="button" className="nav-user" onClick={() => onNavigate('account')} aria-label="My account">
              <UserIcon />
            </button>
          </nav>
        )}
      </div>
    </header>
  )
}
