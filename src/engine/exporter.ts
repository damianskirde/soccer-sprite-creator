import type { Player, Nation } from '../types'
import { ANIMATIONS, ANIMATION_ORDER } from '../data/animations'
import { renderSpriteData } from './spriteRenderer'

// Exports a PNG sprite sheet: rows = players, cols = animation first frames
// Native 16×24 per cell, 2px gutter. Also supports 4× pre-scaled.
export async function exportSpriteSheet(
  nation: Nation,
  players: Player[],
  scale: 1 | 4 = 1,
): Promise<Blob> {
  const cellW  = 16 * scale
  const cellH  = 24 * scale
  const gutter = 2 * scale
  const cols = ANIMATION_ORDER.length
  const rows = players.length

  const sheetW = cols * (cellW + gutter)
  const sheetH = rows * (cellH + gutter)

  const canvas = document.createElement('canvas')
  canvas.width  = sheetW
  canvas.height = sheetH
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingEnabled = false

  for (let row = 0; row < rows; row++) {
    const player = players[row]
    for (let col = 0; col < cols; col++) {
      const animId = ANIMATION_ORDER[col]
      const anim   = ANIMATIONS[animId]
      const frame  = anim.frames[0] // first frame only for sheet

      const imgData = renderSpriteData(player, nation, frame, animId)

      const tmp = document.createElement('canvas')
      tmp.width = 16; tmp.height = 24
      tmp.getContext('2d')!.putImageData(imgData, 0, 0)

      const x = col * (cellW + gutter)
      const y = row * (cellH + gutter)
      ctx.drawImage(tmp, x, y, cellW, cellH)
    }
  }

  return new Promise(resolve => {
    canvas.toBlob(blob => resolve(blob!), 'image/png')
  })
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
