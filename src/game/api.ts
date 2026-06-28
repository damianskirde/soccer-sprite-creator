import type { Fixture } from './types'

const OPENFOOTBALL_URL =
  'https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json'

// Map openfootball full names → 3-letter codes used in our game
const NAME_TO_CODE: Record<string, string> = {
  'Algeria': 'ALG',
  'Argentina': 'ARG',
  'Australia': 'AUS',
  'Austria': 'AUT',
  'Belgium': 'BEL',
  'Bosnia and Herzegovina': 'BIH',
  'Bosnia-Herzegovina': 'BIH',
  'Brazil': 'BRA',
  'Canada': 'CAN',
  'Côte d\'Ivoire': 'CIV',
  'Ivory Coast': 'CIV',
  'Congo DR': 'COD',
  'DR Congo': 'COD',
  'Colombia': 'COL',
  'Cape Verde': 'CPV',
  'Costa Rica': 'CRC',
  'Croatia': 'CRO',
  'Curaçao': 'CUW',
  'Czech Republic': 'CZE',
  'Czechia': 'CZE',
  'Ecuador': 'ECU',
  'Egypt': 'EGY',
  'England': 'ENG',
  'Spain': 'ESP',
  'France': 'FRA',
  'Germany': 'GER',
  'Ghana': 'GHA',
  'Haiti': 'HTI',
  'Iran': 'IRN',
  'Iraq': 'IRQ',
  'Jordan': 'JOR',
  'Japan': 'JPN',
  'Korea Republic': 'KOR',
  'South Korea': 'KOR',
  'Morocco': 'MAR',
  'Mexico': 'MEX',
  'Netherlands': 'NED',
  'Norway': 'NOR',
  'New Zealand': 'NZL',
  'Panama': 'PAN',
  'Paraguay': 'PAR',
  'Portugal': 'POR',
  'Qatar': 'QAT',
  'South Africa': 'RSA',
  'Saudi Arabia': 'SAU',
  'Scotland': 'SCO',
  'Senegal': 'SEN',
  'Switzerland': 'SUI',
  'Sweden': 'SWE',
  'Tunisia': 'TUN',
  'Turkey': 'TUR',
  'Türkiye': 'TUR',
  'Uruguay': 'URU',
  'USA': 'USA',
  'United States': 'USA',
  'Uzbekistan': 'UZB',
}

function toCode(name: string): string {
  return NAME_TO_CODE[name] ?? name.slice(0, 3).toUpperCase()
}

function inferStatus(match: OpenFootballMatch): Fixture['status'] {
  if (match.score?.ft) return 'finished'

  // Parse kickoff datetime to infer live/scheduled
  try {
    const kickoff = parseKickoff(match.date, match.time)
    const now = Date.now()
    const elapsed = now - kickoff.getTime()
    if (elapsed > 0 && elapsed < 130 * 60 * 1000) return 'live'
    if (elapsed >= 45 * 60 * 1000 && elapsed < 75 * 60 * 1000) return 'halftime'
  } catch {
    // ignore parse errors
  }
  return 'scheduled'
}

function parseKickoff(date: string, time: string): Date {
  // time format: "13:00 UTC-6" or "20:00"
  const [hm, tz] = time.split(' ')
  const [h, m] = hm.split(':').map(Number)
  const offsetMatch = tz?.match(/UTC([+-]\d+)/)
  const offsetHours = offsetMatch ? parseInt(offsetMatch[1]) : 0
  const d = new Date(`${date}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00Z`)
  d.setHours(d.getHours() - offsetHours) // convert local time → UTC
  return d
}

function inferMinute(match: OpenFootballMatch): number | undefined {
  if (match.score?.ft) return 90
  try {
    const kickoff = parseKickoff(match.date, match.time)
    const elapsed = Math.floor((Date.now() - kickoff.getTime()) / 60000)
    return Math.min(elapsed, 90)
  } catch {
    return undefined
  }
}

interface OpenFootballMatch {
  round?: string
  date: string
  time: string
  team1: string
  team2: string
  score?: { ft?: [number, number]; ht?: [number, number] }
  group?: string
}

interface OpenFootballData {
  name: string
  matches: OpenFootballMatch[]
}

async function fetchOpenFootball(): Promise<Fixture[]> {
  const resp = await fetch(OPENFOOTBALL_URL)
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
  const data: OpenFootballData = await resp.json()

  const todayStr = new Date().toISOString().split('T')[0]

  return data.matches
    .filter((m) => m.date === todayStr)
    .filter((m) => !m.team1.match(/^\d/) && !m.team2.match(/^\d/)) // skip unresolved placeholders like "1A"
    .map((m, i) => {
      const status = inferStatus(m)
      return {
        id: `of-${m.date}-${i}`,
        homeCode: toCode(m.team1),
        homeName: m.team1,
        awayCode: toCode(m.team2),
        awayName: m.team2,
        kickoffTime: parseKickoff(m.date, m.time).toISOString(),
        status,
        homeScore: m.score?.ft?.[0],
        awayScore: m.score?.ft?.[1],
        minute: status === 'live' ? inferMinute(m) : undefined,
      }
    })
}

function mockFixtures(): Fixture[] {
  const now = new Date()
  return [
    {
      id: '1',
      homeCode: 'BRA',
      homeName: 'Brazil',
      awayCode: 'ARG',
      awayName: 'Argentina',
      kickoffTime: new Date(now.getTime() - 47 * 60000).toISOString(),
      status: 'live',
      homeScore: 1,
      awayScore: 0,
      minute: 47,
    },
    {
      id: '2',
      homeCode: 'FRA',
      homeName: 'France',
      awayCode: 'ENG',
      awayName: 'England',
      kickoffTime: new Date(now.getTime() + 3600_000).toISOString(),
      status: 'scheduled',
    },
    {
      id: '3',
      homeCode: 'GER',
      homeName: 'Germany',
      awayCode: 'ESP',
      awayName: 'Spain',
      kickoffTime: new Date(now.getTime() - 5400_000).toISOString(),
      status: 'finished',
      homeScore: 2,
      awayScore: 3,
    },
    {
      id: '4',
      homeCode: 'USA',
      homeName: 'United States',
      awayCode: 'MEX',
      awayName: 'Mexico',
      kickoffTime: new Date(now.getTime() + 7200_000).toISOString(),
      status: 'scheduled',
    },
    {
      id: '5',
      homeCode: 'MAR',
      homeName: 'Morocco',
      awayCode: 'SEN',
      awayName: 'Senegal',
      kickoffTime: new Date(now.getTime() - 1800_000).toISOString(),
      status: 'halftime',
      homeScore: 0,
      awayScore: 0,
    },
  ]
}

export async function getTodaysFixtures(): Promise<Fixture[]> {
  try {
    const fixtures = await fetchOpenFootball()
    // Fall back to mock data if the tournament hasn't started yet
    // (no matches on today's date in the JSON)
    if (fixtures.length === 0) {
      const today = new Date().toISOString().split('T')[0]
      // Check if today is before the tournament start (2026-06-11)
      if (today < '2026-06-11') return mockFixtures()
    }
    return fixtures
  } catch {
    return mockFixtures()
  }
}

export function formatKickoffTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch {
    return '--:--'
  }
}
