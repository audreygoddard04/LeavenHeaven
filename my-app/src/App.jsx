import { useEffect, useState, useRef } from 'react'
import './App.css'
import heroLoavesImage from './images/manylaoves.jpeg'
import plainwhiteImg from './images/plainwhite.png'
import wholewheatImg from './images/wholewheat.png'
import seadedImg from './images/seaded.png'
import chedarjalapenoImg from './images/chedarjalapeno.png'
import cinnamonraisinImg from './images/cinnamonraisin.png'
import crandberrywalnutImg from './images/crandberrywalnut.png'
import croissantImg from './images/croissant.png'
import doublechocolateImg from './images/doublechocolate.png'
import lemonblueberryImg from './images/lemonblueberry.png'
import ryeImg from './images/rye.png'
import oliveImg from './images/olive.png'
import rosemarryImg from './images/rosemarry.png'
import maplepecanImg from './images/maplepecan.png'
import orangecranberryImg from './images/orangecranberry.png'
import cherrychocolateImg from './images/cherrychocolate.png'
import figwalnutImg from './images/figwalnut.png'
import cinnamonswirlImg from './images/cinnamonswirl.png'
import everythingbagelImg from './images/everythingbagel.png'
import lemonpoppyseedImg from './images/lemonpoppyseed.png'
import pumpkinspiceImg from './images/pumpkinspice.png'
import applecinnamonImg from './images/applecinnamon.png'
import roastedgarlicImg from './images/roastedgarlic.png'
import honeyoatImg from './images/honeyoat.png'
import peachImg from './images/peach.png'
import strawberryImg from './images/strawberry.png'
import pizzaImg from './images/pizza.png'
import cottagecheeseImg from './images/cottagecheese.png'
import eggwhiteloafImg from './images/eggwhiteloaf.png'
import collagenboostedloafImg from './images/collagenboostedloaf.png'
import peanutbutterImg from './images/peanutbutter.png'
import carrotcakeImg from './images/carrotcake.png'
import { BuildYourLoaf } from './components/BuildYourLoaf'
import { supabase } from './lib/supabaseClient'

const LOAF_IMAGES = {
  'classic-country-white': plainwhiteImg,
  'whole-wheat': wholewheatImg,
  'rye': ryeImg,
  'seeded': seadedImg,
  'olive': oliveImg,
  'jalapeno-cheddar': chedarjalapenoImg,
  'rosemary': rosemarryImg,
  'cinnamon-raisin': cinnamonraisinImg,
  'cinnamon-swirl': cinnamonswirlImg,
  'everything-bagel': everythingbagelImg,
  'lemon-poppyseed': lemonpoppyseedImg,
  'chocolate': doublechocolateImg,
  'croissant': croissantImg,
  'cranberry-walnut': crandberrywalnutImg,
  'pumpkin-spice': pumpkinspiceImg,
  'apple-cinnamon': applecinnamonImg,
  'roasted-garlic-herb': roastedgarlicImg,
  'maple-pecan': maplepecanImg,
  'orange-cranberry': orangecranberryImg,
  'cherry-chocolate': cherrychocolateImg,
  'fig-walnut': figwalnutImg,
  'lemon-blueberry': lemonblueberryImg,
  'honey-oat': honeyoatImg,
  'peach': peachImg,
  'strawberry': strawberryImg,
  'pizza-loaf': pizzaImg,
  // Protein loaves (reuse similar regular loaf images)
  'cheddar-jalapeno-protein': chedarjalapenoImg,
  'seeded-high-protein': seadedImg,
  'chocolate-protein-sourdough': doublechocolateImg,
  'maple-protein-oat': honeyoatImg,
  'blueberry-protein-loaf': lemonblueberryImg,
  'cottage-cheese-sourdough': cottagecheeseImg,
  'greek-yogurt-sourdough': plainwhiteImg,
  'egg-white-protein-loaf': eggwhiteloafImg,
  'collagen-boost-loaf': collagenboostedloafImg,
  'peanut-butter-protein-swirl': peanutbutterImg,
  'carrot-cake-protein-sourdough': carrotcakeImg,
}

const LOAF_PRICE = 10
const MINI_LOAF_PRICE = 6
const INCLUSION_LOAF_UPCHARGE = 2

const PROTEIN_LOAF_UPCHARGE = 4

function getLoafPriceForProduct(product) {
  let price = product?.inclusion ? LOAF_PRICE + INCLUSION_LOAF_UPCHARGE : LOAF_PRICE
  if (product?.proteinCategory) price += PROTEIN_LOAF_UPCHARGE
  return price
}

const SEASON_ORDER = ['fall', 'winter', 'spring', 'summer']
const SEASON_LABELS = { fall: 'Fall', winter: 'Winter / Holiday', spring: 'Spring', summer: 'Summer' }

function getCurrentSeason() {
  const m = new Date().getMonth()
  if (m >= 8 && m <= 10) return 'fall'
  if (m === 11 || m <= 1) return 'winter'
  if (m >= 2 && m <= 4) return 'spring'
  return 'summer'
}

const loafProducts = [
  { id: 'classic-country-white', name: 'Classic Country', description: 'Our signature sourdough made with unbleached white flour. Crisp, blistered crust and an airy open crumb.' },
  { id: 'whole-wheat', name: 'Whole Wheat', description: 'Made with whole wheat flour for a hearty texture and nutty depth. Wholesome, structured, and deeply satisfying.' },
  { id: 'rye', name: 'Rye', description: 'Crafted with rye flour for earthy complexity and a soft yet structured crumb with gentle tang.' },
  { id: 'seeded', name: 'Seeded', description: 'Folded and topped with sesame seeds, poppy seeds, flax, and sunflower seeds for crunch, flavor, and beautiful visual appeal.', inclusion: 'sesame, poppy, flax, sunflower' },
  { id: 'olive', name: 'Olive', description: 'Studded generously with Kalamata olives for briny, savory bursts in every slice.', inclusion: 'Kalamata olives' },
  { id: 'jalapeno-cheddar', name: 'Jalapeño Cheddar', description: 'Sharp cheddar melted into the crumb with sliced jalapeños for bold flavor and balanced heat.', inclusion: 'jalapeño, cheddar' },
  { id: 'rosemary', name: 'Rosemary', description: 'Fresh rosemary baked into a crisp artisan loaf for a fragrant, herb-forward finish.', inclusion: 'rosemary' },
  { id: 'cinnamon-raisin', name: 'Cinnamon Raisin', description: 'Warm cinnamon layered through plump raisins for cozy sweetness and perfect toast texture.', inclusion: 'cinnamon, raisins' },
  { id: 'chocolate', name: 'Double Chocolate', description: 'Dark chocolate chunks folded into the tangy sourdough cocoa crumb for a rich, slightly bittersweet finish.', inclusion: 'dark chocolate' },
  { id: 'croissant', name: 'Croissant Sourdough', description: 'Laminated with cultured butter for delicate flakiness while maintaining deep sourdough flavor.' },
  { id: 'cinnamon-swirl', name: 'Cinnamon Swirl', description: 'Ribbons of cinnamon sugar swirled through tender sourdough for a sweet, cozy loaf that’s perfect for toast or snacking.', inclusion: 'cinnamon sugar' },
  { id: 'everything-bagel', name: 'Everything Bagel', description: 'Topped and folded with everything bagel seasoning—sesame, poppy, garlic, onion, and salt—for bold, savory flavor in every slice.', inclusion: 'everything bagel seasoning' },
  { id: 'lemon-poppyseed', name: 'Lemon Poppyseed', description: 'Bright lemon zest and poppy seeds baked into the crumb for a light, citrusy loaf with subtle crunch and a fresh finish.', inclusion: 'lemon zest, poppy seeds' },
  { id: 'pizza-loaf', name: 'Pizza Loaf', description: 'Rustic sourdough topped with melted cheese, pepperoni, and pizza sauce for a savory, crowd-pleasing loaf that tastes like your favorite slice.', inclusion: 'mozzarella, pepperoni, pizza sauce' },
  { id: 'pumpkin-spice', name: 'Pumpkin Spice', description: 'Pumpkin purée blended with cinnamon, nutmeg, and clove for a soft, warmly spiced seasonal favorite.', inclusion: 'pumpkin purée, warm spices', seasonal: true, season: 'fall' },
  { id: 'apple-cinnamon', name: 'Apple Cinnamon', description: 'Tender apple pieces folded with cinnamon for comforting sweetness and bakery-fresh aroma.', inclusion: 'apple, cinnamon', seasonal: true, season: 'fall' },
  { id: 'cranberry-walnut', name: 'Cranberry Walnut', description: 'Tart dried cranberries and toasted walnuts create bright contrast and rustic texture.', inclusion: 'cranberries, walnuts', seasonal: true, season: 'fall' },
  { id: 'maple-pecan', name: 'Maple Pecan', description: 'Pure maple sweetness paired with buttery pecans for a cozy, autumn-inspired loaf.', inclusion: 'maple, pecans', seasonal: true, season: 'fall' },
  { id: 'roasted-garlic-herb', name: 'Roasted Garlic & Herb', description: 'Slow-roasted garlic and mixed herbs baked into the crumb for deep, savory aroma and warmth.', inclusion: 'roasted garlic, herbs', seasonal: true, season: 'fall' },
  { id: 'orange-cranberry', name: 'Orange Cranberry', description: 'Fresh orange zest and dried cranberries bring citrus brightness and festive balance.', inclusion: 'orange, cranberries', seasonal: true, season: 'winter' },
  { id: 'cherry-chocolate', name: 'Cherry Chocolate', description: 'Dark chocolate chunks with tart dried cherries for a rich, fruity winter loaf with deep flavor and a hint of sweetness.', inclusion: 'dark chocolate, dried cherries', seasonal: true, season: 'winter' },
  { id: 'fig-walnut', name: 'Fig & Walnut', description: 'Naturally sweet dried figs and toasted walnuts for a refined, old-world character.', inclusion: 'fig, walnut', seasonal: true, season: 'winter' },
  { id: 'lemon-blueberry', name: 'Lemon Blueberry', description: 'Bright lemon zest and bursts of blueberry folded throughout for a fresh, lightly sweet spring loaf.', inclusion: 'lemon, blueberries', seasonal: true, season: 'spring' },
  { id: 'honey-oat', name: 'Honey Oat', description: 'Golden honey and rolled oats incorporated into the dough for gentle sweetness and soft texture.', inclusion: 'honey, oats', seasonal: true, season: 'spring' },
  { id: 'peach', name: 'Peach', description: 'Fresh or dried peaches folded into the crumb for true summer sweetness and subtle floral notes.', inclusion: 'peach (fresh or dried)', seasonal: true, season: 'summer' },
  { id: 'strawberry', name: 'Strawberry', description: 'Dried strawberries or strawberry swirls for bright flavor, soft sweetness, and beautiful natural color.', inclusion: 'strawberry (dried or jam swirls)', seasonal: true, season: 'summer' },
  // Protein Loaves – Savory
  { id: 'cheddar-jalapeno-protein', name: 'Cheddar Jalapeño Protein Loaf', description: 'Whey isolate in the dough with sharp cheddar and jalapeño folded in. High-protein, bold and savory—perfect post-workout.', inclusion: 'sharp cheddar, jalapeño', proteinCategory: 'savory' },
  { id: 'cottage-cheese-sourdough', name: 'Cottage Cheese Sourdough', description: 'Part of the water replaced with blended cottage cheese. Boosts protein and moisture for a very soft crumb.', proteinCategory: 'savory' },
  { id: 'greek-yogurt-sourdough', name: 'Greek Yogurt Sourdough', description: '10–15% hydration swapped with Greek yogurt. Adds protein and tenderness with slight tang amplification.', proteinCategory: 'savory' },
  { id: 'seeded-high-protein', name: 'Seeded High-Protein Loaf', description: 'Hemp hearts, chia, and flax with a small whey addition. Naturally protein-dense and clean-label.', inclusion: 'hemp hearts, chia, flax', proteinCategory: 'savory' },
  // Protein Loaves – Sweet
  { id: 'chocolate-protein-sourdough', name: 'Chocolate Protein Sourdough', description: 'Chocolate whey with dark chocolate chunks. Easy macro-friendly dessert loaf.', inclusion: 'dark chocolate', proteinCategory: 'sweet' },
  { id: 'maple-protein-oat', name: 'Maple Protein Oat', description: 'Vanilla whey with oats and maple. Breakfast protein loaf.', inclusion: 'oats, maple', proteinCategory: 'sweet' },
  { id: 'blueberry-protein-loaf', name: 'Blueberry Protein Loaf', description: 'Vanilla whey with dried blueberries. Light, high-protein spring option.', inclusion: 'dried blueberries', proteinCategory: 'sweet' },
  { id: 'peanut-butter-protein-swirl', name: 'Peanut Butter Protein Swirl', description: 'Vanilla or unflavored whey with a peanut butter ribbon. High satiety, strong gym appeal.', inclusion: 'peanut butter', proteinCategory: 'sweet' },
  { id: 'carrot-cake-protein-sourdough', name: 'Carrot Cake Protein Sourdough', description: 'Vanilla whey with grated carrot and cinnamon. Optional Greek yogurt glaze (macro-friendly).', inclusion: 'carrot, cinnamon', proteinCategory: 'sweet' },
  // Protein Loaves – Advanced / Differentiated
  { id: 'collagen-boost-loaf', name: 'Collagen Boost Loaf', description: 'Unflavored collagen peptides in the dough. Less drying than whey, with beauty and gut health properties.', proteinCategory: 'advanced' },
  { id: 'egg-white-protein-loaf', name: 'Egg White Protein Loaf', description: 'Some water replaced with liquid egg whites. Higher protein without powder texture and a soft crumb.', proteinCategory: 'advanced' },
]

const MOST_POPULAR_IDS = ['greek-yogurt-sourdough', 'cinnamon-swirl', 'rosemary']
const DEFAULT_MORE_IDS = ['classic-country-white', 'jalapeno-cheddar', 'chocolate']

const FLOUR_OPTIONS = ['White', 'Whole wheat', 'Rye']

const FLOUR_PREVIEW_COLORS = {
  'White': '#e2d6c4',
  'Whole wheat': '#c9a962',
  'Rye': '#8b6914',
}

const SPICE_OPTIONS = [
  'Chocolate', 'Vanilla', 'Almond', 'Lavender', 'Matcha', 'Cinnamon', 'Honey', 'Turmeric', 
  'Chili', 'Smoked Paprika', 'Orange', 'Lemon', 'Black pepper', 'Poppyseed', 'Italian', 'Everything Bagel'
]

const SWEET_INCLUSION_OPTIONS = [
  'Cinnamon Sugar', 'Cranberries', 'Raisins', 'Dates', 'Blueberries', 'Walnuts', 'Almonds', 
  'Milk Chocolate Chips', 'Dark Chocolate Chips', 'White Chocolate Chips',
]

const SAVORY_INCLUSION_OPTIONS = [
  'Black Olives', 'Green Olives', 'Roasted Garlic', 'Sun-Dried Tomatoes', 'Caramelized Onion', 'Jalapeño', 
  'Everything Bagel Seasoning', 'Parmesan', 'Asiago', 'Cheddar', 'Feta', 'Manchego', 'Mozzarella', 'Cream cheese', 'Swiss', 'Provolone', 
]

const CHEESE_INCLUSIONS = [
  'Parmesan', 'Cheddar', 'Asiago', 'Goat cheese', 'Feta', 'Manchego', 'Mozzarella', 'Cream cheese', 'Swiss', 'Provolone', 
]

function isCheeseInclusion(name) {
  return CHEESE_INCLUSIONS.some(
    (c) => name.toLowerCase().includes(c.toLowerCase()),
  )
}

function isCustomInclusion(name, type) {
  const list = type === 'sweet' ? SWEET_INCLUSION_OPTIONS : SAVORY_INCLUSION_OPTIONS
  return !list.includes(name)
}

function getInclusionPrice(name, type) {
  if (isCustomInclusion(name, type)) return 2
  return isCheeseInclusion(name) ? 2 : 1
}

const PROTEIN_ENHANCEMENT_PRICE = 4

function getCustomItemPrice(c) {
  const base = c.size === 'mini' ? 6 : 10
  const spicesTotal = (c.spices?.length ?? 0) * 1
  const sweetTotal = (c.sweet ?? []).reduce((sum, name) => sum + getInclusionPrice(name, 'sweet'), 0)
  const savoryTotal = (c.savory ?? []).reduce((sum, name) => sum + getInclusionPrice(name, 'savory'), 0)
  const proteinEnhancementTotal = c.proteinEnhancement ? PROTEIN_ENHANCEMENT_PRICE : 0
  return base + spicesTotal + sweetTotal + savoryTotal + proteinEnhancementTotal
}

function App() {
  const [cartItems, setCartItems] = useState([])
  const [favorites, setFavorites] = useState([])
  const [user, setUser] = useState(null)
  const [orders, setOrders] = useState([])
  const [currentPage, setCurrentPage] = useState('home')
  const [navOpen, setNavOpen] = useState(false)
  const [includeSample, setIncludeSample] = useState(false)
  const [customSize, setCustomSize] = useState('loaf')
  const [customFlour, setCustomFlour] = useState(FLOUR_OPTIONS[0])
  const [customSpices, setCustomSpices] = useState([])
  const [customSweet, setCustomSweet] = useState([])
  const [customSavory, setCustomSavory] = useState([])
  const [sweetSearch, setSweetSearch] = useState('')
  const [savorySearch, setSavorySearch] = useState('')
  const [customProteinEnhancement, setCustomProteinEnhancement] = useState(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAuthPrompt, setShowAuthPrompt] = useState(false)
  const searchRef = useRef(null)

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)

  const searchResults = searchQuery.trim() === ''
    ? [...MOST_POPULAR_IDS, ...DEFAULT_MORE_IDS]
        .map((id) => loafProducts.find((p) => p.id === id))
        .filter(Boolean)
    : loafProducts.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()),
      )

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const storedUser = window.localStorage.getItem('lh_user')
      const storedFavs = window.localStorage.getItem('lh_favorites')
      const storedOrders = window.localStorage.getItem('lh_orders')
      if (storedUser) {
        setUser(JSON.parse(storedUser))
      }
      if (storedFavs) {
        setFavorites(JSON.parse(storedFavs))
      }
      if (storedOrders) {
        setOrders(JSON.parse(storedOrders))
      }
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem('lh_favorites', JSON.stringify(favorites))
    } catch {
      // ignore
    }
  }, [favorites])

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem('lh_orders', JSON.stringify(orders))
    } catch {
      // ignore
    }
  }, [orders])

  useEffect(() => {
    if (!searchOpen) return
    const handleEscape = (e) => {
      if (e.key === 'Escape') setSearchOpen(false)
    }
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false)
      }
    }
    document.addEventListener('keydown', handleEscape)
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [searchOpen])

  const addLoafToCartWithQuantity = (productId, size) => {
    addToCart(productId, size, 1)
  }

  const addToCart = (productId, size, customOptionsOrQuantity = null) => {
    if (productId === 'custom' && customOptionsOrQuantity && typeof customOptionsOrQuantity === 'object' && 'flour' in customOptionsOrQuantity) {
      const key = `custom-${Date.now()}-${Math.random().toString(36).slice(2)}`
      setCartItems((prev) => [...prev, { key, productId: 'custom', size: customOptionsOrQuantity.size, quantity: 1, custom: customOptionsOrQuantity }])
      return
    }
    const qty = typeof customOptionsOrQuantity === 'number'
      ? Math.max(1, customOptionsOrQuantity)
      : (customOptionsOrQuantity && typeof customOptionsOrQuantity === 'object' && 'quantity' in customOptionsOrQuantity)
        ? Math.max(1, customOptionsOrQuantity.quantity)
        : 1
    setCartItems((prev) => {
      const key = `${productId}-${size}`
      const existing = prev.find((item) => item.key === key)
      if (existing) {
        return prev.map((item) =>
          item.key === key
            ? { ...item, quantity: item.quantity + qty }
            : item,
        )
      }
      return [...prev, { key, productId, size, quantity: qty }]
    })
  }

  const customLoafPrice = () => {
    const base = customSize === 'mini' ? 6 : 10
    const spicesTotal = customSpices.length * 1
    const sweetTotal = customSweet.reduce((sum, name) => sum + getInclusionPrice(name, 'sweet'), 0)
    const savoryTotal = customSavory.reduce((sum, name) => sum + getInclusionPrice(name, 'savory'), 0)
    const proteinEnhancementTotal = customProteinEnhancement ? PROTEIN_ENHANCEMENT_PRICE : 0
    return base + spicesTotal + sweetTotal + savoryTotal + proteinEnhancementTotal
  }

  const addSpice = (name) => {
    if (customSpices.includes(name)) return
    setCustomSpices((prev) => [...prev, name])
  }

  const removeSpice = (name) => {
    setCustomSpices((prev) => prev.filter((s) => s !== name))
  }

  const totalInclusions = (customSweet?.length ?? 0) + (customSavory?.length ?? 0)
  const canAddInclusion = totalInclusions < 4

  const addSweet = (name) => {
    const n = (name || sweetSearch).trim()
    if (!n || customSweet.includes(n) || !canAddInclusion) return
    setCustomSweet((prev) => [...prev, n])
    setSweetSearch('')
  }

  const removeSweet = (name) => {
    setCustomSweet((prev) => prev.filter((s) => s !== name))
  }

  const addSavory = (name) => {
    const n = (name || savorySearch).trim()
    if (!n || customSavory.includes(n) || !canAddInclusion) return
    setCustomSavory((prev) => [...prev, n])
    setSavorySearch('')
  }

  const removeSavory = (name) => {
    setCustomSavory((prev) => prev.filter((s) => s !== name))
  }

  const clearCart = () => {
    setCartItems([])
    setIncludeSample(false)
  }

  const updateCartItemQuantity = (key, delta) => {
    setCartItems((prev) => {
      const next = prev
        .map((item) => {
          if (item.key !== key) return item
          const q = item.quantity + delta
          if (q < 1) return null
          return { ...item, quantity: q }
        })
        .filter(Boolean)
      return next
    })
  }

  const placePreorder = () => {
    if (cartItems.length === 0) return
    const createdAt = new Date().toISOString()
    const order = {
      id: `order-${createdAt}`,
      createdAt,
      items: cartItems,
      includeSample,
    }
    setOrders((prev) => [order, ...prev])
    setCartItems([])
    setIncludeSample(false)
  }

  const toggleFavorite = (productId) => {
    if (!user) {
      setShowAuthPrompt(true)
      return
    }
    setFavorites((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId],
    )
  }

  const handleFavoritesNav = () => {
    if (!user) {
      setShowAuthPrompt(true)
      return
    }
    navigateTo('favorites')
  }

  const addCustomToCart = () => {
    addToCart('custom', customSize, {
      flour: customFlour,
      spices: [...customSpices],
      sweet: [...customSweet],
      savory: [...customSavory],
      size: customSize,
      proteinEnhancement: customProteinEnhancement,
    })
    navigateTo('preorder')
  }

  const handleLogin = async (event) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const name = formData.get('name')?.toString().trim() ?? ''
    const email = formData.get('email')?.toString().trim() ?? ''
    const password = formData.get('password')?.toString().trim() ?? ''
    const phone = formData.get('phone')?.toString().trim() ?? ''
    const city = formData.get('city')?.toString().trim() ?? ''
    if (!email || !password) return

    let userId

    // Try to sign in first; if user doesn't exist, fall back to sign up
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError && signInError.message?.toLowerCase().includes('invalid login credentials')) {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      })
      if (signUpError) {
        // eslint-disable-next-line no-console
        console.error('Supabase signUp error', signUpError)
        return
      }
      userId = signUpData.user?.id
    } else if (signInError) {
      // eslint-disable-next-line no-console
      console.error('Supabase signIn error', signInError)
      return
    } else {
      userId = signInData.user?.id
    }

    if (userId) {
      const { error: profileError } = await supabase.from('profiles').upsert(
        {
          id: userId,
          email,
          full_name: name,
          phone,
          city,
          default_loaf_size: 'full',
          default_flour: 'white',
        },
        { onConflict: 'id' },
      )
      if (profileError) {
        // eslint-disable-next-line no-console
        console.error('Supabase profile upsert error', profileError)
      }
    }

    const nextUser = { name, email }
    setUser(nextUser)
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem('lh_user', JSON.stringify(nextUser))
      } catch {
        // ignore
      }
    }
  }

  const navigateTo = (page) => {
    setCurrentPage(page)
    setNavOpen(false)
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <>
      <main id="top">
        <div className="page">
          <header className="header">
            <button type="button" className="logo-block" onClick={() => navigateTo('home')} aria-label="Go to home">
              <div className="logo-mark">Macro Friendly Bakery</div>
              <div className="logo-name">Leaven Heaven</div>
            </button>
            <div className="header-right">
              <div className="header-controls">
                <nav className="main-nav main-nav--desktop">
                  <button
                    type="button"
                    className={currentPage === 'home' ? 'is-active' : ''}
                    onClick={() => navigateTo('home')}
                  >
                    Home
                  </button>
                  <button
                    type="button"
                    className={currentPage === 'loaves' ? 'is-active' : ''}
                    onClick={() => navigateTo('loaves')}
                  >
                    Loaves
                  </button>
                  <button
                    type="button"
                    className={currentPage === 'customize' ? 'is-active' : ''}
                    onClick={() => navigateTo('customize')}
                  >
                    Customize your loaf
                  </button>
                  <div className="nav-search-wrap" ref={searchRef}>
                    {searchOpen && (
                      <input
                        type="search"
                        className="nav-search-input"
                        placeholder="Search loaves..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                        aria-label="Search loaves"
                      />
                    )}
                    <button
                      type="button"
                      className={`nav-search${searchOpen ? ' nav-search--active' : ''}`}
                      onClick={() => setSearchOpen((o) => !o)}
                      aria-label="Search"
                      aria-expanded={searchOpen}
                    >
                      <svg className="icon-search" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
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
                                onClick={() => {
                                  navigateTo('loaves')
                                  setSearchOpen(false)
                                  setSearchQuery('')
                                }}
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
                    onClick={() => navigateTo('preorder')}
                    aria-label={cartCount > 0 ? `Open pre-order cart (${cartCount} items)` : 'Open pre-order cart'}
                  >
                    <span className="nav-cart-icon-wrap">
                      <svg className="icon-cart" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                        <line x1="3" y1="6" x2="21" y2="6" />
                        <path d="M16 10a4 4 0 0 1-8 0" />
                      </svg>
                      {cartCount > 0 && <span className="nav-cart-count" aria-hidden="true">{cartCount}</span>}
                    </span>
                  </button>
                  <button
                    type="button"
                    className="nav-favorites"
                    onClick={handleFavoritesNav}
                    aria-label="View favorites"
                  >
                    <svg className="icon-heart-nav" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    className="nav-user"
                    onClick={() => navigateTo('account')}
                    aria-label="My account"
                  >
                    <svg className="icon-user" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="12" cy="8" r="4" />
                      <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
                    </svg>
                  </button>
                </nav>
                <button
                  type="button"
                  className="nav-toggle"
                  onClick={() => setNavOpen((open) => !open)}
                  aria-label="Toggle navigation"
                >
                  <span />
                  <span />
                  <span />
                </button>
              </div>
              {navOpen ? (
                <nav className="main-nav main-nav--mobile">
                  <button
                    type="button"
                    className={currentPage === 'home' ? 'is-active' : ''}
                    onClick={() => navigateTo('home')}
                  >
                    Home
                  </button>
                  <button
                    type="button"
                    className={currentPage === 'loaves' ? 'is-active' : ''}
                    onClick={() => navigateTo('loaves')}
                  >
                    Loaves
                  </button>
                  <button
                    type="button"
                    className={currentPage === 'customize' ? 'is-active' : ''}
                    onClick={() => navigateTo('customize')}
                  >
                    Customize your loaf
                  </button>
                  <button
                    type="button"
                    className="nav-search"
                    onClick={() => setSearchOpen(true)}
                    aria-label="Search"
                  >
                    <svg className="icon-search" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    className="nav-cart"
                    onClick={() => navigateTo('preorder')}
                    aria-label={cartCount > 0 ? `Open pre-order cart (${cartCount} items)` : 'Open pre-order cart'}
                  >
                    <span className="nav-cart-icon-wrap">
                      <svg className="icon-cart" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                        <line x1="3" y1="6" x2="21" y2="6" />
                        <path d="M16 10a4 4 0 0 1-8 0" />
                      </svg>
                      {cartCount > 0 && <span className="nav-cart-count" aria-hidden="true">{cartCount}</span>}
                    </span>
                  </button>
                  <button
                    type="button"
                    className="nav-favorites"
                    onClick={handleFavoritesNav}
                    aria-label="View favorites"
                  >
                    <svg className="icon-heart-nav" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    className="nav-user"
                    onClick={() => navigateTo('account')}
                    aria-label="My account"
                  >
                    <svg className="icon-user" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="12" cy="8" r="4" />
                      <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
                    </svg>
                  </button>
                </nav>
              ) : null}
            </div>
          </header>

          {showAuthPrompt && (
            <div className="auth-prompt-overlay" role="dialog" aria-label="Sign in to save favorites">
              <div className="auth-prompt-backdrop" onClick={() => setShowAuthPrompt(false)} aria-hidden="true" />
              <div className="auth-prompt-panel">
                <h3 className="auth-prompt-title">Sign in to save favorites</h3>
                <p className="auth-prompt-text">
                  Create an account or sign in to save your favorite loaves.
                </p>
                <div className="auth-prompt-actions">
                  <button
                    type="button"
                    className="auth-prompt-btn auth-prompt-btn--primary"
                    onClick={() => {
                      setShowAuthPrompt(false)
                      navigateTo('account')
                    }}
                  >
                    Sign in / Sign up
                  </button>
                  <button
                    type="button"
                    className="auth-prompt-btn auth-prompt-btn--secondary"
                    onClick={() => setShowAuthPrompt(false)}
                  >
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
                <div className="search-dropdown-results">
                  {searchResults.length === 0 ? (
                    <div className="search-dropdown-empty">No loaves found</div>
                  ) : (
                    searchResults.map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        className="search-dropdown-item"
                        onClick={() => {
                          navigateTo('loaves')
                          setSearchOpen(false)
                          setSearchQuery('')
                        }}
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
            </div>
          )}

          <div className="header-offer-bar">
            <button
              type="button"
              className="header-offer-bar-btn"
              onClick={() => navigateTo('preorder')}
            >
              Get a free sampler slice when you checkout TODAY!
            </button>
          </div>

          <div className="slogan-banner slogan-banner--top">
            <div className="slogan-track">
              <div className="slogan-track__part" aria-hidden="true">
                <span>Healthy quality ingredients</span>
                <span>Your body will thank you</span>
                <span>Indulge without guilt</span>
                <span>Your macro friendly bakery </span>
              </div>
              <div className="slogan-track__part" aria-hidden="true">
                <span>Healthy quality ingredients</span>
                <span>Your body will thank you</span>
                <span>Indulge without guilt</span>
                <span>Your macro friendly bakery </span>
              </div>
              <div className="slogan-track__part" aria-hidden="true">
                <span>Healthy quality ingredients</span>
                <span>Your body will thank you</span>
                <span>Indulge without guilt</span>
                <span>Your macro friendly bakery </span>
              </div>
              <div className="slogan-track__part" aria-hidden="true">
                <span>Healthy quality ingredients</span>
                <span>Your body will thank you</span>
                <span>Indulge without guilt</span>
                <span>Your macro friendly bakery </span>
              </div>
            </div>
          </div>

          <section
            className={`hero${currentPage === 'home' ? '' : ' is-hidden'}`}
          >
            <div>
              <h1 className="hero-title">
                Sourdough: the bread your body will thank you for.
              </h1>
              <p className="hero-subtitle">
                An artisan sourdough bakery and cafe built around healthy,
                quality ingredients, macro-friendly desserts, specialty coffee,
                and small-batch kombucha.
              </p>
              <div className="hero-actions">
                <button
                  type="button"
                  className="btn"
                  onClick={() => navigateTo('preorder')}
                >
                  Pre-order now
                </button>
                <a href="#menu" className="btn btn-secondary">
                  Learn more
                </a>
                <span className="hero-note">
                </span>
              </div>
            </div>

            <div className="hero-image-cell">
              <div className="hero-image-wrap">
                <img src={heroLoavesImage} alt="Fresh artisan sourdough loaves" className="hero-image" />
              </div>
            </div>
          </section>

          <section
            id="mission"
            className={currentPage === 'home' ? '' : 'is-hidden'}
          >
            <div className="section-heading">
              <div>
                <div className="section-label">Mission &amp; vision</div>
                <div className="section-title">
                  Healthy never looked this good.
                </div>
              </div> 
            </div>
            <div className="mission-grid">
              <div className="mission-block">
                <div className="mission-title">Mission</div>
                <p className="mission-text">
                  To create a bakery where every ingredient has a purpose and
                  every bite leaves you feeling nourished, not weighed down. We
                  focus on slow-fermented sourdough, better-for-you sweeteners,
                  and high-protein options that fit your lifestyle.
                </p>
              </div>
              <div className="mission-block">
                <div className="mission-title">Vision</div>
                <p className="mission-text">
                  A space where you can grab a loaf for the week, a
                  macro-friendly dessert for tonight, and a coffee or kombucha
                  to sip while you slow down. A cafe + bakery that proves you
                  can indulge without guilt – and your body will thank you for
                  it.
                </p>
              </div>
            </div>
          </section>

          <section
            id="menu"
            className={currentPage === 'home' ? '' : 'is-hidden'}
          >
            <div className="section-heading">
              <div>
                <div className="section-label">Menu preview</div>
                <div className="section-title">
                  What we’re baking &amp; brewing.
                </div>
              </div>
            </div>

            <div className="menu-grid">
              <div className="menu-column">
                <div className="menu-column-header">Sourdough breads</div>
                <div className="menu-item">
                  <span className="menu-item-label">
                    Classic white / country
                  </span>
                </div>
                <div className="menu-item">
                  <span className="menu-item-label">Rye</span>
                </div>
                <div className="menu-item">
                  <span className="menu-item-label">Savory loaves</span>
                  <span className="menu-item-note">herb, olive, seed</span>
                </div>
                <div className="menu-item">
                  <span className="menu-item-label">Sweet loaves</span>
                  <span className="menu-item-note">
                    cinnamon raisin, pumpkin spice, apple
                  </span>
                </div>
                <div className="menu-item">
                  <span className="menu-item-label">Mini loaves</span>
                  <span className="menu-item-note">perfect for the week</span>
                </div>
              </div>

              <div className="menu-column">
                <div className="menu-column-header">
                  Healthy / fitness desserts
                  <span className="menu-coming">Coming soon</span>
                </div>
                <div className="menu-item">
                  <span className="menu-item-label">
                    Greek yogurt cheesecakes
                  </span>
                  <span className="menu-item-note">single serve</span>
                </div>
                <div className="menu-item">
                  <span className="menu-item-label">
                    Protein muffins &amp; mug cakes
                  </span>
                </div>
                <div className="menu-item">
                  <span className="menu-item-label">Low-sugar mousse cups</span>
                </div>
                <div className="menu-item">
                  <span className="menu-item-label">Parfaits</span>
                  <span className="menu-item-note">
                    with sourdough chunks
                  </span>
                </div>
                <p className="menu-item-note">
                  Macros &amp; nutrition info will be listed for all desserts.
                </p>
              </div>

              <div className="menu-column">
                <div className="menu-column-header">
                  Coffee, kombucha &amp; shakes
                  <span className="menu-coming">Coming soon</span>
                </div>
                <div className="menu-item">
                  <span className="menu-item-label">
                    Espresso &amp; Americanos
                  </span>
                </div>
                <div className="menu-item">
                  <span className="menu-item-label">Lattes</span>
                  <span className="menu-item-note">
                    classic &amp; specialty
                  </span>
                </div>
                <div className="menu-item">
                  <span className="menu-item-label">Kombucha</span>
                  <span className="menu-item-note">
                    3–5 rotating flavors
                  </span>
                </div>
                <div className="menu-item">
                  <span className="menu-item-label">
                    Smoothies &amp; protein shakes
                  </span>
                </div>
                <p className="menu-item-note">
                  Dairy-free and low-sugar options available for most drinks.
                </p>
              </div>
            </div>
          </section>

          <section
            id="preorder-store"
            className={currentPage === 'preorder' ? '' : 'is-hidden'}
          >
            <div className="section-heading">
              <div>
                <div className="section-label">Pre-order online</div>
                <div className="section-title">
                  Build your loaf order &amp; save favorites.
                </div>
              </div>
            </div>

            <div className="preorder-store-grid">
              <aside className="cart-summary">
                <div className="cart-summary-heading">
                  <h2 className="cart-summary-title">Cart</h2>
                </div>
                {cartItems.length === 0 ? (
                  <p className="cart-empty">Your cart is empty.</p>
                ) : (
                  <ul className="cart-items cart-items--simple">
                    {cartItems.map((item) => {
                      if (item.productId === 'custom' && item.custom) {
                        const c = item.custom
                        const sizeLabel = c.size === 'mini' ? 'Mini' : c.size === 'sandwich' ? 'Sandwich' : 'Loaf'
                        const unitPrice = getCustomItemPrice(c)
                        const lineTotal = unitPrice * item.quantity
                        const favId = 'custom'
                        const isFav = favorites.includes(favId)
                        return (
                          <li key={item.key} className="cart-item-simple">
                            <span className="cart-item-label">Custom {sizeLabel} Loaf</span>
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
                      }
                      const product = loafProducts.find((p) => p.id === item.productId)
                      if (!product) return null
                      const sizeLabel = item.size === 'mini' ? 'Mini' : item.size === 'sandwich' ? 'Sandwich' : 'Loaf'
                      const unitPrice = item.size === 'mini' ? MINI_LOAF_PRICE : getLoafPriceForProduct(product)
                      const lineTotal = unitPrice * item.quantity
                      const isFav = favorites.includes(product.id)
                      return (
                        <li key={item.key} className="cart-item-simple">
                          <span className="cart-item-label">{sizeLabel} {product.name} Loaf</span>
                          {LOAF_IMAGES[product.id] && (
                            <div className="cart-item-thumb">
                              <img src={LOAF_IMAGES[product.id]} alt={product.name} />
                              <span>{product.name}</span>
                            </div>
                          )}
                          <button
                            type="button"
                            className={`cart-item-fav fav-toggle${isFav ? ' fav-toggle--active' : ''}`}
                            onClick={() => toggleFavorite(product.id)}
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
                  <button
                    type="button"
                    className={`btn-sample${includeSample ? ' btn-sample--active' : ''}`}
                    onClick={() => setIncludeSample((prev) => !prev)}
                    disabled={cartItems.length === 0}
                  >
                    {includeSample ? 'Free sample added' : 'Add free sample'}
                  </button>
                  {includeSample && <p className="cart-sample-beneath">+ Free sample</p>}
                </div>
                <div className="cart-actions">
                  <button
                    type="button"
                    className="btn-small"
                    onClick={placePreorder}
                    disabled={cartItems.length === 0}
                  >
                    Place pre-order
                  </button>
                </div>
              </aside>
              <div className="preorder-products">
                {loafProducts.map((product) => {
                  const isFavorite = favorites.includes(product.id)
                  return (
                    <div key={product.id} className={`preorder-product-card${product.seasonal ? ' preorder-product-card--has-banner' : ''}${product.seasonal && product.season !== getCurrentSeason() ? ' loaf-card--out-of-season' : ''}${product.soldOut ? ' preorder-product-card--sold-out' : ''}`}>
                      {product.seasonal ? <span className="loaf-season-banner">Limited edition</span> : null}
                      {product.soldOut ? <span className="loaf-sold-out-banner">Sold out</span> : null}
                      {LOAF_IMAGES[product.id] ? (
                        <div className="loaf-image-wrap">
                          <img src={LOAF_IMAGES[product.id]} alt="" className="loaf-image" />
                        </div>
                      ) : null}
                      <div className="preorder-product-name preorder-product-name--card">
                        {product.name}
                      </div>
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
                        {product.soldOut ? (
                          <div className="loaf-sold-out">Sold out</div>
                        ) : (
                        <div className="preorder-actions">
                        <div className="add-btn-with-price">
                          <button
                            type="button"
                            className="btn-small btn-add"
                            onClick={() => addLoafToCartWithQuantity(product.id, 'loaf')}
                          >
                            Add Loaf
                          </button>
                          <div className="add-btn-price">${getLoafPriceForProduct(product)}</div>
                        </div>
                        <div className="add-btn-with-price">
                          <button
                            type="button"
                            className="btn-small btn-secondary btn-add"
                            onClick={() => addLoafToCartWithQuantity(product.id, 'mini')}
                          >
                            Add Mini
                          </button>
                          <div className="add-btn-price">${MINI_LOAF_PRICE}</div>
                        </div>
                        </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>

          <section
            id="preorder"
            className={currentPage === 'preorder' ? '' : 'is-hidden'}
          >
            <div className="section-heading">
              <div>
                <div className="section-label">
                  Pre-order &amp; subscriptions
                </div>
                <div className="section-title">
                  Fresh loaves, held just for you.
                </div>
              </div>
            </div>
            <div className="preorder">
              <div className="preorder-card">
                <div className="preorder-badge">Weekly pre-order</div>
                <div className="preorder-title">
                  Reserve your sourdough in advance.
                </div>
                <p className="section-body">
                  Choose your loaf, size, and any add-ons, and place your order. Pick up fresh. HURRY,
                  your bread is waiting for you.
                </p>
                <ul className="preorder-list">
                  <li>Classic, rye, savory, or sweet loaves.</li>
                  <li>Full loaf or mini loaves for the week.</li>
                  <li>Add desserts, coffee beans, or kombucha growlers.</li>
                  <li>Note macros: high protein, lower sugar, or custom.</li>
                </ul>
              </div>
              <div className="preorder-card">
                <div className="preorder-badge">&quot;Loaf of the week&quot;</div>
                <div className="preorder-title">
                  A new feature loaf, on repeat.
                </div>
                <p className="section-body">
                  One rotating sourdough flavor – like cinnamon raisin, seeded
                  rye, pumpkin spice, or olive &amp; herb – ready on your
                  schedule.
                </p>
                <ul className="preorder-list">
                  <li>Pick weekly or bi-weekly pickups.</li>
                  <li>Add a macro-friendly dessert box if you&apos;d like.</li>
                  <li>Pause easily whenever you&apos;re away.</li>
                </ul>
              </div>
            </div>
          </section>

          <section
            id="social"
            className={currentPage === 'home' ? '' : 'is-hidden'}
          >
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

          <section
            id="loaves"
            className={currentPage === 'loaves' ? '' : 'is-hidden'}
          >
            <div className="section-heading">
              <div>
                <div className="section-label">Loaves</div>
                <div className="section-title">Signature sourdough flavors.</div>
              </div>
              <div className="section-caption">              </div>
            </div>

            <div className="loaves-grid">
              {loafProducts.filter((p) => !p.seasonal && !p.proteinCategory).map((product) => {
                const isFavorite = favorites.includes(product.id)
                return (
                <div key={product.id} className={`loaf-card${product.soldOut ? ' loaf-card--sold-out' : ''}`}>
                  {product.soldOut ? <span className="loaf-sold-out-banner">Sold out</span> : null}
                  {LOAF_IMAGES[product.id] ? (
                    <div className="loaf-image-wrap">
                      <img src={LOAF_IMAGES[product.id]} alt="" className="loaf-image" />
                    </div>
                  ) : null}
                  <div className="loaf-header">
                    <div className="loaf-name-row">
                      <div className="loaf-name">{product.name}</div>
                    </div>
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
                  <p className="loaf-details">{product.description}{product.inclusion ? ` It includes ${product.inclusion}.` : ''}</p>
                  <div className="loaf-actions">
                    {(() => {
                      const loafItem = cartItems.find((i) => i.productId === product.id && i.size === 'loaf')
                      const miniItem = cartItems.find((i) => i.productId === product.id && i.size === 'mini')
                      if (product.soldOut && !loafItem && !miniItem) {
                        return <div className="loaf-sold-out">Sold out</div>
                      }
                      return (
                        <>
                          {loafItem ? (
                            <div className="loaf-qty-control">
                              <button type="button" className="loaf-qty-btn" onClick={() => updateCartItemQuantity(loafItem.key, -1)} aria-label="Decrease loaf">−</button>
                              <span className="loaf-qty-num">{loafItem.quantity}</span>
                              <button type="button" className="loaf-qty-btn" onClick={() => updateCartItemQuantity(loafItem.key, 1)} aria-label="Increase loaf">+</button>
                            </div>
                          ) : (
                            <div className="add-btn-with-price">
                              <button type="button" className="btn-small btn-add" onClick={() => addLoafToCartWithQuantity(product.id, 'loaf')} disabled={product.soldOut}>
                                Add Loaf
                              </button>
                              <div className="add-btn-price">${getLoafPriceForProduct(product)}</div>
                            </div>
                          )}
                          {miniItem ? (
                            <div className="loaf-qty-control">
                              <button type="button" className="loaf-qty-btn" onClick={() => updateCartItemQuantity(miniItem.key, -1)} aria-label="Decrease mini">−</button>
                              <span className="loaf-qty-num">{miniItem.quantity}</span>
                              <button type="button" className="loaf-qty-btn" onClick={() => updateCartItemQuantity(miniItem.key, 1)} aria-label="Increase mini">+</button>
                            </div>
                          ) : (
                            <div className="add-btn-with-price">
                              <button type="button" className="btn-small btn-secondary btn-add" onClick={() => addLoafToCartWithQuantity(product.id, 'mini')} disabled={product.soldOut}>
                                Add Mini
                              </button>
                              <div className="add-btn-price">${MINI_LOAF_PRICE}</div>
                            </div>
                          )}
                        </>
                      )
                    })()}
                  </div>
                </div>
              )
              })}
            </div>

            <div className="section-heading section-heading--seasonal">
              <div>
                <div className="section-label">Seasonal</div>
                <div className="section-title">Limited edition flavors.</div>
              </div>
            </div>

            {[getCurrentSeason(), ...SEASON_ORDER.filter((s) => s !== getCurrentSeason())].map((seasonKey) => {
              const seasonLoaves = loafProducts.filter((p) => p.seasonal && p.season === seasonKey)
              if (seasonLoaves.length === 0) return null
              const currentSeason = getCurrentSeason()
              return (
                <div key={seasonKey} className="seasonal-group">
                  <h3 className="seasonal-group-title">{SEASON_LABELS[seasonKey]}</h3>
                  <div className="loaves-grid">
                    {seasonLoaves.map((product) => {
                      const inSeason = product.season === currentSeason
                      const isFavorite = favorites.includes(product.id)
                      return (
                        <div key={product.id} className={`loaf-card loaf-card--has-banner${inSeason ? '' : ' loaf-card--out-of-season'}`}>
                          <span className="loaf-season-banner">Limited edition</span>
                          {LOAF_IMAGES[product.id] ? (
                            <div className="loaf-image-wrap">
                              <img src={LOAF_IMAGES[product.id]} alt="" className="loaf-image" />
                            </div>
                          ) : null}
                          <div className="loaf-header">
                            <div className="loaf-name-row">
                              <div className="loaf-name">{product.name}</div>
                            </div>
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
                          <p className="loaf-details">{product.description}{product.inclusion ? ` It includes ${product.inclusion}.` : ''}</p>
                          <div className="loaf-actions">
                            {(() => {
                              const loafItem = cartItems.find((i) => i.productId === product.id && i.size === 'loaf')
                              const miniItem = cartItems.find((i) => i.productId === product.id && i.size === 'mini')
                              return (
                                <>
                                  {loafItem ? (
                                    <div className="loaf-qty-control">
                                      <button type="button" className="loaf-qty-btn" onClick={() => updateCartItemQuantity(loafItem.key, -1)} aria-label="Decrease loaf">−</button>
                                      <span className="loaf-qty-num">{loafItem.quantity}</span>
                                      <button type="button" className="loaf-qty-btn" onClick={() => updateCartItemQuantity(loafItem.key, 1)} aria-label="Increase loaf">+</button>
                                    </div>
                                  ) : (
                                    <div className="add-btn-with-price">
                                      <button type="button" className="btn-small btn-add" onClick={() => addLoafToCartWithQuantity(product.id, 'loaf')}>
                                        Add Loaf
                                      </button>
                                      <div className="add-btn-price">${getLoafPriceForProduct(product)}</div>
                                    </div>
                                  )}
                                  {miniItem ? (
                                    <div className="loaf-qty-control">
                                      <button type="button" className="loaf-qty-btn" onClick={() => updateCartItemQuantity(miniItem.key, -1)} aria-label="Decrease mini">−</button>
                                      <span className="loaf-qty-num">{miniItem.quantity}</span>
                                      <button type="button" className="loaf-qty-btn" onClick={() => updateCartItemQuantity(miniItem.key, 1)} aria-label="Increase mini">+</button>
                                    </div>
                                  ) : (
                                    <div className="add-btn-with-price">
                                      <button type="button" className="btn-small btn-secondary btn-add" onClick={() => addLoafToCartWithQuantity(product.id, 'mini')}>
                                        Add Mini
                                      </button>
                                      <div className="add-btn-price">${MINI_LOAF_PRICE}</div>
                                    </div>
                                  )}
                                </>
                              )
                            })()}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}

            <div className="section-heading section-heading--seasonal">
              <div>
                <div className="section-label">High protein</div>
                <h2 className="section-title protein-loaves-title">Protein Loaves</h2>
                <div className="section-caption">Savory, sweet, and advanced high-protein options.</div>
              </div>
            </div>

            {[
              { key: 'savory', title: 'Savory Protein Loaves', category: 'savory' },
              { key: 'sweet', title: 'Sweet Protein Loaves', category: 'sweet' },
              { key: 'advanced', title: 'Deluxe Protein Loaves', category: 'advanced' },
            ].map(({ key: groupKey, title, category }) => {
              const proteinLoaves = loafProducts.filter((p) => p.proteinCategory === category)
              if (proteinLoaves.length === 0) return null
              return (
                <div key={groupKey} className="seasonal-group">
                  <h3 className="seasonal-group-title">{title}</h3>
                  <div className="loaves-grid">
                    {proteinLoaves.map((product) => {
                      const isFavorite = favorites.includes(product.id)
                      return (
                        <div key={product.id} className="loaf-card">
                          {LOAF_IMAGES[product.id] ? (
                            <div className="loaf-image-wrap">
                              <img src={LOAF_IMAGES[product.id]} alt="" className="loaf-image" />
                            </div>
                          ) : null}
                          <div className="loaf-header">
                            <div className="loaf-name-row">
                              <div className="loaf-name">{product.name}</div>
                            </div>
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
                          <p className="loaf-details">{product.description}{product.inclusion ? ` It includes ${product.inclusion}.` : ''}</p>
                          <div className="loaf-actions">
                            {(() => {
                              const loafItem = cartItems.find((i) => i.productId === product.id && i.size === 'loaf')
                              const miniItem = cartItems.find((i) => i.productId === product.id && i.size === 'mini')
                              return (
                                <>
                                  {loafItem ? (
                                    <div className="loaf-qty-control">
                                      <button type="button" className="loaf-qty-btn" onClick={() => updateCartItemQuantity(loafItem.key, -1)} aria-label="Decrease loaf">−</button>
                                      <span className="loaf-qty-num">{loafItem.quantity}</span>
                                      <button type="button" className="loaf-qty-btn" onClick={() => updateCartItemQuantity(loafItem.key, 1)} aria-label="Increase loaf">+</button>
                                    </div>
                                  ) : (
                                    <div className="add-btn-with-price">
                                      <button type="button" className="btn-small btn-add" onClick={() => addLoafToCartWithQuantity(product.id, 'loaf')}>
                                        Add Loaf
                                      </button>
                                      <div className="add-btn-price">${getLoafPriceForProduct(product)}</div>
                                    </div>
                                  )}
                                  {miniItem ? (
                                    <div className="loaf-qty-control">
                                      <button type="button" className="loaf-qty-btn" onClick={() => updateCartItemQuantity(miniItem.key, -1)} aria-label="Decrease mini">−</button>
                                      <span className="loaf-qty-num">{miniItem.quantity}</span>
                                      <button type="button" className="loaf-qty-btn" onClick={() => updateCartItemQuantity(miniItem.key, 1)} aria-label="Increase mini">+</button>
                                    </div>
                                  ) : (
                                    <div className="add-btn-with-price">
                                      <button type="button" className="btn-small btn-secondary btn-add" onClick={() => addLoafToCartWithQuantity(product.id, 'mini')}>
                                        Add Mini
                                      </button>
                                      <div className="add-btn-price">${MINI_LOAF_PRICE}</div>
                                    </div>
                                  )}
                                </>
                              )
                            })()}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}

            <p className="section-note">
              Add to pre-order and we&apos;ll have it ready for you. Full loaves
              in small batches; mini loaves available.
            </p>
          </section>

          <section
            id="customize"
            className={currentPage === 'customize' ? '' : 'is-hidden'}
          >
            <div className="section-heading section-heading--with-fav">
              <div>
                <div className="section-label">Build your loaf</div>
                <div className="section-title">
                  Customize your own loaf!
                </div>
              </div>
              <button
                type="button"
                className={`fav-toggle fav-toggle--section${favorites.includes('custom') ? ' fav-toggle--active' : ''}`}
                onClick={() => toggleFavorite('custom')}
                aria-label={favorites.includes('custom') ? 'Remove custom loaf from favorites' : 'Add custom loaf to favorites'}
              >
                <svg className="icon-heart" viewBox="0 0 24 24" fill={favorites.includes('custom') ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </button>
            </div>
            <BuildYourLoaf />
          </section>

          <section
            id="favorites"
            className={currentPage === 'favorites' ? '' : 'is-hidden'}
          >
            <div className="section-heading">
              <div>
                <div className="section-label">Favorites</div>
                <div className="section-title">
                  Your favorite flavors.
                </div>
              </div>
            </div>

            <div className="info-grid">
              <div className="info-card">
                <div className="mission-title">
                  Favorite flavors
                </div>
                {!user ? (
                  <div className="auth-prompt-inline">
                    <p className="account-summary">
                      Sign in or create an account to save your favorite loaves.
                    </p>
                    <button
                      type="button"
                      className="auth-prompt-inline-btn"
                      onClick={() => navigateTo('account')}
                    >
                      Sign in / Sign up
                    </button>
                  </div>
                ) : favorites.length === 0 ? (
                  <p className="account-summary">
                    Tap &quot;Save&quot; on any loaf in the pre-order section to
                    mark it as a favorite.
                  </p>
                ) : (
                  <div className="chip-row">
                    {favorites.map((id) => {
                      if (id === 'custom') {
                        return (
                          <span key={id} className="chip">
                            Custom loaf
                          </span>
                        )
                      }
                      const product = loafProducts.find(
                        (p) => p.id === id,
                      )
                      if (!product) return null
                      return (
                        <span key={id} className="chip">
                          {product.name}
                        </span>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </section>

          <section
            id="account"
            className={currentPage === 'account' ? '' : 'is-hidden'}
          >
            <div className="section-heading">
              <div>
                <div className="section-label">My account</div>
                <div className="section-title">
                  Account details &amp; past orders.
                </div>
              </div>
            </div>

            <div className="info-grid">
              <div className="info-card">
                <div className="mission-title">
                  {user ? 'Account details' : 'Sign in to your account'}
                </div>
                {user ? (
                  <p className="account-meta">
                    Signed in as <strong>{user.email}</strong>
                    {user.name ? ` (${user.name})` : ''}
                  </p>
                ) : (
                  <p className="account-meta">
                    We keep it simple: sign in with your name and email so your
                    pre-orders stay with you.
                  </p>
                )}
                {!user && (
                  <form className="account-form" onSubmit={handleLogin}>
                    <label>
                      Full name
                      <input name="name" type="text" autoComplete="name" required />
                    </label>
                    <label>
                      Email
                      <input
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                      />
                    </label>
                    <label>
                      Password
                      <input
                        name="password"
                        type="password"
                        autoComplete="new-password"
                        required
                      />
                    </label>
                    <label>
                      Phone (optional)
                      <input name="phone" type="tel" autoComplete="tel" />
                    </label>
                    <label>
                      City (optional)
                      <input name="city" type="text" autoComplete="address-level2" />
                    </label>
                    <button type="submit" className="btn-small">
                      Create or sign in
                    </button>
                  </form>
                )}
                {user && (
                  <p className="account-summary">
                    Your pre-orders will be saved on this device.
                  </p>
                )}
              </div>

              <div className="info-card">
                <div className="mission-title">
                  Past pre-orders
                </div>
                <div className="account-lists">
                  <div className="account-favorites-removed">
                    {favorites.length === 0 ? (
                      <p className="account-summary">
                        Tap “Save” on any loaf in the pre-order section to
                        mark it as a favorite.
                      </p>
                    ) : (
                      <div className="chip-row">
                        {favorites.map((id) => {
                          if (id === 'custom') {
                            return (
                              <span key={id} className="chip">
                                Custom loaf
                              </span>
                            )
                          }
                          const product = loafProducts.find(
                            (p) => p.id === id,
                          )
                          if (!product) return null
                          return (
                            <span key={id} className="chip">
                              {product.name}
                            </span>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="account-meta">Past pre-orders</p>
                    {orders.length === 0 ? (
                      <p className="account-summary">
                        Once you place a pre-order, it will appear here as a
                        simple history on this device.
                      </p>
                    ) : (
                      <div className="orders-list">
                        {orders.map((order) => {
                          const date = new Date(
                            order.createdAt,
                          ).toLocaleDateString()
                          const itemCount = order.items.reduce(
                            (sum, item) => sum + item.quantity,
                            0,
                          )
                          return (
                            <div
                              key={order.id}
                              className="orders-list-item"
                            >
                              <strong>{date}</strong> – {itemCount} item
                              {itemCount > 1 ? 's' : ''}
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
        </div>
      </main>

      <footer>
        <div className="footer-inner">
          <span>
            © Leaven Heaven – sourdough &amp; macro-friendly bakery.
          </span>
          <span>
            Building out licensing, kitchen, equipment &amp; supplier details
            now. Opening timeline: aiming for phased launch over the next few
            months.
          </span>
        </div>
      </footer>
    </>
  )
}

export default App
