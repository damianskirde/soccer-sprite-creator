import { useEffect, useRef } from 'react'
import { renderPitch, PITCH_W, PITCH_H } from '../engine/pitchRenderer'

export default function PitchPreview() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => { if (ref.current) renderPitch(ref.current) }, [])

  return (
    <div className="flex flex-col flex-1 bg-slate-950 items-center justify-center p-6 gap-5">
      <div
        className="rounded-xl p-8 flex flex-col items-center gap-5"
        style={{ background: 'radial-gradient(ellipse at 50% 60%, #1e293b 0%, #020617 70%)' }}
      >
        <canvas
          ref={ref}
          width={PITCH_W}
          height={PITCH_H}
          style={{
            width:  PITCH_W * 0.75,
            height: PITCH_H * 0.75,
            maxWidth: '100%',
            imageRendering: 'pixelated',
          }}
          className="rounded shadow-lg"
        />
        <div className="text-center">
          <div className="text-base font-mono font-bold text-slate-200">Soccer Pitch</div>
          <div className="text-xs font-mono text-slate-500 mt-1">
            {PITCH_W}×{PITCH_H}px native · FIFA standard proportions
          </div>
        </div>
      </div>
    </div>
  )
}
