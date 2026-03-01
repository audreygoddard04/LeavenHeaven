import { flourOptions, sweetInclusionOptions, savoryInclusionOptions, proteinEnhancementOptions } from '../config/loafBuilder'

/**
 * Form controls for flour and inclusions.
 * Mini mirrors Full - no separate state for inclusions.
 */
export function BuilderForm({ state, dispatch }) {
  const { flour, sweetInclusions, savoryInclusions, selectedSize, proteinEnhancement } = state

  const totalInclusions = sweetInclusions.length + savoryInclusions.length
  const canAddMore = totalInclusions < 4

  const toggleSweet = (option) => {
    const isSelected = sweetInclusions.some((s) => s.id === option.id)
    if (isSelected) {
      dispatch({ type: 'REMOVE_SWEET', id: option.id })
    } else if (canAddMore) {
      dispatch({ type: 'ADD_SWEET', option })
    }
  }

  const toggleSavory = (option) => {
    const isSelected = savoryInclusions.some((s) => s.id === option.id)
    if (isSelected) {
      dispatch({ type: 'REMOVE_SAVORY', id: option.id })
    } else if (canAddMore) {
      dispatch({ type: 'ADD_SAVORY', option })
    }
  }

  return (
    <div className="builder-form">
      <div className="builder-form-section">
        <h3 className="builder-form-title">Size</h3>
        <div className="builder-form-options builder-form-row">
          <label className="builder-option">
            <input
              type="radio"
              name="size"
              value="full"
              checked={selectedSize === 'full'}
              onChange={() => dispatch({ type: 'SET_SIZE', size: 'full' })}
            />
            <span>Full loaf</span>
          </label>
          <label className="builder-option">
            <input
              type="radio"
              name="size"
              value="mini"
              checked={selectedSize === 'mini'}
              onChange={() => dispatch({ type: 'SET_SIZE', size: 'mini' })}
            />
            <span>Mini loaf</span>
          </label>
        </div>
      </div>

      <div className="builder-form-section">
        <h3 className="builder-form-title">Flour</h3>
        <div className="builder-form-options builder-form-row">
          {flourOptions.map((o) => (
            <label key={o.id} className="builder-option">
              <input
                type="radio"
                name="flour"
                value={o.id}
                checked={flour === o.id}
                onChange={() => dispatch({ type: 'SET_FLOUR', flour: o.id })}
              />
              <span>{o.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="builder-form-section">
        <h3 className="builder-form-title">Protein powder enhancement</h3>
        <div className="builder-form-options builder-form-row">
          {proteinEnhancementOptions.map((o) => (
            <label key={o.id} className="builder-option">
              <input
                type="radio"
                name="protein"
                value={o.id}
                checked={proteinEnhancement === o.id}
                onChange={() => dispatch({ type: 'SET_PROTEIN', id: o.id })}
              />
              <span>{o.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="builder-form-section">
        <h3 className="builder-form-title">Sweet inclusions</h3>
        <div className="builder-form-options builder-form-chips">
          {sweetInclusionOptions.map((o) => {
            const isSelected = sweetInclusions.some((s) => s.id === o.id)
            const disabled = !isSelected && !canAddMore
            return (
              <button
                key={o.id}
                type="button"
                className={`builder-chip ${isSelected ? 'builder-chip--selected' : ''} ${disabled ? 'builder-chip--disabled' : ''}`}
                onClick={() => toggleSweet(o)}
                disabled={disabled}
              >
                {o.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="builder-form-section">
        <h3 className="builder-form-title">Savory inclusions</h3>
        <div className="builder-form-options builder-form-chips">
          {savoryInclusionOptions.map((o) => {
            const isSelected = savoryInclusions.some((s) => s.id === o.id)
            const disabled = !isSelected && !canAddMore
            return (
              <button
                key={o.id}
                type="button"
                className={`builder-chip ${isSelected ? 'builder-chip--selected' : ''} ${disabled ? 'builder-chip--disabled' : ''}`}
                onClick={() => toggleSavory(o)}
                disabled={disabled}
              >
                {o.label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
