import { useState } from 'react'
import type { Fixture, ScreenId, GameSession } from '../types'
import SectionHeader from '../components/SectionHeader'
import NavFooter from '../components/NavFooter'
import FlagTile from '../components/FlagTile'
import { formatKickoffTime } from '../api'

interface Props {
  fixtures: Fixture[]
  status: 'loading' | 'ok' | 'empty' | 'error'
  errorMsg?: string
  onNavigate: (screen: ScreenId) => void
  onSelectFixture: (f: Fixture) => void
  updateSession: (patch: Partial<GameSession>) => void
}

const FONT = '"Press Start 2P", "Courier New", monospace'

export default function FixtureSelectScreen({
  fixtures,
  status,
  errorMsg,
  onNavigate,
  onSelectFixture,
  updateSession,
}: Props) {
  if (status === 'loading') {
    return (
      <div style={{ width: '100%', height: '100%', background: '#000', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <SectionHeader title="TODAY'S FIXTURES" />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontFamily: FONT, fontSize: 11, color: '#FF6600', letterSpacing: '0.1em', animation: 'blink 0.6s step-end infinite' }}>
            LOADING...
          </span>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div style={{ width: '100%', height: '100%', background: '#000', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <SectionHeader title="TODAY'S FIXTURES" />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: 24 }}>
          <span style={{ fontSize: 32 }}>⚠️</span>
          <p style={{ fontFamily: FONT, fontSize: 9, color: '#FF4444', textAlign: 'center', letterSpacing: '0.06em', lineHeight: 2 }}>
            FAILED TO LOAD FIXTURES
          </p>
          {errorMsg && (
            <p style={{ fontFamily: FONT, fontSize: 7, color: '#555', textAlign: 'center', letterSpacing: '0.05em' }}>
              {errorMsg.toUpperCase()}
            </p>
          )}
        </div>
        <NavFooter onBack={() => onNavigate('start')} />
      </div>
    )
  }

  if (status === 'empty' || fixtures.length === 0) {
    return (
      <div style={{ width: '100%', height: '100%', background: '#000', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <SectionHeader title="TODAY'S FIXTURES" />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: 24 }}>
          <svg width="64" height="64" viewBox="0 0 64 64">
            <rect x="4" y="12" width="56" height="48" fill="#111" stroke="#CC3300" strokeWidth="3" />
            <rect x="4" y="12" width="56" height="14" fill="#CC3300" />
            <rect x="14" y="4" width="8" height="16" fill="#FFB800" />
            <rect x="42" y="4" width="8" height="16" fill="#FFB800" />
            <line x1="24" y1="36" x2="40" y2="52" stroke="#FF4444" strokeWidth="4" />
            <line x1="40" y1="36" x2="24" y2="52" stroke="#FF4444" strokeWidth="4" />
          </svg>
          <p style={{ fontFamily: FONT, fontSize: 11, color: '#fff', textAlign: 'center', letterSpacing: '0.06em', lineHeight: 2 }}>
            NO FIXTURES TODAY
          </p>
          <p style={{ fontFamily: FONT, fontSize: 8, color: '#888', textAlign: 'center', letterSpacing: '0.05em' }}>
            CHECK BACK ON MATCH DAY
          </p>
          <button
            onClick={() => onNavigate('exhibition')}
            style={{
              marginTop: 16,
              border: '3px solid #CC3300',
              background: '#000',
              padding: '14px 24px',
              fontFamily: FONT,
              fontSize: 10,
              color: '#fff',
              cursor: 'pointer',
              letterSpacing: '0.08em',
            }}
          >
            PLAY EXHIBITION
          </button>
        </div>
        <NavFooter onBack={() => onNavigate('start')} />
      </div>
    )
  }

  return (
    <div style={{ width: '100%', height: '100%', background: '#000', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <SectionHeader title="TODAY'S FIXTURES" />
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 100px' }}>
        {fixtures.map((f) => (
          <FixtureCard
            key={f.id}
            fixture={f}
            onClick={() => {
              onSelectFixture(f)
              updateSession({
                mode: 'fixture',
                homeTeamCode: f.homeCode,
                awayTeamCode: f.awayCode,
                selectedFixture: f,
              })
              onNavigate('options')
            }}
          />
        ))}
      </div>
      <NavFooter onBack={() => onNavigate('start')} />
    </div>
  )
}

function FixtureCard({ fixture: f, onClick }: { fixture: Fixture; onClick: () => void }) {
  const [hovered, setHovered] = useState(false)
  const isLive = f.status === 'live' || f.status === 'halftime'
  const borderColor = isLive ? '#FFB800' : hovered ? '#FF6600' : '#CC3300'

  const statusLabel =
    f.status === 'live' ? `LIVE ${f.minute ?? ''}′`
    : f.status === 'halftime' ? 'HT'
    : f.status === 'finished' ? 'FT'
    : formatKickoffTime(f.kickoffTime)

  const statusColor =
    f.status === 'live' || f.status === 'halftime' ? '#FFB800'
    : f.status === 'finished' ? '#FF4444'
    : '#888'

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        width: '100%',
        border: `3px solid ${borderColor}`,
        background: hovered ? '#0a0a0a' : '#000',
        padding: '12px 14px',
        marginBottom: 12,
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'border-color 0.12s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        {/* Home */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <FlagTile code={f.homeCode} scale={2} />
          <span style={{ fontFamily: FONT, fontSize: 10, color: '#fff', letterSpacing: '0.05em' }}>{f.homeCode}</span>
        </div>
        {/* Score or vs */}
        <div style={{ fontFamily: FONT, fontSize: 13, color: '#fff', flexShrink: 0 }}>
          {f.homeScore !== undefined && f.awayScore !== undefined
            ? `${f.homeScore} - ${f.awayScore}`
            : 'VS'}
        </div>
        {/* Away */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, justifyContent: 'flex-end' }}>
          <span style={{ fontFamily: FONT, fontSize: 10, color: '#fff', letterSpacing: '0.05em' }}>{f.awayCode}</span>
          <FlagTile code={f.awayCode} scale={2} />
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span
          style={{
            fontFamily: FONT,
            fontSize: 8,
            color: statusColor,
            letterSpacing: '0.06em',
            animation: isLive ? 'blink 1s step-end infinite' : undefined,
          }}
        >
          {statusLabel}
        </span>
        <span style={{ fontFamily: FONT, fontSize: 7, color: '#555', letterSpacing: '0.05em' }}>
          TAP TO PLAY →
        </span>
      </div>
    </button>
  )
}
