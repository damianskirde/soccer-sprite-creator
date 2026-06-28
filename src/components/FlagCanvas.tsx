import { useEffect, useRef } from 'react'
import { renderFlag, FLAG_W, FLAG_H } from '../engine/flagRenderer'

interface Props {
  code: string
  scale?: number
  className?: string
}

export default function FlagCanvas({ code, scale = 3, className }: Props) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (ref.current) renderFlag(code, ref.current, scale)
  }, [code, scale])

  return (
    <canvas
      ref={ref}
      width={FLAG_W * scale}
      height={FLAG_H * scale}
      className={className}
      style={{ imageRendering: 'pixelated' }}
    />
  )
}
