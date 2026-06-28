import { useState } from 'react'
import type { Nation } from '../types'
import { FIFA_2026_NATIONS } from '../data/nations'
import FlagCanvas from './FlagCanvas'

interface Props {
  selected: Nation
  onSelect: (n: Nation) => void
}

export default function NationSelector({ selected, onSelect }: Props) {
  const [query, setQuery] = useState('')

  const filtered = query.trim()
    ? FIFA_2026_NATIONS.filter(n =>
        n.name.toLowerCase().includes(query.toLowerCase()) ||
        n.code.toLowerCase().includes(query.toLowerCase())
      )
    : FIFA_2026_NATIONS

  return (
    <aside className="w-64 flex flex-col bg-slate-900 border-r border-slate-800 h-full">
      {/* Header */}
      <div className="px-4 pt-5 pb-3 border-b border-slate-800">
        <div className="text-xs font-mono uppercase tracking-widest text-slate-500 mb-3">
          FIFA 2026 · {FIFA_2026_NATIONS.length} nations
        </div>
        <input
          type="text"
          placeholder="Search nation..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs font-mono
                     rounded px-3 py-2 outline-none focus:border-sky-500 placeholder-slate-600
                     transition-colors"
        />
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin py-1">
        {filtered.map(nation => {
          const isActive = nation.code === selected.code
          return (
            <button
              key={nation.code}
              onClick={() => onSelect(nation)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors
                ${isActive
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
            >
              <FlagCanvas code={nation.code} scale={2} className="shrink-0 border border-slate-700 rounded-sm" />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-mono font-bold text-slate-300 truncate">
                  {nation.name}
                </div>
                <div className="text-[10px] font-mono text-slate-600 mt-0.5">{nation.code}</div>
              </div>
              {/* Kit colour swatches */}
              <div className="flex gap-1 shrink-0">
                <div
                  className="w-3 h-3 rounded-sm border border-slate-600"
                  style={{ background: nation.kitPrimary }}
                />
                <div
                  className="w-3 h-3 rounded-sm border border-slate-600"
                  style={{ background: nation.kitSecondary }}
                />
              </div>
            </button>
          )
        })}

        {filtered.length === 0 && (
          <p className="text-center text-xs text-slate-600 py-8 font-mono">No results</p>
        )}
      </div>
    </aside>
  )
}
