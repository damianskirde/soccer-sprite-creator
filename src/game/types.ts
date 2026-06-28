export type ScreenId =
  | 'start'
  | 'fixtures_loading'
  | 'fixtures'
  | 'no_fixtures'
  | 'fixtures_error'
  | 'exhibition'
  | 'team_select'
  | 'options'
  | 'match_overview'
  | 'in_game'
  | 'halftime'
  | 'fulltime'

export interface Fixture {
  id: string
  homeCode: string
  homeName: string
  awayCode: string
  awayName: string
  kickoffTime: string
  status: 'scheduled' | 'live' | 'halftime' | 'finished'
  homeScore?: number
  awayScore?: number
  minute?: number
}

export interface GameSession {
  mode: 'exhibition' | 'fixture'
  homeTeamCode: string
  awayTeamCode: string
  difficulty: 1 | 2 | 3
  halfDuration: 90 | 120
  homeScore: number
  awayScore: number
  half: 1 | 2
  selectedFixture?: Fixture
}

export const DEFAULT_SESSION: GameSession = {
  mode: 'exhibition',
  homeTeamCode: 'ARG',
  awayTeamCode: 'BRA',
  difficulty: 2,
  halfDuration: 90,
  homeScore: 0,
  awayScore: 0,
  half: 1,
}
