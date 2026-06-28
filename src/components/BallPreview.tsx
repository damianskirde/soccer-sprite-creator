import { useEffect, useRef } from 'react'
import { renderBall, BALL_W, BALL_H, BALL_ROTATIONS } from '../engine/ballRenderer'

const DISPLAY_SCALE = 16  // 256×256px per frame

export default function BallPreview() {
  const refs = [
    useRef<HTMLCanvasElement>(null),
    useRef<HTMLCanvasElement>(null),
    useRef<HTMLCanvasElement>(null),
    useRef<HTMLCanvasElement>(null),
  ]

  useEffect(() => {
    BALL_ROTATIONS.forEach((rot, i) => {
      if (refs[i].current) renderBall(refs[i].current!, DISPLAY_SCALE, rot)
    })
  }, [])

  return (
    <div className="flex flex-col flex-1 bg-slate-950 items-center justify-center overflow-auto">
      <div
        className="rounded-xl p-10 flex flex-col items-center gap-8"
        style={{ background: 'radial-gradient(ellipse at 50% 60%, #1e293b 0%, #020617 70%)' }}
      >
        <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
          Ball rotation frames — 4× sprite sheet
        </div>

        <div className="flex gap-8 items-end">
          {BALL_ROTATIONS.map((rot, i) => (
            <div key={rot} className="flex flex-col items-center gap-3">
              <canvas
                ref={refs[i]}
                width={BALL_W * DISPLAY_SCALE}
                height={BALL_H * DISPLAY_SCALE}
                style={{
                  width:  BALL_W * DISPLAY_SCALE,
                  height: BALL_H * DISPLAY_SCALE,
                  imageRendering: 'pixelated',
                }}
              />
              <div className="text-[10px] font-mono text-slate-500">{rot}°</div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <div className="text-base font-mono font-bold text-slate-200">Soccer Ball</div>
          <div className="text-xs font-mono text-slate-500 mt-1">
            {BALL_W}×{BALL_H}px native · 3-panel propeller · 4 rotation frames
          </div>
        </div>
      </div>
    </div>
  )
}
