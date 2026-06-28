import { useEffect, useRef, useState } from 'react'
import { renderGoal, GOAL_W, GOAL_H } from '../engine/goalRenderer'

const DISPLAY_SCALE = 8

export default function GoalpostPreview() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [facing, setFacing] = useState<'east' | 'west'>('east')

  useEffect(() => {
    if (ref.current) renderGoal(ref.current, facing)
  }, [facing])

  return (
    <div className="flex flex-col flex-1 bg-slate-950 items-center justify-center gap-8">
      <div
        className="rounded-xl p-10 flex flex-col items-center gap-6"
        style={{ background: 'radial-gradient(ellipse at 50% 60%, #1e293b 0%, #020617 70%)' }}
      >
        {/* Goal canvas */}
        <canvas
          ref={ref}
          width={GOAL_W}
          height={GOAL_H}
          style={{
            width:  GOAL_W * DISPLAY_SCALE,
            height: GOAL_H * DISPLAY_SCALE,
            imageRendering: 'pixelated',
          }}
          className="rounded shadow-lg"
        />

        {/* Facing toggle */}
        <div className="flex items-center gap-3">
          <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Facing</div>
          <div className="flex gap-1 bg-slate-800 rounded p-0.5">
            {(['east', 'west'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFacing(f)}
                className={`px-4 py-1.5 text-xs font-mono rounded transition-colors
                  ${facing === f
                    ? 'bg-slate-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'}`}
              >
                {f === 'east' ? '← East' : 'West →'}
              </button>
            ))}
          </div>
        </div>

        <div className="text-center">
          <div className="text-base font-mono font-bold text-slate-200">Goal Post</div>
          <div className="text-xs font-mono text-slate-500 mt-1">
            {GOAL_W}×{GOAL_H}px native · pixel art · {facing}-facing
          </div>
        </div>
      </div>
    </div>
  )
}
