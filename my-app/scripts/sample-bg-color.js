/**
 * Sample background color from image corners to see what we're dealing with.
 */
import sharp from 'sharp'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const inputPath = process.argv[2] || join(__dirname, '../public/assets/loaves/full/white/base.png')

async function main() {
  const { data, info } = await sharp(inputPath).raw().ensureAlpha().toBuffer({ resolveWithObject: true })
  const { width, height, channels } = info

  // Sample corners (10px from edge)
  const samples = [
    { name: 'top-left', i: (10 * width + 10) * channels },
    { name: 'top-right', i: (10 * width + (width - 10)) * channels },
    { name: 'bottom-left', i: ((height - 10) * width + 10) * channels },
    { name: 'bottom-right', i: ((height - 10) * width + (width - 10)) * channels },
    { name: 'center', i: (Math.floor(height / 2) * width + Math.floor(width / 2)) * channels },
  ]

  console.log('Sampled colors:')
  for (const s of samples) {
    const r = data[s.i]
    const g = data[s.i + 1]
    const b = data[s.i + 2]
    const hex = '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')
    console.log(`  ${s.name}: rgb(${r},${g},${b}) ${hex}`)
  }
}

main().catch(console.error)
