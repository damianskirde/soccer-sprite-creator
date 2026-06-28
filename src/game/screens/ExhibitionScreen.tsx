import { useState } from 'react'
import type { ScreenId } from '../types'
import SectionHeader from '../components/SectionHeader'
import NavFooter from '../components/NavFooter'
import FlagTile from '../components/FlagTile'

interface Props {
  onNavigate: (screen: ScreenId) => void
}

const FONT = '"Press Start 2P", "Courier New", monospace'
const PREVIEW_FLAGS = ['BRA', 'ARG', 'ESP', 'FRA']

export default function ExhibitionScreen({ onNavigate }: Props) {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#000', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <SectionHeader title="EXHIBITION" />

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 24px 100px' }}>
        <div style={{ display: 'flex', gap: 20, width: '100%', maxWidth: 360, justifyContent: 'center' }}>
          <ModeCard
            title="COUNTRIES"
            flags={PREVIEW_FLAGS}
            onClick={() => onNavigate('team_select')}
          />
          <ModeCard
            title="CLUBS"
            flags={[]}
            disabled
            comingSoon
          />
        </div>
      </div>

      <NavFooter onBack={() => onNavigate('start')} />
    </div>
  )
}

interface ModeCardProps {
  title: string
  flags: string[]
  onClick?: () => void
  disabled?: boolean
  comingSoon?: boolean
}

function ModeCard({ title, flags, onClick, disabled, comingSoon }: ModeCardProps) {
  const [hovered, setHovered] = useState(false)

  return (
    <button
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => !disabled && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      disabled={disabled}
      style={{
        flex: 1,
        maxWidth: 160,
        border: `3px solid ${hovered ? '#FFB800' : '#CC3300'}`,
        background: '#000',
        padding: '20px 16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        transition: 'border-color 0.12s, opacity 0.12s',
        position: 'relative',
      }}
    >
      {/* 2×2 flag grid or crest placeholder */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
        {flags.length > 0
          ? flags.map((code) => <FlagTile key={code} code={code} scale={2} />)
          : [0, 1, 2, 3].map((i) => (
              <div key={i} style={{ width: 40, height: 26, background: '#222', border: '2px solid #333' }} />
            ))}
      </div>

      <span style={{ fontFamily: FONT, fontSize: 9, color: hovered ? '#FFB800' : '#fff', letterSpacing: '0.06em' }}>
        {title}
      </span>

      {comingSoon && (
        <span style={{ fontFamily: FONT, fontSize: 6, color: '#888', letterSpacing: '0.05em' }}>
          COMING SOON
        </span>
      )}
    </button>
  )
}
