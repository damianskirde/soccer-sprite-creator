import { useState, useCallback } from 'react'
import GameApp from './game/GameApp'
import type { Nation, Player, AnimId } from './types'
import { FIFA_2026_NATIONS } from './data/nations'
import { generateTeam } from './engine/teamGenerator'
import NationSelector from './components/NationSelector'
import FlagCanvas from './components/FlagCanvas'
import SpritePreview from './components/SpritePreview'
import PlayerConfig from './components/PlayerConfig'
import TeamSheet from './components/TeamSheet'
import ExportPanel from './components/ExportPanel'
import FlagPreview from './components/FlagPreview'
import BallPreview from './components/BallPreview'
import PitchPreview from './components/PitchPreview'
import TrophyPreview from './components/TrophyPreview'
import ScoreboardPreview from './components/ScoreboardPreview'
import GoalpostPreview from './components/GoalpostPreview'
import StadiumPreview from './components/StadiumPreview'
type ViewMode = 'single' | 'team' | 'flag' | 'ball' | 'pitch' | 'trophy' | 'scoreboard' | 'goalpost' | 'stadium'

const DEFAULT_NATION = FIFA_2026_NATIONS.find(n => n.code === 'ARG')!

export default function App() {
  const [showGame, setShowGame] = useState(false)
  const [nation,   setNation]   = useState<Nation>(DEFAULT_NATION)
  const [players,  setPlayers]  = useState<Player[]>(() => generateTeam(DEFAULT_NATION))
  const [selIdx,   setSelIdx]   = useState(0)
  const [animId,   setAnimId]   = useState<AnimId>('idle')
  const [viewMode, setViewMode] = useState<ViewMode>('single')

  const selectedPlayer = players[selIdx]

  const handleNationChange = useCallback((n: Nation) => {
    setNation(n)
    setPlayers(generateTeam(n))
    setSelIdx(0)
  }, [])

  const handlePlayerChange = useCallback((patch: Partial<Player>) => {
    setPlayers(prev => prev.map(p =>
      p.index === selIdx ? { ...p, ...patch } : p
    ))
  }, [selIdx])

  const handleRegenerate = useCallback(() => {
    setPlayers(generateTeam(nation))
    setSelIdx(0)
  }, [nation])

  if (showGame) {
    return <GameApp onExit={() => setShowGame(false)} />
  }

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-mono">
      {/* Left: Nation selector */}
      <NationSelector selected={nation} onSelect={handleNationChange} />

      {/* Centre column */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Top bar */}
        <header className="flex items-center gap-4 px-6 py-3 border-b border-slate-800 bg-slate-900/50">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <span className="text-lg">⚽</span>
            <span className="text-xs font-bold uppercase tracking-widest text-slate-300">
              Soccer Sprite Creator
            </span>
            <span className="text-[10px] text-slate-600 ml-1">FIFA 2026</span>
          </div>

          <div className="h-4 w-px bg-slate-800" />

          {/* View mode tabs */}
          <div className="flex gap-1 bg-slate-800 rounded p-0.5">
            {([
              ['single', 'Single player'],
              ['team',   'Full team'],
              ['flag',   'Flag'],
              ['ball',   'Ball'],
              ['pitch',  'Pitch'],
              ['trophy',      'Trophy'],
              ['scoreboard',  'Scoreboard'],
              ['goalpost',    'Goal Post'],
              ['stadium',     'Stadium'],
            ] as const).map(([mode, label]) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-4 py-1.5 text-xs font-mono rounded transition-colors
                  ${viewMode === mode
                    ? 'bg-slate-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'}`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Game UI launch */}
          <button
            onClick={() => setShowGame(true)}
            className="ml-auto px-4 py-1.5 text-xs font-mono rounded transition-colors bg-amber-700 text-amber-200 hover:bg-amber-600 border border-amber-600"
          >
            ▶ GAME UI
          </button>

          {/* Nation badge */}
          <div className="flex items-center gap-2">
            <FlagCanvas code={nation.code} scale={2} className="border border-slate-700 rounded-sm" />
            <span className="text-xs text-slate-400">{nation.name}</span>
            <div className="flex gap-1 ml-1">
              <div className="w-3 h-3 rounded-sm border border-slate-700"
                   style={{ background: nation.kitPrimary }} />
              <div className="w-3 h-3 rounded-sm border border-slate-700"
                   style={{ background: nation.kitSecondary }} />
            </div>
          </div>
        </header>

        {/* Main content */}
        <div className="flex-1 flex overflow-hidden">
          {viewMode === 'flag' ? (
            <FlagPreview nation={nation} />
          ) : viewMode === 'ball' ? (
            <BallPreview />
          ) : viewMode === 'pitch' ? (
            <PitchPreview />
          ) : viewMode === 'trophy' ? (
            <TrophyPreview />
          ) : viewMode === 'scoreboard' ? (
            <ScoreboardPreview />
          ) : viewMode === 'goalpost' ? (
            <GoalpostPreview />
          ) : viewMode === 'stadium' ? (
            <StadiumPreview />
          ) : viewMode === 'single' ? (
            <>
              <SpritePreview
                player={selectedPlayer}
                nation={nation}
                animId={animId}
                onAnimChange={setAnimId}
              />
              <PlayerConfig
                player={selectedPlayer}
                nation={nation}
                onChange={handlePlayerChange}
              />
            </>
          ) : (
            <div className="flex-1 overflow-y-auto scrollbar-thin">
              <TeamSheet
                players={players}
                nation={nation}
                animId={animId}
                selectedIndex={selIdx}
                onSelect={idx => { setSelIdx(idx); setViewMode('single') }}
                onRegenerate={handleRegenerate}
              />
            </div>
          )}
        </div>

        {/* Export panel (always visible at bottom) */}
        <ExportPanel nation={nation} players={players} viewMode={viewMode} />
      </div>
    </div>
  )
}
