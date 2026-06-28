// Stadium renderer — composites crowd stands, extended grass, goals, and ad boards
// around the pitch from pitchRenderer.ts.
// DO NOT modify pitchRenderer.ts, spriteRenderer.ts, or any other engine file.

import { renderPitch } from './pitchRenderer'

// Both HTMLCanvas and OffscreenCanvas contexts share the same drawing API
type Ctx2D = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D

export const STADIUM_W = 1024
export const STADIUM_H = 640

// Pitch canvas (1024×480) placed at this offset in the stadium canvas
const PITCH_X = 0
const PITCH_Y = 160

// Actual pitch trapezoid corners in STADIUM canvas pixels:
// pitchRenderer logical coords × 2 (canvas scale) then + PITCH_Y for y, + PITCH_X for x
// Logical: TL=(108,56), TR=(404,56), BL=(16,223), BR=(496,223)
const TL_S = [216, 272] as const   // 108*2 + 0,  56*2 + 160
const TR_S = [808, 272] as const   // 404*2 + 0,  56*2 + 160
const BL_S = [ 32, 606] as const   //  16*2 + 0, 223*2 + 160
const BR_S = [992, 606] as const   // 496*2 + 0, 223*2 + 160

// Extended grass trapezoid — ~44px outward from pitch corners, maintains same perspective
const G_TL = { x: 170, y: 245 }
const G_TR = { x: 854, y: 245 }
const G_BL = { x:   8, y: 636 }
const G_BR = { x: 1016, y: 636 }

// Orange front wall at top of pitch
const WALL_Y = 250
const WALL_H = 18

// Field dimensions (mirrors pitchRenderer.ts)
const FW = 105
const FH = 68

// fs() — maps normalised field coords to stadium canvas pixels, supports extrapolation
// Replicates pitchRenderer's internal fs() but in stadium pixel space
function lerp(a: number, b: number, t: number) { return a + (b - a) * t }

function fs(px: number, py: number): [number, number] {
  return [
    lerp(lerp(TL_S[0], BL_S[0], py), lerp(TR_S[0], BR_S[0], py), px),
    lerp(TL_S[1], BL_S[1], py),
  ]
}
const fm = (mx: number, my: number): [number, number] => fs(mx / FW, my / FH)

function lerpPt(a: [number, number], b: [number, number], t: number): [number, number] {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t)]
}

// Bilinear interpolation for net face grid
function bilerp(
  tl: [number, number], tr: [number, number],
  br: [number, number], bl: [number, number],
  s: number, t: number,
): [number, number] {
  return [
    (1-s)*(1-t)*tl[0] + s*(1-t)*tr[0] + s*t*br[0] + (1-s)*t*bl[0],
    (1-s)*(1-t)*tl[1] + s*(1-t)*tr[1] + s*t*br[1] + (1-s)*t*bl[1],
  ]
}

// ── Spectator config ──────────────────────────────────────────────────────────

const SPEC_W  = 10
const SPEC_H  = 10
const SHIRT_H = 6
const GAP     = 2
const CELL_W  = SPEC_W + GAP        // 12px per cell
const CELL_H  = SPEC_H + SHIRT_H + GAP  // 18px per cell

const SKIN   = ['#FFCC99', '#E8A870', '#C87840', '#9A5828', '#5C3010']
const HAIR   = ['#1A1A1A', '#3D2B1F', '#7B4F2E', '#C8A050', '#888888']
const SHIRTS = [
  '#CC0000', '#0044CC', '#FFFFFF', '#FFD700', '#008800',
  '#FF6600', '#880088', '#00AACC', '#CC4400', '#AAAAAA',
]

function seededRand(seed: number): number {
  const x = Math.sin(seed + 1) * 73856
  return x - Math.floor(x)
}
function pick<T>(arr: T[], seed: number): T {
  return arr[Math.floor(seededRand(seed) * arr.length)]
}

function drawSpectator(ctx: Ctx2D, x: number, y: number, seed: number) {
  const skin  = pick(SKIN,   seed)
  const hair  = pick(HAIR,   seed + 7)
  const shirt = pick(SHIRTS, seed + 13)

  // Shirt body (below head)
  ctx.fillStyle = '#000'
  ctx.fillRect(x, y + SPEC_H, SPEC_W, SHIRT_H)
  ctx.fillStyle = shirt
  ctx.fillRect(x + 1, y + SPEC_H + 1, SPEC_W - 2, SHIRT_H - 2)

  // Head outline
  ctx.fillStyle = '#000'
  ctx.fillRect(x, y, SPEC_W, SPEC_H)
  // Hair (top 3px)
  ctx.fillStyle = hair
  ctx.fillRect(x + 1, y + 1, SPEC_W - 2, 3)
  // Skin (lower 6px)
  ctx.fillStyle = skin
  ctx.fillRect(x + 1, y + 4, SPEC_W - 2, SPEC_H - 5)
}

// Fill a rectangular region with crowd spectators
function fillCrowd(
  ctx: Ctx2D,
  x0: number, y0: number, x1: number, y1: number,
  bankSeed: number,
) {
  let row = 0
  for (let cy = y0; cy + SPEC_H < y1; cy += CELL_H, row++) {
    let col = 0
    for (let cx = x0; cx + SPEC_W < x1; cx += CELL_W, col++) {
      drawSpectator(ctx, cx, cy, bankSeed + col * 31 + row * 97)
    }
  }
}

// ── Stand tier backgrounds ────────────────────────────────────────────────────

const TIER_COLS = ['#888888', '#707070', '#585858', '#404040']

function fillTiers(
  ctx: Ctx2D,
  x0: number, y0: number, x1: number, y1: number,
) {
  const h = y1 - y0
  const th = Math.ceil(h / TIER_COLS.length)
  TIER_COLS.forEach((c, i) => {
    ctx.fillStyle = c
    const ty = y0 + i * th
    ctx.fillRect(x0, ty, x1 - x0, Math.min(th, y1 - ty))
  })
}

// ── Goal frame + net ─────────────────────────────────────────────────────────

// pitchRenderer draws nets as checkerboard cells (not a wire grid).
// goalH in stadium px: 67 logical × 2 scale = 134px
const GOAL_H = 134

// Checkerboard net face — fills white cells of a quad, skips dark (shows grass)
function netFace(
  ctx: Ctx2D,
  tl: [number,number], tr: [number,number],
  br: [number,number], bl: [number,number],
  cols: number, rows: number,
) {
  ctx.fillStyle = 'rgba(255,255,255,0.55)'
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if ((r + c) % 2 !== 0) continue
      const p00 = bilerp(tl, tr, br, bl,  c      / cols,  r      / rows)
      const p10 = bilerp(tl, tr, br, bl, (c + 1) / cols,  r      / rows)
      const p11 = bilerp(tl, tr, br, bl, (c + 1) / cols, (r + 1) / rows)
      const p01 = bilerp(tl, tr, br, bl,  c      / cols, (r + 1) / rows)
      ctx.beginPath()
      ctx.moveTo(p00[0], p00[1])
      ctx.lineTo(p10[0], p10[1])
      ctx.lineTo(p11[0], p11[1])
      ctx.lineTo(p01[0], p01[1])
      ctx.closePath()
      ctx.fill()
    }
  }
}

function strokeLine(ctx: Ctx2D, a: [number,number], b: [number,number]) {
  ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke()
}

function drawGoal(ctx: Ctx2D, side: 'left' | 'right') {
  const GW      = 10.98
  const GD_back = 9.0
  const GD_frnt = 3.0
  const GY0 = (FH - GW) / 2   // 28.51m — far-side post
  const GY1 = GY0 + GW         // 39.49m — near-side post

  let A: [number,number], B: [number,number], C: [number,number], D: [number,number]
  if (side === 'left') {
    A = fm( GD_frnt,  GY0)   // far front — inside pitch
    B = fm( GD_frnt,  GY1)   // near front — inside pitch
    C = fm(-GD_back,  GY1)   // near back — outside pitch
    D = fm(-GD_back,  GY0)   // far back — outside pitch
  } else {
    A = fm(FW - GD_frnt,  GY0)
    B = fm(FW - GD_frnt,  GY1)
    C = fm(FW + GD_back,  GY1)
    D = fm(FW + GD_back,  GY0)
  }

  const up = (p: [number,number]): [number,number] => [p[0], p[1] - GOAL_H]
  const Ap = up(A), Bp = up(B), Cp = up(C), Dp = up(D)

  // Top net panel (horizontal — looking down from above)
  netFace(ctx, Dp, Ap, Bp, Cp, 5, 4)

  // Front face (goal mouth)
  netFace(ctx, Ap, Bp, B, A, 3, 6)

  // Back face (far wall of net)
  netFace(ctx, Dp, Cp, C, D, 3, 6)

  // Side panels — far side and near side (diagonal quads)
  netFace(ctx, Dp, Ap, A, D, 4, 3)  // far side
  netFace(ctx, Bp, Cp, C, B, 4, 3)  // near side

  // Post + bar wireframe (dark shadow then white highlight)
  const segs: [[number,number],[number,number]][] = [
    [A, Ap], [B, Bp],   // front posts
    [Ap, Bp],           // crossbar
    [Ap, Dp], [Bp, Cp], // top depth rails
    [Dp, Cp],           // back bar top
    [D, Dp], [C, Cp],   // back posts
    [D, C],             // back bar ground (net base)
  ]

  ctx.lineCap = 'round'; ctx.lineJoin = 'round'
  ctx.strokeStyle = '#333333'; ctx.lineWidth = 3
  segs.forEach(([a, b]) => strokeLine(ctx, a, b))
  ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 1.5
  segs.forEach(([a, b]) => strokeLine(ctx, a, b))
}

// ── Module-level bitmap cache (filled by initStadium) ────────────────────────

let crowdBitmap: ImageBitmap | null = null
let staticBitmap: ImageBitmap | null = null

// ── Public API ────────────────────────────────────────────────────────────────

// Call once on mount — renders crowd + static layers to ImageBitmap cache.
export async function initStadium(canvas: HTMLCanvasElement): Promise<void> {
  canvas.width  = STADIUM_W
  canvas.height = STADIUM_H

  // ── Crowd offscreen ──────────────────────────────────────────────────────
  // Draw tiers + spectators everywhere; the static layer (grass + pitch) covers the interior.
  const crowdOff = new OffscreenCanvas(STADIUM_W, STADIUM_H)
  const cc = crowdOff.getContext('2d')!

  // Stand tier backgrounds across the full canvas (grass/pitch will overdraw center)
  fillTiers(cc, 0, 0, STADIUM_W, WALL_Y + WALL_H)

  // Left and right side tiers (below the top band, beside the pitch)
  fillTiers(cc, 0, WALL_Y + WALL_H, 180, STADIUM_H)
  fillTiers(cc, 844, WALL_Y + WALL_H, STADIUM_W, STADIUM_H)

  // ── Top crowd bank (full-width above pitch) ──────────────────────────────
  fillCrowd(cc, 4, 4, STADIUM_W - 4, WALL_Y - 4, 0)

  // ── Left end crowd bank (behind left goal + left side) ──────────────────
  // Fill rectangle; static layer covers everything inside the extended grass
  fillCrowd(cc, 0, WALL_Y + WALL_H + 2, 178, STADIUM_H, 1000)

  // ── Right end crowd bank (mirrored) ─────────────────────────────────────
  fillCrowd(cc, 846, WALL_Y + WALL_H + 2, STADIUM_W, STADIUM_H, 2000)

  crowdBitmap = await createImageBitmap(crowdOff)

  // ── Static layer offscreen ───────────────────────────────────────────────
  // Contains: orange wall, extended grass, pitch canvas, boards, goal frames + nets
  const staticOff = new OffscreenCanvas(STADIUM_W, STADIUM_H)
  const sc = staticOff.getContext('2d')!
  sc.imageSmoothingEnabled = false

  // Orange front wall
  sc.fillStyle = '#CC6600'
  sc.fillRect(0, WALL_Y, STADIUM_W, WALL_H)
  sc.fillStyle = '#884400'
  sc.fillRect(0, WALL_Y + WALL_H - 3, STADIUM_W, 3)
  // Left and right side walls (beside pitch, connecting top wall to stadium edge)
  sc.fillStyle = '#CC6600'
  sc.fillRect(0,   WALL_Y + WALL_H, 18, STADIUM_H - WALL_Y - WALL_H)
  sc.fillRect(STADIUM_W - 18, WALL_Y + WALL_H, 18, STADIUM_H - WALL_Y - WALL_H)

  // Extended grass trapezoid
  sc.fillStyle = '#2BB418'
  sc.beginPath()
  sc.moveTo(G_TL.x, G_TL.y)
  sc.lineTo(G_TR.x, G_TR.y)
  sc.lineTo(G_BR.x, G_BR.y)
  sc.lineTo(G_BL.x, G_BL.y)
  sc.closePath()
  sc.fill()

  // Pitch canvas composited on top of extended grass
  const pitchCanvas = document.createElement('canvas')
  renderPitch(pitchCanvas)
  sc.drawImage(pitchCanvas, PITCH_X, PITCH_Y)

  // ── Advertising boards (on top of extended grass, outside pitch edges) ──

  const BD_BG   = '#1A1A88'
  const BD_TEXT = '#FFFFFF'

  // Far touchline board (top of pitch)
  sc.fillStyle = BD_BG
  sc.fillRect(TL_S[0], TL_S[1] - 7, TR_S[0] - TL_S[0], 5)
  sc.fillStyle = BD_TEXT
  sc.fillRect(TL_S[0] + 6, TL_S[1] - 6, TR_S[0] - TL_S[0] - 12, 2)

  // Near touchline board (bottom of pitch)
  sc.fillStyle = BD_BG
  sc.fillRect(BL_S[0], BL_S[1], BR_S[0] - BL_S[0], 8)
  sc.fillStyle = BD_TEXT
  sc.fillRect(BL_S[0] + 6, BL_S[1] + 3, BR_S[0] - BL_S[0] - 12, 2)

  // Left side board (diagonal parallelogram from BL to TL)
  sc.fillStyle = BD_BG
  sc.beginPath()
  sc.moveTo(BL_S[0],     BL_S[1])
  sc.lineTo(TL_S[0],     TL_S[1] - 7)
  sc.lineTo(TL_S[0] + 8, TL_S[1] - 7)
  sc.lineTo(BL_S[0] + 8, BL_S[1])
  sc.closePath(); sc.fill()

  // Right side board
  sc.fillStyle = BD_BG
  sc.beginPath()
  sc.moveTo(TR_S[0],     TR_S[1] - 7)
  sc.lineTo(BR_S[0],     BR_S[1])
  sc.lineTo(BR_S[0] - 8, BR_S[1])
  sc.lineTo(TR_S[0] - 8, TR_S[1] - 7)
  sc.closePath(); sc.fill()

  // ── Goal frames + nets ──────────────────────────────────────────────────
  drawGoal(sc, 'left')
  drawGoal(sc, 'right')

  staticBitmap = await createImageBitmap(staticOff)

  // Render immediately to the provided canvas
  const ctx = canvas.getContext('2d')!
  _draw(ctx)
}

// Call each frame (or just once for a static view) — costs 2 × drawImage.
export function renderStadium(ctx: CanvasRenderingContext2D): void {
  _draw(ctx)
}

function _draw(ctx: Ctx2D) {
  ctx.imageSmoothingEnabled = false
  ctx.fillStyle = '#111111'
  ctx.fillRect(0, 0, STADIUM_W, STADIUM_H)
  if (crowdBitmap)  ctx.drawImage(crowdBitmap,  0, 0)
  if (staticBitmap) ctx.drawImage(staticBitmap, 0, 0)
}
