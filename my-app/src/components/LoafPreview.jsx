import { getBaseImagePath } from '../config/loafBuilder'
import ryeCinnamonSwirlImg from '../images/customizedloaf/ryecinnamonswirl.png'
import whiteCinnamonSwirlImg from '../images/customizedloaf/whitecinnamonswirl.png'
import wholewheatCinnamonSwirlImg from '../images/customizedloaf/wholewheatcinnamonswirl.png'

const CINNAMON_SWIRL_CRUMB_IMAGES = {
  rye: ryeCinnamonSwirlImg,
  white: whiteCinnamonSwirlImg,
  wholewheat: wholewheatCinnamonSwirlImg,
}

/**
 * Renders loaf preview. Full loaf always uses base image. Crumb shot: when
 * only cinnamon sugar is selected, shows the flour-specific cinnamon swirl
 * image; otherwise shows the regular crumb image.
 */
export function LoafPreview({ size, flour, selectedSweet, selectedSavory, view = 'whole' }) {
  const basePath = getBaseImagePath(size, flour, view)

  const onlyCinnamonSugar =
    selectedSweet.length === 1 &&
    selectedSweet[0].id === 'cinnamon-sugar' &&
    selectedSavory.length === 0

  const useCinnamonSwirlCrumb = view === 'crumb' && onlyCinnamonSugar
  const cinnamonSwirlSrc = CINNAMON_SWIRL_CRUMB_IMAGES[flour]

  const src = useCinnamonSwirlCrumb && cinnamonSwirlSrc ? cinnamonSwirlSrc : basePath

  return (
    <div className={`loaf-preview-stack${size === 'mini' ? ' loaf-preview-stack--mini' : ''}`}>
      <img
        src={src}
        alt={`${flour} ${size} loaf`}
        className="loaf-preview-base"
      />
    </div>
  )
}
