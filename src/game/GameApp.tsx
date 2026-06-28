import { useState } from 'react'
import type { ScreenId, GameSession, Fixture } from './types'
import { DEFAULT_SESSION } from './types'
import StartScreen from './screens/StartScreen'
import FixtureSelectScreen from './screens/FixtureSelectScreen'
import TeamSelectScreen from './screens/TeamSelectScreen'
import OptionsScreen from './screens/OptionsScreen'
import MatchOverviewScreen from './screens/MatchOverviewScreen'
import InGameScreen from './screens/InGameScreen'
import HalftimeScreen from './screens/HalftimeScreen'
import FullTimeScreen from './screens/FullTimeScreen'

interface Props {
  onExit: () => void
}

type FixtureStatus = 'idle' | 'loading' | 'ok' | 'empty' | 'error'

export default function GameApp({ onExit }: Props) {
  const [screen, setScreen] = useState<ScreenId>('start')
  const [session, setSession] = useState<GameSession>({ ...DEFAULT_SESSION })
  const [fixtures, setFixtures] = useState<Fixture[]>([])
  const [fixtureStatus, setFixtureStatus] = useState<FixtureStatus>('idle')
  const [fixtureError, setFixtureError] = useState<string>()

  function updateSession(patch: Partial<GameSession>) {
    setSession((prev) => ({ ...prev, ...patch }))
  }

  function navigate(next: ScreenId) {
    if (next === 'fixtures_loading') setFixtureStatus('loading')
    setScreen(next)
  }

  function onFixturesLoaded(data: Fixture[]) {
    setFixtures(data)
    setFixtureStatus(data.length === 0 ? 'empty' : 'ok')
  }

  function onFixturesError(msg: string) {
    setFixtureError(msg)
    setFixtureStatus('error')
  }

  function onSelectFixture(f: Fixture) {
    setSession((prev) => ({
      ...prev,
      mode: 'fixture',
      homeTeamCode: f.homeCode,
      awayTeamCode: f.awayCode,
      selectedFixture: f,
    }))
  }

  function onStartGame() {
    setSession((prev) => ({ ...prev, homeScore: 0, awayScore: 0, half: 1 }))
    navigate('in_game')
  }

  function onRematch() {
    setSession((prev) => ({ ...prev, homeScore: 0, awayScore: 0, half: 1 }))
    navigate('match_overview')
  }

  const fixtureScreenStatus: 'loading' | 'ok' | 'empty' | 'error' =
    fixtureStatus === 'idle' ? 'loading' : fixtureStatus as 'loading' | 'ok' | 'empty' | 'error'

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#000',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        fontFamily: '"Press Start 2P", "Courier New", monospace',
      }}
    >
      {/* Exit to sprite creator button */}
      <button
        onClick={onExit}
        style={{
          position: 'absolute',
          top: 8,
          left: 8,
          zIndex: 200,
          background: 'transparent',
          border: '1px solid #333',
          color: '#444',
          fontFamily: '"Press Start 2P", "Courier New", monospace',
          fontSize: 7,
          padding: '4px 8px',
          cursor: 'pointer',
          letterSpacing: '0.05em',
          pointerEvents: screen === 'in_game' ? 'none' : 'auto',
          opacity: screen === 'in_game' ? 0 : 1,
        }}
      >
        ← CREATOR
      </button>

      {/* Screen router */}
      {screen === 'start' && (
        <StartScreen
          onNavigate={navigate}
          onFixturesLoaded={onFixturesLoaded}
          onFixturesError={onFixturesError}
        />
      )}

      {(screen === 'fixtures_loading' || screen === 'fixtures' || screen === 'no_fixtures' || screen === 'fixtures_error') && (
        <FixtureSelectScreen
          fixtures={fixtures}
          status={fixtureScreenStatus}
          errorMsg={fixtureError}
          onNavigate={navigate}
          onSelectFixture={onSelectFixture}
          updateSession={updateSession}
        />
      )}

      {screen === 'team_select' && (
        <TeamSelectScreen
          session={session}
          updateSession={updateSession}
          onNavigate={navigate}
          locked={session.mode === 'fixture'}
        />
      )}

      {screen === 'options' && (
        <OptionsScreen
          session={session}
          updateSession={updateSession}
          onNavigate={navigate}
        />
      )}

      {screen === 'match_overview' && (
        <MatchOverviewScreen
          session={session}
          onNavigate={navigate}
          onStartGame={onStartGame}
        />
      )}

      {screen === 'in_game' && (
        <InGameScreen
          session={session}
          updateSession={updateSession}
          onNavigate={navigate}
        />
      )}

      {screen === 'halftime' && (
        <HalftimeScreen session={session} onNavigate={navigate} />
      )}

      {screen === 'fulltime' && (
        <FullTimeScreen
          session={session}
          onNavigate={navigate}
          onRematch={onRematch}
        />
      )}
    </div>
  )
}
