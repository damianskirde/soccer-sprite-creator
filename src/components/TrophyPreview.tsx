import { useEffect, useRef } from 'react'
import { renderTrophy, TROPHY_W, TROPHY_H } from '../engine/trophyRenderer'

const DISPLAY_SCALE = 10  // 280×440px display

export default function TrophyPreview() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (ref.current) renderTrophy(ref.current, DISPLAY_SCALE)
  }, [])

  return (
    <div className="flex flex-col flex-1 bg-slate-950 items-center justify-center">
      <div
        className="rounded-xl p-12 flex flex-col items-center gap-6"
        style={{ background: 'radial-gradient(ellipse at 50% 60%, #1e293b 0%, #020617 70%)' }}
      >
        <canvas
          ref={ref}
          width={TROPHY_W * DISPLAY_SCALE}
          height={TROPHY_H * DISPLAY_SCALE}
          style={{
            width:  TROPHY_W * DISPLAY_SCALE,
            height: TROPHY_H * DISPLAY_SCALE,
            imageRendering: 'pixelated',
          }}
        />
        <div className="text-center">
          <div className="text-lg font-mono font-bold text-slate-200">World Cup Trophy</div>
          <div className="text-xs font-mono text-slate-500 mt-1">
            {TROPHY_W}×{TROPHY_H}px · pixel art
          </div>
        </div>
      </div>
    </div>
  )
}
