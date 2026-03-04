/**
 * Adds rounded corners to the favicon image.
 * Run: node scripts/round-favicon.js
 */
import sharp from 'sharp'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const inputPath = join(__dirname, '../public/cloud.jpg')
const outputPath = join(__dirname, '../public/favicon.png')

const SIZE = 64
const RADIUS = 12

async function main() {
  const roundedMask = Buffer.from(
    `<svg width="${SIZE}" height="${SIZE}">
      <rect x="0" y="0" width="${SIZE}" height="${SIZE}" rx="${RADIUS}" ry="${RADIUS}" fill="white"/>
    </svg>`
  )

  await sharp(inputPath)
    .resize(SIZE, SIZE)
    .composite([{ input: roundedMask, blend: 'dest-in' }])
    .png()
    .toFile(outputPath)

  console.log(`Done: ${outputPath}`)
}

main().catch(console.error)
