// Goal post renderer — 80 × 144 px native (portrait, ~5:9)
// East-facing: mouth opens LEFT. West-facing: horizontal mirror.
// Net: white cells opaque, black cells transparent (pitch shows through).
// All opaque elements drawn onto a cleared (alpha=0) canvas — no color-key pass.

export const GOAL_W = 80
export const GOAL_H = 144

type Pt = [number, number]

// Margin reserved for stroke overflow — half stroke width = 4px at native scale
const M = 4

// Map fractional coords [0,1] into the inset region [M, W-M] / [M, H-M]
function sc(fx: number, fy: number): Pt {
  return [
    M + fx * (GOAL_W - 2 * M),
    M + fy * (GOAL_H - 2 * M),
  ]
}

function polyPath(ctx: CanvasRenderingContext2D, pts: Pt[]) {
  ctx.beginPath()
  ctx.moveTo(pts[0][0], pts[0][1])
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1])
  ctx.closePath()
}

// Fill only WHITE checker cells; black cells left transparent (skip draw).
function checkerFill(ctx: CanvasRenderingContext2D, pts: Pt[], cellSize: number) {
  ctx.save()
  polyPath(ctx, pts)
  ctx.clip()

  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1])
  const x0 = Math.floor(Math.min(...xs) / cellSize) * cellSize
  const y0 = Math.floor(Math.min(...ys) / cellSize) * cellSize
  const x1 = Math.ceil(Math.max(...xs) / cellSize) * cellSize
  const y1 = Math.ceil(Math.max(...ys) / cellSize) * cellSize

  ctx.fillStyle = '#FFFFFF'
  for (let y = y0; y < y1; y += cellSize) {
    for (let x = x0; x < x1; x += cellSize) {
      const col = Math.round(x / cellSize)
      const row = Math.round(y / cellSize)
      // Only paint white cells; skip black cells (leave canvas transparent)
      if ((col + row) % 2 === 0) {
        ctx.fillRect(x, y, cellSize, cellSize)
      }
    }
  }

  ctx.restore()
}

export function renderGoal(
  canvas: HTMLCanvasElement,
  facing: 'east' | 'west' = 'east',
  scale = 1,
) {
  canvas.width  = GOAL_W * scale
  canvas.height = GOAL_H * scale
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingEnabled = false
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.save()
  ctx.scale(scale, scale)

  if (facing === 'west') {
    ctx.translate(GOAL_W, 0)
    ctx.scale(-1, 1)
  }

  // Panel A (upper): (0,0)→(0.43,0)→(0.80,0.44)→(0,0.44)
  const panelA: Pt[] = [
    sc(0,    0   ),
    sc(0.43, 0   ),
    sc(0.80, 0.44),
    sc(0,    0.44),
  ]

  // Panel B (lower): (0.37,0.45)→(0.81,0.45)→(1.0,0.99)→(0.47,1.0)→(0.47,0.57)
  const panelB: Pt[] = [
    sc(0.37, 0.45),
    sc(0.81, 0.45),
    sc(1.0,  0.99),
    sc(0.47, 1.0 ),
    sc(0.47, 0.57),
  ]

  const cellSize = (GOAL_W - 2 * M) / 14  // ~5.1 px → ~14 squares across

  // 1. Checker fills (white cells only, black = transparent)
  checkerFill(ctx, panelA, cellSize)
  checkerFill(ctx, panelB, cellSize)

  // 2. Panel borders — stroke width = 2*M so outer edge aligns with inset boundary
  ctx.strokeStyle = '#FFFFFF'
  ctx.lineWidth   = M * 2
  ctx.lineJoin    = 'round'
  ctx.lineCap     = 'round'
  polyPath(ctx, panelA); ctx.stroke()
  polyPath(ctx, panelB); ctx.stroke()

  // 3. Post band — solid opaque white parallelogram, drawn LAST on top of everything
  // Centre line: x = 0.55 at top → 0.75 at bottom. Half-width = M+1 px.
  const hw = M + 1
  const topX  = M + 0.55 * (GOAL_W - 2 * M)
  const botX  = M + 0.75 * (GOAL_W - 2 * M)
  const postBand: Pt[] = [
    [topX - hw, M           ],
    [topX + hw, M           ],
    [botX + hw, GOAL_H - M  ],
    [botX - hw, GOAL_H - M  ],
  ]
  ctx.fillStyle = '#FFFFFF'
  polyPath(ctx, postBand)
  ctx.fill()

  ctx.restore()
}

export function goalToBlob(
  facing: 'east' | 'west' = 'east',
  scale = 8,
): Promise<Blob> {
  const canvas = document.createElement('canvas')
  renderGoal(canvas, facing, scale)
  return new Promise(res => canvas.toBlob(b => res(b!), 'image/png'))
}
