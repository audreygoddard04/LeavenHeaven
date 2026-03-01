import { getBaseImagePath } from '../config/loafBuilder'

/**
 * Renders a loaf preview by stacking base image + inclusion overlay images.
 * view: 'whole' | 'crumb'. Overlays use the images you provide at overlayPath.
 */
export function LoafPreview({ size, flour, selectedSweet, selectedSavory, view = 'whole' }) {
  const basePath = getBaseImagePath(size, flour, view)
  const overlays = [
    ...selectedSweet.map((inc) => inc.overlayPath),
    ...selectedSavory.map((inc) => inc.overlayPath),
  ]

  return (
    <div className={`loaf-preview-stack${size === 'mini' ? ' loaf-preview-stack--mini' : ''}`}>
      <img
        src={basePath}
        alt={`${flour} ${size} loaf`}
        className="loaf-preview-base"
      />
      {overlays.map((src, i) => (
        <img
          key={`${src}-${i}`}
          src={src}
          alt=""
          className="loaf-preview-overlay"
          aria-hidden
          onError={(e) => { e.target.style.display = 'none' }}
        />
      ))}
    </div>
  )
}
