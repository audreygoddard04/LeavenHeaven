import { useReducer } from 'react'
import { flourOptions } from '../config/loafBuilder'
import { LoafPreview } from './LoafPreview'
import { BuilderForm } from './BuilderForm'
import { PriceSummary } from './PriceSummary'

const initialState = {
  flour: flourOptions[0]?.id ?? 'white',
  sweetInclusions: [],
  savoryInclusions: [],
  proteinEnhancement: 'none',
  selectedSize: 'full',
  viewMode: 'whole',
}

function builderReducer(state, action) {
  switch (action.type) {
    case 'SET_FLOUR':
      return { ...state, flour: action.flour }
    case 'SET_SIZE':
      return { ...state, selectedSize: action.size }
    case 'SET_VIEW':
      return { ...state, viewMode: action.view }
    case 'SET_PROTEIN':
      return { ...state, proteinEnhancement: action.id }
    case 'ADD_SWEET':
      return { ...state, sweetInclusions: [...state.sweetInclusions, action.option] }
    case 'REMOVE_SWEET':
      return { ...state, sweetInclusions: state.sweetInclusions.filter((s) => s.id !== action.id) }
    case 'ADD_SAVORY':
      return { ...state, savoryInclusions: [...state.savoryInclusions, action.option] }
    case 'REMOVE_SAVORY':
      return { ...state, savoryInclusions: state.savoryInclusions.filter((s) => s.id !== action.id) }
    default:
      return state
  }
}

function calcCustomPrice(state) {
  const base = state.selectedSize === 'mini' ? 6 : 10
  const inclusions = [...state.sweetInclusions, ...state.savoryInclusions].reduce((sum, inc) => sum + (inc.price ?? 0), 0)
  const protein = state.proteinEnhancement !== 'none' ? 4 : 0
  return base + inclusions + protein
}

export function BuildYourLoaf({ onAddToCart }) {
  const [state, dispatch] = useReducer(builderReducer, initialState)

  return (
    <div className="build-your-loaf">
      <div className="build-your-loaf-header">
        <h2 className="build-your-loaf-title">Build Your Loaf</h2>
        <p className="build-your-loaf-subtitle">
          Choose your size, flour type, and a variety of inclusions.
        </p>
      </div>

      <div className="build-your-loaf-content">
        <div className="build-your-loaf-preview-section">
          <div className="build-your-loaf-view-toggle">
            <span className="build-your-loaf-view-label">Preview:</span>
            <label className="build-your-loaf-toggle-option">
              <input
                type="radio"
                name="viewMode"
                checked={state.viewMode === 'whole'}
                onChange={() => dispatch({ type: 'SET_VIEW', view: 'whole' })}
              />
              <span>Whole loaf</span>
            </label>
            <label className="build-your-loaf-toggle-option">
              <input
                type="radio"
                name="viewMode"
                checked={state.viewMode === 'crumb'}
                onChange={() => dispatch({ type: 'SET_VIEW', view: 'crumb' })}
              />
              <span>Crumb Shot</span>
            </label>
          </div>
          <div className="loaf-preview-pair">
            <button
              type="button"
              className={`loaf-preview-slot${state.selectedSize === 'full' ? ' loaf-preview-slot--selected' : ''}`}
              onClick={() => dispatch({ type: 'SET_SIZE', size: 'full' })}
            >
              <span className="loaf-preview-label">Full loaf</span>
              <LoafPreview
                size="full"
                flour={state.flour}
                selectedSweet={state.sweetInclusions}
                selectedSavory={state.savoryInclusions}
                view={state.viewMode}
              />
            </button>
            <button
              type="button"
              className={`loaf-preview-slot loaf-preview-slot--mini${state.selectedSize === 'mini' ? ' loaf-preview-slot--selected' : ''}`}
              onClick={() => dispatch({ type: 'SET_SIZE', size: 'mini' })}
            >
              <span className="loaf-preview-label">Mini loaf</span>
              <LoafPreview
                size="mini"
                flour={state.flour}
                selectedSweet={state.sweetInclusions}
                selectedSavory={state.savoryInclusions}
                view={state.viewMode}
              />
            </button>
          </div>
        </div>

        <div className="build-your-loaf-form-section">
          <BuilderForm state={state} dispatch={dispatch} />
          <PriceSummary state={state} />
          <button
            type="button"
            className="btn build-your-loaf-add-btn"
            onClick={() => onAddToCart?.({
              flour: state.flour,
              sweetInclusions: state.sweetInclusions,
              savoryInclusions: state.savoryInclusions,
              proteinEnhancement: state.proteinEnhancement,
              size: state.selectedSize,
              unitPrice: calcCustomPrice(state),
            })}
          >
            Add to cart
          </button>
        </div>
      </div>
    </div>
  )
}
