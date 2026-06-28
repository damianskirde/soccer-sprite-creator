// Pixel-art flag renderer — 20×12 px native per flag

export const FLAG_W = 20
export const FLAG_H = 12

type RGB = [number, number, number]

const W: RGB = [255, 255, 255]
const K: RGB = [17,  17,  17]

function r(hex: string): RGB {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff]
}

function p(d: Uint8ClampedArray, x: number, y: number, c: RGB) {
  if (x < 0 || x >= FLAG_W || y < 0 || y >= FLAG_H) return
  const i = (y * FLAG_W + x) * 4
  d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255
}

function rect(d: Uint8ClampedArray, x: number, y: number, w: number, h: number, c: RGB) {
  for (let dy = 0; dy < h; dy++)
    for (let dx = 0; dx < w; dx++)
      p(d, x + dx, y + dy, c)
}

function fill(d: Uint8ClampedArray, c: RGB) { rect(d, 0, 0, FLAG_W, FLAG_H, c) }

function hS(d: Uint8ClampedArray, cols: RGB[]) {
  const n = cols.length
  for (let i = 0; i < n; i++) {
    const y0 = Math.round(i * FLAG_H / n)
    const y1 = i === n - 1 ? FLAG_H : Math.round((i + 1) * FLAG_H / n)
    rect(d, 0, y0, FLAG_W, y1 - y0, cols[i])
  }
}

function vS(d: Uint8ClampedArray, cols: RGB[]) {
  const n = cols.length
  for (let i = 0; i < n; i++) {
    const x0 = Math.round(i * FLAG_W / n)
    const x1 = i === n - 1 ? FLAG_W : Math.round((i + 1) * FLAG_W / n)
    rect(d, x0, 0, x1 - x0, FLAG_H, cols[i])
  }
}

// Nordic cross — outer 4px bars, optional inner 2px bar, vertical bar left-offset at vx
function nordic(d: Uint8ClampedArray, bg: RGB, outer: RGB, inner: RGB | null, vx = 6, hy = 4) {
  fill(d, bg)
  rect(d, 0, hy, FLAG_W, 4, outer)
  rect(d, vx, 0, 4, FLAG_H, outer)
  if (inner) {
    rect(d, 0, hy + 1, FLAG_W, 2, inner)
    rect(d, vx + 1, 0, 2, FLAG_H, inner)
  }
}

// St George's cross (full-width, full-height, 2px bars)
function stGeorge(d: Uint8ClampedArray, bg: RGB, c: RGB) {
  fill(d, bg)
  rect(d, 0, 5, FLAG_W, 2, c)
  rect(d, 9, 0, 2, FLAG_H, c)
}

// Square centred cross (Swiss style)
function swissCross(d: Uint8ClampedArray, bg: RGB, c: RGB) {
  fill(d, bg)
  rect(d, 8, 2, 4, 8, c)
  rect(d, 5, 5, 10, 2, c)
}

// Filled circle
function disc(d: Uint8ClampedArray, cx: number, cy: number, rad: number, c: RGB) {
  for (let y = cy - rad; y <= cy + rad; y++)
    for (let x = cx - rad; x <= cx + rad; x++)
      if ((x - cx) ** 2 + (y - cy) ** 2 <= rad * rad + 0.5)
        p(d, x, y, c)
}

// Diagonal cross (saltire) — each arm 2px wide
function saltire(d: Uint8ClampedArray, bg: RGB, c: RGB) {
  fill(d, bg)
  for (let x = 0; x < FLAG_W; x++) {
    const y1 = Math.round(x * (FLAG_H - 1) / (FLAG_W - 1))
    const y2 = (FLAG_H - 1) - y1
    p(d, x, y1, c);           p(d, x, Math.min(FLAG_H - 1, y1 + 1), c)
    p(d, x, y2, c);           p(d, x, Math.max(0, y2 - 1), c)
  }
}

// Union Jack in a rectangular canton box
function unionJack(d: Uint8ClampedArray, x0: number, y0: number, bw: number, bh: number) {
  const B: RGB = [0, 36, 125]; const RE: RGB = [200, 16, 46]; const WH: RGB = [255, 255, 255]
  rect(d, x0, y0, bw, bh, B)
  // diagonals
  for (let x = 0; x < bw; x++) {
    const y = Math.round(x * (bh - 1) / (bw - 1))
    p(d, x0 + x, y0 + y, WH)
    p(d, x0 + x, y0 + bh - 1 - y, WH)
  }
  // center cross white then red
  rect(d, x0, y0 + Math.floor(bh / 2) - 1, bw, 3, WH)
  rect(d, x0 + Math.floor(bw / 2) - 1, y0, 3, bh, WH)
  rect(d, x0, y0 + Math.floor(bh / 2), bw, 1, RE)
  rect(d, x0 + Math.floor(bw / 2), y0, 1, bh, RE)
}

// Left-pointing triangle (base = full left edge, apex = right at mid-height)
// Used by Czech Republic (blue), Jordan (red)
function leftTriangle(d: Uint8ClampedArray, c: RGB, apexX: number) {
  for (let y = 0; y < FLAG_H; y++) {
    const ratio = 1 - Math.abs(y - (FLAG_H - 1) / 2) / ((FLAG_H - 1) / 2)
    const w = Math.round(ratio * apexX) + 1
    rect(d, 0, y, w, 1, c)
  }
}

// Crescent: large disc - offset small disc
function crescent(d: Uint8ClampedArray, cx: number, cy: number, R: number, dx: number, dy: number, bg: RGB, c: RGB) {
  disc(d, cx, cy, R, c)
  disc(d, cx + dx, cy + dy, R - 1, bg)
}

// Simple 5-point star pixel approximation (9px tall)
function star5(d: Uint8ClampedArray, cx: number, cy: number, c: RGB) {
  const pts: [number, number][] = [
    [cx, cy - 3],
    [cx - 1, cy - 1], [cx + 1, cy - 1],
    [cx - 3, cy], [cx + 3, cy],
    [cx - 2, cy + 1], [cx + 2, cy + 1],
    [cx - 1, cy + 2], [cx + 1, cy + 2],
    [cx, cy - 2], [cx - 1, cy], [cx + 1, cy], [cx, cy + 1],
  ]
  pts.forEach(([x, y]) => p(d, x, y, c))
}

export function drawFlagData(code: string): ImageData {
  const img = new ImageData(FLAG_W, FLAG_H)
  const d = img.data

  switch (code) {

    // ── CONMEBOL ──────────────────────────────────────────────────────────────

    case 'ARG': // Sky blue / white / sky blue + sun
      hS(d, [r('#74ACDF'), W, r('#74ACDF')])
      disc(d, 10, 6, 2, r('#F6B40E'))
      for (const [dx, dy] of [[-3,0],[3,0],[0,-3],[0,3],[-2,-2],[2,-2],[-2,2],[2,2]])
        p(d, 10+dx, 6+dy, r('#F6B40E'))
      break

    case 'BRA': { // Green + yellow diamond + blue disc + stars
      fill(d, r('#009B3A'))
      const Y = r('#FEDF00')
      for (let y = 0; y < FLAG_H; y++) {
        const hw = Math.round((1 - Math.abs(y - 5.5) / 5) * 8)
        if (hw > 0) rect(d, 10 - hw, y, hw * 2, 1, Y)
      }
      disc(d, 10, 6, 3, r('#002776'))
      rect(d, 7, 6, 6, 1, W)
      break
    }

    case 'COL': // Yellow (wide) / blue / red
      rect(d, 0, 0, FLAG_W, 6, r('#FCD116'))
      rect(d, 0, 6, FLAG_W, 3, r('#003087'))
      rect(d, 0, 9, FLAG_W, 3, r('#CE1126'))
      break

    case 'ECU': // Same proportions as Colombia
      rect(d, 0, 0, FLAG_W, 6, r('#FFD100'))
      rect(d, 0, 6, FLAG_W, 3, r('#003087'))
      rect(d, 0, 9, FLAG_W, 3, r('#CE1126'))
      break

    case 'PAR': // Red / white / blue horizontal
      hS(d, [r('#D52B1E'), W, r('#0038A8')])
      break

    case 'URU': { // White + blue stripes + sun canton
      fill(d, W)
      const BU = r('#5EB6E4')
      for (let i = 1; i < FLAG_H; i += 2) rect(d, 0, i, FLAG_W, 1, BU)
      // canton
      rect(d, 0, 0, 8, 6, W)
      disc(d, 4, 3, 2, r('#F6B40E'))
      for (const [dx, dy] of [[-3,0],[3,0],[0,-2],[0,2],[-2,-1],[2,-1],[-2,1],[2,1]])
        p(d, 4+dx, 3+dy, r('#F6B40E'))
      break
    }

    // ── UEFA ─────────────────────────────────────────────────────────────────

    case 'ALG': { // Green | white + red crescent
      vS(d, [r('#006233'), W])
      crescent(d, 14, 6, 3, 1, -1, r('#006233'), r('#D52B1E'))
      star5(d, 17, 4, r('#D52B1E'))
      break
    }

    case 'AUT': // Red / white / red
      hS(d, [r('#ED2939'), W, r('#ED2939')])
      break

    case 'BEL': // Black | yellow | red vertical
      vS(d, [K, r('#FAE042'), r('#EF3340')])
      break

    case 'BIH': { // Blue + yellow diagonal band + stars
      fill(d, r('#002395'))
      const Y = r('#FFCD00')
      for (let x = 0; x < FLAG_W; x++) {
        const y = Math.round(x * (FLAG_H - 1) / (FLAG_W - 1))
        for (let t = -1; t <= 3; t++) p(d, x, y + t, Y)
      }
      // stars along top-right of band
      for (let i = 0; i < 6; i++) {
        const bx = Math.round(i * (FLAG_W - 1) / 5)
        const by = Math.round(i * (FLAG_H - 1) / 5)
        if (bx < FLAG_W - 1 && by < FLAG_H - 1) p(d, bx, by - 2, W)
      }
      break
    }

    case 'CRO': { // Red / white / blue + checkerboard shield centre
      hS(d, [r('#FF0000'), W, r('#171796')])
      for (let row = 0; row < 3; row++)
        for (let col = 0; col < 4; col++)
          rect(d, 6 + col * 2, 3 + row * 2, 2, 2, (row + col) % 2 === 0 ? r('#FF0000') : W)
      break
    }

    case 'CZE': { // White top / red bottom + blue triangle
      rect(d, 0, 0, FLAG_W, 6, W)
      rect(d, 0, 6, FLAG_W, 6, r('#D7141A'))
      leftTriangle(d, r('#11457E'), 9)
      break
    }

    case 'ENG': // St George's cross
      stGeorge(d, W, r('#CC0000'))
      break

    case 'ESP': // Red / yellow (wide) / red
      rect(d, 0, 0, FLAG_W, 3, r('#C60B1E'))
      rect(d, 0, 3, FLAG_W, 6, r('#F1BF00'))
      rect(d, 0, 9, FLAG_W, 3, r('#C60B1E'))
      break

    case 'FRA': // Blue | white | red vertical
      vS(d, [r('#002395'), W, r('#ED2939')])
      break

    case 'GER': // Black / red / gold
      hS(d, [K, r('#DD0000'), r('#FFCE00')])
      break

    case 'NED': // Red / white / blue
      hS(d, [r('#AE1C28'), W, r('#21468B')])
      break

    case 'NOR': // Red + white/blue Nordic cross
      nordic(d, r('#EF2B2D'), W, r('#002868'), 6, 4)
      break

    case 'POR': { // Green left | red right + shield seam
      rect(d, 0, 0, 7, FLAG_H, r('#006600'))
      rect(d, 7, 0, 13, FLAG_H, r('#FF0000'))
      rect(d, 5, 3, 5, 6, r('#002D6E'))
      rect(d, 6, 4, 3, 4, r('#FFD700'))
      rect(d, 7, 4, 1, 4, W)
      break
    }

    case 'SCO': // Navy + white saltire
      saltire(d, r('#003366'), W)
      break

    case 'SUI': // Red + white cross
      swissCross(d, r('#FF0000'), W)
      break

    case 'SWE': // Blue + yellow Nordic cross
      nordic(d, r('#006AA7'), r('#FECC02'), null, 6, 4)
      break

    case 'TUR': { // Red + white crescent + star
      fill(d, r('#E30A17'))
      crescent(d, 8, 6, 3, 1, -1, r('#E30A17'), W)
      p(d, 13, 5, W); p(d, 14, 6, W); p(d, 13, 7, W); p(d, 12, 6, W); p(d, 13, 6, W)
      break
    }

    // ── AFC ──────────────────────────────────────────────────────────────────

    case 'AUS': // Navy + Union Jack canton + stars
      fill(d, r('#00247D'))
      unionJack(d, 0, 0, 10, 6)
      disc(d, 5, 9, 1, W)         // commonwealth star
      p(d, 14, 3, W); p(d, 17, 5, W); p(d, 13, 8, W); p(d, 17, 9, W) // southern cross
      break

    case 'IRN': // Green / white / red
      hS(d, [r('#239F40'), W, r('#DA0000')])
      break

    case 'IRQ': // Red / white / black + green text hint
      hS(d, [r('#CE1126'), W, K])
      for (let i = 5; i <= 15; i += 2) p(d, i, 6, r('#007A3D'))
      break

    case 'JOR': { // Black / white / green + red triangle + star
      hS(d, [K, W, r('#007A3D')])
      leftTriangle(d, r('#CE1126'), 8)
      star5(d, 4, 6, W)
      break
    }

    case 'JPN': // White + red disc
      fill(d, W)
      disc(d, 9, 6, 3, r('#BC002D'))
      break

    case 'KOR': { // White + taegeuk + trigrams
      fill(d, W)
      disc(d, 10, 6, 4, r('#CD2E3A'))
      for (let y = 6; y <= 10; y++)
        for (let x = 6; x <= 14; x++)
          if ((x - 10) ** 2 + (y - 6) ** 2 <= 16) p(d, x, y, r('#003478'))
      disc(d, 10, 4, 1, r('#CD2E3A'))
      disc(d, 10, 8, 1, r('#003478'))
      // trigrams (4 corners, 3 short lines each)
      for (let i = 0; i < 3; i++) { rect(d, 1, 1 + i * 2, 3, 1, K); rect(d, 16, 1 + i * 2, 3, 1, K) }
      for (let i = 0; i < 3; i++) { rect(d, 1, 8 + i, 3, 1, K);     rect(d, 16, 8 + i, 3, 1, K) }
      break
    }

    case 'QAT': { // Maroon + white serrated band
      fill(d, r('#8D153A'))
      rect(d, 0, 0, 5, FLAG_H, W)
      for (let i = 0; i < 5; i++) p(d, 5, i * 2 + 1, r('#8D153A'))
      break
    }

    case 'SAU': // Dark green + white elements
      fill(d, r('#006C35'))
      rect(d, 3, 5, 14, 1, W)
      rect(d, 9, 3, 1, 5, W)
      break

    case 'UZB': { // Sky blue / (red border) / white / (red border) / green + crescent + dots
      rect(d, 0, 0, FLAG_W, 5, r('#00AEEF'))
      rect(d, 0, 5, FLAG_W, 1, r('#CE1126'))
      rect(d, 0, 6, FLAG_W, 1, W)
      rect(d, 0, 7, FLAG_W, 1, r('#CE1126'))
      rect(d, 0, 8, FLAG_W, 4, r('#1EB53A'))
      crescent(d, 4, 2, 2, 1, -1, r('#00AEEF'), W)
      for (let i = 0; i < 3; i++) p(d, 8 + i * 3, 1, W)
      for (let i = 0; i < 3; i++) p(d, 8 + i * 3, 3, W)
      break
    }

    // ── CAF ──────────────────────────────────────────────────────────────────

    case 'CIV': // Orange | white | green vertical
      vS(d, [r('#F77F00'), W, r('#009A44')])
      break

    case 'COD': { // Sky blue + yellow/red diagonal stripe + star
      fill(d, r('#007FFF'))
      for (let x = 0; x < FLAG_W; x++) {
        const y = (FLAG_H - 1) - Math.round(x * (FLAG_H - 1) / (FLAG_W - 1))
        p(d, x, Math.max(0, y - 1), r('#F7D618'))
        p(d, x, y, r('#CE1126'))
        p(d, x, Math.min(FLAG_H - 1, y + 1), r('#F7D618'))
      }
      disc(d, 2, 2, 1, r('#F7D618'))
      break
    }

    case 'CPV': { // Blue + two white + one red stripe + stars ring
      fill(d, r('#003893'))
      rect(d, 0, 7, FLAG_W, 1, W)
      rect(d, 0, 8, FLAG_W, 2, r('#CF2027'))
      rect(d, 0, 10, FLAG_W, 1, W)
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2 - Math.PI / 2
        const sx = Math.round(10 + 5 * Math.cos(a))
        const sy = Math.round(4 + 3 * Math.sin(a))
        p(d, sx, sy, r('#F7D618'))
      }
      break
    }

    case 'EGY': // Red / white / black + gold eagle
      hS(d, [r('#CE1126'), W, K])
      disc(d, 10, 6, 2, r('#C09300'))
      break

    case 'GHA': // Red / gold / green + black star
      hS(d, [r('#CE1126'), r('#FCD116'), r('#006B3F')])
      disc(d, 10, 6, 2, K)
      break

    case 'MAR': { // Red + green star
      fill(d, r('#C1272D'))
      const G = r('#006233')
      // 5-pointed star outline (interlaced)
      const pts: [number, number][] = [
        [10, 3], [8, 8], [13, 5], [7, 5], [12, 8]
      ]
      // draw lines between points for a star
      p(d, 10, 4, G); p(d, 10, 5, G); p(d, 10, 6, G)
      p(d, 9, 6, G); p(d, 11, 6, G)
      p(d, 8, 7, G); p(d, 12, 7, G)
      p(d, 9, 5, G); p(d, 11, 5, G)
      p(d, 10, 3, G); p(d, 8, 8, G); p(d, 12, 8, G)
      break
    }

    case 'RSA': { // Red / blue + green Y-stripe + black triangle
      rect(d, 0, 0, FLAG_W, 6, r('#DE3831'))
      rect(d, 0, 6, FLAG_W, 6, r('#002395'))
      // left black triangle
      for (let y = 0; y < FLAG_H; y++) {
        const w = Math.round((1 - Math.abs(y - 5.5) / 5.5) * 5)
        rect(d, 0, y, w, 1, K)
      }
      // green Y-stripe with gold borders
      for (let y = 0; y < FLAG_H; y++) {
        const cx = Math.round((1 - Math.abs(y - 5.5) / 5.5) * 5)
        rect(d, cx, y, 4, 1, r('#FFB612'))
        rect(d, cx + 1, y, 2, 1, r('#007A4D'))
      }
      break
    }

    case 'SEN': { // Green | yellow | red + green star
      vS(d, [r('#00853F'), r('#FDEF42'), r('#E31B23')])
      star5(d, 10, 6, r('#00853F'))
      break
    }

    case 'TUN': { // Red + white disc + red crescent
      fill(d, r('#E70013'))
      disc(d, 10, 6, 4, W)
      crescent(d, 10, 6, 3, -1, -1, r('#E70013'), r('#E70013'))
      disc(d, 8, 5, 2, W)
      p(d, 12, 5, r('#E70013')); p(d, 12, 6, r('#E70013')); p(d, 12, 7, r('#E70013'))
      break
    }

    // ── CONCACAF ─────────────────────────────────────────────────────────────

    case 'CAN': { // Red | white | red + maple leaf
      rect(d, 0, 0, 3, FLAG_H, r('#FF0000'))
      rect(d, 3, 0, 14, FLAG_H, W)
      rect(d, 17, 0, 3, FLAG_H, r('#FF0000'))
      const L = r('#FF0000')
      p(d, 10, 2, L); p(d, 9, 3, L); p(d, 10, 3, L); p(d, 11, 3, L)
      p(d, 8, 4, L); p(d, 9, 4, L); p(d, 10, 4, L); p(d, 11, 4, L); p(d, 12, 4, L)
      p(d, 9, 5, L); p(d, 10, 5, L); p(d, 11, 5, L)
      p(d, 8, 5, L); p(d, 12, 5, L)
      p(d, 9, 6, L); p(d, 10, 6, L); p(d, 11, 6, L)
      p(d, 10, 7, L); p(d, 10, 8, L)
      p(d, 9, 9, L); p(d, 11, 9, L)
      break
    }

    case 'CRC': // Blue / white / red (wide) / white / blue
      rect(d, 0, 0, FLAG_W, 2, r('#002B7F'))
      rect(d, 0, 2, FLAG_W, 2, W)
      rect(d, 0, 4, FLAG_W, 4, r('#D60029'))
      rect(d, 0, 8, FLAG_W, 2, W)
      rect(d, 0, 10, FLAG_W, 2, r('#002B7F'))
      break

    case 'CUW': { // Blue + yellow stripe + 3 stars
      fill(d, r('#003DA5'))
      rect(d, 0, 9, FLAG_W, 2, r('#F8CD00'))
      p(d, 2, 3, W); p(d, 4, 2, W); p(d, 6, 3, W)
      break
    }

    case 'HTI': { // Blue / red + white rectangle (coat of arms)
      hS(d, [r('#00209F'), r('#D21034')])
      rect(d, 8, 4, 4, 4, W)
      break
    }

    case 'MEX': { // Green | white | red + eagle
      vS(d, [r('#006847'), W, r('#CE1126')])
      disc(d, 10, 6, 2, r('#8B6914'))
      p(d, 10, 4, r('#2E7D32'))
      break
    }

    case 'PAN': { // 4 quadrants: white/red top, blue/white bottom + blue & red stars
      rect(d, 0,  0, 10, 6, W)
      rect(d, 10, 0, 10, 6, r('#D21034'))
      rect(d, 0,  6, 10, 6, r('#005293'))
      rect(d, 10, 6, 10, 6, W)
      star5(d, 5,  3, r('#005293'))
      star5(d, 15, 9, r('#D21034'))
      break
    }

    case 'USA': { // Red/white stripes + blue canton + stars
      for (let y = 0; y < FLAG_H; y++)
        rect(d, 0, y, FLAG_W, 1, y % 2 === 0 ? r('#B22234') : W)
      rect(d, 0, 0, 8, 6, r('#3C3B6E'))
      for (let row = 0; row < 3; row++)
        for (let col = 0; col < 4; col++)
          p(d, 1 + col * 2, 1 + row * 2, W)
      break
    }

    // ── OFC ──────────────────────────────────────────────────────────────────

    case 'NZL': // Navy + Union Jack canton + Southern Cross
      fill(d, r('#00247D'))
      unionJack(d, 0, 0, 10, 6)
      p(d, 14, 2, r('#CC0000')); p(d, 15, 2, r('#CC0000'))
      p(d, 17, 4, r('#CC0000')); p(d, 18, 4, r('#CC0000'))
      p(d, 13, 7, r('#CC0000')); p(d, 14, 7, r('#CC0000'))
      p(d, 17, 9, r('#CC0000')); p(d, 18, 9, r('#CC0000'))
      break

    default:
      fill(d, r('#334155'))
  }

  return img
}

export function renderFlag(code: string, canvas: HTMLCanvasElement, scale = 1) {
  canvas.width  = FLAG_W * scale
  canvas.height = FLAG_H * scale
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingEnabled = false

  const img = drawFlagData(code)
  const tmp = document.createElement('canvas')
  tmp.width = FLAG_W; tmp.height = FLAG_H
  tmp.getContext('2d')!.putImageData(img, 0, 0)
  ctx.drawImage(tmp, 0, 0, FLAG_W * scale, FLAG_H * scale)
}

export function flagToBlob(code: string, scale = 8): Promise<Blob> {
  const canvas = document.createElement('canvas')
  renderFlag(code, canvas, scale)
  return new Promise(resolve => canvas.toBlob(b => resolve(b!), 'image/png'))
}
