import plainwhiteImg from '../images/plainwhite.png'
import wholewheatImg from '../images/wholewheat.png'
import seadedImg from '../images/seaded.png'
import chedarjalapenoImg from '../images/chedarjalapeno.png'
import cinnamonraisinImg from '../images/cinnamonraisin.png'
import crandberrywalnutImg from '../images/crandberrywalnut.png'
import croissantImg from '../images/croissant.png'
import doublechocolateImg from '../images/doublechocolate.png'
import lemonblueberryImg from '../images/lemonblueberry.png'
import ryeImg from '../images/rye.png'
import oliveImg from '../images/olive.png'
import rosemarryImg from '../images/rosemarry.png'
import maplepecanImg from '../images/maplepecan.png'
import orangecranberryImg from '../images/orangecranberry.png'
import cherrychocolateImg from '../images/cherrychocolate.png'
import figwalnutImg from '../images/figwalnut.png'
import cinnamonswirlImg from '../images/cinnamonswirl.png'
import everythingbagelImg from '../images/everythingbagel.png'
import lemonpoppyseedImg from '../images/lemonpoppyseed.png'
import pumpkinspiceImg from '../images/pumpkinspice.png'
import applecinnamonImg from '../images/applecinnamon.png'
import roastedgarlicImg from '../images/roastedgarlic.png'
import honeyoatImg from '../images/honeyoat.png'
import peachImg from '../images/peach.png'
import strawberryImg from '../images/strawberry.png'
import pizzaImg from '../images/pizza.png'
import cottagecheeseImg from '../images/cottagecheese.png'
import eggwhiteloafImg from '../images/eggwhiteloaf.png'
import collagenboostedloafImg from '../images/collagenboostedloaf.png'
import peanutbutterImg from '../images/peanutbutter.png'
import carrotcakeImg from '../images/carrotcake.png'

export const LOAF_IMAGES = {
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

export const LOAF_PRICE = 10
export const MINI_LOAF_PRICE = 6
export const INCLUSION_LOAF_UPCHARGE = 2
export const PROTEIN_LOAF_UPCHARGE = 4

export function getLoafPriceForProduct(product) {
  let price = product?.inclusion ? LOAF_PRICE + INCLUSION_LOAF_UPCHARGE : LOAF_PRICE
  if (product?.proteinCategory) price += PROTEIN_LOAF_UPCHARGE
  return price
}

export const SEASON_ORDER = ['fall', 'winter', 'spring', 'summer']
export const SEASON_LABELS = { fall: 'Fall', winter: 'Winter / Holiday', spring: 'Spring', summer: 'Summer' }

export function getCurrentSeason() {
  const m = new Date().getMonth()
  if (m >= 8 && m <= 10) return 'fall'
  if (m === 11 || m <= 1) return 'winter'
  if (m >= 2 && m <= 4) return 'spring'
  return 'summer'
}

export const MOST_POPULAR_IDS = ['greek-yogurt-sourdough', 'cinnamon-swirl', 'rosemary']
export const DEFAULT_MORE_IDS = ['classic-country-white', 'jalapeno-cheddar', 'chocolate']

export const loafProducts = [
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
  { id: 'cinnamon-swirl', name: 'Cinnamon Swirl', description: 'Ribbons of cinnamon sugar swirled through tender sourdough for a sweet, cozy loaf that\'s perfect for toast or snacking.', inclusion: 'cinnamon sugar' },
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
  { id: 'cheddar-jalapeno-protein', name: 'Cheddar Jalapeño Protein Loaf', description: 'Whey isolate in the dough with sharp cheddar and jalapeño folded in. High-protein, bold and savory—perfect post-workout.', inclusion: 'sharp cheddar, jalapeño', proteinCategory: 'savory' },
  { id: 'cottage-cheese-sourdough', name: 'Cottage Cheese Sourdough', description: 'Part of the water replaced with blended cottage cheese. Boosts protein and moisture for a very soft crumb.', proteinCategory: 'savory' },
  { id: 'greek-yogurt-sourdough', name: 'Greek Yogurt Sourdough', description: 'Greek yogurt blended into the dough for extra protein, a super soft crumb, and a gentle tang.', proteinCategory: 'savory' },
  { id: 'seeded-high-protein', name: 'Seeded High-Protein Loaf', description: 'Hemp hearts, chia, and flax with a small whey addition. Naturally protein-dense and clean-label.', inclusion: 'hemp hearts, chia, flax', proteinCategory: 'savory' },
  { id: 'chocolate-protein-sourdough', name: 'Chocolate Protein Sourdough', description: 'Chocolate whey with dark chocolate chunks. Easy macro-friendly dessert loaf.', inclusion: 'dark chocolate', proteinCategory: 'sweet' },
  { id: 'maple-protein-oat', name: 'Maple Protein Oat', description: 'Vanilla whey with oats and maple. Breakfast protein loaf.', inclusion: 'oats, maple', proteinCategory: 'sweet' },
  { id: 'blueberry-protein-loaf', name: 'Blueberry Protein Loaf', description: 'Vanilla whey with dried blueberries. Light, high-protein spring option.', inclusion: 'dried blueberries', proteinCategory: 'sweet' },
  { id: 'peanut-butter-protein-swirl', name: 'Peanut Butter Protein Swirl', description: 'Vanilla or unflavored whey with a peanut butter ribbon. High satiety, strong gym appeal.', inclusion: 'peanut butter', proteinCategory: 'sweet' },
  { id: 'carrot-cake-protein-sourdough', name: 'Carrot Cake Protein Sourdough', description: 'Vanilla whey with grated carrot and cinnamon. Optional Greek yogurt glaze (macro-friendly).', inclusion: 'carrot, cinnamon', proteinCategory: 'sweet' },
  { id: 'collagen-boost-loaf', name: 'Collagen Boost Loaf', description: 'Unflavored collagen peptides in the dough. Less drying than whey, with beauty and gut health properties.', proteinCategory: 'advanced' },
  { id: 'egg-white-protein-loaf', name: 'Egg White Protein Loaf', description: 'Some water replaced with liquid egg whites. Higher protein without powder texture and a soft crumb.', proteinCategory: 'advanced' },
]
