import { useEffect, useState } from 'react'
import './App.css'
import heroLoavesImage from './images/manylaoves.jpeg'
import { BuildYourLoaf } from './components/BuildYourLoaf'
import { LoafCard } from './components/LoafCard'
import { FavoritesList } from './components/FavoritesList'
import { NavBar } from './components/NavBar'
import { AdminPage } from './components/AdminPage'
import { supabase } from './lib/supabaseClient'
import { buildOrderItemsPayload, getOrderLines, getOrderIncludeSample } from './lib/orderHelpers'
import { resolvePickupWindowId } from './lib/pickupWindow'
import { useAuth } from './hooks/useAuth'
import { useAdmin } from './hooks/useAdmin'
import {
  loafProducts,
  LOAF_IMAGES,
  MINI_LOAF_PRICE,
  getLoafPriceForProduct,
  SEASON_ORDER,
  SEASON_LABELS,
  getCurrentSeason,
} from './data/products'

// ── Pickup-window utilities ──────────────────────────────────────────────────

// Returns up to `count` upcoming Sunday pickup windows that are still open.
// A Sunday's orders close at the end of the Thursday before it (11:59:59 PM).
function getPickupWindows(count = 3) {
  const now = new Date()
  const windows = []
  const d = new Date(now)
  d.setHours(0, 0, 0, 0)
  // Advance to the next Sunday (never today even if today is Sunday)
  const daysUntilSun = (7 - d.getDay()) % 7 || 7
  d.setDate(d.getDate() + daysUntilSun)
  let attempts = 0
  while (windows.length < count && attempts < 12) {
    attempts++
    const cutoff = new Date(d)
    cutoff.setDate(cutoff.getDate() - 3) // Thursday before that Sunday
    cutoff.setHours(23, 59, 59, 999)
    if (now <= cutoff) {
      windows.push({ date: new Date(d), cutoff, iso: d.toISOString().split('T')[0] })
    }
    d.setDate(d.getDate() + 7)
  }
  return windows
}

function formatPickupLabel(date) {
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
}

// Returns the cutoff Date for the nearest open Sunday (Thursday 11:59:59 PM).
function getNextCutoff() {
  const ws = getPickupWindows(1)
  return ws.length > 0 ? ws[0].cutoff : null
}

function formatCountdown(ms) {
  if (ms <= 0) return null
  const d = Math.floor(ms / 86400000)
  const h = Math.floor((ms % 86400000) / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  return `${d}d ${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`
}

// ── Loaf-of-the-week week ID ─────────────────────────────────────────────────

// Returns the local timestamp (ms) of the most recent Friday at 8:00 AM.
// This value is identical for the whole week, then jumps every Friday at 8am —
// so it doubles as both the auto-rotation seed and the expiry check.
function getLotwWeekId() {
  const now = new Date()
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 0, 0)
  // getDay(): 0=Sun 1=Mon 2=Tue 3=Wed 4=Thu 5=Fri 6=Sat
  const daysToLastFriday = (d.getDay() - 5 + 7) % 7
  d.setDate(d.getDate() - daysToLastFriday)
  if (d > now) d.setDate(d.getDate() - 7) // haven't hit 8am yet today
  return d.getTime()
}

// ── End loaf-of-the-week utilities ───────────────────────────────────────────

// ── End pickup-window utilities ──────────────────────────────────────────────

// ── Pickup location ── update VITE_PICKUP_ADDRESS in your .env.local ─────────
const PICKUP_ADDRESS = import.meta.env.VITE_PICKUP_ADDRESS ?? 'Address TBA — check your email'
const PICKUP_NOTES   = import.meta.env.VITE_PICKUP_NOTES   ?? ''
// ─────────────────────────────────────────────────────────────────────────────

function getUserDisplay(authUser) {
  if (!authUser) return null
  const meta = authUser.user_metadata || {}
  return {
    name: meta.full_name ?? meta.name ?? (meta.given_name && meta.family_name ? `${meta.given_name} ${meta.family_name}`.trim() : meta.given_name ?? meta.family_name) ?? authUser.email?.split('@')[0] ?? '',
    email: authUser.email ?? '',
    avatar: meta.picture ?? meta.avatar_url ?? null,
  }
}

function App() {
  const { user: authUser, loading: authLoading } = useAuth()
  const user = getUserDisplay(authUser) ?? null
  const { isAdmin, orders: adminOrders, profiles: adminProfiles, loadOrders: refreshAdminOrders, updateOrderStatus, lotwProductId: adminLotwId, updateLotw } = useAdmin(authUser)

  const [cartItems, setCartItems] = useState([])
  const [favorites, setFavorites] = useState([])
  const [orders, setOrders] = useState([])
  const [currentPage, setCurrentPage] = useState(() => {
    if (typeof window === 'undefined') return 'home'
    const hash = window.location.hash.slice(1) || 'home'
    return ['home', 'loaves', 'customize', 'preorder', 'favorites', 'account', 'admin'].includes(hash) ? hash : 'home'
  })
  const [navOpen, setNavOpen] = useState(false)
  const [includeSample, setIncludeSample] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAuthPrompt, setShowAuthPrompt] = useState(false)
  const [accountMode, setAccountMode] = useState('signup')
  const [authError, setAuthError] = useState('')
  const [authMessage, setAuthMessage] = useState('')
  const [authLoaderActive, setAuthLoaderActive] = useState(false)
  const [orderError, setOrderError] = useState(null)
  const [orderSuccess, setOrderSuccess] = useState(null)
  const [publicLotwId, setPublicLotwId] = useState(null)

  const currentSeason = getCurrentSeason()

  // Pickup window selection — initialise to the first open Sunday
  const pickupWindows = getPickupWindows(3)
  const [pickupDate, setPickupDate] = useState(() => getPickupWindows(1)[0]?.date ?? null)

  // Live countdown to the nearest Thursday cutoff
  const [countdown, setCountdown] = useState(() => formatCountdown(getNextCutoff() - Date.now()))
  useEffect(() => {
    const cutoff = getNextCutoff()
    if (!cutoff) return
    const tick = () => setCountdown(formatCountdown(cutoff - Date.now()))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)
  const favKey = authUser ? `lh_favorites_${authUser.id}` : null

  useEffect(() => {
    if (authLoading) return
    if (typeof window === 'undefined') return

    try {
      if (favKey) {
        const stored = window.localStorage.getItem(favKey)
        setFavorites(stored ? JSON.parse(stored) : [])
      } else {
        setFavorites([])
      }
    } catch { /* ignore */ }

    if (authUser) {
      supabase
        .from('orders')
        .select('*')
        .eq('user_id', authUser.id)
        .order('created_at', { ascending: false })
        .then(({ data }) => {
          if (data) setOrders(data.map(row => ({
            id: row.id,
            createdAt: row.created_at,
            items: getOrderLines(row.items),
            includeSample: getOrderIncludeSample(row.include_sample, row.items),
            status: row.status,
            pickupDate: row.pickup_date ?? null,
          })))
        })
    } else {
      setOrders([])
    }
  }, [authLoading, authUser?.id, favKey])

  useEffect(() => {
    if (typeof window === 'undefined' || !favKey) return
    try { window.localStorage.setItem(favKey, JSON.stringify(favorites)) } catch { /* ignore */ }
  }, [favorites, favKey])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('next') === 'account') {
      setCurrentPage('account')
      window.location.hash = 'account'
      // Remove ?next so reloads don't redirect again
      const clean = window.location.pathname
      window.history.replaceState(null, '', clean + '#account')
    }
  }, [])

  // Only redirect to account after an OAuth or email-confirmation callback
  // (URL will contain access_token= or ?code=). A plain reload should keep
  // the user on whatever page the hash says.
  useEffect(() => {
    if (!authUser) return
    const hashStr = window.location.hash
    const searchStr = window.location.search
    const isAuthCallback =
      hashStr.includes('access_token=') ||
      Boolean(new URLSearchParams(searchStr).get('code'))
    if (isAuthCallback) {
      setCurrentPage('account')
      window.location.hash = 'account'
    }
  }, [authUser])

  // Detect when the user arrives via a password-reset link
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setCurrentPage('account')
        setAccountMode('reset')
        if (typeof window !== 'undefined') window.location.hash = 'account'
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.slice(1) || 'home'
      if (['home', 'loaves', 'customize', 'preorder', 'favorites', 'account', 'admin'].includes(hash)) {
        setCurrentPage(hash)
        window.scrollTo(0, 0)
      }
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  // Scroll to top on initial load (handles page reload mid-scroll)
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  // Public fetch of loaf of the week (no auth required).
  // Value is stored as JSON: { id, since } where `since` is a getLotwWeekId()
  // timestamp. If `since` doesn't match the current week the setting is expired.
  useEffect(() => {
    supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'loaf_of_the_week')
      .single()
      .then(({ data }) => {
        if (!data?.value) return
        try {
          const parsed = JSON.parse(data.value)
          if (parsed.since === getLotwWeekId()) setPublicLotwId(parsed.id)
        } catch {
          setPublicLotwId(data.value) // legacy plain-string fallback
        }
      })
  }, [])

  // Admin update — tags the value with the current week ID so it auto-expires next Friday 8am
  const handleUpdateLotw = async (productId) => {
    const value = productId ? JSON.stringify({ id: productId, since: getLotwWeekId() }) : null
    await updateLotw(value)
    setPublicLotwId(productId ?? null)
  }

  // The resolved featured loaf: admin pick → auto-rotation anchored to Friday 8am
  const lotwProduct = (() => {
    const id = isAdmin ? (adminLotwId ?? publicLotwId) : publicLotwId
    if (id) return loafProducts.find((p) => p.id === id) ?? null
    // Auto-rotate: use Friday-8am week ID as the seed so it changes every Friday
    const weekIndex = Math.floor(getLotwWeekId() / (7 * 24 * 60 * 60 * 1000))
    const eligible = loafProducts.filter((p) => !p.soldOut && (!p.seasonal || p.season === currentSeason))
    return eligible.length > 0 ? eligible[weekIndex % eligible.length] : null
  })()

  const navigateTo = (page) => {
    setCurrentPage(page)
    setNavOpen(false)
    if (typeof window !== 'undefined') {
      window.location.hash = page
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const addToCart = (productId, size, qty = 1) => {
    setCartItems((prev) => {
      const key = `${productId}-${size}`
      const existing = prev.find((item) => item.key === key)
      if (existing) {
        return prev.map((item) => item.key === key ? { ...item, quantity: item.quantity + qty } : item)
      }
      return [...prev, { key, productId, size, quantity: qty }]
    })
  }

  const addCustomToCart = (options) => {
    const key = `custom-${Date.now()}`
    setCartItems((prev) => [...prev, { key, productId: 'custom', size: options.size, quantity: 1, custom: options }])
    navigateTo('preorder')
  }

  const updateCartItemQuantity = (key, delta) => {
    setCartItems((prev) =>
      prev.map((item) => item.key !== key ? item : { ...item, quantity: item.quantity + delta })
          .filter((item) => item.quantity > 0)
    )
  }

  const clearCart = () => {
    setCartItems([])
    setIncludeSample(false)
  }

  const placePreorder = async () => {
    if (cartItems.length === 0) return
    if (!authUser) {
      navigateTo('account')
      setAuthMessage('Please sign in to place a pre-order.')
      return
    }
    if (!pickupDate) {
      setOrderError('Please select a pickup date.')
      return
    }
    setOrderError(null)
    try {
      await _placePreorder()
    } catch (err) {
      console.error('[placePreorder] unhandled exception:', err)
      setOrderError('Something went wrong. Please try again.')
    }
  }

  const _placePreorder = async () => {

    const totalCents = cartItems.reduce((sum, item) => {
      if (item.productId === 'custom') return sum + (item.custom?.unitPrice ?? 0) * item.quantity * 100
      const product = loafProducts.find(p => p.id === item.productId)
      const unitPrice = item.size === 'mini' ? MINI_LOAF_PRICE : getLoafPriceForProduct(product)
      return sum + unitPrice * item.quantity * 100
    }, 0)

    // 001_init: money columns + (after migration 010) items + pickup_date.
    // 004-style: items + total_cents + pickup_date, no subtotal/delivery.
    const pickupIso = pickupDate.toISOString().split('T')[0]
    const pickupWindowId = await resolvePickupWindowId(supabase, pickupIso)
    const itemsPayload = buildOrderItemsPayload(cartItems, includeSample)
    const orderId = crypto.randomUUID()
    const baseRow = {
      id: orderId,
      user_id: authUser.id,
      items: itemsPayload,
      status: 'pending',
      total_cents: totalCents,
      pickup_date: pickupIso,
      pickup_window_id: pickupWindowId,
    }
    const legacyMoneyRow = {
      ...baseRow,
      subtotal_cents: totalCents,
      delivery_cents: 0,
    }

    let { data: newOrder, error } = await supabase.from('orders').insert(legacyMoneyRow).select().single()
    if (error && /subtotal|delivery_cents|schema cache/i.test(error.message ?? '')) {
      ({ data: newOrder, error } = await supabase.from('orders').insert(baseRow).select().single())
    }

    if (error) {
      console.error('Failed to save order:', error)
      const msg = error.message ?? ''
      if (msg.includes('row-level security') || msg.includes('RLS')) {
        setOrderError('Your order could not be saved (database permissions). Please contact the bakery.')
      } else if (msg.includes('foreign key') || msg.includes('profiles')) {
        setOrderError('Account setup is incomplete. Try signing out and back in, then try again.')
      } else if (msg.includes('pickup_window_id')) {
        setOrderError(
          'Pickup window: in Supabase SQL Editor, run: ALTER TABLE public.orders ALTER COLUMN pickup_window_id DROP NOT NULL; — Or set VITE_PICKUP_WINDOW_ID in .env to a UUID from your pickup_windows table.',
        )
      } else if (msg.includes('items') || msg.includes('schema cache') || msg.includes('pickup_date')) {
        setOrderError(
          'Database setup is incomplete. In Supabase → SQL → New query, paste and run supabase/migrations/010_orders_app_columns.sql from this project, then try again.',
        )
      } else {
        setOrderError(`Could not place your order: ${msg}`)
      }
      return
    }

    // Resolve item names for the confirmation + email
    const resolvedItems = cartItems.map((item) => {
      if (item.productId === 'custom') return { name: 'Custom Loaf', size: item.size, quantity: item.quantity }
      const product = loafProducts.find((p) => p.id === item.productId)
      return { name: product?.name ?? item.productId, size: item.size, quantity: item.quantity }
    })

    // Use pickupIso as fallback in case the insert didn't return the row
    const savedPickupDate = newOrder?.pickup_date ?? pickupIso
    const savedOrderId = newOrder?.id ?? orderId

    // Send confirmation email via Edge Function
    if (authUser.email) {
      console.log('[email] invoking order-confirmation for', authUser.email)
      supabase.functions.invoke('order-confirmation', {
        body: {
          to: authUser.email,
          customerName: user?.name ?? 'there',
          items: resolvedItems,
          pickupDate: savedPickupDate,
          includeSample,
          totalCents,
        },
      }).then(({ data, error }) => {
        if (error) {
          console.warn('[email] edge function error:', error)
        } else if (data?.error) {
          console.warn('[email] resend error:', data.error, data)
        } else {
          console.log('[email] sent ok, id:', data?.id)
        }
      }).catch((err) => console.warn('[email] order-confirmation failed:', err))
    } else {
      console.warn('[email] skipped — authUser.email is empty')
    }

    setOrders((prev) => [{
      id: savedOrderId,
      createdAt: newOrder?.created_at ?? new Date().toISOString(),
      items: cartItems,
      includeSample,
      status: 'pending',
      pickupDate: savedPickupDate,
    }, ...prev])
    setOrderSuccess({
      id: savedOrderId,
      items: resolvedItems,
      pickupDate: savedPickupDate,
      includeSample,
      totalCents,
    })
    clearCart()
  }

  const toggleFavorite = (productId) => {
    if (!user) { setShowAuthPrompt(true); return }
    setFavorites((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    )
  }

  const handleFavoritesNav = () => {
    if (!user) { setShowAuthPrompt(true); return }
    navigateTo('favorites')
  }

  const resetAuthState = () => { setAuthError(''); setAuthMessage(''); setAuthLoaderActive(false) }

  const handleSignIn = async (event) => {
    event.preventDefault()
    resetAuthState()
    setAuthLoaderActive(true)
    const formData = new FormData(event.currentTarget)
    const email = formData.get('email')?.toString().trim() ?? ''
    const password = formData.get('password')?.toString().trim() ?? ''
    if (!email || !password) { setAuthLoaderActive(false); return }

    const { data: signInData, error } = await supabase.auth.signInWithPassword({ email, password })
    setAuthLoaderActive(false)
    if (error) {
      const msg = error.message ?? ''
      if (msg.toLowerCase().includes('invalid login') || msg.toLowerCase().includes('invalid credentials')) {
        setAuthError('Incorrect email or password. If you signed up with Google, use "Sign in with Google" below.')
      } else if (msg.toLowerCase().includes('email not confirmed')) {
        setAuthError('Please confirm your email first — check your inbox for a confirmation link from LeavenHeaven.')
      } else {
        setAuthError(msg || 'Sign in failed. Please try again.')
      }
      return
    }
    if (signInData?.user && !signInData.user.email_confirmed_at) {
      await supabase.auth.signOut()
      setAuthError('Please confirm your email before signing in — check your inbox for a confirmation link from LeavenHeaven.')
    }
  }

  const handleSignUp = async (event) => {
    event.preventDefault()
    resetAuthState()
    setAuthLoaderActive(true)
    const formData = new FormData(event.currentTarget)
    const name = formData.get('name')?.toString().trim() ?? ''
    const email = formData.get('email')?.toString().trim() ?? ''
    const password = formData.get('password')?.toString().trim() ?? ''
    if (!email || !password) { setAuthLoaderActive(false); return }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}/?next=account`,
      },
    })
    setAuthLoaderActive(false)

    if (error) {
      const msg = error.message ?? ''
      if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('already been registered') || error.status === 422) {
        setAuthError('An account with this email already exists. Please sign in instead.')
        setAccountMode('signin')
      } else {
        setAuthError(msg || 'Sign up failed. Please try again.')
      }
      return
    }

    if (data?.user && (!data.user.identities || data.user.identities.length === 0)) {
      setAuthError('An account with this email already exists. Please sign in instead.')
      setAccountMode('signin')
      return
    }

    if (data?.user) {
      await supabase.from('profiles').upsert(
        { id: data.user.id, display_name: name || email?.split('@')[0] },
        { onConflict: 'id' },
      )
      setAuthMessage('✓ Account created! Check your email for a confirmation link, then sign in here.')
      setAccountMode('signin')
    } else {
      setAuthError('Something went wrong. Please try again.')
    }
  }

  const handleForgotPassword = async (event) => {
    event.preventDefault()
    resetAuthState()
    setAuthLoaderActive(true)
    const formData = new FormData(event.currentTarget)
    const email = formData.get('email')?.toString().trim() ?? ''
    if (!email) { setAuthLoaderActive(false); return }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/?next=account`,
    })
    setAuthLoaderActive(false)
    if (error) {
      setAuthError(error.message || 'Could not send reset email. Please try again.')
    } else {
      setAuthMessage('✓ Check your email — a password reset link is on its way.')
      setAccountMode('signin')
    }
  }

  const handleUpdatePassword = async (event) => {
    event.preventDefault()
    resetAuthState()
    setAuthLoaderActive(true)
    const formData = new FormData(event.currentTarget)
    const password = formData.get('password')?.toString().trim() ?? ''
    const confirm = formData.get('confirm')?.toString().trim() ?? ''
    if (!password) { setAuthLoaderActive(false); return }
    if (password !== confirm) {
      setAuthError('Passwords don\'t match.')
      setAuthLoaderActive(false)
      return
    }

    const { error } = await supabase.auth.updateUser({ password })
    setAuthLoaderActive(false)
    if (error) {
      setAuthError(error.message || 'Could not update password. Please try again.')
    } else {
      setAuthMessage('✓ Password updated! You\'re signed in.')
      setAccountMode('signin')
    }
  }

  const signInGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/?next=account` : undefined,
      },
    })
  }

  return (
    <>
      <main id="top">
        <div className="page">
          <NavBar
            currentPage={currentPage}
            cartCount={cartCount}
            searchOpen={searchOpen}
            searchQuery={searchQuery}
            navOpen={navOpen}
            isAdmin={isAdmin}
            onNavigate={navigateTo}
            onToggleNav={() => setNavOpen((o) => !o)}
            onSearchToggle={() => setSearchOpen((o) => !o)}
            onSearchClose={() => setSearchOpen(false)}
            onSearchChange={setSearchQuery}
            onFavoritesNav={handleFavoritesNav}
          />

          {showAuthPrompt && (
            <div className="auth-prompt-overlay" role="dialog" aria-label="Sign in to save favorites">
              <div className="auth-prompt-backdrop" onClick={() => setShowAuthPrompt(false)} aria-hidden="true" />
              <div className="auth-prompt-panel">
                <h3 className="auth-prompt-title">Sign in to save favorites</h3>
                <p className="auth-prompt-text">Create an account or sign in to save your favorite loaves.</p>
                <div className="auth-prompt-actions">
                  <button type="button" className="auth-prompt-btn auth-prompt-btn--primary" onClick={() => { setShowAuthPrompt(false); navigateTo('account') }}>
                    Sign in / Sign up
                  </button>
                  <button type="button" className="auth-prompt-btn auth-prompt-btn--secondary" onClick={() => setShowAuthPrompt(false)}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {searchOpen && (
            <div className="search-overlay-mobile" role="dialog" aria-label="Search loaves">
              <div className="search-overlay-mobile-backdrop" onClick={() => setSearchOpen(false)} aria-hidden="true" />
              <div className="search-overlay-mobile-panel">
                <input
                  type="search"
                  className="nav-search-input"
                  placeholder="Search loaves..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  aria-label="Search loaves"
                />
              </div>
            </div>
          )}

          <div className="header-offer-bar">
            <button type="button" className="header-offer-bar-btn" onClick={() => navigateTo('preorder')}>
              Get a free sampler when you checkout TODAY!
            </button>
          </div>

          {countdown && (
            <div className="site-cutoff-banner" onClick={() => navigateTo('preorder')}>
              <span className="site-cutoff-banner-label">This Sunday's order cutoff</span>
              <span className="site-cutoff-banner-timer">{countdown}</span>
              <span className="site-cutoff-banner-cta">Order now →</span>
            </div>
          )}

          {/* Home */}
          <section className={`hero${currentPage === 'home' ? '' : ' is-hidden'}`}>
            <div>
              <h1 className="hero-title">Sourdough: the bread your body will thank you for.</h1>
              <p className="hero-subtitle">
                An artisan sourdough bakery and cafe built around healthy, quality ingredients, macro-friendly desserts, specialty coffee, and small-batch kombucha.
              </p>
              <div className="hero-actions">
                <button type="button" className="btn" onClick={() => navigateTo('preorder')}>Pre-order now</button>
                <a href="#menu" className="btn btn-secondary">Learn more</a>
              </div>
            </div>
            <div className="hero-image-cell">
              <div className="hero-image-wrap">
                <img src={heroLoavesImage} alt="Fresh artisan sourdough loaves" className="hero-image" />
              </div>
            </div>
          </section>

          <div className="home-banner-strip" style={{ display: currentPage === 'home' ? undefined : 'none' }}>
            <div className="slogan-banner slogan-banner--top">
              <div className="slogan-track">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="slogan-track__part" aria-hidden="true">
                    <span>Healthy quality ingredients</span>
                    <span>Your body will thank you</span>
                    <span>Indulge without guilt</span>
                    <span>Your macro friendly bakery </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <section id="mission" className={currentPage === 'home' ? '' : 'is-hidden'}>
            <div className="section-heading">
              <div>
                <div className="section-label">Mission &amp; vision</div>
                <div className="section-title">Healthy never looked this good.</div>
              </div>
            </div>
            <div className="mission-grid">
              <div className="mission-block">
                <div className="mission-title">Mission</div>
                <p className="mission-text">
                  To create a bakery where every ingredient has a purpose and every bite leaves you feeling nourished, not weighed down. We focus on slow-fermented sourdough, better-for-you sweeteners, and high-protein options that fit your lifestyle.
                </p>
              </div>
              <div className="mission-block">
                <div className="mission-title">Vision</div>
                <p className="mission-text">
                  A space where you can grab a loaf for the week, a macro-friendly dessert for tonight, and a coffee or kombucha to sip while you slow down. A cafe + bakery that proves you can indulge without guilt – and your body will thank you for it.
                </p>
              </div>
            </div>
          </section>

          <section id="menu" className={currentPage === 'home' ? '' : 'is-hidden'}>
            <div className="section-heading">
              <div>
                <div className="section-label">Menu preview</div>
                <div className="section-title">What we're baking &amp; brewing.</div>
              </div>
            </div>
            <div className="menu-grid">
              <div className="menu-column">
                <div className="menu-column-header">Sourdough breads</div>
                <div className="menu-item"><span className="menu-item-label">Classic white / country</span></div>
                <div className="menu-item"><span className="menu-item-label">Rye</span></div>
                <div className="menu-item"><span className="menu-item-label">Savory loaves</span><span className="menu-item-note">herb, olive, seed</span></div>
                <div className="menu-item"><span className="menu-item-label">Sweet loaves</span><span className="menu-item-note">cinnamon raisin, pumpkin spice, apple</span></div>
                <div className="menu-item"><span className="menu-item-label">Mini loaves</span><span className="menu-item-note">perfect for the week</span></div>
              </div>
              <div className="menu-column">
                <div className="menu-column-header">Healthy / fitness desserts <span className="menu-coming">Coming soon</span></div>
                <div className="menu-item"><span className="menu-item-label">Greek yogurt cheesecakes</span><span className="menu-item-note">single serve</span></div>
                <div className="menu-item"><span className="menu-item-label">Protein muffins &amp; mug cakes</span></div>
                <div className="menu-item"><span className="menu-item-label">Low-sugar mousse cups</span></div>
                <div className="menu-item"><span className="menu-item-label">Parfaits</span><span className="menu-item-note">with sourdough chunks</span></div>
                <p className="menu-item-note">Macros &amp; nutrition info will be listed for all desserts.</p>
              </div>
              <div className="menu-column">
                <div className="menu-column-header">Coffee, kombucha &amp; shakes <span className="menu-coming">Coming soon</span></div>
                <div className="menu-item"><span className="menu-item-label">Espresso &amp; Americanos</span></div>
                <div className="menu-item"><span className="menu-item-label">Lattes</span><span className="menu-item-note">classic &amp; specialty</span></div>
                <div className="menu-item"><span className="menu-item-label">Kombucha</span><span className="menu-item-note">3–5 rotating flavors</span></div>
                <div className="menu-item"><span className="menu-item-label">Smoothies &amp; protein shakes</span></div>
                <p className="menu-item-note">Dairy-free and low-sugar options available for most drinks.</p>
              </div>
            </div>
          </section>

          <section id="social" className={currentPage === 'home' ? '' : 'is-hidden'}>
            <div className="section-heading">
              <div>
                <div className="section-label">My socials</div>
                <div className="section-title">Connect.</div>
              </div>
            </div>
            <div className="social-grid">
              <div className="social-card social-card--links">
                <div className="social-line">
                  <span className="social-label">Instagram</span>
                  <a href="https://instagram.com/audcast_" target="_blank" rel="noopener noreferrer" className="social-handle">@audcast_</a>
                </div>
                <div className="social-line">
                  <span className="social-label">TikTok</span>
                  <span className="social-handle social-handle--muted">Coming soon</span>
                </div>
                <div className="social-line">
                  <span className="social-label">Email</span>
                  <a href="mailto:audreyannagoddard@gmail.com" className="social-handle">audreyannagoddard@gmail.com</a>
                </div>
              </div>
            </div>
          </section>

          {/* Pre-order */}
          <section id="preorder-store" className={currentPage === 'preorder' ? '' : 'is-hidden'}>
            <div className="section-heading">
              <div>
                <div className="section-label">Pre-order online</div>
                <div className="section-title">Build your loaf order &amp; save favorites.</div>
              </div>
              {countdown && (
                <div className="preorder-cutoff-pill">
                  <span className="preorder-cutoff-label">This Sunday's cutoff</span>
                  <span className="preorder-cutoff-timer">{countdown}</span>
                </div>
              )}
            </div>
            <div className="preorder-store-grid">
              <aside className="cart-summary">
                {orderSuccess ? (
                  <div className="order-confirm">
                    <div className="order-confirm-check">✓</div>
                    <div className="order-confirm-title">Order placed!</div>

                    <div className="order-confirm-section">
                      <div className="order-confirm-label">Your items</div>
                      {orderSuccess.items.map((item, i) => (
                        <div key={i} className="order-confirm-item">
                          {item.quantity}× {item.name}
                          <span className="order-confirm-item-size">{item.size === 'mini' ? ' (Mini)' : ''}</span>
                        </div>
                      ))}
                      {orderSuccess.includeSample && (
                        <div className="order-confirm-item order-confirm-item--sample">+ Free sample loaf</div>
                      )}
                    </div>

                    <div className="order-confirm-section order-confirm-pickup">
                      <div className="order-confirm-label">Pickup</div>
                      <div className="order-confirm-pickup-date">
                        📅{' '}
                        {new Date(orderSuccess.pickupDate + 'T12:00:00').toLocaleDateString('en-US', {
                          weekday: 'long', month: 'long', day: 'numeric',
                        })}
                      </div>
                      <div className="order-confirm-pickup-addr">📍 {PICKUP_ADDRESS}</div>
                      {PICKUP_NOTES && <div className="order-confirm-pickup-notes">{PICKUP_NOTES}</div>}
                    </div>

                    {authUser?.email && (
                      <p className="order-confirm-email">
                        A confirmation email is on its way to <strong>{authUser.email}</strong>.
                      </p>
                    )}

                    <button
                      type="button"
                      className="btn-small btn-secondary"
                      onClick={() => setOrderSuccess(null)}
                    >
                      Place another order
                    </button>
                  </div>
                ) : (
                <>
                <div className="cart-summary-heading">
                  <h2 className="cart-summary-title">Cart</h2>
                </div>
                {cartItems.length === 0 ? (
                  <div className="cart-empty-state">
                    <div className="cart-empty-icon">🧺</div>
                    <p className="cart-empty-title">Your basket is empty</p>
                    <p className="cart-empty-sub">Pick a loaf to get started!</p>
                    <button
                      type="button"
                      className="btn-fill-basket"
                      onClick={() => navigateTo('loaves')}
                    >
                      Fill up your Basket
                    </button>
                  </div>
                ) : (
                  <ul className="cart-items cart-items--simple">
                    {cartItems.map((item) => {
                      const isCustom = item.productId === 'custom'
                      const product = !isCustom ? loafProducts.find((p) => p.id === item.productId) : null
                      if (!isCustom && !product) return null
                      const sizeLabel = item.size === 'mini' ? 'Mini' : item.size === 'sandwich' ? 'Sandwich' : 'Loaf'
                      const unitPrice = isCustom
                        ? (item.custom?.unitPrice ?? 0)
                        : (item.size === 'mini' ? MINI_LOAF_PRICE : getLoafPriceForProduct(product))
                      const lineTotal = unitPrice * item.quantity
                      const favId = isCustom ? 'custom' : product.id
                      const isFav = favorites.includes(favId)
                      return (
                        <li key={item.key} className="cart-item-simple">
                          <span className="cart-item-label">{sizeLabel} {isCustom ? 'Custom' : product.name} Loaf</span>
                          {!isCustom && LOAF_IMAGES[product.id] && (
                            <div className="cart-item-thumb">
                              <img src={LOAF_IMAGES[product.id]} alt={product.name} />
                            </div>
                          )}
                          <button
                            type="button"
                            className={`cart-item-fav fav-toggle${isFav ? ' fav-toggle--active' : ''}`}
                            onClick={() => toggleFavorite(favId)}
                            aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
                          >
                            <svg className="icon-heart" viewBox="0 0 24 24" fill={isFav ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                            </svg>
                          </button>
                          <div className="cart-item-qty">
                            <button type="button" className="cart-qty-btn" onClick={() => updateCartItemQuantity(item.key, -1)} aria-label="Decrease">−</button>
                            <span className="cart-qty-num">{item.quantity}</span>
                            <button type="button" className="cart-qty-btn" onClick={() => updateCartItemQuantity(item.key, 1)} aria-label="Increase">+</button>
                          </div>
                          <span className="cart-item-price">${lineTotal}</span>
                        </li>
                      )
                    })}
                  </ul>
                )}
                <div className="cart-sample-wrap">
                  {!includeSample && (
                    <p className="cart-sample-hint">Add items to your order and get a free sample on us!</p>
                  )}
                  <button
                    type="button"
                    className={`btn-sample${includeSample ? ' btn-sample--active' : ''}`}
                    onClick={() => setIncludeSample((prev) => !prev)}
                    disabled={cartItems.length === 0}
                  >
                    {includeSample ? 'Free sample added ✓' : 'Add free sample'}
                  </button>
                  {includeSample && <p className="cart-sample-beneath">+ Free sample loaf included with your order!</p>}
                </div>

                {/* Pickup window */}
                <div className="cart-pickup-wrap">
                  <div className="cart-pickup-label">Choose Your Pickup Date</div>
                  {pickupWindows.length === 0 ? (
                    <p className="cart-pickup-closed">No open pickup windows right now — check back soon.</p>
                  ) : (
                    <div className="cart-pickup-options">
                      {pickupWindows.map((w, i) => {
                        const isActive = pickupDate && pickupDate.toISOString().split('T')[0] === w.iso
                        const monthDay = w.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                        const weekLabel = i === 0 ? 'This Sunday' : i === 1 ? 'Next Sunday' : '+2 Sundays'
                        return (
                          <button
                            key={w.iso}
                            type="button"
                            className={`cart-pickup-btn${isActive ? ' cart-pickup-btn--active' : ''}`}
                            onClick={() => setPickupDate(w.date)}
                          >
                            <span className="cart-pickup-btn-date">{monthDay}</span>
                            <span className="cart-pickup-btn-week">{weekLabel}</span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                  <div className="cart-pickup-location">
                    <span className="cart-pickup-location-label">Pickup location</span>
                    <span className="cart-pickup-location-addr">📍 {PICKUP_ADDRESS}</span>
                  </div>
                </div>

                <div className="cart-actions">
                  {!authUser && cartItems.length > 0 && (
                    <p className="cart-auth-notice">
                      <button type="button" className="account-mode-link" onClick={() => navigateTo('account')}>Sign in</button>{' '}to place your pre-order.
                    </p>
                  )}
                  {orderError && <p className="cart-order-error">{orderError}</p>}
                  <button type="button" className="btn-small" onClick={placePreorder} disabled={cartItems.length === 0 || !pickupDate}>
                    Place pre-order
                  </button>
                </div>
                </>
                )}
              </aside>

              <div className="preorder-products">
                {loafProducts.map((product) => {
                  const isFavorite = favorites.includes(product.id)
                  return (
                    <div
                      key={product.id}
                      className={[
                        'preorder-product-card',
                        product.seasonal ? 'preorder-product-card--has-banner' : '',
                        product.seasonal && product.season !== currentSeason ? 'loaf-card--out-of-season' : '',
                        product.soldOut ? 'preorder-product-card--sold-out' : '',
                      ].filter(Boolean).join(' ')}
                    >
                      {product.seasonal && <span className="loaf-season-banner">Limited edition</span>}
                      {product.soldOut && <span className="loaf-sold-out-banner">Sold out</span>}
                      {LOAF_IMAGES[product.id] && (
                        <div className="loaf-image-wrap">
                          <img src={LOAF_IMAGES[product.id]} alt="" className="loaf-image" />
                        </div>
                      )}
                      <div className="preorder-product-name preorder-product-name--card">{product.name}</div>
                      <div className="preorder-product-header">
                        <button
                          type="button"
                          className={`fav-toggle${isFavorite ? ' fav-toggle--active' : ''}`}
                          onClick={() => toggleFavorite(product.id)}
                          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                        >
                          <svg className="icon-heart" viewBox="0 0 24 24" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                          </svg>
                        </button>
                      </div>
                      <div className="preorder-product-body">
                        {(() => {
                          const isOutOfSeason = product.seasonal && product.season !== currentSeason
                          if (product.soldOut || isOutOfSeason) {
                            return <div className="loaf-sold-out">{product.soldOut ? 'Sold out' : 'Out of season'}</div>
                          }
                          return (
                            <div className="preorder-actions">
                              <div className="add-btn-with-price">
                                <button type="button" className="btn-small btn-add" onClick={() => addToCart(product.id, 'loaf')}>Add Loaf</button>
                                <div className="add-btn-price">${getLoafPriceForProduct(product)}</div>
                              </div>
                              <div className="add-btn-with-price">
                                <button type="button" className="btn-small btn-secondary btn-add" onClick={() => addToCart(product.id, 'mini')}>Add Mini</button>
                                <div className="add-btn-price">${MINI_LOAF_PRICE}</div>
                              </div>
                            </div>
                          )
                        })()}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>

          <section id="preorder" className={currentPage === 'preorder' ? '' : 'is-hidden'}>
            <div className="section-heading">
              <div>
                <div className="section-label">Pre-order &amp; subscriptions</div>
                <div className="section-title">Fresh loaves, held just for you.</div>
              </div>
            </div>
            <div className="preorder">
              <div className="preorder-card">
                <div className="preorder-badge">Weekly pre-order</div>
                <div className="preorder-title">Reserve your sourdough in advance.</div>
                <p className="section-body">Choose your loaf, size, and any add-ons, and place your order. Pick up fresh. HURRY, your bread is waiting for you.</p>
                <ul className="preorder-list">
                  <li>Classic, rye, savory, or sweet loaves.</li>
                  <li>Full loaf or mini loaves for the week.</li>
                </ul>
              </div>
              <div className="preorder-card">
                <div className="preorder-badge">Loaf of the week;</div>
                <div className="preorder-title">A new feature loaf, on repeat.</div>
                <p className="section-body">One rotating sourdough flavor – like cinnamon raisin, seeded rye, pumpkin spice, or olive &amp; herb – ready on your schedule.</p>
                <ul className="preorder-list">
                  <li>Pick weekly or bi-weekly pickups.</li>
                  <li>Pause easily whenever you&apos;re away.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Loaves */}
          <section id="loaves" className={currentPage === 'loaves' ? '' : 'is-hidden'}>
            <div className="section-heading">
              <div>
                <div className="section-label">Loaves</div>
                <div className="section-title">Signature sourdough flavors.</div>
              </div>
            </div>

            {/* Loaf of the week */}
            {lotwProduct && (
              <div className="lotw-card">
                <div className="lotw-badge">Loaf of the Week</div>
                <div className="lotw-inner">
                  {LOAF_IMAGES[lotwProduct.id] && (
                    <div className="lotw-image-wrap">
                      <img src={LOAF_IMAGES[lotwProduct.id]} alt={lotwProduct.name} className="lotw-image" />
                    </div>
                  )}
                  <div className="lotw-content">
                    <div className="lotw-name">{lotwProduct.name}</div>
                    <p className="lotw-description">
                      {lotwProduct.description}{lotwProduct.inclusion ? ` It includes ${lotwProduct.inclusion}.` : ''}
                    </p>
                    <div className="lotw-actions">
                      {lotwProduct.soldOut || (lotwProduct.seasonal && lotwProduct.season !== currentSeason) ? (
                        <span className="loaf-sold-out">
                          {lotwProduct.soldOut ? 'Sold out' : 'Out of season'}
                        </span>
                      ) : (
                        <>
                          <div className="add-btn-with-price">
                            <button type="button" className="btn-small btn-add" onClick={() => addToCart(lotwProduct.id, 'loaf')}>
                              Add Loaf
                            </button>
                            <div className="add-btn-price">${getLoafPriceForProduct(lotwProduct)}</div>
                          </div>
                          <div className="add-btn-with-price">
                            <button type="button" className="btn-small btn-secondary btn-add" onClick={() => addToCart(lotwProduct.id, 'mini')}>
                              Add Mini
                            </button>
                            <div className="add-btn-price">${MINI_LOAF_PRICE}</div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="loaves-grid">
              {loafProducts.filter((p) => !p.seasonal && !p.proteinCategory).map((product) => (
                <LoafCard
                  key={product.id}
                  product={product}
                  isFavorite={favorites.includes(product.id)}
                  loafCartItem={cartItems.find((i) => i.productId === product.id && i.size === 'loaf')}
                  miniCartItem={cartItems.find((i) => i.productId === product.id && i.size === 'mini')}
                  onToggleFavorite={toggleFavorite}
                  onUpdateQuantity={updateCartItemQuantity}
                  onAddToCart={addToCart}
                />
              ))}
            </div>

            <div className="section-heading section-heading--seasonal">
              <div>
                <div className="section-label">High protein</div>
                <h2 className="section-title protein-loaves-title">Protein Loaves</h2>
                <div className="section-caption">Savory, sweet, and advanced high-protein options.</div>
              </div>
            </div>

            {[
              { key: 'savory', title: 'Savory Protein Loaves' },
              { key: 'sweet', title: 'Sweet Protein Loaves' },
              { key: 'advanced', title: 'Deluxe Protein Loaves' },
            ].map(({ key, title }) => {
              const proteinLoaves = loafProducts.filter((p) => p.proteinCategory === key)
              if (proteinLoaves.length === 0) return null
              return (
                <div key={key} className="seasonal-group">
                  <h3 className="seasonal-group-title">{title}</h3>
                  <div className="loaves-grid">
                    {proteinLoaves.map((product) => (
                      <LoafCard
                        key={product.id}
                        product={product}
                        isFavorite={favorites.includes(product.id)}
                        loafCartItem={cartItems.find((i) => i.productId === product.id && i.size === 'loaf')}
                        miniCartItem={cartItems.find((i) => i.productId === product.id && i.size === 'mini')}
                        onToggleFavorite={toggleFavorite}
                        onUpdateQuantity={updateCartItemQuantity}
                        onAddToCart={addToCart}
                      />
                    ))}
                  </div>
                </div>
              )
            })}

            <div className="section-heading section-heading--seasonal">
              <div>
                <div className="section-label">Seasonal</div>
                <div className="section-title">Limited edition flavors.</div>
              </div>
            </div>

            {[currentSeason, ...SEASON_ORDER.filter((s) => s !== currentSeason)].map((seasonKey) => {
              const seasonLoaves = loafProducts.filter((p) => p.seasonal && p.season === seasonKey)
              if (seasonLoaves.length === 0) return null
              return (
                <div key={seasonKey} className="seasonal-group">
                  <h3 className="seasonal-group-title">{SEASON_LABELS[seasonKey]}</h3>
                  <div className="loaves-grid">
                    {seasonLoaves.map((product) => (
                      <LoafCard
                        key={product.id}
                        product={product}
                        isFavorite={favorites.includes(product.id)}
                        loafCartItem={cartItems.find((i) => i.productId === product.id && i.size === 'loaf')}
                        miniCartItem={cartItems.find((i) => i.productId === product.id && i.size === 'mini')}
                        onToggleFavorite={toggleFavorite}
                        onUpdateQuantity={updateCartItemQuantity}
                        onAddToCart={addToCart}
                        showBanner
                        isOutOfSeason={product.season !== currentSeason}
                      />
                    ))}
                  </div>
                </div>
              )
            })}

            <p className="section-note">Add to pre-order and we&apos;ll have it ready for you. Full loaves in small batches; mini loaves available.</p>
          </section>

          {/* Customize */}
          <section id="customize" className={currentPage === 'customize' ? '' : 'is-hidden'}>
            <div className="section-heading">
              <div>
                <div className="section-label">Build your loaf</div>
                <div className="section-title">Customize your own loaf!</div>
              </div>
            </div>
            <BuildYourLoaf onAddToCart={addCustomToCart} />
            <div className="customize-save-row">
              <button
                type="button"
                className={`fav-toggle fav-toggle--customize${favorites.includes('custom') ? ' fav-toggle--active' : ''}`}
                onClick={() => toggleFavorite('custom')}
                aria-label={favorites.includes('custom') ? 'Remove custom loaf from favorites' : 'Save custom loaf to favorites'}
              >
                <svg className="icon-heart" viewBox="0 0 24 24" fill={favorites.includes('custom') ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                <span>{favorites.includes('custom') ? 'Saved to favorites' : 'Save loaf to favorites'}</span>
              </button>
            </div>
          </section>

          {/* Favorites */}
          <section id="favorites" className={currentPage === 'favorites' ? '' : 'is-hidden'}>
            <div className="section-heading">
              <div>
                <div className="section-label">Favorites</div>
                <div className="section-title">Your favorite flavors.</div>
              </div>
            </div>
            <div className="info-grid">
              <div className="info-card">
                <div className="mission-title">Favorite flavors</div>
                {!user ? (
                  <div className="auth-prompt-inline">
                    <p className="account-summary">Sign in or create an account to save your favorite loaves.</p>
                    <button type="button" className="auth-prompt-inline-btn" onClick={() => navigateTo('account')}>Sign in / Sign up</button>
                  </div>
                ) : favorites.length === 0 ? (
                  <p className="account-summary">
                    Tap the{' '}
                    <svg style={{ display: 'inline', verticalAlign: 'middle', marginBottom: '2px' }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                    {' '}on any loaf to mark it as a favorite.
                  </p>
                ) : (
                  <FavoritesList favorites={favorites} onToggleFavorite={toggleFavorite} />
                )}
              </div>
            </div>
          </section>

          {/* Account */}
          <section id="account" className={currentPage === 'account' ? '' : 'is-hidden'}>
            <div className="section-heading">
              <div>
                <div className="section-label">My account</div>
                <div className="section-title">Account details &amp; past orders.</div>
              </div>
            </div>
            <div className="info-grid">
              <div className="info-card">
                <div className="mission-title">
                  {authLoading ? 'Loading...' : user ? 'Account details' : 'Sign in to your account'}
                </div>
                {authLoading ? (
                  <p className="account-summary">Checking session...</p>
                ) : user ? (
                  <div className="account-details">
                    {user.avatar && <img src={user.avatar} alt="" className="account-avatar" />}
                    <div className="account-details-fields">
                      {user.name && (
                        <p className="account-detail-row">
                          <span className="account-detail-label">Name</span>
                          <span className="account-detail-value">{user.name}</span>
                        </p>
                      )}
                      <p className="account-detail-row">
                        <span className="account-detail-label">Email</span>
                        <span className="account-detail-value">{user.email}</span>
                      </p>
                    </div>
                    <button type="button" className="btn-small btn-secondary" style={{ marginTop: '1rem' }} onClick={() => supabase.auth.signOut()}>
                      Sign out
                    </button>
                  </div>
                ) : (
                  <p className="account-meta">
                    {accountMode === 'signup' ? 'Create an account to save favorites and pre-orders.' : accountMode === 'forgot' ? 'Reset your password.' : accountMode === 'reset' ? 'Set a new password.' : 'Sign in to access your account and favorites.'}
                  </p>
                )}
                {!user && (
                  <>
                    {!['forgot', 'reset'].includes(accountMode) && (
                      <div className="account-mode-toggle">
                        <button type="button" className={`account-mode-btn ${accountMode === 'signup' ? 'is-active' : ''}`} onClick={() => { setAccountMode('signup'); resetAuthState() }}>Sign up</button>
                        <button type="button" className={`account-mode-btn ${accountMode === 'signin' ? 'is-active' : ''}`} onClick={() => { setAccountMode('signin'); resetAuthState() }}>Sign in</button>
                      </div>
                    )}
                    {authMessage && <p className="account-auth-message">{authMessage}</p>}
                    {authError && <p className="account-auth-error">{authError}</p>}
                    {accountMode === 'signup' ? (
                      <form className="account-form" onSubmit={handleSignUp}>
                        <label>Full name<input name="name" type="text" autoComplete="name" required /></label>
                        <label>Email<input name="email" type="email" autoComplete="email" required /></label>
                        <label>Password<input name="password" type="password" autoComplete="new-password" required /></label>
                        <label>Phone (optional)<input name="phone" type="tel" autoComplete="tel" /></label>
                        <button type="submit" className="btn-small" disabled={authLoaderActive}>{authLoaderActive ? 'Creating account…' : 'Sign up'}</button>
                        <p className="account-mode-switch">Already have an account?{' '}<button type="button" className="account-mode-link" onClick={() => { setAccountMode('signin'); resetAuthState() }}>Sign in</button></p>
                        <div className="account-form-divider">or</div>
                        <button type="button" className="btn-small btn-secondary" onClick={signInGoogle}>Sign up with Google</button>
                      </form>
                    ) : accountMode === 'forgot' ? (
                      <form className="account-form" onSubmit={handleForgotPassword}>
                        <p className="account-meta" style={{ marginTop: 0 }}>Enter your email and we'll send you a link to reset your password.</p>
                        <label>Email<input name="email" type="email" autoComplete="email" required /></label>
                        <button type="submit" className="btn-small" disabled={authLoaderActive}>{authLoaderActive ? 'Sending…' : 'Send reset link'}</button>
                        <p className="account-mode-switch"><button type="button" className="account-mode-link" onClick={() => { setAccountMode('signin'); resetAuthState() }}>Back to sign in</button></p>
                      </form>
                    ) : accountMode === 'reset' ? (
                      <form className="account-form" onSubmit={handleUpdatePassword}>
                        <p className="account-meta" style={{ marginTop: 0 }}>Choose a new password for your account.</p>
                        <label>New password<input name="password" type="password" autoComplete="new-password" required minLength={6} /></label>
                        <label>Confirm password<input name="confirm" type="password" autoComplete="new-password" required minLength={6} /></label>
                        <button type="submit" className="btn-small" disabled={authLoaderActive}>{authLoaderActive ? 'Updating…' : 'Update password'}</button>
                      </form>
                    ) : (
                      <form className="account-form" onSubmit={handleSignIn}>
                        <label>Email<input name="email" type="email" autoComplete="email" required /></label>
                        <label>Password<input name="password" type="password" autoComplete="current-password" required /></label>
                        <button type="submit" className="btn-small" disabled={authLoaderActive}>{authLoaderActive ? 'Signing in…' : 'Sign in'}</button>
                        <p className="account-mode-switch">
                          Don&apos;t have an account?{' '}<button type="button" className="account-mode-link" onClick={() => { setAccountMode('signup'); resetAuthState() }}>Sign up</button>
                          {' · '}<button type="button" className="account-mode-link" onClick={() => { setAccountMode('forgot'); resetAuthState() }}>Forgot password?</button>
                        </p>
                        <div className="account-form-divider">or</div>
                        <button type="button" className="btn-small btn-secondary" onClick={signInGoogle}>Sign in with Google</button>
                      </form>
                    )}
                  </>
                )}
              </div>

              <div className="info-card">
                <div className="mission-title">Past pre-orders</div>
                <div className="account-lists">
                  {favorites.length > 0 && (
                    <div className="account-favorites-removed">
                      <FavoritesList favorites={favorites} onToggleFavorite={toggleFavorite} />
                    </div>
                  )}
                  <div>
                    {orders.length === 0 ? (
                      <p className="account-summary">You haven't placed any orders yet.</p>
                    ) : (
                      <div className="orders-list">
                        {orders.map((order) => {
                          const date = new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                          const itemSummary = order.items.map(item => {
                            const product = loafProducts.find(p => p.id === item.productId)
                            const label = item.productId === 'custom' ? 'Custom loaf' : (product?.name ?? item.productId)
                            return `${item.quantity}× ${label}${item.size === 'mini' ? ' (mini)' : ''}`
                          }).join(', ')
                          const statusLabel = { pending: 'Pending', confirmed: 'Confirmed', ready: 'Ready for pickup', completed: 'Completed' }[order.status] ?? order.status
                          const pickupLabel = order.pickupDate
                            ? new Date(order.pickupDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
                            : null
                          return (
                            <div key={order.id} className="orders-list-item">
                              <div className="order-row-top">
                                <strong>{date}</strong>
                                <span className={`order-status order-status--${order.status ?? 'pending'}`}>{statusLabel}</span>
                              </div>
                              {pickupLabel && (
                                <div className="order-row-pickup">Pickup: {pickupLabel}</div>
                              )}
                              <div className="order-row-items">{itemSummary}</div>
                              {order.includeSample && <div className="order-row-note">+ Free sampler slice</div>}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Admin */}
          {isAdmin && (
            <section id="admin" className={currentPage === 'admin' ? '' : 'is-hidden'}>
              <AdminPage
                orders={adminOrders}
                profiles={adminProfiles}
                onUpdateStatus={updateOrderStatus}
                onRefresh={refreshAdminOrders}
                lotwProductId={adminLotwId}
                onUpdateLotw={handleUpdateLotw}
              />
            </section>
          )}
        </div>
      </main>

      <footer>
        <div className="footer-inner">
          <span>© Leaven Heaven – sourdough &amp; macro-friendly bakery.</span>
        </div>
      </footer>
    </>
  )
}

export default App
