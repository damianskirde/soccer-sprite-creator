import { useEffect, useRef, useState } from 'react'
import { FIFA_2026_NATIONS } from '../data/nations'
import { renderScoreboard, SB_W, SB_H } from '../engine/scoreboardRenderer'

const DISPLAY_SCALE = 2

export default function ScoreboardPreview() {
  const ref = useRef<HTMLCanvasElement>(null)

  const [homeNation, setHomeNation] = useState(
    () => FIFA_2026_NATIONS.find(n => n.code === 'ARG') ?? FIFA_2026_NATIONS[0]
  )
  const [awayNation, setAwayNation] = useState(
    () => FIFA_2026_NATIONS.find(n => n.code === 'RSA') ?? FIFA_2026_NATIONS[1]
  )

  useEffect(() => {
    if (ref.current) renderScoreboard(ref.current, homeNation, awayNation)
  }, [homeNation, awayNation])

  const selectClass = `px-3 py-1.5 bg-slate-800 border border-slate-600 rounded text-xs font-mono
                       text-slate-300 focus:outline-none focus:border-sky-500 cursor-pointer`

  return (
    <div className="flex flex-col flex-1 bg-slate-950 items-center justify-center gap-8">
      <div
        className="rounded-xl p-10 flex flex-col items-center gap-6"
        style={{ background: 'radial-gradient(ellipse at 50% 60%, #1e293b 0%, #020617 70%)' }}
      >
        {/* Scoreboard canvas */}
        <canvas
          ref={ref}
          width={SB_W}
          height={SB_H}
          style={{
            width:  SB_W * DISPLAY_SCALE,
            height: SB_H * DISPLAY_SCALE,
            imageRendering: 'pixelated',
          }}
          className="rounded shadow-lg"
        />

        {/* Team selectors */}
        <div className="flex items-center gap-6">
          {/* Home dropdown */}
          <div className="flex flex-col items-center gap-1">
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Home</div>
            <select
              value={homeNation.code}
              onChange={e => {
                const n = FIFA_2026_NATIONS.find(n => n.code === e.target.value)
                if (!n) return
                setHomeNation(n)
                // If home now matches away, swap away to previous home
                if (n.code === awayNation.code) setAwayNation(homeNation)
              }}
              className={selectClass}
            >
              {FIFA_2026_NATIONS.map(n => (
                <option key={n.code} value={n.code} disabled={n.code === awayNation.code}>
                  {n.name} · {n.code}
                </option>
              ))}
            </select>
          </div>

          <div className="text-slate-700 font-mono text-lg">vs</div>

          {/* Away dropdown */}
          <div className="flex flex-col items-center gap-1">
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Away</div>
            <select
              value={awayNation.code}
              onChange={e => {
                const n = FIFA_2026_NATIONS.find(n => n.code === e.target.value)
                if (!n) return
                setAwayNation(n)
                // If away now matches home, swap home to previous away
                if (n.code === homeNation.code) setHomeNation(awayNation)
              }}
              className={selectClass}
            >
              {FIFA_2026_NATIONS.map(n => (
                <option key={n.code} value={n.code} disabled={n.code === homeNation.code}>
                  {n.name} · {n.code}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-center">
          <div className="text-base font-mono font-bold text-slate-200">Scoreboard</div>
          <div className="text-xs font-mono text-slate-500 mt-1">
            {SB_W}×{SB_H}px native · pixel art
          </div>
        </div>
      </div>
    </div>
  )
}
