import { useEffect, useRef } from 'react'
import type { Nation } from '../types'
import { renderFlag, FLAG_W, FLAG_H } from '../engine/flagRenderer'

interface Props {
  nation: Nation
}

const DISPLAY_SCALE = 10

export default function FlagPreview({ nation }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (canvasRef.current) renderFlag(nation.code, canvasRef.current, DISPLAY_SCALE)
  }, [nation.code])

  return (
    <div className="flex flex-col flex-1 bg-slate-950 items-center justify-center">
      <div
        className="rounded-xl p-12 flex flex-col items-center gap-6"
        style={{ background: 'radial-gradient(ellipse at 50% 60%, #1e293b 0%, #020617 70%)' }}
      >
        <canvas
          ref={canvasRef}
          width={FLAG_W * DISPLAY_SCALE}
          height={FLAG_H * DISPLAY_SCALE}
          style={{
            width:  FLAG_W * DISPLAY_SCALE,
            height: FLAG_H * DISPLAY_SCALE,
            imageRendering: 'pixelated',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        />
        <div className="text-center">
          <div className="text-lg font-mono font-bold text-slate-200">{nation.name}</div>
          <div className="text-xs font-mono text-slate-500 mt-1">{nation.code} · FIFA 2026</div>
        </div>
      </div>
    </div>
  )
}
