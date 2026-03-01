import { flourOptions, proteinEnhancementOptions } from '../config/loafBuilder'

/**
 * Running total and breakdown.
 * Only shows the selected loaf size.
 */
export function PriceSummary({ state }) {
  const { flour, sweetInclusions, savoryInclusions, selectedSize, proteinEnhancement } = state
  const flourOpt = flourOptions.find((f) => f.id === flour)

  const baseFull = flourOpt?.basePriceFull ?? 10
  const baseMini = flourOpt?.basePriceMini ?? 6
  const base = selectedSize === 'mini' ? baseMini : baseFull

  const inclusionTotal = [...sweetInclusions, ...savoryInclusions].reduce(
    (sum, inc) => sum + (inc.price ?? 0),
    0
  )

  const proteinOpt = proteinEnhancementOptions.find((p) => p.id === proteinEnhancement)
  const proteinTotal = proteinOpt?.price ?? 0

  const total = base + inclusionTotal + proteinTotal

  return (
    <div className="price-summary">
      <div className="price-summary-title">Price Summary</div>
      <div className="price-summary-breakdown">
        <div className="price-summary-row">
          <span>{selectedSize === 'mini' ? 'Mini' : 'Full'} loaf base</span>
          <span>${base}</span>
        </div>
        <div className="price-summary-row">
          <span>Inclusions ({sweetInclusions.length + savoryInclusions.length})</span>
          <span>${inclusionTotal}</span>
        </div>
        {proteinTotal > 0 && (
          <div className="price-summary-row">
            <span>Protein powder enhancement</span>
            <span>${proteinTotal}</span>
          </div>
        )}
      </div>
      <div className="price-summary-totals">
        <div className="price-summary-row price-summary-row--total">
          <span>Total</span>
          <span>${total}</span>
        </div>
      </div>
    </div>
  )
}
