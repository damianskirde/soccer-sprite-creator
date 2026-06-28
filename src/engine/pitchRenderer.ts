// Soccer pitch renderer — 1024 × 480 px native (2× logical scale for pixel-crisp game rendering)
// Logical drawing space: 512 × 240 — all coords below are in logical px, canvas ctx is pre-scaled ×2

export const PITCH_W = 1024
export const PITCH_H = 480

// Trapezoid corners — y-coords shifted +40 vs original to give headroom above pitch
const TL: [number, number] = [108, 56]
const TR: [number, number] = [404, 56]
const BL: [number, number] = [16,  223]
const BR: [number, number] = [496, 223]

const FW = 105   // field length m (goal line → goal line)
const FH = 68    // field width m  (far → near touchline)

// Pitch screen depth (px): BL.y - TL.y = 167 px
// Goal height used below: 70 px ≈ 42% of 167, consistent with reference

const lerp = (a: number, b: number, t: number) => a + (b - a) * t

// Map normalised field coords → screen px (supports extrapolation outside [0,1] for goal depth)
function fs(px: number, py: number): [number, number] {
  return [
    lerp(lerp(TL[0], BL[0], py), lerp(TR[0], BR[0], py), px),
    lerp(TL[1], BL[1], py),
  ]
}
const fm = (mx: number, my: number): [number, number] => fs(mx / FW, my / FH)

type P = [number, number]

function bilerp(tl: P, tr: P, br: P, bl: P, s: number, t: number): P {
  return [
    (1-s)*(1-t)*tl[0] + s*(1-t)*tr[0] + s*t*br[0] + (1-s)*t*bl[0],
    (1-s)*(1-t)*tl[1] + s*(1-t)*tr[1] + s*t*br[1] + (1-s)*t*bl[1],
  ]
}

function arcPts(cx: number, cy: number, r: number, a0: number, a1: number, n = 56): P[] {
  const pts: P[] = []
  for (let i = 0; i <= n; i++) {
    const a = lerp(a0, a1, i / n)
    pts.push(fm(cx + Math.cos(a) * r, cy + Math.sin(a) * r))
  }
  return pts
}

function polyPath(ctx: CanvasRenderingContext2D, pts: P[], close = false) {
  ctx.beginPath()
  pts.forEach(([x, y], i) => i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y))
  if (close) ctx.closePath()
}

function strokeLine(ctx: CanvasRenderingContext2D, a: P, b: P) {
  ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke()
}

function strokeFRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  polyPath(ctx, [fm(x, y), fm(x + w, y), fm(x + w, y + h), fm(x, y + h)], true)
  ctx.stroke()
}

// Goal net: white cells opaque, dark cells skipped → pitch grass shows through
function goalNetFace(
  ctx: CanvasRenderingContext2D,
  tl: P, tr: P, br: P, bl: P,
  cols: number, rows: number,
) {
  ctx.fillStyle = '#FFFFFF'
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if ((r + c) % 2 !== 0) continue  // dark cells = transparent; grass shows through
      const p00 = bilerp(tl, tr, br, bl,  c    / cols,  r    / rows)
      const p10 = bilerp(tl, tr, br, bl, (c+1) / cols,  r    / rows)
      const p11 = bilerp(tl, tr, br, bl, (c+1) / cols, (r+1) / rows)
      const p01 = bilerp(tl, tr, br, bl,  c    / cols, (r+1) / rows)
      ctx.beginPath()
      ctx.moveTo(p00[0], p00[1]); ctx.lineTo(p10[0], p10[1])
      ctx.lineTo(p11[0], p11[1]); ctx.lineTo(p01[0], p01[1])
      ctx.closePath(); ctx.fill()
    }
  }
}

function drawGoal(ctx: CanvasRenderingContext2D, side: 'left' | 'right') {
  const GW      = 10.98
  const GD_back = 9.0   // depth behind goal line (m)
  const GD_frnt = 3.0   // depth inside pitch (m) — 25% straddle
  const GY0 = (FH - GW) / 2   // 28.51 m — far-side post
  const GY1 = GY0 + GW         // 39.49 m — near-side post
  const goalH = 67              // 40% of 167px pitch depth

  // Ground-level corners — front face 25% inside pitch, back 75% outside
  let A: P, B: P, C: P, D: P
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

  // Crossbar-height versions (shift up by goalH px)
  const up = (p: P): P => [p[0], p[1] - goalH]
  const Ap = up(A), Bp = up(B), Cp = up(C), Dp = up(D)

  // Top net panel (at crossbar height, viewed from above):
  //   tl = far-back, tr = far-front (goal line), br = near-front, bl = near-back
  goalNetFace(ctx, Dp, Ap, Bp, Cp, 5, 4)

  // Front face (goal mouth, at goal line):
  //   tl = far-top, tr = near-top, br = near-ground, bl = far-ground
  goalNetFace(ctx, Ap, Bp, B, A, 3, 6)

  // Post and bar wireframe — dark stroke behind white highlight for pixel-art clarity
  const segs: [P, P][] = [
    [A,  Ap],   // far post
    [B,  Bp],   // near post
    [Ap, Bp],   // crossbar
    [Ap, Dp],   // top far rail (depth)
    [Bp, Cp],   // top near rail (depth)
    [Dp, Cp],   // back bar
  ]
  ctx.lineJoin = 'round'; ctx.lineCap = 'round'
  ctx.strokeStyle = '#333333'; ctx.lineWidth = 2.5
  segs.forEach(([a, b]) => strokeLine(ctx, a, b))
  ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 1.2
  segs.forEach(([a, b]) => strokeLine(ctx, a, b))
}

export function renderPitch(canvas: HTMLCanvasElement) {
  canvas.width  = PITCH_W
  canvas.height = PITCH_H
  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, PITCH_W, PITCH_H)
  ctx.scale(2, 2)   // logical drawing space is 512×240; canvas is 1024×480

  // ── Grass stripes ─────────────────────────────────────────
  const GRASS_A = '#32C81E'
  const GRASS_B = '#2BB418'
  for (let i = 0; i < 10; i++) {
    const y0 = i / 10, y1 = (i + 1) / 10
    polyPath(ctx, [fs(0, y0), fs(1, y0), fs(1, y1), fs(0, y1)], true)
    ctx.fillStyle = i % 2 === 0 ? GRASS_A : GRASS_B
    ctx.fill()
  }

  // ── White field markings ──────────────────────────────────
  ctx.strokeStyle = '#FFFFFF'
  ctx.lineWidth   = 1.5
  ctx.lineJoin    = 'round'
  ctx.lineCap     = 'round'

  strokeFRect(ctx, 0, 0, FW, FH)
  strokeLine(ctx, fm(FW / 2, 0), fm(FW / 2, FH))

  polyPath(ctx, arcPts(FW / 2, FH / 2, 9.15, 0, Math.PI * 2))
  ctx.closePath(); ctx.stroke()

  const [cX, cY] = fm(FW / 2, FH / 2)
  ctx.beginPath(); ctx.arc(cX, cY, 2, 0, Math.PI * 2)
  ctx.fillStyle = '#FFFFFF'; ctx.fill()

  const paY = (FH - 40.32) / 2
  strokeFRect(ctx, 0,          paY, 16.5, 40.32)
  strokeFRect(ctx, FW - 16.5,  paY, 16.5, 40.32)

  const gaY = (FH - 18.32) / 2
  strokeFRect(ctx, 0,         gaY, 5.5, 18.32)
  strokeFRect(ctx, FW - 5.5,  gaY, 5.5, 18.32)

  const aMax = Math.acos((16.5 - 11) / 9.15)
  polyPath(ctx, arcPts(11,      FH / 2, 9.15, -aMax,           aMax          )); ctx.stroke()
  polyPath(ctx, arcPts(FW - 11, FH / 2, 9.15, Math.PI - aMax, Math.PI + aMax)); ctx.stroke()

  for (const spoX of [11, FW - 11]) {
    const [sx, sy] = fm(spoX, FH / 2)
    ctx.beginPath(); ctx.arc(sx, sy, 1.5, 0, Math.PI * 2)
    ctx.fillStyle = '#FFFFFF'; ctx.fill()
  }

  polyPath(ctx, arcPts(0,  0,  1, 0,            Math.PI / 2    )); ctx.stroke()
  polyPath(ctx, arcPts(FW, 0,  1, Math.PI / 2,  Math.PI        )); ctx.stroke()
  polyPath(ctx, arcPts(FW, FH, 1, Math.PI,      3 * Math.PI / 2)); ctx.stroke()
  polyPath(ctx, arcPts(0,  FH, 1, -Math.PI / 2, 0              )); ctx.stroke()

  // ── Corner flags ──────────────────────────────────────────
  function drawFlag(mx: number, my: number) {
    const [sx, sy] = fm(mx, my)
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx, sy - 12)
    ctx.strokeStyle = '#888888'; ctx.lineWidth = 1; ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(sx, sy - 12); ctx.lineTo(sx + 7, sy - 7); ctx.lineTo(sx, sy - 3.5)
    ctx.closePath()
    ctx.fillStyle = '#CC1111'; ctx.fill()
  }
  drawFlag(0, 0);  drawFlag(FW, 0)
  drawFlag(0, FH); drawFlag(FW, FH)
}

export function pitchToBlob(): Promise<Blob> {
  const canvas = document.createElement('canvas')
  renderPitch(canvas)
  return new Promise(res => canvas.toBlob(b => res(b!), 'image/png'))
}
