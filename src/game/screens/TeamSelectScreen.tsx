import { useState } from 'react'
import type { ScreenId, GameSession } from '../types'
import SectionHeader from '../components/SectionHeader'
import NavFooter from '../components/NavFooter'
import FlagTile from '../components/FlagTile'
import { FIFA_2026_NATIONS } from '../../data/nations'

interface Props {
  session: GameSession
  updateSession: (patch: Partial<GameSession>) => void
  onNavigate: (screen: ScreenId) => void
  locked?: boolean
}

const FONT = '"Press Start 2P", "Courier New", monospace'
const NATIONS = FIFA_2026_NATIONS.slice().sort((a, b) => a.code.localeCompare(b.code))
const CODES = NATIONS.map((n) => n.code)

function nameOf(code: string) {
  return NATIONS.find((n) => n.code === code)?.name ?? code
}

function idxOf(code: string) {
  return Math.max(0, CODES.indexOf(code))
}

export default function TeamSelectScreen({ session, updateSession, onNavigate, locked }: Props) {
  const [p1Idx, setP1Idx] = useState(() => idxOf(session.homeTeamCode))
  const [cpuIdx, setCpuIdx] = useState(() => idxOf(session.awayTeamCode))

  function moveP1(dir: number) {
    const next = (p1Idx + dir + CODES.length) % CODES.length
    setP1Idx(next)
    updateSession({ homeTeamCode: CODES[next] })
  }
  function moveCpu(dir: number) {
    const next = (cpuIdx + dir + CODES.length) % CODES.length
    setCpuIdx(next)
    updateSession({ awayTeamCode: CODES[next] })
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#000', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <SectionHeader title="SELECT YOUR TEAM" />

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '16px 16px 100px', gap: 0 }}>
        {/* P1 panel */}
        <TeamPanel
          code={CODES[p1Idx]}
          label="1P"
          labelColor="#66BBFF"
          arrowColor="#3399FF"
          borderColor="#3399FF"
          onLeft={() => moveP1(-1)}
          onRight={() => moveP1(1)}
          locked={locked}
        />

        {/* VS center */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, flexShrink: 0 }}>
          <span style={{ fontFamily: FONT, fontSize: 13, color: '#fff' }}>VS</span>
        </div>

        {/* CPU panel */}
        <TeamPanel
          code={CODES[cpuIdx]}
          label="CPU"
          labelColor="#44DDCC"
          arrowColor="#FF4444"
          borderColor="#FF4444"
          onLeft={() => moveCpu(-1)}
          onRight={() => moveCpu(1)}
          locked={locked}
        />
      </div>

      <NavFooter
        onBack={() => onNavigate(session.mode === 'fixture' ? 'fixtures' : 'start')}
        onForward={() => onNavigate('options')}
      />
    </div>
  )
}

interface TeamPanelProps {
  code: string
  label: string
  labelColor: string
  arrowColor: string
  borderColor: string
  onLeft: () => void
  onRight: () => void
  locked?: boolean
}

function TeamPanel({ code, label, labelColor, arrowColor, borderColor, onLeft, onRight, locked }: TeamPanelProps) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      {/* Preview card */}
      <div
        style={{
          border: `3px solid ${borderColor}`,
          background: '#0a0a0a',
          width: '100%',
          maxWidth: 160,
          aspectRatio: '4/3',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          padding: 12,
        }}
      >
        <FlagTile code={code} scale={4} border="none" />
        <span
          style={{
            fontFamily: FONT,
            fontSize: 9,
            color: '#fff',
            letterSpacing: '0.06em',
            textAlign: 'center',
          }}
        >
          {nameOf(code).toUpperCase()}
        </span>
      </div>

      {/* Carousel */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {!locked && (
          <button
            onClick={onLeft}
            style={{ background: 'none', border: 'none', fontSize: 18, color: arrowColor, cursor: 'pointer', padding: '4px 6px' }}
          >
            ◄
          </button>
        )}

        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <FlagTile code={code} scale={2} />
        </div>

        {!locked && (
          <button
            onClick={onRight}
            style={{ background: 'none', border: 'none', fontSize: 18, color: arrowColor, cursor: 'pointer', padding: '4px 6px' }}
          >
            ►
          </button>
        )}
      </div>

      <span style={{ fontFamily: FONT, fontSize: 9, color: labelColor, letterSpacing: '0.06em' }}>
        {label}
      </span>
    </div>
  )
}
