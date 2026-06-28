import type { Nation, Player, HairStyle, BeardStyle } from '../types'

function weightedRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function rndInt(max: number): number {
  return Math.floor(Math.random() * max)
}

export function generateTeam(nation: Nation): Player[] {
  const players: Player[] = []
  for (let i = 0; i < 7; i++) {
    const skinTone = weightedRandom(nation.skinTones)
    const hairStyle = rndInt(10) as HairStyle
    const beardStyle: BeardStyle = 0
    // Light/medium_light players can have brown hair (variant 1)
    const hairVariant = (skinTone === 'light' || skinTone === 'medium_light') && Math.random() > 0.5 ? 1 : 0
    players.push({
      index: i,
      position: i === 0 ? 'GK' : 'OUT',
      skinTone,
      hairStyle,
      beardStyle,
      hairVariant,
    })
  }
  return players
}
