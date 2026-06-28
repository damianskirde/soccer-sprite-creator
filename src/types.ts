export type SkinTone = 'light' | 'medium_light' | 'medium' | 'medium_dark' | 'dark'
export type HairStyle = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
export type BeardStyle = 0 | 1 | 2 | 3 | 4 | 5
export type Position = 'GK' | 'OUT'

export type KitPatternType =
  | 'solid' | 'v_stripes' | 'h_stripes' | 'sash'
  | 'collar_band' | 'shadow_stripe' | 'halved'

export interface KitPattern {
  type: KitPatternType
  primary: string
  secondary: string
  stripeWidth?: number
  stripeCount?: number
}

export interface Nation {
  code: string
  name: string
  flag: string
  kitPrimary: string
  kitSecondary: string
  gkKit: string
  kitPattern: KitPattern
  region: string
  skinTones: SkinTone[]
}

export interface Player {
  index: number
  position: Position
  skinTone: SkinTone
  hairStyle: HairStyle
  beardStyle: BeardStyle
  hairVariant: number
}

export interface AnimFrame {
  bodyY: number
  legL: [number, number]  // [dx, dy] — center-based: leftLegCol = CENTER_X + dx
  legR: [number, number]
  armF: number            // arm swing: negative = arms raise/forward, positive = arm extends out
  headX?: number          // head horizontal nudge for headers
  pose?: 'slide' | 'dive' | 'throwin_peak'
}

export interface AnimDef {
  id: string
  name: string
  frameDuration: number
  frames: AnimFrame[]
}

export type AnimId =
  | 'idle' | 'walk' | 'run' | 'slide' | 'jump'
  | 'kick' | 'head' | 'save' | 'throwin' | 'celebrate' | 'taunt'
