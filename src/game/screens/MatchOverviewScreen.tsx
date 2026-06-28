import type { ScreenId, GameSession } from '../types'
import SectionHeader from '../components/SectionHeader'
import NavFooter from '../components/NavFooter'
import FlagTile from '../components/FlagTile'
import { FIFA_2026_NATIONS } from '../../data/nations'

interface Props {
  session: GameSession
  onNavigate: (screen: ScreenId) => void
  onStartGame: () => void
}

const FONT = '"Press Start 2P", "Courier New", monospace'

function nameOf(code: string) {
  return FIFA_2026_NATIONS.find((n) => n.code === code)?.name ?? code
}

const DIFF_LABELS: Record<number, string> = { 1: 'EASY', 2: 'MEDIUM', 3: 'HARD' }
const DIFF_STARS: Record<number, string> = { 1: '★☆☆', 2: '★★☆', 3: '★★★' }

export default function MatchOverviewScreen({ session, onNavigate, onStartGame }: Props) {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#000', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <SectionHeader title="MATCH OVERVIEW" />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 24px 100px', gap: 24 }}>
        {/* Teams row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, width: '100%' }}>
          {/* P1 team */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <FlagTile code={session.homeTeamCode} scale={4} border="p1" />
            <span style={{ fontFamily: FONT, fontSize: 11, color: '#fff', letterSpacing: '0.05em' }}>
              {session.homeTeamCode}
            </span>
            <span style={{ fontFamily: FONT, fontSize: 8, color: '#66BBFF', letterSpacing: '0.05em' }}>1P</span>
          </div>

          {/* VS */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <span style={{ fontFamily: FONT, fontSize: 20, color: '#fff' }}>VS</span>
          </div>

          {/* CPU team */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <FlagTile code={session.awayTeamCode} scale={4} border="p2" />
            <span style={{ fontFamily: FONT, fontSize: 11, color: '#fff', letterSpacing: '0.05em' }}>
              {session.awayTeamCode}
            </span>
            <span style={{ fontFamily: FONT, fontSize: 8, color: '#44DDCC', letterSpacing: '0.05em' }}>CPU</span>
          </div>
        </div>

        {/* Match details */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: FONT, fontSize: 8, color: '#888', letterSpacing: '0.06em' }}>
            {nameOf(session.homeTeamCode).toUpperCase()} VS {nameOf(session.awayTeamCode).toUpperCase()}
          </span>
          <span style={{ fontFamily: FONT, fontSize: 7, color: '#555', letterSpacing: '0.05em' }}>
            {DIFF_STARS[session.difficulty]} {DIFF_LABELS[session.difficulty]}  ·  {session.halfDuration === 90 ? '1.5' : '2'} MIN HALVES
          </span>
        </div>

        {/* Launch button */}
        <button
          onClick={onStartGame}
          style={{
            marginTop: 8,
            border: '3px solid #FFB800',
            background: '#000',
            padding: '16px 32px',
            fontFamily: FONT,
            fontSize: 12,
            color: '#FFB800',
            cursor: 'pointer',
            letterSpacing: '0.1em',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#FFB800'
            e.currentTarget.style.color = '#000'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#000'
            e.currentTarget.style.color = '#FFB800'
          }}
        >
          KICK OFF ▶
        </button>
      </div>

      <NavFooter onBack={() => onNavigate('options')} />
    </div>
  )
}
