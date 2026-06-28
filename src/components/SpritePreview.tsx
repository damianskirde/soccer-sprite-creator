import { useRef, useEffect, useState, useCallback } from 'react'
import type { Player, Nation, AnimId } from '../types'
import { ANIMATIONS, ANIMATION_ORDER } from '../data/animations'
import { renderSprite } from '../engine/spriteRenderer'

const SCALE = 12
const CANVAS_W = 16 * SCALE  // 192px
const CANVAS_H = 24 * SCALE  // 288px

interface Props {
  player: Player
  nation: Nation
  animId: AnimId
  onAnimChange: (id: AnimId) => void
}

export default function SpritePreview({ player, nation, animId, onAnimChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frameRef  = useRef(0)
  const rafRef    = useRef<number>(0)
  const lastRef   = useRef(0)
  const [facingLeft, setFacingLeft] = useState(true)
  const [showGrid, setShowGrid]     = useState(false)
  const [currentFrame, setCurrentFrame] = useState(0)

  const anim = ANIMATIONS[animId]

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const frame = anim.frames[frameRef.current]
    renderSprite(canvas, player, nation, frame, SCALE, facingLeft, animId)

    if (showGrid) {
      const ctx = canvas.getContext('2d')!
      ctx.strokeStyle = 'rgba(99,102,241,0.25)'
      ctx.lineWidth = 0.5
      for (let i = 0; i <= 16; i++) {
        const x = i * SCALE
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_H); ctx.stroke()
      }
      for (let i = 0; i <= 24; i++) {
        const y = i * SCALE
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_W, y); ctx.stroke()
      }
    }
  }, [player, nation, anim, facingLeft, showGrid])

  useEffect(() => {
    frameRef.current = 0
    lastRef.current = 0
    setCurrentFrame(0)
  }, [animId, player, nation])

  useEffect(() => {
    function tick(ts: number) {
      const elapsed = ts - lastRef.current
      if (elapsed >= anim.frameDuration) {
        frameRef.current = (frameRef.current + 1) % anim.frames.length
        setCurrentFrame(frameRef.current)
        lastRef.current = ts
        draw()
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    draw()
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [draw, anim])

  return (
    <div className="flex flex-col flex-1 bg-slate-950 min-w-0">
      {/* Controls bar */}
      <div className="flex items-center gap-4 px-6 py-3 border-b border-slate-800 flex-wrap">
        {/* Animation selector */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Anim</span>
          <select
            value={animId}
            onChange={e => onAnimChange(e.target.value as AnimId)}
            className="bg-slate-800 border border-slate-700 text-slate-200 text-xs font-mono
                       rounded px-2 py-1.5 outline-none focus:border-sky-500"
          >
            {ANIMATION_ORDER.map(id => (
              <option key={id} value={id}>{ANIMATIONS[id].name}</option>
            ))}
          </select>
        </div>

        {/* Direction toggle */}
        <div className="flex items-center gap-1 bg-slate-800 rounded p-0.5">
          <button
            onClick={() => setFacingLeft(true)}
            className={`px-3 py-1 text-xs font-mono rounded transition-colors
              ${facingLeft ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            ← Left
          </button>
          <button
            onClick={() => setFacingLeft(false)}
            className={`px-3 py-1 text-xs font-mono rounded transition-colors
              ${!facingLeft ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Right →
          </button>
        </div>

        {/* Grid toggle */}
        <button
          onClick={() => setShowGrid(g => !g)}
          className={`px-3 py-1 text-xs font-mono rounded border transition-colors
            ${showGrid
              ? 'border-indigo-500 text-indigo-300 bg-indigo-950'
              : 'border-slate-700 text-slate-500 hover:text-slate-300'}`}
        >
          Grid
        </button>

        {/* Frame indicator */}
        <div className="ml-auto text-[10px] font-mono text-slate-600">
          Frame {currentFrame + 1} / {anim.frames.length}
          &nbsp;·&nbsp;{anim.frameDuration}ms
        </div>
      </div>

      {/* Canvas stage */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="relative">
          {/* Dark stage */}
          <div
            className="rounded-xl p-8 flex items-center justify-center"
            style={{ background: 'radial-gradient(ellipse at 50% 60%, #1e293b 0%, #020617 70%)' }}
          >
            <canvas
              ref={canvasRef}
              width={CANVAS_W}
              height={CANVAS_H}
              style={{
                width: CANVAS_W,
                height: CANVAS_H,
                imageRendering: 'pixelated',
              }}
            />
          </div>

          {/* Kit info badge */}
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2
                          bg-slate-800 border border-slate-700 rounded-full px-3 py-1">
            <div className="w-2.5 h-2.5 rounded-full border border-slate-600"
                 style={{ background: player.position === 'GK' ? nation.gkKit : nation.kitPrimary }} />
            <span className="text-[10px] font-mono text-slate-400">
              {nation.name} · {player.position === 'GK' ? 'GK' : 'Outfield'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
