# Soccer Sprite Creator — FIFA World Cup 2026
## Project Context for Claude Code

---

## What this project is

A **pixel art asset creation tool** built to generate all the 2D sprites, flags, ball, and pitch artwork needed for a FIFA World Cup 2026 retro-style soccer game. The tool itself is a Vite + React 18 + TypeScript + Tailwind CSS v3 web app running on `localhost:5173`.

The **next phase** is to take these exported assets and build the actual **game engine and mechanics** on top of them — think Sensible Soccer / Nintendo World Cup style gameplay.

---

## Stack

- **Framework:** Vite 5 + React 18 + TypeScript
- **Styles:** Tailwind CSS v3
- **Rendering:** HTML Canvas API (pixel-level via `ImageData` for sprites/flags/ball; Canvas 2D path API for pitch)
- **Dev server:** `npm run dev` → `localhost:5173`
- **Type check:** `npx tsc --noEmit`
- **No test suite** — verify visually via browser preview

---

## Project structure

```
soccer-sprite-creator/
├── src/
│   ├── App.tsx                        # Root — 5 tabs: Single player, Full team, Flag, Ball, Pitch
│   ├── types.ts                       # All shared types (Player, Nation, AnimDef, KitPattern, etc.)
│   ├── main.tsx
│   ├── index.css
│   │
│   ├── components/
│   │   ├── NationSelector.tsx         # Left sidebar — searchable list of 48 FIFA 2026 nations
│   │   ├── SpritePreview.tsx          # Single player sprite viewer with animation playback
│   │   ├── TeamSheet.tsx              # 7-player grid view
│   │   ├── PlayerConfig.tsx           # Per-player editor (skin, hair, beard, position)
│   │   ├── FlagCanvas.tsx             # Inline flag renderer (used in header + nation list)
│   │   ├── FlagPreview.tsx            # Full flag preview tab
│   │   ├── BallPreview.tsx            # Ball preview tab (256×256 display at 16× scale)
│   │   ├── PitchPreview.tsx           # Pitch preview tab (768×300 CSS display at 1.5×)
│   │   └── ExportPanel.tsx            # Bottom panel — context-aware export UI per tab
│   │
│   ├── engine/
│   │   ├── spriteRenderer.ts          # Core pixel-art character renderer (ImageData, 16×24px)
│   │   ├── ballRenderer.ts            # 3-panel propeller ball renderer (16×16px native)
│   │   ├── flagRenderer.ts            # Per-nation flag renderer (20×13px native)
│   │   ├── pitchRenderer.ts           # Isometric pitch renderer (512×200px native)
│   │   ├── teamGenerator.ts           # Randomises a 7-player squad for a given nation
│   │   └── exporter.ts                # Sprite sheet export (PNG-32 via canvas toBlob)
│   │
│   └── data/
│       ├── nations.ts                 # All 48 FIFA 2026 nations with kit colours, skin tones, region
│       ├── animations.ts              # All AnimDef frame data (idle/walk/run/kick/slide/etc.)
│       └── skinPalettes.ts            # 6 skin tone palettes + hair/beard colour lookup
```

---

## Asset specifications

### Player sprites — `src/engine/spriteRenderer.ts`
- **Cell size:** 16 × 24 px per frame (native 1×)
- **Display/export scale:** 4× = 64×96px per frame
- **Sprite sheet layout:** One row per player, frames arranged horizontally by animation
- **Anatomy (right-facing):**
  - Head: cols 4–10, rows 2–8 (7×7px, intentionally oversized — retro style)
  - Hair: rows 2–3 of head
  - Eyes: row 6, Mouth: row 8
  - Torso: cols 5–10, rows 10–14
  - Arms: col 4 (left) / col 11 (right), rows 10–12
  - Shorts: cols 5–10, rows 15–17
  - Legs: 2px wide × 4px tall, center-anchored at col 7
  - Boots: 3×2px, rows 22–23 (always black #1A1A1A + white sole)
  - GK gloves: 2×2px at arm ends, yellow-gold #F5C400
- **Outline:** 1px solid black (#000000) applied as a post-pass over all filled pixels
- **Palette limit:** 8 foreground colours per character (excl. black outline + transparency)
- **Transparency:** Background is fully transparent (alpha=0)
- **imageRendering:** `pixelated` for crisp display

### Ball — `src/engine/ballRenderer.ts`
- **Native size:** 16 × 16 px
- **Export size:** 256 × 256 px (16× scale)
- **Style:** 3-panel propeller (Brazuca/Jabulani-inspired) — red (#D43030), blue (#2856A0), green (#35904D) panels with white seam bands and propeller twist effect
- **imageRendering:** `pixelated`

### Flags — `src/engine/flagRenderer.ts`
- **Native size:** 20 × 13 px
- **Export size:** 160 × 104 px (8× scale)
- **Style:** Pixel-accurate per-nation flags, programmatic rendering

### Pitch — `src/engine/pitchRenderer.ts`
- **Native size:** 512 × 200 px
- **Export size:** 1024 × 400 px (2× scale)
- **Perspective:** Isometric trapezoid — far edge narrower than near edge
- **Trapezoid corners:** TL=(108,16), TR=(404,16), BL=(16,183), BR=(496,183)
- **Field coordinate system:** FW=105m (left→right, goal line to goal line), FH=68m (far→near touchline)
- **Transformation:** `fs(px, py)` maps normalised field coords [0–1, 0–1] to screen px
- **Grass:** 10 alternating stripes, #32C81E / #2BB418
- **Markings:** FIFA standard — boundary, halfway, centre circle (r=9.15m), penalty areas (16.5m), goal areas (5.5m), penalty arcs, penalty spots (at 11m), corner arcs (r=1m)
- **Goals:** GW=10.98m (50% larger than FIFA spec for visual clarity), GD=9.0m depth
- **Corner flags:** Red (#CC1111) pennant triangles on grey poles
- **imageRendering:** `auto` (smooth scaling, not pixelated)

---

## Key types — `src/types.ts`

```typescript
type SkinTone  = 'light' | 'medium_light' | 'medium' | 'medium_dark' | 'dark'
type HairStyle = 0–9        // 10 hair styles
type BeardStyle = 0–5       // 6 beard styles
type Position   = 'GK' | 'OUT'
type AnimId     = 'idle' | 'walk' | 'run' | 'slide' | 'jump' | 'kick' | 'head' | 'save' | 'throwin' | 'celebrate' | 'taunt'

interface Player  { index, position, skinTone, hairStyle, beardStyle, hairVariant }
interface Nation  { code, name, flag, kitPrimary, kitSecondary, gkKit, kitPattern, region, skinTones[] }
interface AnimDef { id, name, frameDuration, frames: AnimFrame[] }
interface AnimFrame { bodyY, legL:[dx,dy], legR:[dx,dy], armF, headX?, pose? }
```

---

## Animation system — `src/data/animations.ts`

Animations are data-driven `AnimDef` objects. Leg offsets are **center-based** from `CENTER_X=7`:
- `legL: [-2, 0]` → left leg at col 5–6
- `legR: [+2, 0]` → right leg at col 9–10
- Negative dy = leg lifts up; negative dx = leg moves back

All sprites face **right** by default — mirror horizontally at runtime for left-facing.

Currently implemented animations: `idle`, `walk`, `run`, `slide`, `jump`, `kick`, `head`, `save`, `throwin`, `celebrate`, `taunt`

---

## Nations data — `src/data/nations.ts`

48 FIFA World Cup 2026 nations across 5 regions (CONMEBOL, UEFA, AFC, CAF, CONCACAF, OFC). Each nation has:
- Kit colours (primary/secondary/GK) and pattern type (solid/stripes/sash/etc.)
- Default skin tone distribution for squad generation
- 2-letter FIFA country code and full flag string

---

## What's been built — done ✓

- [x] Full sprite renderer with 11 animation states
- [x] All 48 nations with accurate kit colours and flag art
- [x] Ball renderer (3-panel propeller, 16×16px)
- [x] Isometric pitch with all FIFA markings (512×200px)
- [x] Team generator (randomised 7-player squads per nation)
- [x] PNG export for sprites (sprite sheet), flags, ball, and pitch
- [x] Dev UI: 5-tab viewer with nation selector and export panel

---

## What to build next — game phase

The goal is to build a **retro 2D top-down soccer game** using these assets. Key things to design/implement:

- **Game engine:** Canvas-based game loop (requestAnimationFrame), fixed timestep physics
- **Pitch rendering in-game:** Use `pitchRenderer.ts` as the background layer; players drawn on top
- **Player rendering in-game:** Use `spriteRenderer.ts` to blit individual frames at runtime (no sprite sheet export needed — render directly to game canvas)
- **Ball physics:** Simple 2D physics (velocity, friction, bounce off pitch boundary)
- **Player movement:** Keyboard input → walk/run animation states, facing direction
- **Kicking / passing:** Trigger `kick` animation, apply impulse to ball
- **AI / opposition:** Simple rule-based AI for opponent team
- **Game state:** Kickoff, in-play, goal scored, half-time, full-time
- **Camera:** Either fixed (full pitch visible) or follow-ball scrolling

### Architecture suggestion for game

Separate the game from the sprite creator — either:
1. A new route `/game` within this Vite app, or
2. A new sibling project that imports from `soccer-sprite-creator/src/engine/`

The engine files (`spriteRenderer`, `pitchRenderer`, `ballRenderer`) are pure canvas functions with no React dependencies — they can be called directly from a game loop.

---

## Dev notes

- Run dev server: `npm run dev` (port 5173)
- Type check: `npx tsc --noEmit`
- No linter configured — TypeScript strict mode is the guardrail
- Tailwind purges unused classes at build time — use full class names, not dynamic string construction
