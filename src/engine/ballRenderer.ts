// Pixel-art soccer ball — 16×16 px native
// 3-panel propeller design (Brazuca/modern style)
// Panels meet at centre in a pinwheel arrangement

export const BALL_W = 16
export const BALL_H = 16

type RGB = [number, number, number]

function px(d: Uint8ClampedArray, x: number, y: number, c: RGB) {
  if (x < 0 || x >= BALL_W || y < 0 || y >= BALL_H) return
  const i = (y * BALL_W + x) * 4
  d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255
}

const RED:   RGB = [212,  48,  48]
const BLUE:  RGB = [ 40,  86, 160]
const GREEN: RGB = [ 53, 144,  77]
const WHITE: RGB = [255, 255, 255]
const BLACK: RGB = [ 17,  17,  17]

// Panel definitions: sectors in degrees (0° = east/right, clockwise)
const PANELS: { color: RGB; start: number; end: number }[] = [
  { color: RED,   start: 120, end: 240 },
  { color: BLUE,  start: 240, end: 360 },
  { color: GREEN, start:   0, end: 120 },
]

// rotation: degrees to rotate the panel pattern clockwise (0, 90, 180, 270 for animation frames)
export function drawBallData(rotation = 0): ImageData {
  const img = new ImageData(BALL_W, BALL_H)
  const d   = img.data

  const cx      = BALL_W / 2
  const cy      = BALL_H / 2
  const R_outer = 7.4  // outer edge (black outline)
  const R_inner = 5.8  // inner boundary (coloured fill starts)
  const TWIST   = 42   // propeller twist in degrees (more = tighter pinwheel)
  const SEAM    = 14   // half-width of white seam band, in degrees

  for (let y = 0; y < BALL_H; y++) {
    for (let x = 0; x < BALL_W; x++) {
      const dx   = x - cx + 0.5
      const dy   = y - cy + 0.5
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist > R_outer) continue   // transparent outside circle

      if (dist >= R_inner) {
        px(d, x, y, BLACK)           // outline band
        continue
      }

      // interior: compute twisted angle for propeller shape
      let angle = Math.atan2(dy, dx) * 180 / Math.PI
      if (angle < 0) angle += 360

      // twist increases toward centre creating the pinwheel curve
      const twist  = (1 - dist / R_inner) * TWIST
      const ta     = (angle + twist - rotation + 720) % 360

      // white seam bands at each of the 3 panel boundaries
      let inSeam = false
      for (const b of [0, 120, 240]) {
        const diff = Math.min(Math.abs(ta - b), 360 - Math.abs(ta - b))
        if (diff < SEAM) { inSeam = true; break }
      }
      if (inSeam) { px(d, x, y, WHITE); continue }

      // assign panel colour
      let color: RGB = WHITE
      for (const panel of PANELS) {
        if (ta >= panel.start && ta < panel.end) { color = panel.color; break }
      }
      px(d, x, y, color)
    }
  }

  return img
}

export const BALL_ROTATIONS = [0, 90, 180, 270] as const
export type BallRotation = typeof BALL_ROTATIONS[number]

export function renderBall(canvas: HTMLCanvasElement, scale = 1, rotation: BallRotation = 0) {
  canvas.width  = BALL_W * scale
  canvas.height = BALL_H * scale
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingEnabled = false
  const tmp = document.createElement('canvas')
  tmp.width = BALL_W; tmp.height = BALL_H
  tmp.getContext('2d')!.putImageData(drawBallData(rotation), 0, 0)
  ctx.drawImage(tmp, 0, 0, BALL_W * scale, BALL_H * scale)
}

// Renders all 4 rotation frames as a horizontal sprite sheet: 64×16 native
export function renderBallSheet(canvas: HTMLCanvasElement, scale = 1) {
  canvas.width  = BALL_W * 4 * scale
  canvas.height = BALL_H * scale
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingEnabled = false
  BALL_ROTATIONS.forEach((rot, i) => {
    const tmp = document.createElement('canvas')
    tmp.width = BALL_W; tmp.height = BALL_H
    tmp.getContext('2d')!.putImageData(drawBallData(rot), 0, 0)
    ctx.drawImage(tmp, i * BALL_W * scale, 0, BALL_W * scale, BALL_H * scale)
  })
}

export function ballToBlob(scale = 16): Promise<Blob> {
  const canvas = document.createElement('canvas')
  renderBall(canvas, scale)
  return new Promise(resolve => canvas.toBlob(b => resolve(b!), 'image/png'))
}

export function ballSheetToBlob(scale = 16): Promise<Blob> {
  const canvas = document.createElement('canvas')
  renderBallSheet(canvas, scale)
  return new Promise(resolve => canvas.toBlob(b => resolve(b!), 'image/png'))
}
