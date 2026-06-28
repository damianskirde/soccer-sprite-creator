import { useState } from 'react'
import type { ScreenId, GameSession } from '../types'

interface Props {
  session: GameSession
  onNavigate: (screen: ScreenId) => void
  onRematch: () => void
}

const FONT = '"Press Start 2P", "Courier New", monospace'

export default function FullTimeScreen({ session, onNavigate, onRematch }: Props) {
  const winner =
    session.homeScore > session.awayScore
      ? session.homeTeamCode
      : session.awayScore > session.homeScore
        ? session.awayTeamCode
        : null

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: '#000',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 28,
      }}
    >
      <div style={{ fontFamily: FONT, fontSize: 20, color: '#FFB800', letterSpacing: '0.12em' }}>
        FULL TIME
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <span style={{ fontFamily: FONT, fontSize: 14, color: '#fff', letterSpacing: '0.06em' }}>
          {session.homeTeamCode}
        </span>
        <span style={{ fontFamily: FONT, fontSize: 36, color: '#fff', letterSpacing: '0.06em' }}>
          {session.homeScore} - {session.awayScore}
        </span>
        <span style={{ fontFamily: FONT, fontSize: 14, color: '#fff', letterSpacing: '0.06em' }}>
          {session.awayTeamCode}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        <span style={{ fontFamily: FONT, fontSize: 9, color: '#FF6600', letterSpacing: '0.08em' }}>
          FINAL SCORE
        </span>
        {winner && (
          <span style={{ fontFamily: FONT, fontSize: 8, color: '#FFB800', letterSpacing: '0.06em' }}>
            {winner} WINS!
          </span>
        )}
        {!winner && (
          <span style={{ fontFamily: FONT, fontSize: 8, color: '#888', letterSpacing: '0.06em' }}>
            DRAW
          </span>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%', maxWidth: 280, padding: '0 24px' }}>
        <FullTimeBtn label="REMATCH" onClick={onRematch} />
        <FullTimeBtn label="MAIN MENU" onClick={() => onNavigate('start')} danger />
      </div>
    </div>
  )
}

function FullTimeBtn({ label, onClick, danger }: { label: string; onClick: () => void; danger?: boolean }) {
  const [hovered, setHovered] = useState(false)
  const borderColor = danger ? '#FF4444' : '#CC3300'

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? (danger ? '#FF4444' : '#CC3300') : '#000',
        border: `3px solid ${borderColor}`,
        color: hovered ? '#fff' : danger ? '#FF4444' : '#fff',
        fontFamily: FONT,
        fontSize: 11,
        padding: 16,
        cursor: 'pointer',
        letterSpacing: '0.08em',
        textAlign: 'center',
        transition: 'background 0.1s, color 0.1s',
        width: '100%',
      }}
    >
      {label}
    </button>
  )
}
