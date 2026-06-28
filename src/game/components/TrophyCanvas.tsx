import { useEffect, useRef } from 'react'
import { renderTrophy } from '../../engine/trophyRenderer'

interface Props {
  scale?: number
  className?: string
}

export default function TrophyCanvas({ scale = 2, className = '' }: Props) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (ref.current) renderTrophy(ref.current, scale)
  }, [scale])

  return (
    <canvas
      ref={ref}
      className={className}
      style={{ imageRendering: 'pixelated', display: 'block' }}
    />
  )
}
