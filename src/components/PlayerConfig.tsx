import type { Player, Nation, HairStyle } from '../types'

const HAIR_NAMES = [
  'H01 Short flat', 'H02 Short messy', 'H03 Afro', 'H04 Bald', 'H05 Mohawk',
  'H06 Curly tight', 'H07 Long / tied', 'H08 Dreadlocks', 'H09 Wavy part', 'H10 Sideburns',
]

interface Props {
  player: Player
  nation: Nation
  onChange: (p: Partial<Player>) => void
}

function Swatch({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="w-5 h-5 rounded border border-slate-600 shrink-0"
        style={{ background: color }}
      />
      <span className="text-[10px] font-mono text-slate-500">{label}</span>
      <span className="text-[10px] font-mono text-slate-600 ml-auto">{color}</span>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
        {label}
      </label>
      {children}
    </div>
  )
}

export default function PlayerConfig({ player, nation, onChange }: Props) {
  const isGK = player.position === 'GK'
  const kitColor = isGK ? nation.gkKit : nation.kitPrimary

  return (
    <aside className="w-60 flex flex-col bg-slate-900 border-l border-slate-800 overflow-y-auto scrollbar-thin">
      <div className="px-4 pt-5 pb-4 border-b border-slate-800">
        <div className="text-xs font-mono uppercase tracking-widest text-slate-500">
          Player config
        </div>
        <div className="text-lg font-mono font-bold text-slate-200 mt-1">
          {nation.flag} #{player.index + 1}
        </div>
      </div>

      <div className="p-4 flex flex-col gap-5">
        {/* Position */}
        <Field label="Position">
          <div className="flex gap-1 bg-slate-800 rounded p-0.5">
            {(['OUT', 'GK'] as const).map(pos => (
              <button
                key={pos}
                onClick={() => onChange({ position: pos })}
                className={`flex-1 py-1.5 text-xs font-mono rounded transition-colors
                  ${player.position === pos
                    ? 'bg-slate-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'}`}
              >
                {pos === 'GK' ? 'GK' : 'Outfield'}
              </button>
            ))}
          </div>
        </Field>

        {/* Hair style */}
        <Field label="Hair style">
          <select
            value={player.hairStyle}
            onChange={e => onChange({ hairStyle: Number(e.target.value) as HairStyle })}
            className="bg-slate-800 border border-slate-700 text-slate-200 text-xs font-mono
                       rounded px-2 py-1.5 outline-none focus:border-sky-500"
          >
            {HAIR_NAMES.map((name, i) => (
              <option key={i} value={i}>{name}</option>
            ))}
          </select>
        </Field>

        {/* Kit preview */}
        <div className="border-t border-slate-800 pt-4">
          <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-3">
            Kit colours
          </div>
          <div className="flex flex-col gap-2">
            <Swatch color={kitColor} label="Shirt" />
            <Swatch color={isGK ? nation.gkKit : nation.kitSecondary} label="Shorts / Socks" />
            <Swatch color={nation.gkKit} label="GK kit" />
            <Swatch color="#111111" label="Boots" />
          </div>
        </div>

        {/* Kit pattern info */}
        <div className="border-t border-slate-800 pt-4">
          <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-2">
            Kit pattern
          </div>
          <div className="bg-slate-800 rounded px-3 py-2">
            <span className="text-xs font-mono text-sky-400">
              {nation.kitPattern.type.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Skin tone (read-only display) */}
        <div className="border-t border-slate-800 pt-4">
          <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-2">
            Skin tone (auto)
          </div>
          <div className="bg-slate-800 rounded px-3 py-2 text-xs font-mono text-slate-400">
            {player.skinTone.replace('_', ' ')}
          </div>
        </div>
      </div>
    </aside>
  )
}
