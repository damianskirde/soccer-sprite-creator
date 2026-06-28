import { useState } from 'react'
import type { Player, Nation } from '../types'
import { exportSpriteSheet, downloadBlob } from '../engine/exporter'
import { flagToBlob, FLAG_W, FLAG_H } from '../engine/flagRenderer'
import { ballToBlob, ballSheetToBlob, BALL_W, BALL_H } from '../engine/ballRenderer'
import { pitchToBlob, PITCH_W, PITCH_H } from '../engine/pitchRenderer'
import { trophyToBlob, TROPHY_W, TROPHY_H } from '../engine/trophyRenderer'
import { scoreboardToBlob, SB_W, SB_H } from '../engine/scoreboardRenderer'
import { goalToBlob, GOAL_W, GOAL_H } from '../engine/goalRenderer'
import { FIFA_2026_NATIONS } from '../data/nations'
import { ANIMATION_ORDER } from '../data/animations'

type ViewMode = 'single' | 'team' | 'flag' | 'ball' | 'pitch' | 'trophy' | 'scoreboard' | 'goalpost' | 'stadium'

interface Props {
  nation: Nation
  players: Player[]
  viewMode: ViewMode
}

export default function ExportPanel({ nation, players, viewMode }: Props) {
  const [exporting, setExporting] = useState(false)
  const [scale, setScale]         = useState<1 | 4>(4)

  const isFlag        = viewMode === 'flag'
  const isBall        = viewMode === 'ball'
  const isPitch       = viewMode === 'pitch'
  const isTrophy      = viewMode === 'trophy'
  const isScoreboard  = viewMode === 'scoreboard'
  const isGoalpost    = viewMode === 'goalpost'
  const defaultAway   = FIFA_2026_NATIONS.find(n => n.code === 'RSA') ?? FIFA_2026_NATIONS[1]

  async function handleExportSprites() {
    setExporting(true)
    try {
      const blob = await exportSpriteSheet(nation, players, scale)
      downloadBlob(blob, `${nation.code}_sprites.png`)
    } finally { setExporting(false) }
  }

  async function handleExportFlag() {
    setExporting(true)
    try {
      const blob = await flagToBlob(nation.code, 8)
      downloadBlob(blob, `${nation.code}_flag.png`)
    } finally { setExporting(false) }
  }

  const cellW  = 16 * scale
  const cellH  = 24 * scale
  const gutter = 2 * scale
  const sheetW = ANIMATION_ORDER.length * (cellW + gutter)
  const sheetH = 7 * (cellH + gutter)

  return (
    <div className="border-t border-slate-800">
      <div className="px-5 py-4">
        <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-4">
          {isFlag ? 'Flag export' : isBall ? 'Ball export' : isPitch ? 'Pitch export' : isTrophy ? 'Trophy export' : isScoreboard ? 'Scoreboard export' : isGoalpost ? 'Goal post export' : 'Sprite export'}
        </div>

        {isGoalpost ? (
          <>
            <div className="bg-slate-800/60 rounded-lg p-3 mb-4 font-mono text-[10px] text-slate-500 space-y-0.5">
              <div><span className="text-slate-600">Format:</span> PNG-32 (RGBA)</div>
              <div><span className="text-slate-600">Native:</span> {GOAL_W}×{GOAL_H}px</div>
              <div><span className="text-slate-600">Export:</span> {GOAL_W * 8}×{GOAL_H * 8}px (8×)</div>
              <div><span className="text-slate-600">File:</span> goalpost_east.png / goalpost_west.png</div>
              <div className="pt-1 text-indigo-400">Pixel art · transparent bg · checkerboard net</div>
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={async () => { setExporting(true); try { downloadBlob(await goalToBlob('east', 8), 'goalpost_east.png') } finally { setExporting(false) } }}
                disabled={exporting}
                className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-700
                           text-white text-xs font-mono rounded transition-colors"
              >
                {exporting ? 'Exporting…' : '↓ Download goalpost_east.png'}
              </button>
              <button
                onClick={async () => { setExporting(true); try { downloadBlob(await goalToBlob('west', 8), 'goalpost_west.png') } finally { setExporting(false) } }}
                disabled={exporting}
                className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-700
                           text-white text-xs font-mono rounded transition-colors"
              >
                {exporting ? 'Exporting…' : '↓ Download goalpost_west.png'}
              </button>
            </div>
          </>
        ) : isScoreboard ? (
          <>
            <div className="bg-slate-800/60 rounded-lg p-3 mb-4 font-mono text-[10px] text-slate-500 space-y-0.5">
              <div><span className="text-slate-600">Format:</span> PNG-32 (RGBA)</div>
              <div><span className="text-slate-600">Native:</span> {SB_W}×{SB_H}px</div>
              <div><span className="text-slate-600">Export:</span> {SB_W * 2}×{SB_H * 2}px (2×)</div>
              <div><span className="text-slate-600">File:</span> scoreboard.png</div>
              <div className="pt-1 text-indigo-400">Home = selected nation · Away = RSA default</div>
            </div>
            <button
              onClick={async () => {
                setExporting(true)
                try { downloadBlob(await scoreboardToBlob(nation, defaultAway, 2), 'scoreboard.png') }
                finally { setExporting(false) }
              }}
              disabled={exporting}
              className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-700
                         text-white text-xs font-mono rounded transition-colors"
            >
              {exporting ? 'Exporting…' : '↓ Download scoreboard.png'}
            </button>
          </>
        ) : isTrophy ? (
          <>
            <div className="bg-slate-800/60 rounded-lg p-3 mb-4 font-mono text-[10px] text-slate-500 space-y-0.5">
              <div><span className="text-slate-600">Format:</span> PNG-32 (RGBA)</div>
              <div><span className="text-slate-600">Native:</span> {TROPHY_W}×{TROPHY_H}px</div>
              <div><span className="text-slate-600">Export:</span> {TROPHY_W * 8}×{TROPHY_H * 8}px (8×)</div>
              <div><span className="text-slate-600">File:</span> trophy.png</div>
              <div className="pt-1 text-indigo-400">Pixel art · transparent bg</div>
            </div>
            <button
              onClick={async () => { setExporting(true); try { downloadBlob(await trophyToBlob(8), 'trophy.png') } finally { setExporting(false) } }}
              disabled={exporting}
              className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-700
                         text-white text-xs font-mono rounded transition-colors"
            >
              {exporting ? 'Exporting…' : '↓ Download trophy.png'}
            </button>
          </>
        ) : isPitch ? (
          <>
            <div className="bg-slate-800/60 rounded-lg p-3 mb-4 font-mono text-[10px] text-slate-500 space-y-0.5">
              <div><span className="text-slate-600">Format:</span> PNG-32 (RGBA)</div>
              <div><span className="text-slate-600">Native:</span> {PITCH_W}×{PITCH_H}px</div>
              <div><span className="text-slate-600">Export:</span> {PITCH_W}×{PITCH_H}px (1× — already 2× logical scale)</div>
              <div><span className="text-slate-600">File:</span> pitch.png</div>
              <div className="pt-1 text-indigo-400">FIFA standard · isometric · pixel-crisp · transparent bg</div>
            </div>
            <button
              onClick={async () => { setExporting(true); try { downloadBlob(await pitchToBlob(), 'pitch.png') } finally { setExporting(false) } }}
              disabled={exporting}
              className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-700
                         text-white text-xs font-mono rounded transition-colors"
            >
              {exporting ? 'Exporting…' : '↓ Download pitch.png'}
            </button>
          </>
        ) : isBall ? (
          <>
            <div className="bg-slate-800/60 rounded-lg p-3 mb-4 font-mono text-[10px] text-slate-500 space-y-0.5">
              <div><span className="text-slate-600">Format:</span> PNG-32 (RGBA)</div>
              <div><span className="text-slate-600">Native:</span> {BALL_W}×{BALL_H}px per frame</div>
              <div><span className="text-slate-600">Sheet:</span> {BALL_W * 4}×{BALL_H}px native · 4 frames (0°/90°/180°/270°)</div>
              <div><span className="text-slate-600">Export:</span> {BALL_W * 4 * 16}×{BALL_H * 16}px (16×)</div>
              <div className="pt-1 text-indigo-400">3-panel propeller · rolling animation · transparent bg</div>
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={async () => { setExporting(true); try { downloadBlob(await ballSheetToBlob(16), 'ball_sheet.png') } finally { setExporting(false) } }}
                disabled={exporting}
                className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-700
                           text-white text-xs font-mono rounded transition-colors"
              >
                {exporting ? 'Exporting…' : '↓ Download ball_sheet.png (4 frames)'}
              </button>
              <button
                onClick={async () => { setExporting(true); try { downloadBlob(await ballToBlob(16), 'ball.png') } finally { setExporting(false) } }}
                disabled={exporting}
                className="w-full py-2.5 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-700
                           text-white text-xs font-mono rounded transition-colors"
              >
                {exporting ? 'Exporting…' : '↓ Download ball.png (0° only)'}
              </button>
            </div>
          </>
        ) : isFlag ? (
          <>
            <div className="bg-slate-800/60 rounded-lg p-3 mb-4 font-mono text-[10px] text-slate-500 space-y-0.5">
              <div><span className="text-slate-600">Format:</span> PNG-32 (RGBA)</div>
              <div><span className="text-slate-600">Native:</span> {FLAG_W}×{FLAG_H}px</div>
              <div><span className="text-slate-600">Export:</span> {FLAG_W * 8}×{FLAG_H * 8}px (8×)</div>
              <div><span className="text-slate-600">File:</span> {nation.code}_flag.png</div>
              <div className="pt-1 text-indigo-400">Pixel art · no anti-aliasing</div>
            </div>
            <button
              onClick={handleExportFlag}
              disabled={exporting}
              className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-700
                         text-white text-xs font-mono rounded transition-colors"
            >
              {exporting ? 'Exporting…' : `↓ Download ${nation.code}_flag.png`}
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-[10px] font-mono text-slate-500">Scale</span>
              <div className="flex gap-1 bg-slate-800 rounded p-0.5">
                {([1, 4] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => setScale(s)}
                    className={`px-3 py-1 text-xs font-mono rounded transition-colors
                      ${scale === s ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    {s}×
                  </button>
                ))}
              </div>
              <span className="text-[10px] font-mono text-slate-600">{sheetW}×{sheetH}px</span>
            </div>

            <div className="bg-slate-800/60 rounded-lg p-3 mb-4 font-mono text-[10px] text-slate-500 space-y-0.5">
              <div><span className="text-slate-600">Format:</span> PNG-32 (RGBA)</div>
              <div><span className="text-slate-600">Cols:</span> {ANIMATION_ORDER.length} animations</div>
              <div><span className="text-slate-600">Rows:</span> 7 players</div>
              <div><span className="text-slate-600">Cell:</span> {cellW}×{cellH}px</div>
              <div><span className="text-slate-600">File:</span> {nation.code}_sprites.png</div>
              <div className="pt-1 text-indigo-400">Facing: right (flip at runtime)</div>
            </div>

            <button
              onClick={handleExportSprites}
              disabled={exporting}
              className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-700
                         text-white text-xs font-mono rounded transition-colors"
            >
              {exporting ? 'Exporting…' : `↓ Export ${nation.code}_sprites.png`}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
