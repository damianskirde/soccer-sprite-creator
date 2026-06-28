import { useRef, useEffect, useCallback } from 'react'
import type { Player, Nation, AnimId } from '../types'
import { ANIMATIONS } from '../data/animations'
import { renderSprite } from '../engine/spriteRenderer'

const CARD_SCALE = 6
const CARD_PX = 24 * CARD_SCALE  // 144px

interface PlayerCardProps {
  player: Player
  nation: Nation
  animId: AnimId
  isSelected: boolean
  onClick: () => void
}

function PlayerCard({ player, nation, animId, isSelected, onClick }: PlayerCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frameRef  = useRef(0)
  const rafRef    = useRef<number>(0)
  const lastRef   = useRef(0)
  const anim = ANIMATIONS[animId]

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    renderSprite(canvas, player, nation, anim.frames[frameRef.current], CARD_SCALE, true)
  }, [player, nation, anim])

  useEffect(() => {
    function tick(ts: number) {
      if (ts - lastRef.current >= anim.frameDuration) {
        frameRef.current = (frameRef.current + 1) % anim.frames.length
        lastRef.current = ts
        draw()
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    frameRef.current = 0; lastRef.current = 0
    draw()
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [draw, anim])

  const isGK = player.position === 'GK'
  const kitColor = isGK ? nation.gkKit : nation.kitPrimary

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all cursor-pointer
        ${isSelected
          ? 'bg-slate-700 ring-1 ring-sky-500'
          : 'bg-slate-800/60 hover:bg-slate-800'
        }`}
    >
      {/* Sprite */}
      <div
        className="rounded-lg flex items-center justify-center"
        style={{
          background: 'radial-gradient(ellipse at 50% 70%, #1e293b 0%, #0f172a 100%)',
          width: CARD_PX + 16,
          height: CARD_PX + 16,
        }}
      >
        <canvas
          ref={canvasRef}
          width={CARD_PX}
          height={CARD_PX}
          style={{ width: CARD_PX, height: CARD_PX, imageRendering: 'pixelated' }}
        />
      </div>

      {/* Kit swatch + position */}
      <div className="flex items-center gap-1.5">
        <div className="w-2 h-2 rounded-full" style={{ background: kitColor }} />
        <span className="text-[10px] font-mono text-slate-400">
          {isGK ? 'GK' : `#${player.index}`}
        </span>
      </div>

      {/* Skin tone dot */}
      <span className="text-[9px] font-mono text-slate-600 -mt-1">
        {player.skinTone.replace('_', ' ')}
      </span>
    </button>
  )
}

// Film strip: all animation frames for selected player
function FilmStrip({ player, nation }: { player: Player; nation: Nation }) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-2">
      {Object.entries(ANIMATIONS).map(([id, anim]) => (
        <div key={id} className="flex flex-col items-center gap-1 shrink-0">
          <div className="flex gap-1">
            {anim.frames.map((frame, fi) => {
              const tmpCanvas = document.createElement('canvas')
              tmpCanvas.width = 24; tmpCanvas.height = 24
              renderSprite(tmpCanvas, player, nation, frame, 1, true)
              return (
                <canvas
                  key={fi}
                  width={24 * 4}
                  height={24 * 4}
                  style={{ width: 24 * 4, height: 24 * 4, imageRendering: 'pixelated' }}
                  ref={el => {
                    if (!el) return
                    renderSprite(el, player, nation, frame, 4, true)
                  }}
                />
              )
            })}
          </div>
          <span className="text-[9px] font-mono text-slate-600">{anim.name}</span>
        </div>
      ))}
    </div>
  )
}

interface Props {
  players: Player[]
  nation: Nation
  animId: AnimId
  selectedIndex: number
  onSelect: (i: number) => void
  onRegenerate: () => void
}

export default function TeamSheet({ players, nation, animId, selectedIndex, onSelect, onRegenerate }: Props) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-slate-800">
        <div>
          <span className="text-xs font-mono text-slate-400">{nation.flag} {nation.name} · Team sheet</span>
          <span className="ml-3 text-[10px] font-mono text-slate-600">7 players</span>
        </div>
        <button
          onClick={onRegenerate}
          className="flex items-center gap-2 px-4 py-1.5 bg-slate-700 hover:bg-slate-600
                     text-xs font-mono text-slate-200 rounded transition-colors"
        >
          ↺ Regenerate
        </button>
      </div>

      {/* Player grid */}
      <div className="p-5 grid grid-cols-7 gap-3">
        {players.map(player => (
          <PlayerCard
            key={player.index}
            player={player}
            nation={nation}
            animId={animId}
            isSelected={player.index === selectedIndex}
            onClick={() => onSelect(player.index)}
          />
        ))}
      </div>

      {/* Film strip */}
      <div className="border-t border-slate-800 px-5 py-4">
        <div className="text-[10px] font-mono uppercase tracking-widest text-slate-600 mb-3">
          Animation strip · Player #{selectedIndex + 1}
        </div>
        <FilmStrip player={players[selectedIndex]} nation={nation} />
      </div>
    </div>
  )
}
