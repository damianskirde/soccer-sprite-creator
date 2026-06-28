import { useEffect } from 'react'
import type { ScreenId, GameSession } from '../types'

interface Props {
  session: GameSession
  onNavigate: (screen: ScreenId) => void
}

const FONT = '"Press Start 2P", "Courier New", monospace'

export default function HalftimeScreen({ session, onNavigate }: Props) {
  useEffect(() => {
    const id = setTimeout(() => onNavigate('in_game'), 3000)
    return () => clearTimeout(id)
  }, [onNavigate])

  return (
    <div
      onClick={() => onNavigate('in_game')}
      style={{
        width: '100%',
        height: '100%',
        background: '#000',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 32,
        cursor: 'pointer',
        userSelect: 'none',
      }}
    >
      <div style={{ fontFamily: FONT, fontSize: 20, color: '#FF6600', letterSpacing: '0.12em' }}>
        HALF TIME
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <span style={{ fontFamily: FONT, fontSize: 16, color: '#fff', letterSpacing: '0.06em' }}>
          {session.homeTeamCode}
        </span>
        <span style={{ fontFamily: FONT, fontSize: 36, color: '#fff', letterSpacing: '0.06em' }}>
          {session.homeScore} - {session.awayScore}
        </span>
        <span style={{ fontFamily: FONT, fontSize: 16, color: '#fff', letterSpacing: '0.06em' }}>
          {session.awayTeamCode}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <span style={{ fontFamily: FONT, fontSize: 8, color: '#888', letterSpacing: '0.06em' }}>
          SECOND HALF STARTING SOON
        </span>
        <span style={{ fontFamily: FONT, fontSize: 7, color: '#555', letterSpacing: '0.05em' }}>
          TAP TO CONTINUE
        </span>
      </div>
    </div>
  )
}
