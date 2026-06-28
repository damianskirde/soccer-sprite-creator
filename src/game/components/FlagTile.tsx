import { useEffect, useRef } from 'react'
import { renderFlag } from '../../engine/flagRenderer'

interface Props {
  code: string
  scale?: number
  border?: 'none' | 'p1' | 'p2' | 'accent'
  className?: string
}

const BORDER_COLORS: Record<string, string> = {
  p1: '#3399FF',
  p2: '#FF4444',
  accent: '#CC3300',
  none: 'transparent',
}

export default function FlagTile({ code, scale = 4, border = 'none', className = '' }: Props) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (ref.current) renderFlag(code, ref.current, scale)
  }, [code, scale])

  const borderColor = BORDER_COLORS[border] ?? 'transparent'
  const borderWidth = border !== 'none' ? '3px' : '0'

  return (
    <div
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#111',
        border: `${borderWidth} solid ${borderColor}`,
        padding: 2,
        flexShrink: 0,
      }}
    >
      <canvas
        ref={ref}
        style={{ imageRendering: 'pixelated', display: 'block' }}
      />
    </div>
  )
}
