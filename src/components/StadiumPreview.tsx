import { useEffect, useRef } from 'react'
import { initStadium, STADIUM_W, STADIUM_H } from '../engine/stadiumRenderer'

// Display at 45% so the full 1024×640 canvas fits in the preview pane
const DISPLAY_SCALE = 0.45

export default function StadiumPreview() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (canvasRef.current) initStadium(canvasRef.current)
  }, [])

  return (
    <div className="flex-1 flex flex-col items-center justify-start overflow-auto p-4 bg-slate-950 gap-4">
      <div className="text-xs text-slate-400 font-mono">
        Stadium — {STADIUM_W}×{STADIUM_H}px native · displayed at {Math.round(DISPLAY_SCALE * 100)}%
      </div>
      <canvas
        ref={canvasRef}
        style={{
          width:  Math.round(STADIUM_W * DISPLAY_SCALE),
          height: Math.round(STADIUM_H * DISPLAY_SCALE),
          imageRendering: 'pixelated',
          display: 'block',
          border: '1px solid #334155',
        }}
      />
    </div>
  )
}
