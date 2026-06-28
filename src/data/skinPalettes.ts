import type { SkinTone } from '../types'

export interface SkinPalette {
  skin: string
  shadow: string
}

export const SKIN_PALETTES: Record<SkinTone, SkinPalette> = {
  light:        { skin: '#F5CBA7', shadow: '#E59866' },
  medium_light: { skin: '#E8A87C', shadow: '#C9854E' },
  medium:       { skin: '#C68642', shadow: '#A0522D' },
  medium_dark:  { skin: '#8D5524', shadow: '#6B3A1F' },
  dark:         { skin: '#4A2912', shadow: '#2D1810' },
}

// Primary + fallback hair colour per skin tone [dark, brown]
export const HAIR_COLORS: Record<SkinTone, [string, string]> = {
  light:        ['#1A1A1A', '#8B4513'],
  medium_light: ['#1A1A1A', '#3B1F0E'],
  medium:       ['#1A1A1A', '#1A1A1A'],
  medium_dark:  ['#0D0D0D', '#0D0D0D'],
  dark:         ['#0D0D0D', '#0D0D0D'],
}

// Beard colour per skin tone (slightly lighter/warmer than hair)
export const BEARD_COLORS: Record<SkinTone, string> = {
  light:        '#5C3317',
  medium_light: '#3B1F0E',
  medium:       '#2D1600',
  medium_dark:  '#1A0D00',
  dark:         '#0D0800',
}

export function getHairColor(skinTone: SkinTone, hairVariant: number): string {
  return HAIR_COLORS[skinTone][hairVariant] ?? HAIR_COLORS[skinTone][0]
}

export function getBeardColor(skinTone: SkinTone): string {
  return BEARD_COLORS[skinTone]
}
