// Pixel-art scoreboard renderer — 480 × 96 px native
// Layout: [LEFT TEAM 180px] [CENTER 120px] [RIGHT TEAM 180px]
//         Timer strip (120px wide × 32px tall) hangs below the centre zone

import type { Nation } from '../types'
import { renderFlag, FLAG_W, FLAG_H } from './flagRenderer'
import { renderTrophy, TROPHY_W, TROPHY_H } from './trophyRenderer'

export const SB_W      = 480
export const SB_BAR_H  =  64   // main scoreboard bar height
export const SB_TIMER_H =  32  // timer strip height
export const SB_H      = SB_BAR_H + SB_TIMER_H   // 96

const LEFT_END    = 180   // left team zone ends / centre begins
const RIGHT_START = 300   // centre ends / right team zone begins

// Palette
const BLACK = '#111111'
const TEAL  = '#00CCBB'
const GRAY  = '#555555'
const WHITE = '#FFFFFF'

// ── 5×7 bitmap font ──────────────────────────────────────────
// Each entry = 7 row bitmasks, 5 bits wide (bit 4 = left, bit 0 = right)
const FONT: Record<string, readonly number[]> = {
  '0': [0x0E,0x11,0x11,0x11,0x11,0x11,0x0E],
  '1': [0x04,0x0C,0x04,0x04,0x04,0x04,0x0E],
  '2': [0x0E,0x11,0x01,0x06,0x08,0x10,0x1F],
  '3': [0x0E,0x01,0x01,0x06,0x01,0x01,0x0E],
  '4': [0x02,0x06,0x0A,0x12,0x1F,0x02,0x02],
  '5': [0x1F,0x10,0x10,0x1E,0x01,0x01,0x0E],
  '6': [0x06,0x08,0x10,0x1E,0x11,0x11,0x0E],
  '7': [0x1F,0x01,0x02,0x04,0x04,0x04,0x04],
  '8': [0x0E,0x11,0x11,0x0E,0x11,0x11,0x0E],
  '9': [0x0E,0x11,0x11,0x0F,0x01,0x02,0x0C],
  'A': [0x04,0x0A,0x11,0x1F,0x11,0x11,0x11],
  'B': [0x1E,0x11,0x11,0x1E,0x11,0x11,0x1E],
  'C': [0x0E,0x11,0x10,0x10,0x10,0x11,0x0E],
  'D': [0x1C,0x12,0x11,0x11,0x11,0x12,0x1C],
  'E': [0x1F,0x10,0x10,0x1E,0x10,0x10,0x1F],
  'F': [0x1F,0x10,0x10,0x1E,0x10,0x10,0x10],
  'G': [0x0E,0x11,0x10,0x17,0x11,0x11,0x0E],
  'H': [0x11,0x11,0x11,0x1F,0x11,0x11,0x11],
  'I': [0x0E,0x04,0x04,0x04,0x04,0x04,0x0E],
  'J': [0x07,0x02,0x02,0x02,0x12,0x12,0x0C],
  'K': [0x11,0x12,0x14,0x18,0x14,0x12,0x11],
  'L': [0x10,0x10,0x10,0x10,0x10,0x10,0x1F],
  'M': [0x11,0x1B,0x15,0x11,0x11,0x11,0x11],
  'N': [0x11,0x19,0x15,0x13,0x11,0x11,0x11],
  'O': [0x0E,0x11,0x11,0x11,0x11,0x11,0x0E],
  'P': [0x1E,0x11,0x11,0x1E,0x10,0x10,0x10],
  'Q': [0x0E,0x11,0x11,0x11,0x15,0x12,0x0D],
  'R': [0x1E,0x11,0x11,0x1E,0x14,0x12,0x11],
  'S': [0x0E,0x11,0x10,0x0E,0x01,0x11,0x0E],
  'T': [0x1F,0x04,0x04,0x04,0x04,0x04,0x04],
  'U': [0x11,0x11,0x11,0x11,0x11,0x11,0x0E],
  'V': [0x11,0x11,0x11,0x11,0x0A,0x0A,0x04],
  'W': [0x11,0x11,0x15,0x15,0x15,0x1B,0x11],
  'X': [0x11,0x11,0x0A,0x04,0x0A,0x11,0x11],
  'Y': [0x11,0x11,0x11,0x0A,0x04,0x04,0x04],
  'Z': [0x1F,0x01,0x02,0x04,0x08,0x10,0x1F],
  ':': [0x00,0x04,0x04,0x00,0x04,0x04,0x00],
  ' ': [0x00,0x00,0x00,0x00,0x00,0x00,0x00],
}

const CHAR_W = 5
const CHAR_H = 7

function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  scale: number,
  color: string,
) {
  ctx.fillStyle = color
  let cx = x
  for (const ch of text.toUpperCase()) {
    const rows = FONT[ch] ?? FONT[' ']
    for (let r = 0; r < CHAR_H; r++) {
      const mask = rows[r]
      for (let c = 0; c < CHAR_W; c++) {
        if (mask & (1 << (CHAR_W - 1 - c))) {
          ctx.fillRect(cx + c * scale, y + r * scale, scale, scale)
        }
      }
    }
    cx += (CHAR_W + 1) * scale   // 1px gap between characters
  }
}

function textWidth(text: string, scale: number) {
  return text.length * (CHAR_W + 1) * scale - scale  // no trailing gap
}

// ── Main export ───────────────────────────────────────────────
export function renderScoreboard(
  canvas: HTMLCanvasElement,
  home: Nation,
  away: Nation,
  homeScore = 0,
  awayScore = 0,
  time = '01:30',
) {
  canvas.width  = SB_W
  canvas.height = SB_H
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingEnabled = false
  ctx.clearRect(0, 0, SB_W, SB_H)

  // ── Background zones ────────────────────────────────────────
  // Left team zone
  ctx.fillStyle = BLACK
  ctx.fillRect(0, 0, LEFT_END, SB_BAR_H)
  // Centre teal zone
  ctx.fillStyle = TEAL
  ctx.fillRect(LEFT_END, 0, RIGHT_START - LEFT_END, SB_BAR_H)
  // Right team zone
  ctx.fillStyle = BLACK
  ctx.fillRect(RIGHT_START, 0, SB_W - RIGHT_START, SB_BAR_H)
  // Timer strip (below centre only)
  ctx.fillStyle = GRAY
  ctx.fillRect(LEFT_END, SB_BAR_H, RIGHT_START - LEFT_END, SB_TIMER_H)

  // ── Zone separators ─────────────────────────────────────────
  ctx.fillStyle = BLACK
  ctx.fillRect(LEFT_END - 2, 0, 4, SB_BAR_H)
  ctx.fillRect(RIGHT_START - 2, 0, 4, SB_BAR_H)

  // ── Flag scale ──────────────────────────────────────────────
  // FLAG_W=20 FLAG_H=12 → at scale 3: 60×36px, centred in 64px bar → 14px top margin
  const flagScale = 3
  const FW = FLAG_W * flagScale   // 60
  const FH = FLAG_H * flagScale   // 36
  const flagY = Math.round((SB_BAR_H - FH) / 2)  // 14

  // Content width for each zone: flag + gap + code
  // code at fontScale 3: textWidth("XXX", 3) = 3*(5+1)*3 - 3 = 51px
  // gap = 10px → total = 60+10+51 = 121px, pad = (180-121)/2 = 29px
  const zPad    = 29
  const codeScale = 3
  const codeH  = CHAR_H * codeScale  // 21px
  const codeY  = Math.round((SB_BAR_H - codeH) / 2)  // 21

  // ── Left team (home) — FLAG | CODE ──────────────────────────
  const homeFlagX = zPad
  const homeCodeX = zPad + FW + 10

  const homeFlagCanvas = document.createElement('canvas')
  renderFlag(home.code, homeFlagCanvas, flagScale)
  ctx.drawImage(homeFlagCanvas, homeFlagX, flagY)
  drawText(ctx, home.code, homeCodeX, codeY, codeScale, WHITE)

  // ── Right team (away) — CODE | FLAG ─────────────────────────
  const awayCodeX = RIGHT_START + zPad
  const awayFlagX = awayCodeX + textWidth(away.code, codeScale) + 10

  const awayFlagCanvas = document.createElement('canvas')
  renderFlag(away.code, awayFlagCanvas, flagScale)
  ctx.drawImage(awayFlagCanvas, awayFlagX, flagY)
  drawText(ctx, away.code, awayCodeX, codeY, codeScale, WHITE)

  // ── Trophy (centre, native 28×46 → fits in 64px bar) ────────
  const trophyX = LEFT_END + Math.round((RIGHT_START - LEFT_END - TROPHY_W) / 2)
  const trophyY = Math.round((SB_BAR_H - TROPHY_H) / 2)

  // Black-bordered white frame behind trophy
  const framepad = 3
  ctx.fillStyle = WHITE
  ctx.fillRect(trophyX - framepad, trophyY - framepad, TROPHY_W + framepad * 2, TROPHY_H + framepad * 2)
  ctx.strokeStyle = BLACK; ctx.lineWidth = 2
  ctx.strokeRect(trophyX - framepad - 1, trophyY - framepad - 1, TROPHY_W + framepad * 2 + 2, TROPHY_H + framepad * 2 + 2)

  const trophyCanvas = document.createElement('canvas')
  renderTrophy(trophyCanvas, 1)
  ctx.drawImage(trophyCanvas, trophyX, trophyY)

  // ── Score badges + digits ────────────────────────────────────
  const scoreScale = 4
  const scoreW = CHAR_W * scoreScale        // 20
  const scoreH = CHAR_H * scoreScale        // 28
  const scoreY = Math.round((SB_BAR_H - scoreH) / 2)  // 18

  // Left score sits between left zone edge and trophy frame
  const trophyFrameLeft = trophyX - framepad - 1
  const scoreGap = 8
  const homeScoreX = LEFT_END + scoreGap
  const awayScoreX = RIGHT_START - scoreGap - scoreW

  drawText(ctx, String(homeScore), homeScoreX, scoreY, scoreScale, WHITE)
  drawText(ctx, String(awayScore), awayScoreX, scoreY, scoreScale, WHITE)

  // ── Timer ────────────────────────────────────────────────────
  const timerScale = 3
  const timerW = textWidth(time, timerScale)
  const timerX = LEFT_END + Math.round((RIGHT_START - LEFT_END - timerW) / 2)
  const timerH = CHAR_H * timerScale
  const timerY = SB_BAR_H + Math.round((SB_TIMER_H - timerH) / 2)
  drawText(ctx, time, timerX, timerY, timerScale, WHITE)
}

export function scoreboardToBlob(
  home: Nation,
  away: Nation,
  scale = 2,
): Promise<Blob> {
  const src = document.createElement('canvas')
  renderScoreboard(src, home, away)
  const out = document.createElement('canvas')
  out.width  = SB_W * scale
  out.height = SB_H * scale
  const ctx  = out.getContext('2d')!
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(src, 0, 0, out.width, out.height)
  return new Promise(res => out.toBlob(b => res(b!), 'image/png'))
}
