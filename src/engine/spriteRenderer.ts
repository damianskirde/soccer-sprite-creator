import type { Player, Nation, AnimFrame, KitPattern, HairStyle, BeardStyle } from '../types'
import { SKIN_PALETTES, getHairColor, getBeardColor } from '../data/skinPalettes'

// ── Canvas: 16 × 24 px per frame ─────────────────────────────────────────────
const W = 16
const H = 24

// ── Anatomy (right-facing, front-ish 3/4 chibi — spec §3) ────────────────────
// HEAD:   cols 4–10 (7 px wide), rows 2–8  (7 px tall)
//   hair: rows 2–3 (top 2 rows of head)
//   face: rows 4–8  — eyes @ row 6, mouth @ row 8
// NECK:   cols 6–7  (2 px), row 9
// TORSO:  cols 5–10 (6 px), rows 10–14 (5 px)
// ARMS:   col 4 (left) / col 11 (right), rows 10–12 (1 px wide, 3 px tall)
// SHORTS: cols 5–10 (6 px), rows 15–17 (3 px)
// LEGS:   2 px wide × 4 px tall — center-based: col = CENTER_X + offset
// BOOTS:  3 px wide × 2 px tall — rows 22–23

const CENTER_X = 7   // horizontal leg anchor

type RGB = [number, number, number]

const BOOT_TOP:  RGB = [26,  26,  26 ]   // #1A1A1A
const BOOT_SOLE: RGB = [240, 240, 240]   // white sole strip
const GK_GLOVE:  RGB = [245, 196, 0  ]   // #F5C400 yellow-gold

function hexToRgb(hex: string): RGB {
  const h = hex.replace('#', '')
  return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)]
}

function p(d: Uint8ClampedArray, col: number, row: number, rgb: RGB) {
  if (col < 0 || col >= W || row < 0 || row >= H) return
  const i = (row * W + col) * 4
  d[i] = rgb[0]; d[i+1] = rgb[1]; d[i+2] = rgb[2]; d[i+3] = 255
}

// ── 1-px solid black outline pass (spec §11 rule 3) ──────────────────────────
function applyOutline(d: Uint8ClampedArray) {
  const flag = new Uint8Array(W * H)
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (d[(y * W + x) * 4 + 3] > 0) continue
      if (x > 0   && d[(y*W+x-1)*4+3] > 0) { flag[y*W+x] = 1; continue }
      if (x < W-1 && d[(y*W+x+1)*4+3] > 0) { flag[y*W+x] = 1; continue }
      if (y > 0   && d[((y-1)*W+x)*4+3] > 0) { flag[y*W+x] = 1; continue }
      if (y < H-1 && d[((y+1)*W+x)*4+3] > 0) { flag[y*W+x] = 1 }
    }
  }
  for (let i = 0; i < W * H; i++) {
    if (flag[i]) { const idx = i*4; d[idx]=0; d[idx+1]=0; d[idx+2]=0; d[idx+3]=255 }
  }
}

// ── Hair styles H01–H09 (spec §4) ────────────────────────────────────────────
// Drawn in top 2 rows of head (r1=2+dy, r2=3+dy).
// For right-facing: col 4 = back of head (left), col 10 = front (right).

function drawHairStyle(
  d: Uint8ClampedArray, dy: number, dx: number, hair: RGB, style: HairStyle,
) {
  const r1 = 2 + dy
  const r2 = 3 + dy

  switch (style) {
    case 0: // H01 short flat — full top row, partial sides on row 2
      for (let c = 4; c <= 10; c++) p(d, c+dx, r1, hair)
      p(d, 4+dx, r2, hair); p(d, 5+dx, r2, hair)
      p(d, 9+dx, r2, hair); p(d, 10+dx, r2, hair)
      break

    case 1: // H02 short messy — alternating spike effect
      for (let c = 4; c <= 10; c += 2) p(d, c+dx, r1, hair)  // 4,6,8,10
      for (let c = 5; c <= 9;  c += 2) p(d, c+dx, r2, hair)  // 5,7,9
      break

    case 2: // H03 afro — rounded full fill + 1-px overhang on sides
      for (let c = 3; c <= 11; c++) p(d, c+dx, r1, hair)      // wide
      for (let c = 4; c <= 10; c++) p(d, c+dx, r2, hair)
      p(d, 3+dx, r2, hair); p(d, 11+dx, r2, hair)             // side puffs
      p(d, 3+dx, r2+1, hair); p(d, 11+dx, r2+1, hair)         // ear-level puffs
      break

    case 3: // H04 bald — no fill; skin continues to top
      break

    case 4: // H05 mohawk — 2–3 centre pixels, spike above
      p(d, 7+dx, r1-1, hair)
      p(d, 6+dx, r1, hair); p(d, 7+dx, r1, hair); p(d, 8+dx, r1, hair)
      p(d, 7+dx, r2, hair)
      break

    case 5: // H06 curly tight — dense dotted pattern
      for (let c = 4; c <= 10; c++) p(d, c+dx, r1, hair)
      for (let c = 5; c <= 9;  c += 2) p(d, c+dx, r2, hair)  // 5,7,9
      break

    case 6: // H07 long (tied) — full fill + small tail at back-left (rows below)
      for (let c = 4; c <= 10; c++) p(d, c+dx, r1, hair)
      for (let c = 4; c <= 10; c++) p(d, c+dx, r2, hair)
      p(d, 3+dx, r2, hair)                                     // extra width at back
      p(d, 4+dx, r2+1, hair); p(d, 5+dx, r2+1, hair)          // tail peeking below
      break

    case 7: // H08 dreadlocks — full top + 3 vertical lines down back side
      for (let c = 4; c <= 10; c++) p(d, c+dx, r1, hair)
      for (let c = 4; c <= 10; c++) p(d, c+dx, r2, hair)
      // Locs hang from left/back of head through neck and torso area
      for (let r = r2+1; r <= r2+5; r++) {
        p(d, 4+dx, r, hair)
        p(d, 6+dx, r, hair)
      }
      break

    case 8: // H09 wavy side part — asymmetric, heavier left (back) side
      for (let c = 4; c <= 10; c++) p(d, c+dx, r1, hair)
      p(d, 4+dx, r2, hair); p(d, 5+dx, r2, hair); p(d, 6+dx, r2, hair)
      break

    default: // extra style — short with sideburn tufts
      for (let c = 4; c <= 10; c++) p(d, c+dx, r1, hair)
      for (let c = 4; c <= 10; c++) p(d, c+dx, r2, hair)
      p(d, 4+dx, r2+1, hair); p(d, 10+dx, r2+1, hair)
      break
  }
}

// ── Head (7×7 px, rows 2–8) ───────────────────────────────────────────────────
// Face = lower 5 rows (rows 4–8). Eyes @ face-row 3 = canvas row 6. Mouth @ row 8.
// eyeStyle: 0=E01 open, 1=E02 squint, 2=E03 wide, 3=E04 closed
// mouthStyle: 0=M01 neutral, 1=M02 open, 2=M03 grin, 3=M04 grimace

function drawHead(
  d: Uint8ClampedArray, dy: number, dx: number,
  skin: RGB, hair: RGB, beard: RGB,
  hairStyle: HairStyle, beardStyle: BeardStyle,
  eyeStyle = 0, mouthStyle = 0,
) {
  const EYE:  RGB = [20, 20, 20]
  const DARK: RGB = [20, 20, 20]

  drawHairStyle(d, dy, dx, hair, hairStyle)

  // Face skin: rows 4–8, cols 4–10 (row 8 chin slightly narrower)
  for (let r = 4; r <= 7; r++)
    for (let c = 4; c <= 10; c++) p(d, c+dx, r+dy, skin)
  for (let c = 5; c <= 9; c++) p(d, c+dx, 8+dy, skin)

  // ── Eyes (row 6, cols 6 and 8 — 2 px apart with gap at col 7) ──
  switch (eyeStyle) {
    case 3: // E04 closed — single horizontal line
      for (let c = 6; c <= 8; c++) p(d, c+dx, 6+dy, EYE)
      break
    case 2: // E03 wide — 2 px tall
      p(d, 6+dx, 5+dy, EYE); p(d, 6+dx, 6+dy, EYE)
      p(d, 8+dx, 5+dy, EYE); p(d, 8+dx, 6+dy, EYE)
      break
    default: // E01/E02 — 2 dark dots
      p(d, 6+dx, 6+dy, EYE)
      p(d, 8+dx, 6+dy, EYE)
  }

  // ── Mouth (row 8, cols 6–8, 3 px wide) ──
  switch (mouthStyle) {
    case 1: // M02 open — 3×2 dark rect
      for (let c = 6; c <= 8; c++) p(d, c+dx, 7+dy, DARK)
      for (let c = 6; c <= 8; c++) p(d, c+dx, 8+dy, DARK)
      break
    case 2: // M03 grin — pixel at each end
      p(d, 6+dx, 8+dy, DARK); p(d, 8+dx, 8+dy, DARK)
      break
    case 3: // M04 grimace — solid 3-px line
      for (let c = 6; c <= 8; c++) p(d, c+dx, 8+dy, DARK)
      break
    default: // M01 neutral — thin 3-px line
      for (let c = 6; c <= 8; c++) p(d, c+dx, 8+dy, DARK)
  }

  // ── Beard (spec §4, face rows 4–5 = canvas rows 7–8) ──
  switch (beardStyle) {
    case 1: // B01 stubble — sparse dots at chin
      p(d, 6+dx, 8+dy, beard); p(d, 8+dx, 8+dy, beard)
      break
    case 2: // B02 short beard — 3-px fill rows 7–8
      for (let c = 6; c <= 8; c++) p(d, c+dx, 7+dy, beard)
      for (let c = 6; c <= 8; c++) p(d, c+dx, 8+dy, beard)
      break
    case 3: // B03 full beard — parallel cheek lines from row 5 down + chin line
      for (let r = 5; r <= 8; r++) p(d, 5+dx, r+dy, beard)  // left cheek line
      for (let r = 5; r <= 8; r++) p(d, 9+dx, r+dy, beard)  // right cheek line
      for (let c = 5; c <= 9; c++) p(d, c+dx, 8+dy, beard)  // chin
      break
    case 4: // B04 moustache — 3-px fill row 7 only
      for (let c = 6; c <= 8; c++) p(d, c+dx, 7+dy, beard)
      break
    case 5: // B05 goatee — 2-px centre fill rows 7–8
      p(d, 7+dx, 7+dy, beard); p(d, 7+dx, 8+dy, beard)
      break
    // case 0: B00 clean shaven — nothing
  }
}

// ── Neck ──────────────────────────────────────────────────────────────────────
function drawNeck(d: Uint8ClampedArray, dy: number, skin: RGB) {
  p(d, 6, 9+dy, skin); p(d, 7, 9+dy, skin)
}

// ── Torso (6×5 px, cols 5–10, rows 10–14) ────────────────────────────────────
function drawTorso(d: Uint8ClampedArray, dy: number, kit: RGB, pattern: KitPattern) {
  for (let r = 10; r <= 14; r++)
    for (let c = 5; c <= 10; c++) p(d, c, r+dy, kit)

  if (pattern.type !== 'solid') applyKitPattern(d, dy, pattern)

  // Collar: 2 px wide, centred at col 7–8, row 10 (spec §5)
  const sec = hexToRgb(pattern.secondary)
  p(d, 7, 10+dy, sec); p(d, 8, 10+dy, sec)
}

function applyKitPattern(d: Uint8ClampedArray, dy: number, pattern: KitPattern) {
  const pri = hexToRgb(pattern.primary)
  const sec = hexToRgb(pattern.secondary)
  const sw  = pattern.stripeWidth ?? 2

  for (let row = 10; row <= 14; row++) {
    for (let col = 5; col <= 10; col++) {
      const relC = col - 5
      const relR = row - 10
      let color: RGB

      switch (pattern.type) {
        case 'v_stripes':
          color = Math.floor(relC / sw) % 2 === 0 ? pri : sec; break
        case 'h_stripes':
          color = Math.floor(relR / sw) % 2 === 0 ? pri : sec; break
        case 'sash': {
          const diagC = Math.floor(relR * 1.5)
          color = (relC >= diagC && relC <= diagC + 1) ? sec : pri; break
        }
        case 'collar_band':
          color = row === 10 ? sec : pri; break
        case 'shadow_stripe':
          color = relC >= 4 ? sec : pri; break
        case 'halved':
          color = relC < 3 ? pri : sec; break
        default:
          color = pri
      }
      p(d, col, row+dy, color)
    }
  }
}

// ── Arms (1×3 px each) ────────────────────────────────────────────────────────
// Left arm: col 4. Right arm: col 11. Sleeve (kit) at row 10, skin below.
// armF ≤ -3: arms raised (celebrate/throwin).
// armF ≥  3: right arm extended horizontally (save/taunt).
// Else: normal swing with subtle elbow bend at |armF| == 2.

function drawArms(
  d: Uint8ClampedArray, dy: number, armF: number,
  skin: RGB, kit: RGB, isGK: boolean,
) {
  if (armF <= -3) {
    // Arms raised overhead
    const lift = armF === -4 ? 5 : 3
    for (let r = 10 - lift; r <= 12; r++) {
      const rgb: RGB = r === 10 ? kit : skin
      p(d, 4,  r+dy, rgb)
      p(d, 11, r+dy, rgb)
    }
    if (isGK) {
      const tr = 10 - lift
      p(d, 3, tr+dy, GK_GLOVE); p(d, 4, tr+dy, GK_GLOVE)
      p(d, 11, tr+dy, GK_GLOVE); p(d, 12, tr+dy, GK_GLOVE)
    }
    return
  }

  if (armF >= 3) {
    // Left arm normal; right arm extended right (save / taunt)
    p(d, 4,  10+dy, kit); p(d, 4,  11+dy, skin); p(d, 4,  12+dy, skin)
    p(d, 11, 10+dy, kit)
    p(d, 12, 10+dy, skin); p(d, 13, 10+dy, skin); p(d, 14, 10+dy, skin)
    if (isGK) {
      p(d, 3, 12+dy, GK_GLOVE); p(d, 3, 11+dy, GK_GLOVE)
      p(d, 15, 10+dy, GK_GLOVE); p(d, 14, 11+dy, GK_GLOVE)
    }
    return
  }

  // Normal: straight arms with optional elbow bend for |armF| == 2
  const lBend = armF ===  2 ? 1 : (armF === -2 ? -1 : 0)
  const rBend = armF === -2 ? 1 : (armF ===  2 ? -1 : 0)

  p(d, 4,         10+dy, kit);  p(d, 4,         11+dy, skin); p(d, 4+lBend,  12+dy, skin)
  p(d, 11,        10+dy, kit);  p(d, 11,        11+dy, skin); p(d, 11+rBend, 12+dy, skin)

  if (isGK) {
    p(d, 3,  11+dy, GK_GLOVE); p(d, 3,  12+dy, GK_GLOVE)
    p(d, 4,  12+dy, GK_GLOVE)
    p(d, 11, 12+dy, GK_GLOVE)
    p(d, 12, 11+dy, GK_GLOVE); p(d, 12, 12+dy, GK_GLOVE)
  }
}

// ── Shorts (6×3 px, cols 5–10, rows 15–17) ───────────────────────────────────
function drawShorts(d: Uint8ClampedArray, dy: number, shorts: RGB) {
  for (let r = 15; r <= 17; r++)
    for (let c = 5; c <= 10; c++) p(d, c, r+dy, shorts)
}

// ── Leg + boot unit ───────────────────────────────────────────────────────────
// bx = leftmost col of 2-px leg. by = top row of 4-px leg section.
// Boot (3×2) sits directly below: top row = by+4, sole = by+5.

function drawLegAndBoot(d: Uint8ClampedArray, bx: number, by: number, skin: RGB, sock: RGB) {
  // Thigh (2 rows skin)
  p(d, bx, by,   skin); p(d, bx+1, by,   skin)
  p(d, bx, by+1, skin); p(d, bx+1, by+1, skin)
  // Sock (2 rows)
  p(d, bx, by+2, sock); p(d, bx+1, by+2, sock)
  p(d, bx, by+3, sock); p(d, bx+1, by+3, sock)
  // Boot (3×2): extends 1 px right for right-facing foot shape (spec §5)
  const bb = by + 4
  p(d, bx,   bb,   BOOT_TOP);  p(d, bx+1, bb,   BOOT_TOP);  p(d, bx+2, bb,   BOOT_TOP)
  p(d, bx,   bb+1, BOOT_SOLE); p(d, bx+1, bb+1, BOOT_SOLE); p(d, bx+2, bb+1, BOOT_SOLE)
}

// ── Slide tackle pose (spec §6.5) ─────────────────────────────────────────────
// Body nearly horizontal: head left (trailing), tackling leg extends right.

function drawSlide(
  d: Uint8ClampedArray,
  skin: RGB, hair: RGB, _beard: RGB, kit: RGB, shorts: RGB, sock: RGB,
  _hairStyle: HairStyle, _beardStyle: BeardStyle, isGK: boolean,
) {
  const br = 13
  const EYE: RGB = [20, 20, 20]

  // Simplified head (5×4 px) on left side
  for (let c = 0; c <= 4; c++) p(d, c, br-1, hair)
  for (let c = 0; c <= 4; c++) p(d, c, br,   hair)
  for (let c = 0; c <= 4; c++) p(d, c, br+1, skin)
  for (let c = 0; c <= 4; c++) p(d, c, br+2, skin)
  p(d, 1, br, EYE); p(d, 3, br, EYE)          // eyes
  for (let c = 1; c <= 3; c++) p(d, c, br+2, EYE)  // grimace M04

  // Torso horizontal (rows br+1 – br+2, cols 4–12)
  for (let c = 4; c <= 12; c++) p(d, c, br+1, kit)
  for (let c = 4; c <= 12; c++) p(d, c, br+2, kit)
  // Shorts
  for (let c = 4; c <= 9; c++) p(d, c, br+3, shorts)

  // Extended RIGHT leg (tackling, forward direction)
  for (let c = 10; c <= 14; c++) p(d, c, br+2, sock)
  for (let c = 10; c <= 14; c++) p(d, c, br+3, sock)
  p(d, 13, br+4, BOOT_TOP); p(d, 14, br+4, BOOT_TOP); p(d, 15, br+4, BOOT_TOP)
  p(d, 13, br+5, BOOT_SOLE); p(d, 14, br+5, BOOT_SOLE); p(d, 15, br+5, BOOT_SOLE)

  // Bent LEFT leg (knee raised behind)
  p(d, 8, br-1, skin); p(d, 9, br-1, skin)
  p(d, 8, br-2, sock); p(d, 9, br-2, sock)
  p(d, 7, br-3, BOOT_TOP); p(d, 8, br-3, BOOT_TOP)
  p(d, 7, br-4, BOOT_SOLE); p(d, 8, br-4, BOOT_SOLE)

  // Arms
  p(d, 3, br+1, skin); p(d, 3, br+2, skin)
  if (isGK) {
    p(d, 2, br+1, GK_GLOVE); p(d, 2, br+2, GK_GLOVE)
    p(d, 13, br+1, GK_GLOVE); p(d, 13, br+2, GK_GLOVE)
  }
}

// ── GK dive pose (spec §6.9) ──────────────────────────────────────────────────
function drawDive(
  d: Uint8ClampedArray, armF: number,
  skin: RGB, hair: RGB, _beard: RGB, kit: RGB, shorts: RGB, sock: RGB,
  _hairStyle: HairStyle, _beardStyle: BeardStyle,
) {
  const EYE: RGB = [20, 20, 20]

  // Head upper-left (simplified)
  for (let c = 0; c <= 5; c++) p(d, c, 3, hair)
  for (let c = 0; c <= 5; c++) p(d, c, 4, hair)
  for (let c = 0; c <= 5; c++) p(d, c, 5, skin)
  for (let c = 0; c <= 5; c++) p(d, c, 6, skin)
  p(d, 1, 5, EYE); p(d, 3, 5, EYE)

  // Torso angled downward-right
  for (let c = 4; c <= 12; c++) {
    const r = 8 + Math.floor((c - 4) * 0.35)
    p(d, c, r,   kit)
    p(d, c, r+1, kit)
  }

  // Arms extended right toward dive
  const reach = Math.min(armF, 5)
  for (let r = 7; r <= 10; r++) p(d, 8 + (r-7) + reach, r, r === 7 ? kit : skin)
  const gx = 10 + reach
  p(d, gx,   9, GK_GLOVE); p(d, gx+1, 9, GK_GLOVE)
  p(d, gx,  10, GK_GLOVE); p(d, gx+1, 10, GK_GLOVE)

  // Shorts + trailing leg
  for (let c = 3; c <= 7; c++) p(d, c, 12, shorts)
  p(d, 3, 13, skin); p(d, 4, 13, skin)
  p(d, 3, 14, sock); p(d, 4, 14, sock)
  p(d, 2, 15, BOOT_TOP); p(d, 3, 15, BOOT_TOP)
  p(d, 2, 16, BOOT_SOLE); p(d, 3, 16, BOOT_SOLE)
}

// ── Throw-in arms (spec §6.7) ─────────────────────────────────────────────────
function drawThrowIn(
  d: Uint8ClampedArray, dy: number, armF: number, skin: RGB, kit: RGB,
) {
  const r0 = armF === -4 ? 2 : 4
  // Both arms overhead
  for (let r = r0; r <= 9; r++) {
    const rgb: RGB = r >= 9 ? kit : skin
    p(d, 4,  r+dy, rgb)
    p(d, 11, r+dy, rgb)
  }
}

// ── Colour builder ────────────────────────────────────────────────────────────
interface RenderColors {
  skin: RGB; hair: RGB; beard: RGB
  kit: RGB; shorts: RGB; sock: RGB
  kitPat: KitPattern
  isGK: boolean
}

function buildColors(player: Player, nation: Nation): RenderColors {
  const pal  = SKIN_PALETTES[player.skinTone]
  const isGK = player.position === 'GK'
  return {
    skin:   hexToRgb(pal.skin),
    hair:   hexToRgb(getHairColor(player.skinTone, player.hairVariant)),
    beard:  hexToRgb(getBeardColor(player.skinTone)),
    kit:    hexToRgb(isGK ? nation.gkKit : nation.kitPrimary),
    shorts: hexToRgb(isGK ? nation.gkKit : nation.kitSecondary),
    sock:   hexToRgb(isGK ? nation.gkKit : nation.kitSecondary),
    kitPat: isGK
      ? { type: 'solid' as const, primary: nation.gkKit, secondary: nation.gkKit }
      : nation.kitPattern,
    isGK,
  }
}

// ── Per-frame eye / mouth selection ──────────────────────────────────────────
function pickEye(pose?: string): number {
  if (pose === 'slide') return 3   // E04 closed during tackle
  return 0
}

function pickMouth(pose?: string, animId?: string): number {
  if (pose === 'slide') return 3                             // M04 grimace
  if (animId === 'run') return 3                            // M04 sprint grimace
  if (animId === 'celebrate' || pose === 'throwin_peak') return 1  // M02 open
  return 0                                                   // M01 neutral
}

// ── Composite a single frame ──────────────────────────────────────────────────
function compositeFrame(
  d: Uint8ClampedArray, c: RenderColors, player: Player,
  frame: AnimFrame, animId?: string,
) {
  const by  = frame.bodyY ?? 0
  const [llx, lly] = frame.legL
  const [lrx, lry] = frame.legR
  const armF = frame.armF ?? 0

  if (frame.pose === 'slide') {
    drawSlide(d, c.skin, c.hair, c.beard, c.kit, c.shorts, c.sock,
      player.hairStyle, player.beardStyle, c.isGK)
    return
  }

  if (frame.pose === 'dive') {
    drawDive(d, armF, c.skin, c.hair, c.beard, c.kit, c.shorts, c.sock,
      player.hairStyle, player.beardStyle)
    return
  }

  // Leg positions (center-based)
  const lBX = CENTER_X + llx
  const rBX = CENTER_X + lrx
  const legBase = 18 + by

  // Draw-order: back leg first, front leg last (front = higher col for right-facing)
  if (lBX <= rBX) {
    drawLegAndBoot(d, lBX, legBase + lly, c.skin, c.sock)
    drawLegAndBoot(d, rBX, legBase + lry, c.skin, c.sock)
  } else {
    drawLegAndBoot(d, rBX, legBase + lry, c.skin, c.sock)
    drawLegAndBoot(d, lBX, legBase + lly, c.skin, c.sock)
  }

  drawShorts(d, by, c.shorts)
  drawTorso(d, by, c.kit, c.kitPat)
  drawNeck(d, by, c.skin)
  drawArms(d, by, armF, c.skin, c.kit, c.isGK)

  if (frame.pose === 'throwin_peak') {
    drawThrowIn(d, by, armF, c.skin, c.kit)
  }

  drawHead(d, by, frame.headX ?? 0, c.skin, c.hair, c.beard,
    player.hairStyle, player.beardStyle,
    pickEye(frame.pose), pickMouth(frame.pose, animId))
}

// ── Public API ────────────────────────────────────────────────────────────────
export function renderSprite(
  canvas: HTMLCanvasElement,
  player: Player, nation: Nation, frame: AnimFrame,
  scale: number, facingLeft: boolean,
  animId?: string,
) {
  const imageData = new ImageData(W, H)
  const c = buildColors(player, nation)
  compositeFrame(imageData.data, c, player, frame, animId)
  applyOutline(imageData.data)

  const tmp = document.createElement('canvas')
  tmp.width = W; tmp.height = H
  tmp.getContext('2d')!.putImageData(imageData, 0, 0)

  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.imageSmoothingEnabled = false

  if (facingLeft) {
    ctx.save()
    ctx.translate(canvas.width, 0)
    ctx.scale(-1, 1)
    ctx.drawImage(tmp, 0, 0, canvas.width, canvas.height)
    ctx.restore()
  } else {
    ctx.drawImage(tmp, 0, 0, canvas.width, canvas.height)
  }
}

export function renderSpriteData(
  player: Player, nation: Nation, frame: AnimFrame, animId?: string,
): ImageData {
  const imageData = new ImageData(W, H)
  const c = buildColors(player, nation)
  compositeFrame(imageData.data, c, player, frame, animId)
  applyOutline(imageData.data)
  return imageData
}
