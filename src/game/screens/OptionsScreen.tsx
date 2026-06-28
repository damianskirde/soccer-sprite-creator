import { useState } from 'react'
import type { ScreenId, GameSession } from '../types'
import SectionHeader from '../components/SectionHeader'
import NavFooter from '../components/NavFooter'

interface Props {
  session: GameSession
  updateSession: (patch: Partial<GameSession>) => void
  onNavigate: (screen: ScreenId) => void
}

const FONT = '"Press Start 2P", "Courier New", monospace'

export default function OptionsScreen({ session, updateSession, onNavigate }: Props) {
  const [difficulty, setDifficulty] = useState<1 | 2 | 3>(session.difficulty)
  const [halfDuration, setHalfDuration] = useState<90 | 120>(session.halfDuration)

  function cycleDifficulty() {
    const next = ((difficulty % 3) + 1) as 1 | 2 | 3
    setDifficulty(next)
    updateSession({ difficulty: next })
  }

  function cycleTime() {
    const next: 90 | 120 = halfDuration === 90 ? 120 : 90
    setHalfDuration(next)
    updateSession({ halfDuration: next })
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#000', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <SectionHeader title="OPTIONS" />

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 24px 100px', gap: 32 }}>
        {/* Difficulty tile */}
        <OptionGroup label="DIFFICULTY">
          <OptionTile onClick={cycleDifficulty}>
            <StarIcon filled={difficulty >= 1} />
            <StarIcon filled={difficulty >= 2} />
            <StarIcon filled={difficulty >= 3} />
          </OptionTile>
          <span style={{ fontFamily: FONT, fontSize: 8, color: '#FFB800', letterSpacing: '0.06em' }}>
            {difficulty === 1 ? 'EASY' : difficulty === 2 ? 'MEDIUM' : 'HARD'}
          </span>
        </OptionGroup>

        {/* Time tile */}
        <OptionGroup label="TIME">
          <OptionTile onClick={cycleTime}>
            <ClockIcon half={halfDuration === 90} />
          </OptionTile>
          <span style={{ fontFamily: FONT, fontSize: 8, color: '#FFB800', letterSpacing: '0.06em' }}>
            {halfDuration === 90 ? '1.5 MIN' : '2 MIN'}
          </span>
        </OptionGroup>
      </div>

      <NavFooter
        onBack={() => onNavigate('team_select')}
        onForward={() => onNavigate('match_overview')}
      />
    </div>
  )
}

function OptionGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
      <span style={{ fontFamily: FONT, fontSize: 8, color: '#FF6600', letterSpacing: '0.05em' }}>{label}</span>
      {children}
    </div>
  )
}

function OptionTile({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 120,
        height: 120,
        border: `3px solid ${hovered ? '#FFB800' : '#CC3300'}`,
        background: '#000',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        cursor: 'pointer',
        transition: 'border-color 0.12s',
      }}
    >
      {children}
    </button>
  )
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" style={{ imageRendering: 'pixelated' }}>
      <polygon
        points="12,2 15,9 22,9 16,14 18,21 12,17 6,21 8,14 2,9 9,9"
        fill={filled ? '#FFB800' : 'none'}
        stroke={filled ? '#CC8800' : '#555'}
        strokeWidth="2"
      />
    </svg>
  )
}

function ClockIcon({ half }: { half: boolean }) {
  return (
    <svg width="60" height="60" viewBox="0 0 60 60" style={{ imageRendering: 'pixelated' }}>
      <circle cx="30" cy="30" r="26" fill="none" stroke="#888" strokeWidth="3" />
      {/* Full fill if not half, partial for half */}
      {half ? (
        <path d="M30 30 L30 8 A22 22 0 1 1 8 30 Z" fill="#00CCBB" />
      ) : (
        <circle cx="30" cy="30" r="22" fill="#00CCBB" />
      )}
      <circle cx="30" cy="30" r="26" fill="none" stroke="#888" strokeWidth="3" />
      {/* Clock hands */}
      <line x1="30" y1="30" x2="30" y2="10" stroke="#000" strokeWidth="3" strokeLinecap="square" />
      <line x1="30" y1="30" x2={half ? '42' : '30'} y2={half ? '30' : '15'} stroke="#000" strokeWidth="3" strokeLinecap="square" />
    </svg>
  )
}
