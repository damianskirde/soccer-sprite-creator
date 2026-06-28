// World Cup trophy renderer — 28 × 46 px native
// White pixels = opaque shine highlights (not transparent)

export const TROPHY_W = 28
export const TROPHY_H = 46

type RGB = [number, number, number]

const BLK: RGB = [ 26,  26,  26]   // #1A1A1A
const GB:  RGB = [255, 215,   0]   // #FFD700 gold_bright
const GM:  RGB = [230, 168,   0]   // #E6A800 gold_mid
const GD:  RGB = [184, 120,   0]   // #B87800 gold_dark
const BS:  RGB = [122,  79,   0]   // #7A4F00 base_dark
const WH:  RGB = [255, 255, 255]   // #FFFFFF white highlight

function set(d: Uint8ClampedArray, x: number, y: number, c: RGB) {
  if (x < 0 || x >= TROPHY_W || y < 0 || y >= TROPHY_H) return
  const i = (y * TROPHY_W + x) * 4
  d[i] = c[0]; d[i+1] = c[1]; d[i+2] = c[2]; d[i+3] = 255
}

// Filled rect (no outline)
function fill(d: Uint8ClampedArray, x0: number, y0: number, x1: number, y1: number, c: RGB) {
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++)
      set(d, x, y, c)
}

// Black outline on rect perimeter only
function outline(d: Uint8ClampedArray, x0: number, y0: number, x1: number, y1: number) {
  for (let x = x0; x <= x1; x++) { set(d, x, y0, BLK); set(d, x, y1, BLK) }
  for (let y = y0; y <= y1; y++) { set(d, x0, y, BLK); set(d, x1, y, BLK) }
}

export function renderTrophy(canvas: HTMLCanvasElement, scale = 1) {
  canvas.width  = TROPHY_W * scale
  canvas.height = TROPHY_H * scale
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingEnabled = false
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  const img = ctx.createImageData(TROPHY_W, TROPHY_H)
  const d   = img.data

  // ── BALL: filled circle r=9, center (14,10) ─────────────────
  const CX = 14, CY = 10, SR = 9
  for (let y = 0; y < TROPHY_H; y++) {
    for (let x = 0; x < TROPHY_W; x++) {
      const dx = x - CX, dy = y - CY
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist > SR + 0.5) continue
      if (dist >= SR - 0.5) { set(d, x, y, BLK); continue }
      // Base fill: gold_mid
      set(d, x, y, GM)
    }
  }

  // gold_bright highlight patch — top-left quadrant ~(10,4) 3×3
  fill(d, 10, 4, 12, 6, GB)

  // gold_dark shadow patches — soccer panel seams, bottom-right
  // Central lower-right patch
  fill(d, 15, 12, 18, 15, GD)
  // Lower-left patch
  fill(d, 10, 13, 13, 16, GD)
  // Top-right patch
  fill(d, 16,  6, 19,  9, GD)
  // Bottom-centre patch
  fill(d, 12, 16, 16, 18, GD)

  // White specular highlight — 2×2 block at (9,3)
  fill(d,  9, 3, 10, 4, WH)

  // Re-draw ball outline on top of patches
  for (let y = 0; y < 22; y++) {
    for (let x = 0; x < TROPHY_W; x++) {
      const dx = x - CX, dy = y - CY
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist >= SR - 0.5 && dist <= SR + 0.5) set(d, x, y, BLK)
    }
  }

  // ── NECK: two 2px bars, 2px gap, rows 20-25 ─────────────────
  // Centered at x=14: left bar cols 11-12, right bar cols 15-16
  fill(d, 11, 20, 12, 25, GD)
  fill(d, 15, 20, 16, 25, GD)
  // Black outlines
  for (let y = 20; y <= 25; y++) {
    set(d, 10, y, BLK); set(d, 13, y, BLK)   // left bar sides
    set(d, 14, y, BLK); set(d, 17, y, BLK)   // right bar sides
  }
  set(d, 10, 20, BLK); set(d, 11, 20, BLK); set(d, 12, 20, BLK); set(d, 13, 20, BLK)
  set(d, 14, 20, BLK); set(d, 15, 20, BLK); set(d, 16, 20, BLK); set(d, 17, 20, BLK)
  set(d, 10, 25, BLK); set(d, 11, 25, BLK); set(d, 12, 25, BLK); set(d, 13, 25, BLK)
  set(d, 14, 25, BLK); set(d, 15, 25, BLK); set(d, 16, 25, BLK); set(d, 17, 25, BLK)

  // ── STEM FLARE: trapezoid rows 26-29, top 6px, bottom 10px ──
  // Centered at x=14 → top: cols 11-16, bottom: cols 9-18
  // Linearly interpolate left/right edge per row
  for (let y = 26; y <= 29; y++) {
    const t = (y - 26) / 3   // 0 at top, 1 at bottom
    const x0 = Math.round(11 - t * 2)   // 11 → 9
    const x1 = Math.round(16 + t * 2)   // 16 → 18
    for (let x = x0; x <= x1; x++) set(d, x, y, GM)
    set(d, x0, y, BLK); set(d, x1, y, BLK)
  }
  // top/bottom outlines of flare
  for (let x = 11; x <= 16; x++) set(d, x, 26, BLK)
  for (let x =  9; x <= 18; x++) set(d, x, 29, BLK)

  // ── BASE COLUMN: 6px wide × 6px tall, rows 30-35 ────────────
  // cols 11-16
  fill(d, 11, 30, 16, 35, GD)
  outline(d, 11, 30, 16, 35)

  // ── BASE PLINTH: 14px wide × 4px tall, rows 36-39 ───────────
  // cols 7-20
  fill(d,  7, 36, 20, 36, GM)   // top row: gold_mid
  fill(d,  7, 37, 20, 39, GD)   // bottom 3: gold_dark
  outline(d, 7, 36, 20, 39)

  // ── BOTTOM PLINTH: 18px wide × 6px tall, rows 40-45 ─────────
  // cols 5-22
  fill(d,  5, 40, 22, 40, GM)   // top 1px: gold_mid
  fill(d,  5, 41, 22, 43, BS)   // middle 3px: base_dark
  fill(d,  5, 44, 22, 45, BLK)  // bottom 2px: black
  outline(d, 5, 40, 22, 45)
  // White highlight bar — 1×4 at left-center, y=42
  fill(d,  7, 42, 10, 42, WH)

  // ── Blit to canvas ───────────────────────────────────────────
  const tmp = document.createElement('canvas')
  tmp.width = TROPHY_W; tmp.height = TROPHY_H
  tmp.getContext('2d')!.putImageData(img, 0, 0)
  ctx.drawImage(tmp, 0, 0, TROPHY_W * scale, TROPHY_H * scale)
}

export function trophyToBlob(scale = 8): Promise<Blob> {
  const canvas = document.createElement('canvas')
  renderTrophy(canvas, scale)
  return new Promise(res => canvas.toBlob(b => res(b!), 'image/png'))
}
