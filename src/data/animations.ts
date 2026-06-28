import type { AnimDef, AnimId } from '../types'

// Leg offsets are CENTER-BASED: leftLegCol = 7 + legL[0], rightLegCol = 7 + legR[0].
// Idle neutral: legL=[-2,0] → cols 5–6, legR=[+2,0] → cols 9–10.
// Positive dx = leg moves RIGHT (forward for right-facing), negative = moves LEFT (back).
// Negative dy = leg lifts UP (raised), positive = drops down.
// armF: negative = arms raise/swing forward, positive = arm extends out.

export const ANIMATIONS: Record<AnimId, AnimDef> = {

  // ── Idle ──────────────────────────────────────────────────────────────────
  idle: {
    id: 'idle', name: 'Idle', frameDuration: 320,
    frames: [
      { bodyY:  0, legL: [-2,  0], legR: [+2,  0], armF:  0 },
      { bodyY:  0, legL: [-2,  0], legR: [+2, -1], armF:  0 },
      { bodyY:  0, legL: [-2,  0], legR: [+2,  0], armF:  0 },
      { bodyY:  0, legL: [-2, -1], legR: [+2,  0], armF:  0 },
    ],
  },

  // ── Walk ──────────────────────────────────────────────────────────────────
  walk: {
    id: 'walk', name: 'Walk', frameDuration: 190,
    frames: [
      { bodyY:  0, legL: [-4,  0], legR: [+4,  0], armF:  1 },
      { bodyY: -1, legL: [-2,  0], legR: [+2,  0], armF:  0 },
      { bodyY:  0, legL: [+4,  0], legR: [-4,  0], armF: -1 },
      { bodyY: -1, legL: [-2,  0], legR: [+2,  0], armF:  0 },
    ],
  },

  // ── Run ───────────────────────────────────────────────────────────────────
  run: {
    id: 'run', name: 'Run', frameDuration: 110,
    frames: [
      { bodyY: -1, legL: [-4,  0], legR: [+5, -2], armF:  2 },
      { bodyY:  0, legL: [-2,  0], legR: [+2,  0], armF:  1 },
      { bodyY: -1, legL: [+5, -2], legR: [-4,  0], armF: -2 },
      { bodyY:  0, legL: [-2,  0], legR: [+2,  0], armF: -1 },
    ],
  },

  // ── Slide tackle ──────────────────────────────────────────────────────────
  slide: {
    id: 'slide', name: 'Slide Tackle', frameDuration: 180,
    frames: [
      { bodyY:  0, legL: [-2,  0], legR: [+3,  0], armF:  0 },
      { bodyY:  0, legL: [ 0,  0], legR: [ 0,  0], armF:  0, pose: 'slide' },
      { bodyY:  0, legL: [ 0,  0], legR: [ 0,  0], armF:  0, pose: 'slide' },
    ],
  },

  // ── Jump ──────────────────────────────────────────────────────────────────
  jump: {
    id: 'jump', name: 'Jump', frameDuration: 175,
    frames: [
      { bodyY:  0, legL: [-2,  1], legR: [+2,  1], armF: -1 },
      { bodyY: -3, legL: [-1,  0], legR: [+1,  0], armF: -2 },
      { bodyY: -4, legL: [-1, -1], legR: [+1, -1], armF: -2 },
      { bodyY:  0, legL: [-2,  0], legR: [+2,  0], armF:  0 },
    ],
  },

  // ── Kick ──────────────────────────────────────────────────────────────────
  kick: {
    id: 'kick', name: 'Kick', frameDuration: 140,
    frames: [
      { bodyY:  0, legL: [-2,  0], legR: [+2,  0], armF:  1 },
      { bodyY:  0, legL: [-2,  0], legR: [+5, -2], armF: -1 },
      { bodyY:  0, legL: [-2,  0], legR: [+6, -1], armF: -2 },
      { bodyY:  0, legL: [-2,  0], legR: [+3,  0], armF:  0 },
    ],
  },

  // ── Header ────────────────────────────────────────────────────────────────
  head: {
    id: 'head', name: 'Header', frameDuration: 175,
    frames: [
      { bodyY: -1, legL: [-2,  0], legR: [+2,  0], armF: -1 },
      { bodyY: -4, legL: [-1, -1], legR: [+1, -1], armF: -2, headX: 1 },
      { bodyY:  0, legL: [-2,  0], legR: [+2,  0], armF:  0 },
    ],
  },

  // ── GK Save / Dive ────────────────────────────────────────────────────────
  save: {
    id: 'save', name: 'GK Save', frameDuration: 130,
    frames: [
      { bodyY:  0, legL: [-2,  0], legR: [+2,  0], armF:  0 },
      { bodyY:  0, legL: [ 0,  0], legR: [ 0,  0], armF:  0, pose: 'dive' },
      { bodyY:  0, legL: [ 0,  0], legR: [ 0,  0], armF:  3, pose: 'dive' },
      { bodyY:  0, legL: [ 0,  0], legR: [ 0,  0], armF:  4, pose: 'dive' },
    ],
  },

  // ── Throw-in ──────────────────────────────────────────────────────────────
  throwin: {
    id: 'throwin', name: 'Throw-in', frameDuration: 210,
    frames: [
      { bodyY: -1, legL: [-2,  0], legR: [+2,  0], armF: -3, pose: 'throwin_peak' },
      { bodyY: -2, legL: [-2,  0], legR: [+2,  0], armF: -4, pose: 'throwin_peak' },
      { bodyY:  0, legL: [-2,  0], legR: [+2,  0], armF:  1 },
    ],
  },

  // ── Celebrate ─────────────────────────────────────────────────────────────
  celebrate: {
    id: 'celebrate', name: 'Celebrate', frameDuration: 170,
    frames: [
      { bodyY: -1, legL: [-2,  0], legR: [+2,  0], armF: -2 },
      { bodyY: -4, legL: [-1, -1], legR: [+1, -1], armF: -4 },
      { bodyY: -1, legL: [-2,  0], legR: [+2,  0], armF: -3 },
      { bodyY:  0, legL: [-2,  0], legR: [+2,  0], armF: -1 },
    ],
  },

  // ── Taunt ─────────────────────────────────────────────────────────────────
  taunt: {
    id: 'taunt', name: 'Taunt', frameDuration: 230,
    frames: [
      { bodyY:  0, legL: [-2,  0], legR: [+2,  0], armF:  3 },
      { bodyY:  0, legL: [-2,  0], legR: [+2,  0], armF:  1 },
      { bodyY:  0, legL: [-2,  0], legR: [+2,  0], armF:  3 },
    ],
  },
}

export const ANIMATION_ORDER: AnimId[] = [
  'idle','walk','run','slide','jump','kick','head','save','throwin','celebrate','taunt',
]
