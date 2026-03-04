/**
 * Removes beige/light background from an image by making those pixels transparent.
 * Samples background from corners, then removes pixels within tolerance.
 * Run: node scripts/remove-beige-bg.js <input> <output>
 */
import sharp from 'sharp'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

const inputPath = process.argv[2] || join(__dirname, '../public/assets/loaves/full/white/base.png')
const outputPath = process.argv[3] || inputPath

// Tolerance for color matching (Euclidean distance in RGB)
const TOLERANCE = 35

function colorDistance(r1, g1, b1, r2, g2, b2) {
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2)
}

function isBackground(r, g, b, targetR, targetG, targetB) {
  return colorDistance(r, g, b, targetR, targetG, targetB) <= TOLERANCE
}

async function main() {
  const image = sharp(inputPath)
  const { data, info } = await image.raw().ensureAlpha().toBuffer({ resolveWithObject: true })

  const { width, height, channels } = info

  // Sample background from corners (beige is uniform there)
  const cornerIdx = (10 * width + 10) * channels
  const targetR = data[cornerIdx]
  const targetG = data[cornerIdx + 1]
  const targetB = data[cornerIdx + 2]
  console.log(`Target background: rgb(${targetR},${targetG},${targetB})`)

  for (let i = 0; i < data.length; i += channels) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    if (isBackground(r, g, b, targetR, targetG, targetB)) {
      data[i + 3] = 0 // set alpha to transparent
    }
  }

  await sharp(Buffer.from(data), {
    raw: { width, height, channels }
  })
    .png()
    .toFile(outputPath)

  console.log(`Done: ${outputPath}`)
}

main().catch(console.error)
