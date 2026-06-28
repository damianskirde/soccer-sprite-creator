import { useState, useEffect, useRef } from 'react'
import { renderBall } from '../../engine/ballRenderer'
import type { ScreenId } from '../types'
import { getTodaysFixtures } from '../api'
import type { Fixture } from '../types'

interface Props {
  onNavigate: (screen: ScreenId) => void
  onFixturesLoaded: (fixtures: Fixture[]) => void
  onFixturesError: (msg: string) => void
}

const FONT = '"Press Start 2P", "Courier New", monospace'
const today = new Date()
const DATE_STR = today
  .toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  .toUpperCase()
  .replace(/,/g, '')

export default function StartScreen({ onNavigate, onFixturesLoaded, onFixturesError }: Props) {
  const [loadingFixtures, setLoadingFixtures] = useState(false)

  async function handleFixtures() {
    setLoadingFixtures(true)
    onNavigate('fixtures_loading')
    try {
      const fixtures = await getTodaysFixtures()
      onFixturesLoaded(fixtures)
      if (fixtures.length === 0) {
        onNavigate('no_fixtures')
      } else {
        onNavigate('fixtures')
      }
    } catch (e) {
      onFixturesError(e instanceof Error ? e.message : 'Unknown error')
      onNavigate('fixtures_error')
    } finally {
      setLoadingFixtures(false)
    }
  }

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        background: '#000',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 0,
        overflow: 'hidden',
        fontFamily: FONT,
      }}
    >
      {/* Pitch lines decoration */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.06,
          backgroundImage: 'repeating-linear-gradient(transparent, transparent 47px, #00CCBB 47px, #00CCBB 50px)',
          pointerEvents: 'none',
        }}
      />

      {/* Hero title block */}
      <div style={{ textAlign: 'center', padding: '0 24px', marginBottom: 48, zIndex: 1 }}>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 38,
            color: '#FFB800',
            letterSpacing: '0.06em',
            lineHeight: 1,
            textShadow: '4px 4px 0 #7A5000, 8px 8px 0 rgba(0,0,0,0.4)',
            marginBottom: 6,
          }}
        >
          RETRO
        </div>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 38,
            color: '#FFB800',
            letterSpacing: '0.06em',
            lineHeight: 1,
            textShadow: '4px 4px 0 #7A5000, 8px 8px 0 rgba(0,0,0,0.4)',
            marginBottom: 14,
          }}
        >
          SOCCER
        </div>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 7,
            color: '#CC3300',
            letterSpacing: '0.12em',
          }}
        >
          FIFA WORLD CUP 2026
        </div>
      </div>

      {/* Mode buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%', maxWidth: 360, padding: '0 24px', zIndex: 1 }}>
        <ModeButton
          icon={<BallIcon />}
          label="PLAY"
          sublabel="EXHIBITION"
          onClick={() => onNavigate('team_select')}
          disabled={loadingFixtures}
        />
        <ModeButton
          icon={<CalendarIcon />}
          label="TODAY'S FIXTURES"
          sublabel={DATE_STR}
          onClick={handleFixtures}
          disabled={loadingFixtures}
          pulsing={loadingFixtures}
        />
      </div>

      {/* Credits */}
      <div
        style={{
          position: 'absolute',
          bottom: 16,
          fontFamily: FONT,
          fontSize: 6,
          color: '#555',
          letterSpacing: '0.05em',
          textAlign: 'center',
        }}
      >
        © 2026 XP STUDIOS · ALL RIGHTS RESERVED
      </div>
    </div>
  )
}

interface ModeButtonProps {
  icon: React.ReactNode
  label: string
  sublabel: string
  onClick: () => void
  disabled?: boolean
  pulsing?: boolean
}

function ModeButton({ icon, label, sublabel, onClick, disabled, pulsing }: ModeButtonProps) {
  const [hovered, setHovered] = useState(false)

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '100%',
        border: `3px solid ${hovered ? '#FFB800' : pulsing ? '#FF6600' : '#CC3300'}`,
        background: hovered ? '#0a0a0a' : '#000',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        cursor: disabled ? 'wait' : 'pointer',
        textAlign: 'left',
        transition: 'border-color 0.15s',
        animation: pulsing ? 'pulse 0.8s infinite alternate' : undefined,
      }}
    >
      <div style={{ width: 40, height: 40, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span
          style={{
            fontFamily: '"Press Start 2P", "Courier New", monospace',
            fontSize: 12,
            color: hovered ? '#FFB800' : '#fff',
            letterSpacing: '0.08em',
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontFamily: '"Press Start 2P", "Courier New", monospace',
            fontSize: 7,
            color: '#888',
            letterSpacing: '0.05em',
          }}
        >
          {sublabel}
        </span>
      </div>
    </button>
  )
}

function BallIcon() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    if (ref.current) renderBall(ref.current, 3)
  }, [])
  return <canvas ref={ref} style={{ imageRendering: 'pixelated', display: 'block' }} />
}

function CalendarIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" style={{ imageRendering: 'pixelated' }}>
      <rect x="2" y="6" width="32" height="28" rx="0" fill="#111" stroke="#CC3300" strokeWidth="2" />
      <rect x="2" y="6" width="32" height="8" fill="#CC3300" />
      <rect x="8" y="2" width="4" height="8" rx="0" fill="#FFB800" />
      <rect x="24" y="2" width="4" height="8" rx="0" fill="#FFB800" />
      <rect x="7" y="19" width="5" height="5" fill="#FF6600" />
      <rect x="15" y="19" width="5" height="5" fill="#888" />
      <rect x="23" y="19" width="5" height="5" fill="#888" />
      <rect x="7" y="27" width="5" height="5" fill="#888" />
      <rect x="15" y="27" width="5" height="5" fill="#888" />
    </svg>
  )
}
