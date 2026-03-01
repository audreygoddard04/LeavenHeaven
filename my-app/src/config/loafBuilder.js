/**
 * Build Your Loaf - configuration
 * Asset paths follow: /assets/loaves/{size}/{flour}/base.png
 * Overlays: /assets/overlays/{sweet|savory}/{id}.png
 */

export const flourOptions = [
  { id: 'white', label: 'White', basePriceFull: 10, basePriceMini: 6 },
  { id: 'wholewheat', label: 'Whole Wheat', basePriceFull: 10, basePriceMini: 6 },
  { id: 'rye', label: 'Rye', basePriceFull: 10, basePriceMini: 6 },
]

export const sweetInclusionOptions = [
  { id: 'cinnamon-sugar', label: 'Cinnamon Sugar', overlayPath: '/assets/overlays/sweet/cinnamon-sugar.png', price: 1 },
  { id: 'cranberries', label: 'Cranberries', overlayPath: '/assets/overlays/sweet/cranberries.png', price: 1 },
  { id: 'raisins', label: 'Raisins', overlayPath: '/assets/overlays/sweet/raisins.png', price: 1 },
  { id: 'dates', label: 'Dates', overlayPath: '/assets/overlays/sweet/dates.png', price: 1 },
  { id: 'blueberries', label: 'Blueberries', overlayPath: '/assets/overlays/sweet/blueberries.png', price: 1 },
  { id: 'walnuts', label: 'Walnuts', overlayPath: '/assets/overlays/sweet/walnuts.png', price: 1 },
  { id: 'almonds', label: 'Almonds', overlayPath: '/assets/overlays/sweet/almonds.png', price: 1 },
  { id: 'milk-chocolate-chips', label: 'Milk Chocolate Chips', overlayPath: '/assets/overlays/sweet/milk-chocolate-chips.png', price: 1 },
  { id: 'dark-chocolate-chips', label: 'Dark Chocolate Chips', overlayPath: '/assets/overlays/sweet/dark-chocolate-chips.png', price: 1 },
  { id: 'white-chocolate-chips', label: 'White Chocolate Chips', overlayPath: '/assets/overlays/sweet/white-chocolate-chips.png', price: 1 },
]

export const proteinEnhancementOptions = [
  { id: 'none', label: 'None', price: 0 },
  { id: 'plain', label: 'Plain', price: 4 },
  { id: 'vanilla', label: 'Vanilla', price: 4 },
  { id: 'chocolate', label: 'Chocolate', price: 4 },
  { id: 'cinnamon', label: 'Cinnamon', price: 4 },
]

export const savoryInclusionOptions = [
  { id: 'black-olives', label: 'Black Olives', overlayPath: '/assets/overlays/savory/black-olives.png', price: 1 },
  { id: 'green-olives', label: 'Green Olives', overlayPath: '/assets/overlays/savory/green-olives.png', price: 1 },
  { id: 'garlic', label: 'Roasted Garlic', overlayPath: '/assets/overlays/savory/garlic.png', price: 1 },
  { id: 'tomatoes', label: 'Sun-Dried Tomatoes', overlayPath: '/assets/overlays/savory/tomatoes.png', price: 1 },
  { id: 'onion', label: 'Caramelized Onion', overlayPath: '/assets/overlays/savory/onion.png', price: 1 },
  { id: 'jalapeno', label: 'Jalapeño', overlayPath: '/assets/overlays/savory/jalapeno.png', price: 1 },
  { id: 'everything-bagel', label: 'Everything Bagel Seasoning', overlayPath: '/assets/overlays/savory/everything-bagel.png', price: 1 },
  { id: 'parmesan', label: 'Parmesan', overlayPath: '/assets/overlays/savory/parmesan.png', price: 2 },
  { id: 'asiago', label: 'Asiago', overlayPath: '/assets/overlays/savory/asiago.png', price: 2 },
  { id: 'cheddar', label: 'Cheddar', overlayPath: '/assets/overlays/savory/cheddar.png', price: 2 },
  { id: 'feta', label: 'Feta', overlayPath: '/assets/overlays/savory/feta.png', price: 2 },
  { id: 'manchego', label: 'Manchego', overlayPath: '/assets/overlays/savory/manchego.png', price: 2 },
  { id: 'mozzarella', label: 'Mozzarella', overlayPath: '/assets/overlays/savory/mozzarella.png', price: 2 },
  { id: 'cream-cheese', label: 'Cream Cheese', overlayPath: '/assets/overlays/savory/cream-cheese.png', price: 2 },
  { id: 'swiss', label: 'Swiss', overlayPath: '/assets/overlays/savory/swiss.png', price: 2 },
  { id: 'provolone', label: 'Provolone', overlayPath: '/assets/overlays/savory/provolone.png', price: 2 },
]

export function getBaseImagePath(size, flourId, view = 'whole') {
  const file = view === 'crumb' ? 'crumb.png' : 'base.png'
  return `/assets/loaves/${size}/${flourId}/${file}`
}
