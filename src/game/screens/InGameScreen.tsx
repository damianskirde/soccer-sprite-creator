// InGameScreen — full canvas game engine, ported from retro-soccer-2026.html
import { useEffect, useRef } from 'react'
import type { GameSession, ScreenId } from '../types'
import { renderScoreboard, SB_W, SB_H } from '../../engine/scoreboardRenderer'
import { renderPitch } from '../../engine/pitchRenderer'
import { FIFA_2026_NATIONS } from '../../data/nations'
import type { Nation } from '../../types'

interface Props {
  session: GameSession
  updateSession: (patch: Partial<GameSession>) => void
  onNavigate: (screen: ScreenId) => void
}

// ─── Sprite sheet constants ────────────────────────────────────────────────────
const SS_CELL_W = 72, SS_CELL_H = 104, SS_VIS_W = 64, SS_VIS_H = 96
const ANIM_COL: Record<string, number> = {
  idle:0, walk:1, run:2, slide:3, jump:4, kick:5, head:6, save:7, throwin:8, celebrate:9, taunt:10,
}
const ROLE_ROW: Record<string, number> = { gk:0, lb:1, rb:2, lm:3, cm:4, rm:5, cf:6 }

const GOAL_Y_MIN = 26.75, GOAL_Y_MAX = 37.25

const DIFF_PARAMS: Record<string, { reaction:number; passAcc:number; shootAcc:number; gkReflex:number; dribble:number }> = {
  diff_amateur:     { reaction:400, passAcc:0.60, shootAcc:0.50, gkReflex:500, dribble:0.30 },
  diff_world_class: { reaction:200, passAcc:0.80, shootAcc:0.72, gkReflex:350, dribble:0.55 },
  diff_legendary:   { reaction:80,  passAcc:0.95, shootAcc:0.88, gkReflex:200, dribble:0.80 },
}

// ─── Team kit colours ──────────────────────────────────────────────────────────
const TEAM_KIT: Record<string, [string, string, string, string]> = {
  ALG:['#FFFFFF','#FFFFFF','#FF6B00','solid'],  ARG:['#75AADB','#FFFFFF','#FFD700','v_stripes'],
  AUS:['#00843D','#FFD700','#FF6B00','solid'],  AUT:['#ED2939','#FFFFFF','#FFD700','solid'],
  BEL:['#ED2939','#000000','#00A650','solid'],  BIH:['#002395','#002395','#7FD420','solid'],
  BRA:['#F7D000','#009C3B','#3E6AC5','collar_band'], CAN:['#FF0000','#FFFFFF','#003087','solid'],
  CIV:['#FF6600','#FFFFFF','#7FD420','solid'],  COD:['#007FFF','#CE1126','#FF6B00','solid'],
  COL:['#FDD116','#003087','#CE1126','solid'],  CPV:['#003893','#FFFFFF','#FFD700','solid'],
  CRC:['#CC0000','#FFFFFF','#003087','solid'],  CRO:['#FF0000','#FFFFFF','#FFD700','h_stripes'],
  CUW:['#003DA5','#F8CD00','#CE1126','solid'],  CZE:['#D7141A','#11457E','#00A86B','solid'],
  ECU:['#FFD100','#003087','#CE1126','solid'],  EGY:['#CE1126','#FFFFFF','#004A97','solid'],
  ENG:['#FFFFFF','#CE1126','#FFD700','solid'],  ESP:['#CE1126','#FFD700','#003087','solid'],
  FRA:['#002395','#FFFFFF','#00A86B','solid'],  GER:['#FFFFFF','#000000','#CE1126','solid'],
  GHA:['#FFFFFF','#006B3F','#CE1126','solid'],  HTI:['#00209F','#D21034','#007A5E','solid'],
  IRN:['#239F40','#FFFFFF','#003087','solid'],  IRQ:['#007A3D','#FFFFFF','#FF6B00','solid'],
  JOR:['#007A3D','#CE1126','#003087','solid'],  JPN:['#003087','#FFFFFF','#CE1126','solid'],
  KOR:['#CE1126','#FFFFFF','#003087','solid'],  MAR:['#C1272D','#006233','#FF6B00','solid'],
  MEX:['#006847','#FFFFFF','#003087','shadow_stripe'], NED:['#FF6600','#FFFFFF','#003087','solid'],
  NOR:['#EF2B2D','#FFFFFF','#FF6B00','solid'],  NZL:['#FFFFFF','#000000','#FFD700','solid'],
  PAN:['#D21034','#FFFFFF','#005293','solid'],  PAR:['#CE1126','#FFFFFF','#007A5E','solid'],
  POR:['#CE1126','#006600','#004A97','shadow_stripe'], QAT:['#8D153A','#FFFFFF','#FFD700','solid'],
  RSA:['#007A4D','#FFB81C','#CE1126','solid'],  SAU:['#006C35','#FFFFFF','#003087','solid'],
  SCO:['#003366','#FFFFFF','#FF6B00','solid'],  SEN:['#FFFFFF','#00853F','#FF6B00','solid'],
  SUI:['#CE1126','#FFFFFF','#003087','solid'],  SWE:['#FECC02','#006AA7','#FF6B00','solid'],
  TUN:['#CE1126','#FFFFFF','#004A97','solid'],  TUR:['#CE1126','#FFFFFF','#003087','solid'],
  URU:['#5DADE2','#FFFFFF','#FFD700','solid'],  USA:['#002868','#FFFFFF','#BF0A30','solid'],
  UZB:['#1EB53A','#FFFFFF','#003087','solid'],
}

// ─── Game animation data ───────────────────────────────────────────────────────
type AnimFrame = { bodyY:number; legL:[number,number]; legR:[number,number]; armF:number; pose?:string; headX?:number }
const GAME_ANIMS: Record<string, { frames: AnimFrame[] }> = {
  idle:     { frames: [{bodyY:0,legL:[-2,0],legR:[2,0],armF:0},{bodyY:0,legL:[-2,0],legR:[2,-1],armF:0}] },
  walk:     { frames: [{bodyY:0,legL:[-4,0],legR:[4,0],armF:1},{bodyY:-1,legL:[-2,0],legR:[2,0],armF:0},{bodyY:0,legL:[4,0],legR:[-4,0],armF:-1}] },
  run:      { frames: [{bodyY:-1,legL:[-4,0],legR:[5,-2],armF:2},{bodyY:0,legL:[-2,0],legR:[2,0],armF:1},{bodyY:-1,legL:[5,-2],legR:[-4,0],armF:-2}] },
  slide:    { frames: [{bodyY:0,legL:[-2,0],legR:[3,0],armF:0},{bodyY:0,legL:[0,0],legR:[0,0],armF:0,pose:'slide'}] },
  jump:     { frames: [{bodyY:0,legL:[-2,1],legR:[2,1],armF:-1},{bodyY:-3,legL:[-1,0],legR:[1,0],armF:-2},{bodyY:-4,legL:[-1,-1],legR:[1,-1],armF:-2}] },
  kick:     { frames: [{bodyY:0,legL:[-2,0],legR:[2,0],armF:1},{bodyY:0,legL:[-2,0],legR:[5,-2],armF:-1},{bodyY:0,legL:[-2,0],legR:[6,-1],armF:-2}] },
  head:     { frames: [{bodyY:-1,legL:[-2,0],legR:[2,0],armF:-1},{bodyY:-4,legL:[-1,-1],legR:[1,-1],armF:-2}] },
  save:     { frames: [{bodyY:0,legL:[-2,0],legR:[2,0],armF:0},{bodyY:0,legL:[0,0],legR:[0,0],armF:3,pose:'dive'}] },
  throwin:  { frames: [{bodyY:-1,legL:[-2,0],legR:[2,0],armF:-3,pose:'throwin_peak'},{bodyY:-2,legL:[-2,0],legR:[2,0],armF:-4,pose:'throwin_peak'}] },
  celebrate:{ frames: [{bodyY:-1,legL:[-2,0],legR:[2,0],armF:-2},{bodyY:-4,legL:[-1,-1],legR:[1,-1],armF:-4}] },
  taunt:    { frames: [{bodyY:0,legL:[-2,0],legR:[2,0],armF:3}] },
}
const GAME_FRAME_PICK: Record<string, number> = {
  idle:0, walk:1, run:0, slide:1, jump:2, kick:2, head:1, save:1, throwin:0, celebrate:1, taunt:0,
}
const GAME_ANIM_ORDER = ['idle','walk','run','slide','jump','kick','head','save','throwin','celebrate','taunt']

// ─── Sprite sheet builder ──────────────────────────────────────────────────────
type RGB = [number, number, number]
const BOOT_TOP: RGB  = [26,26,26]
const BOOT_SOLE: RGB = [240,240,240]
const GK_GLOVE: RGB  = [245,196,0]
const SKINS: RGB[]   = [[255,204,153],[240,175,110],[210,145,85],[170,110,65],[110,65,35]]
const HAIRS: RGB[]   = [[50,30,10],[40,25,8],[80,50,20],[150,120,60],[100,60,20]]

function hexRgb(h: string): RGB {
  h = h.replace('#', '')
  return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)]
}
function sp(d: Uint8ClampedArray, c: number, r: number, rgb: RGB) {
  if (c < 0 || c >= 16 || r < 0 || r >= 24) return
  const i = (r*16+c)*4; d[i]=rgb[0]; d[i+1]=rgb[1]; d[i+2]=rgb[2]; d[i+3]=255
}
function applyOutline(d: Uint8ClampedArray) {
  const flag = new Uint8Array(384)
  for (let y = 0; y < 24; y++) for (let x = 0; x < 16; x++) {
    if (d[(y*16+x)*4+3] > 0) continue
    if ((x>0 && d[(y*16+x-1)*4+3]>0)||(x<15 && d[(y*16+x+1)*4+3]>0)||
        (y>0 && d[((y-1)*16+x)*4+3]>0)||(y<23 && d[((y+1)*16+x)*4+3]>0)) flag[y*16+x]=1
  }
  for (let i = 0; i < 384; i++) if (flag[i]) { const j=i*4; d[j]=0; d[j+1]=0; d[j+2]=0; d[j+3]=255 }
}
function drawHair(d: Uint8ClampedArray, dy: number, hair: RGB) {
  for (let c = 4; c <= 10; c++) sp(d,c,2+dy,hair)
  ;[4,5,9,10].forEach(c => sp(d,c,3+dy,hair))
}
function drawHead(d: Uint8ClampedArray, dy: number, skin: RGB, hair: RGB) {
  drawHair(d,dy,hair)
  for (let r = 4; r <= 7; r++) for (let c = 4; c <= 10; c++) sp(d,c,r+dy,skin)
  for (let c = 5; c <= 9; c++) sp(d,c,8+dy,skin)
  sp(d,6,6+dy,[20,20,20]); sp(d,8,6+dy,[20,20,20])
  for (let c = 6; c <= 8; c++) sp(d,c,8+dy,[20,20,20])
}
function drawNeck(d: Uint8ClampedArray, dy: number, skin: RGB) { sp(d,6,9+dy,skin); sp(d,7,9+dy,skin) }
function drawTorso(d: Uint8ClampedArray, dy: number, kit: RGB, sec: RGB, pat: string) {
  for (let r = 10; r <= 14; r++) for (let c = 5; c <= 10; c++) sp(d,c,r+dy,kit)
  if (pat==='v_stripes') { for (let r=10;r<=14;r++) for (let c=5;c<=10;c++) if (Math.floor((c-5)/2)%2===1) sp(d,c,r+dy,sec) }
  else if (pat==='h_stripes') { for (let r=10;r<=14;r++) if ((r-10)%2===1) for (let c=5;c<=10;c++) sp(d,c,r+dy,sec) }
  else if (pat==='collar_band') { for (let c=5;c<=10;c++) sp(d,c,10+dy,sec) }
  else if (pat==='shadow_stripe') { for (let r=10;r<=14;r++) { sp(d,9,r+dy,sec); sp(d,10,r+dy,sec) } }
  sp(d,7,10+dy,sec); sp(d,8,10+dy,sec)
}
function drawArms(d: Uint8ClampedArray, dy: number, armF: number, skin: RGB, kit: RGB, isGK: boolean) {
  if (armF <= -3) {
    const lift = armF===-4 ? 5 : 3
    for (let r = 10-lift; r <= 12; r++) { sp(d,4,r+dy,r===10?kit:skin); sp(d,11,r+dy,r===10?kit:skin) }
    if (isGK) { const tr=10-lift; [3,4].forEach(c=>sp(d,c,tr+dy,GK_GLOVE)); [11,12].forEach(c=>sp(d,c,tr+dy,GK_GLOVE)) }
    return
  }
  if (armF >= 3) {
    sp(d,4,10+dy,kit); sp(d,4,11+dy,skin); sp(d,4,12+dy,skin)
    sp(d,11,10+dy,kit); sp(d,12,10+dy,skin); sp(d,13,10+dy,skin); sp(d,14,10+dy,skin)
    if (isGK) { sp(d,3,11+dy,GK_GLOVE); sp(d,3,12+dy,GK_GLOVE); sp(d,15,10+dy,GK_GLOVE); sp(d,14,11+dy,GK_GLOVE) }
    return
  }
  const lB = armF===2?1:(armF===-2?-1:0), rB = armF===-2?1:(armF===2?-1:0)
  sp(d,4,10+dy,kit); sp(d,4,11+dy,skin); sp(d,4+lB,12+dy,skin)
  sp(d,11,10+dy,kit); sp(d,11,11+dy,skin); sp(d,11+rB,12+dy,skin)
  if (isGK) { sp(d,3,11+dy,GK_GLOVE); sp(d,3,12+dy,GK_GLOVE); sp(d,4,12+dy,GK_GLOVE); sp(d,11,12+dy,GK_GLOVE); sp(d,12,11+dy,GK_GLOVE); sp(d,12,12+dy,GK_GLOVE) }
}
function drawShorts(d: Uint8ClampedArray, dy: number, s: RGB) { for (let r=15;r<=17;r++) for (let c=5;c<=10;c++) sp(d,c,r+dy,s) }
function drawLeg(d: Uint8ClampedArray, bx: number, by: number, skin: RGB, sock: RGB) {
  sp(d,bx,by,skin); sp(d,bx+1,by,skin); sp(d,bx,by+1,skin); sp(d,bx+1,by+1,skin)
  sp(d,bx,by+2,sock); sp(d,bx+1,by+2,sock); sp(d,bx,by+3,sock); sp(d,bx+1,by+3,sock)
  const bb = by+4
  sp(d,bx,bb,BOOT_TOP); sp(d,bx+1,bb,BOOT_TOP); sp(d,bx+2,bb,BOOT_TOP)
  sp(d,bx,bb+1,BOOT_SOLE); sp(d,bx+1,bb+1,BOOT_SOLE); sp(d,bx+2,bb+1,BOOT_SOLE)
}
function drawSlide(d: Uint8ClampedArray, skin: RGB, hair: RGB, kit: RGB, shorts: RGB, sock: RGB, isGK: boolean) {
  const br = 13, EYE: RGB = [20,20,20]
  for (let c=0;c<=4;c++) { sp(d,c,br-1,hair); sp(d,c,br,hair); sp(d,c,br+1,skin); sp(d,c,br+2,skin) }
  sp(d,1,br,EYE); sp(d,3,br,EYE); for (let c=1;c<=3;c++) sp(d,c,br+2,EYE)
  for (let c=4;c<=12;c++) { sp(d,c,br+1,kit); sp(d,c,br+2,kit) }
  for (let c=4;c<=9;c++) sp(d,c,br+3,shorts)
  for (let c=10;c<=14;c++) { sp(d,c,br+2,sock); sp(d,c,br+3,sock) }
  sp(d,13,br+4,BOOT_TOP); sp(d,14,br+4,BOOT_TOP); sp(d,15,br+4,BOOT_TOP)
  sp(d,13,br+5,BOOT_SOLE); sp(d,14,br+5,BOOT_SOLE); sp(d,15,br+5,BOOT_SOLE)
  sp(d,8,br-1,skin); sp(d,9,br-1,skin); sp(d,8,br-2,sock); sp(d,9,br-2,sock)
  sp(d,7,br-3,BOOT_TOP); sp(d,8,br-3,BOOT_TOP); sp(d,7,br-4,BOOT_SOLE); sp(d,8,br-4,BOOT_SOLE)
  sp(d,3,br+1,skin); sp(d,3,br+2,skin)
  if (isGK) { sp(d,2,br+1,GK_GLOVE); sp(d,2,br+2,GK_GLOVE) }
}
function drawDive(d: Uint8ClampedArray, armF: number, skin: RGB, hair: RGB, kit: RGB, shorts: RGB, sock: RGB) {
  const EYE: RGB = [20,20,20]
  for (let c=0;c<=5;c++) { sp(d,c,3,hair); sp(d,c,4,hair); sp(d,c,5,skin); sp(d,c,6,skin) }
  sp(d,1,5,EYE); sp(d,3,5,EYE)
  for (let c=4;c<=12;c++) { const r=8+Math.floor((c-4)*0.35); sp(d,c,r,kit); sp(d,c,r+1,kit) }
  const reach = Math.min(armF,5)
  for (let r=7;r<=10;r++) sp(d,8+(r-7)+reach,r,r===7?kit:skin)
  const gx=10+reach; sp(d,gx,9,GK_GLOVE); sp(d,gx+1,9,GK_GLOVE); sp(d,gx,10,GK_GLOVE); sp(d,gx+1,10,GK_GLOVE)
  for (let c=3;c<=7;c++) sp(d,c,12,shorts)
  sp(d,3,13,skin); sp(d,4,13,skin); sp(d,3,14,sock); sp(d,4,14,sock)
  sp(d,2,15,BOOT_TOP); sp(d,3,15,BOOT_TOP); sp(d,2,16,BOOT_SOLE); sp(d,3,16,BOOT_SOLE)
}
function drawThrowIn(d: Uint8ClampedArray, dy: number, armF: number, skin: RGB, kit: RGB) {
  const r0 = armF===-4 ? 2 : 4
  for (let r=r0;r<=9;r++) { sp(d,4,r+dy,r>=9?kit:skin); sp(d,11,r+dy,r>=9?kit:skin) }
}

function renderSpriteFrame(frame: AnimFrame, kitRgb: RGB, secRgb: RGB, skinRgb: RGB, hairRgb: RGB, isGK: boolean, pat: string): ImageData {
  const img = new ImageData(16, 24)
  const d = img.data
  const by = frame.bodyY||0, armF = frame.armF||0
  const [llx, lly] = frame.legL, [lrx, lry] = frame.legR
  if (frame.pose==='slide') { drawSlide(d,skinRgb,hairRgb,kitRgb,secRgb,secRgb,isGK); applyOutline(d); return img }
  if (frame.pose==='dive')  { drawDive(d,armF,skinRgb,hairRgb,kitRgb,secRgb,secRgb); applyOutline(d); return img }
  const lBX = 7+llx, rBX = 7+lrx, lb = 18+by
  if (lBX <= rBX) { drawLeg(d,lBX,lb+lly,skinRgb,secRgb); drawLeg(d,rBX,lb+lry,skinRgb,secRgb) }
  else { drawLeg(d,rBX,lb+lry,skinRgb,secRgb); drawLeg(d,lBX,lb+lly,skinRgb,secRgb) }
  drawShorts(d,by,secRgb)
  drawTorso(d,by,kitRgb,secRgb,pat)
  drawNeck(d,by,skinRgb)
  drawArms(d,by,armF,skinRgb,kitRgb,isGK)
  if (frame.pose==='throwin_peak') drawThrowIn(d,by,armF,skinRgb,kitRgb)
  drawHead(d,by,skinRgb,hairRgb)
  applyOutline(d)
  return img
}

function buildSpriteSheet(teamCode: string): HTMLCanvasElement {
  const kit = TEAM_KIT[teamCode] ?? ['#888888','#FFFFFF','#FF6B00','solid']
  const [primary, secondary, gkHex, pattern] = kit
  const sheet = document.createElement('canvas')
  sheet.width = 792; sheet.height = 728
  const sctx = sheet.getContext('2d')!
  sctx.imageSmoothingEnabled = false
  for (let row = 0; row < 7; row++) {
    const isGK = row === 0
    const skinRgb = SKINS[row % SKINS.length]
    const hairRgb = HAIRS[row % HAIRS.length]
    const kitRgb  = hexRgb(isGK ? gkHex : primary)
    const secRgb  = hexRgb(isGK ? gkHex : secondary)
    const pat     = isGK ? 'solid' : (pattern || 'solid')
    for (let col = 0; col < 11; col++) {
      const animId = GAME_ANIM_ORDER[col]
      const anim   = GAME_ANIMS[animId]
      const fi     = Math.min(GAME_FRAME_PICK[animId] || 0, anim.frames.length - 1)
      const img    = renderSpriteFrame(anim.frames[fi], kitRgb, secRgb, skinRgb, hairRgb, isGK, pat)
      const tmp    = document.createElement('canvas')
      tmp.width = 16; tmp.height = 24
      tmp.getContext('2d')!.putImageData(img, 0, 0)
      sctx.drawImage(tmp, col * 72, row * 104, 64, 96)
    }
  }
  return sheet
}

// ─── Ball canvas builder ───────────────────────────────────────────────────────
function buildBallCanvas(): HTMLCanvasElement {
  const BW = 16, BH = 16, SCALE_B = 4
  const imgData = new ImageData(BW, BH)
  const d = imgData.data
  const cx = BW/2, cy = BH/2, R_outer = 7.4, R_inner = 5.8, TWIST = 42, SEAM = 14
  const RED: RGB=[212,48,48], BLUE: RGB=[40,86,160], GREEN: RGB=[53,144,77], WHITE: RGB=[255,255,255], BLACK: RGB=[17,17,17]
  const PANELS = [{c:RED,s:120,e:240},{c:BLUE,s:240,e:360},{c:GREEN,s:0,e:120}]
  for (let y = 0; y < BH; y++) for (let x = 0; x < BW; x++) {
    const dx=x-cx+.5, dy=y-cy+.5, dist=Math.sqrt(dx*dx+dy*dy)
    if (dist > R_outer) continue
    if (dist >= R_inner) { const i=(y*BW+x)*4; d[i]=BLACK[0];d[i+1]=BLACK[1];d[i+2]=BLACK[2];d[i+3]=255; continue }
    let ang = Math.atan2(dy,dx)*180/Math.PI; if (ang < 0) ang += 360
    const twist = (1-dist/R_inner)*TWIST, ta = (ang+twist+360)%360
    let inSeam = false
    for (const b of [0,120,240]) { const diff=Math.min(Math.abs(ta-b),360-Math.abs(ta-b)); if (diff<SEAM) { inSeam=true; break } }
    const i = (y*BW+x)*4
    if (inSeam) { d[i]=255;d[i+1]=255;d[i+2]=255;d[i+3]=255; continue }
    let col: RGB = WHITE
    for (const p of PANELS) if (ta >= p.s && ta < p.e) { col = p.c; break }
    d[i]=col[0]; d[i+1]=col[1]; d[i+2]=col[2]; d[i+3]=255
  }
  const tmp = document.createElement('canvas'); tmp.width=BW; tmp.height=BH
  tmp.getContext('2d')!.putImageData(imgData, 0, 0)
  const c = document.createElement('canvas'); c.width=BW*SCALE_B; c.height=BH*SCALE_B
  const cx2 = c.getContext('2d')!; cx2.imageSmoothingEnabled = false
  cx2.drawImage(tmp, 0, 0, BW*SCALE_B, BH*SCALE_B)
  return c
}

// ─── Nation lookup ─────────────────────────────────────────────────────────────
function nationOf(code: string): Nation {
  return FIFA_2026_NATIONS.find(n => n.code === code) ?? FIFA_2026_NATIONS[0]
}

// ─── Player type ───────────────────────────────────────────────────────────────
interface GamePlayer {
  id: string; role: string; team: 'home'|'away'
  wx: number; wy: number; vx: number; vy: number
  baseWx: number; baseWy: number
  hasBall: boolean; animState: string; animTimer: number
  aiTimer: number; sprintTimer: number
  _facingLeft: boolean; _facingDx?: number; _facingDy?: number
  gkHoldFrames?: number; _gkHolding?: boolean; _reflexDelay?: number
}
interface BallState {
  wx: number; wy: number; vx: number; vy: number
  h: number; vh: number
  isLoose: boolean; lastTouched: string|null; angle: number
}
interface PitchCorners {
  TL:[number,number]; TR:[number,number]; BL:[number,number]; BR:[number,number]
  hudH:number; PW:number; PH:number
}

// ─── React component ───────────────────────────────────────────────────────────
export default function InGameScreen({ session, updateSession, onNavigate }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!

    // Resize canvas to fill container
    function resize() {
      canvas.width  = canvas.offsetWidth  || window.innerWidth
      canvas.height = canvas.offsetHeight || window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // Build asset caches
    const spriteCache: Record<string, HTMLCanvasElement> = {}
    function getSprite(code: string): HTMLCanvasElement {
      if (!spriteCache[code]) spriteCache[code] = buildSpriteSheet(code)
      return spriteCache[code]
    }
    const ballCanvas = buildBallCanvas()

    // Pitch canvas — built using the full pitchRenderer (1024×480, smooth scaling)
    const pitchEl = document.createElement('canvas')
    renderPitch(pitchEl)

    // Pitch corners — pitch fills full canvas, HUD is an overlay
    // Y-proportions match pitchRenderer.ts logical space (512×240): TL.y=56/240, BL.y=223/240
    let _pc: PitchCorners | null = null
    function recomputePitchCorners() {
      const hudH  = 0
      const PW    = canvas.width
      const PH    = canvas.height
      _pc = {
        TL: [PW*(108/512), PH*(56/240)],
        TR: [PW*(404/512), PH*(56/240)],
        BL: [PW*( 16/512), PH*(223/240)],
        BR: [PW*(496/512), PH*(223/240)],
        hudH, PW, PH,
      }
    }
    function worldToScreen(wx: number, wy: number) {
      if (!_pc) recomputePitchCorners()
      const pc = _pc!
      const px = wx/100, py = wy/65
      return {
        x: pc.TL[0] + (pc.TR[0]-pc.TL[0])*px + (pc.BL[0]-pc.TL[0])*py + (pc.BR[0]-pc.TR[0]-pc.BL[0]+pc.TL[0])*px*py,
        y: pc.TL[1] + (pc.BL[1]-pc.TL[1])*py,
      }
    }

    // SCALE for touch/font sizing
    function getScale() { return Math.min(canvas.width/420, canvas.height/280) }

    // ─── Game state ──────────────────────────────────────────────────────────
    const diffMap: Record<number, string> = {1:'diff_amateur', 2:'diff_world_class', 3:'diff_legendary'}
    let difficulty = diffMap[session.difficulty] ?? 'diff_world_class'
    let matchTimer: number = session.halfDuration
    let half       = session.half
    let score      = [session.homeScore, session.awayScore] as [number,number]
    let timerRunning = false
    let deadBall: string|null = 'kickoff'
    let kickOffTeam = 'home'
    let awayAttacksRight = false
    let deadBallTimer = 0
    let walkOnTimer = 0
    let walkOnDone  = false
    let pauseOpen   = false
    let goalFlash   = 0
    let goalFlashTeam = -1
    let statsShots  = [0, 0]
    let possession  = [0, 0]
    let animTick    = 0
    let players: GamePlayer[] = []
    let controlledId = 'home_cm'

    const ball: BallState = { wx:50, wy:32, vx:0, vy:0, h:0, vh:0, isLoose:true, lastTouched:null, angle:0 }

    // ─── Formation helpers ───────────────────────────────────────────────────
    function homeFormation() {
      return [
        {id:'home_gk',role:'gk',wx:4, wy:32},
        {id:'home_lb',role:'lb',wx:30,wy:13},
        {id:'home_rb',role:'rb',wx:30,wy:52},
        {id:'home_lm',role:'lm',wx:44,wy:18},
        {id:'home_cm',role:'cm',wx:44,wy:32},
        {id:'home_rm',role:'rm',wx:44,wy:47},
        {id:'home_cf',role:'cf',wx:54,wy:32},
      ]
    }
    function awayFormation() {
      return [
        {id:'away_gk',role:'gk',wx:96,wy:32},
        {id:'away_lb',role:'lb',wx:72,wy:14},
        {id:'away_rb',role:'rb',wx:72,wy:51},
        {id:'away_lm',role:'lm',wx:65,wy:20},
        {id:'away_cm',role:'cm',wx:65,wy:32},
        {id:'away_rm',role:'rm',wx:65,wy:46},
        {id:'away_cf',role:'cf',wx:60,wy:32},
      ]
    }
    function initPlayers() {
      const dp = DIFF_PARAMS[difficulty]
      players = [
        ...homeFormation().map(p => ({
          ...p, team:'home' as const, vx:0, vy:0, hasBall:false,
          animState:'idle', animTimer:0, isControlled:false,
          baseWx:p.wx, baseWy:p.wy, aiTimer:0, sprintTimer:0, _facingLeft:false,
        })),
        ...awayFormation().map(p => ({
          ...p, team:'away' as const, vx:0, vy:0, hasBall:false,
          animState:'idle', animTimer:0, isControlled:false,
          baseWx:p.wx, baseWy:p.wy, aiTimer:dp.reaction+Math.random()*200,
          sprintTimer:0, _facingLeft:true,
        })),
      ]
      const homeCF = getPlayer('home_cf')
      if (homeCF) (homeCF as any)._kickoffFacingLeft = true
      controlledId = 'home_cf'
    }
    function getPlayer(id: string) { return players.find(p => p.id === id) }
    function resetBall() {
      ball.wx=50; ball.wy=32; ball.vx=0; ball.vy=0; ball.h=0; ball.vh=0; ball.isLoose=true; ball.lastTouched=null
    }
    function swapHalves() {
      for (const p of players) { p.wx=100-p.baseWx; p.wy=p.baseWy; p.baseWx=p.wx }
    }
    function dist2(x1:number,y1:number,x2:number,y2:number) { return Math.hypot(x1-x2,y1-y2) }

    // ─── Start match ─────────────────────────────────────────────────────────
    function startGame() {
      initPlayers()
      resetBall()
      if (half === 2) {
        swapHalves()
        awayAttacksRight = true
        kickOffTeam = 'away'
        // Second half: away kicks off attacking right — set full kickoff formation
        const h2ko: Record<string,{wx:number,wy:number}> = {
          away_lb:{wx:30,wy:13}, away_rb:{wx:30,wy:52},
          away_lm:{wx:44,wy:18}, away_cm:{wx:44,wy:32}, away_rm:{wx:44,wy:47},
          away_cf:{wx:54,wy:32},
          home_lb:{wx:72,wy:14}, home_rb:{wx:72,wy:51},
          home_lm:{wx:65,wy:20}, home_cm:{wx:65,wy:32}, home_rm:{wx:65,wy:46},
          home_cf:{wx:60,wy:32},
        }
        for (const [id, pos] of Object.entries(h2ko)) {
          const p=getPlayer(id); if(p){p.wx=pos.wx;p.wy=pos.wy;p.baseWx=pos.wx;p.baseWy=pos.wy}
        }
        const awayCF=getPlayer('away_cf'); if(awayCF)(awayCF as any)._kickoffFacingLeft=true
        deadBall = 'kickoff'; timerRunning = false
        walkOnDone = true
        for (const p of players) { p.hasBall=false; p.vx=0; p.vy=0; p.aiTimer=600 }
        // Home player nearest to ball controls for the player
        const homeOutH2=players.filter(p=>p.team==='home'&&p.role!=='gk')
        controlledId=homeOutH2.reduce((a,b)=>dist2(a.wx,a.wy,50,32)<dist2(b.wx,b.wy,50,32)?a:b).id
      } else {
        awayAttacksRight = false
        kickOffTeam = 'home'
        deadBall = 'kickoff'; timerRunning = false
        walkOnTimer = 0; walkOnDone = false
        controlledId = 'home_cf'
        const h1CF=getPlayer('home_cf'); if(h1CF)(h1CF as any)._kickoffFacingLeft=true
        for (const p of players) {
          if (p.team==='home') p.wx = -10
          else p.wx = 110
        }
      }
    }
    startGame()

    // ─── Ball physics ─────────────────────────────────────────────────────────
    function kickBallToward(player: GamePlayer, tx:number, ty:number, speed:number) {
      const dx=tx-ball.wx, dy=ty-ball.wy, d=Math.hypot(dx,dy)||1
      ball.vx=dx/d*speed; ball.vy=dy/d*speed
      ball.isLoose=true; player.hasBall=false; ball.lastTouched=player.id
    }
    function goalKickSetup(team: string) {
      deadBall='goal_kick'
      const gk = getPlayer(team==='home'?'home_gk':'away_gk')
      const homeGoalX = awayAttacksRight ? 3 : 97
      const awayGoalX = awayAttacksRight ? 97 : 3
      const gkX = team==='home' ? homeGoalX : awayGoalX
      ball.wx=gkX; ball.wy=32
      if (gk) { gk.wx=gkX; gk.wy=32 }
      deadBallTimer=1500
      ball.vx=0; ball.vy=0; ball.isLoose=true; timerRunning=false
    }
    function throwInSetup(team: string, ex:number, ey:number) {
      deadBall='throw_in'
      ball.wx=ex; ball.wy=Math.max(0,Math.min(65,ey))
      ball.vx=0; ball.vy=0; ball.isLoose=true; timerRunning=false
      if (team==='home') {
        const np = players.filter(p=>p.team==='home'&&p.role!=='gk')
          .reduce((a,b)=>dist2(ex,ball.wy,a.wx,a.wy)<dist2(ex,ball.wy,b.wx,b.wy)?a:b)
        np.wx=ball.wx; np.wy=ball.wy
        np.animState='throwin'; np.animTimer=99999
        controlledId=np.id; deadBallTimer=0
      } else {
        const np = players.filter(p=>p.team==='away'&&p.role!=='gk')
          .reduce((a,b)=>dist2(ex,ball.wy,a.wx,a.wy)<dist2(ex,ball.wy,b.wx,b.wy)?a:b)
        if (np) { np.animState='throwin'; np.animTimer=99999 }
        deadBallTimer=1000
      }
    }
    function registerGoal(team: number) {
      deadBall='goal'; deadBallTimer=2500; timerRunning=false
      goalFlash=2500; goalFlashTeam=team
      score[team]++
      ball.vx=0; ball.vy=0
      kickOffTeam = team===0 ? 'away' : 'home'
      const scoringTeam  = team===0 ? 'home' : 'away'
      const concedingTeam= team===0 ? 'away' : 'home'
      for (const p of players) {
        if (p.team===scoringTeam)  { p.animState='celebrate'; p.animTimer=2400 }
        else if (p.team===concedingTeam) { p.animState='taunt'; p.animTimer=800 }
      }
    }

    function updateBall(dt: number) {
      if (!ball.isLoose) return
      ball.wx += ball.vx; ball.wy += ball.vy
      const spd = Math.hypot(ball.vx, ball.vy)
      if (spd > 0.01) ball.angle += spd * 0.08
      ball.vx *= 0.96; ball.vy *= 0.96
      if (Math.abs(ball.vx) < 0.05) ball.vx=0
      if (Math.abs(ball.vy) < 0.05) ball.vy=0
      if (ball.h > 0 || ball.vh !== 0) {
        ball.h += ball.vh; ball.vh -= 0.05
        if (ball.h <= 0) { ball.h=0; ball.vh=-(ball.vh*0.4); if(Math.abs(ball.vh)<0.1) ball.vh=0 }
      }
      if (ball.wy < 0) {
        ball.wy=0; ball.vy*=-0.6
        if (deadBall===null) throwInSetup(ball.lastTouched?.startsWith('home')?'away':'home', ball.wx, 0)
      }
      if (ball.wy > 65) {
        ball.wy=65; ball.vy*=-0.6
        if (deadBall===null) throwInSetup(ball.lastTouched?.startsWith('home')?'away':'home', ball.wx, 65)
      }
      if (deadBall===null) {
        if (ball.wx < 0) {
          if (ball.wy>=GOAL_Y_MIN && ball.wy<=GOAL_Y_MAX) registerGoal(awayAttacksRight?0:1)
          else goalKickSetup(awayAttacksRight?'away':'home')
        }
        if (ball.wx > 100) {
          if (ball.wy>=GOAL_Y_MIN && ball.wy<=GOAL_Y_MAX) registerGoal(awayAttacksRight?1:0)
          else goalKickSetup(awayAttacksRight?'home':'away')
        }
      }
    }

    // ─── Player AI helpers ────────────────────────────────────────────────────
    const MARK_ROLE_MAP: Record<string,string> = { cf:'cf', lm:'lm', rm:'rm', cm:'cm', lb:'rb', rb:'lb' }
    function getManMark(homePlayer: GamePlayer): GamePlayer|null {
      const away = players.filter(q=>q.team==='away'&&q.role!=='gk')
      if (!away.length) return null
      const mirrorRole = MARK_ROLE_MAP[homePlayer.role]
      if (mirrorRole) { const rm = away.find(q=>q.role===mirrorRole); if (rm) return rm }
      return away.reduce((best,c) => {
        const dB=Math.abs(best.wy-homePlayer.wy)+Math.abs(best.wx-homePlayer.wx)*0.3
        const dC=Math.abs(c.wy-homePlayer.wy)+Math.abs(c.wx-homePlayer.wx)*0.3
        return dC<dB?c:best
      })
    }
    function homeAIWithBall(p: GamePlayer) {
      const candidates = players.filter(q=>q.team==='home'&&q.id!==p.id&&q.role!=='gk')
      let best: GamePlayer|null=null, bestScore=-Infinity
      for (const c of candidates) {
        const forward = awayAttacksRight ? (p.wx-c.wx) : (c.wx-p.wx)
        const isMarked = players.some(q=>q.team==='away'&&dist2(q.wx,q.wy,c.wx,c.wy)<5)
        const prox = dist2(p.wx,p.wy,c.wx,c.wy)
        const s = forward*0.8+(isMarked?-10:6)-prox*0.03
        if (s>bestScore) { bestScore=s; best=c }
      }
      if (best) { kickBallToward(p,best.wx,best.wy,1.2); p.hasBall=false; ball.isLoose=true; p.animState='kick'; p.animTimer=320 }
    }
    function homeSupportRun(p: GamePlayer, spd: number) {
      const bx=ball.wx; const homeAttacksRight=!awayAttacksRight
      let tx=0, ty=0
      if (homeAttacksRight) {
        switch(p.role) {
          case 'cf': tx=Math.min(88,bx+22);ty=32;break; case 'lm': tx=Math.min(82,bx+12);ty=20;break
          case 'cm': tx=Math.min(78,bx+8); ty=32;break; case 'rm': tx=Math.min(82,bx+12);ty=44;break
          case 'lb': tx=Math.min(70,bx+5); ty=18;break; case 'rb': tx=Math.min(70,bx+5); ty=46;break
          default: return
        }
        const awayXD=players.filter(q=>q.team==='away').map(q=>q.wx).sort((a,b)=>b-a)
        tx=Math.min(tx,(awayXD[1]??95)-0.5)
      } else {
        switch(p.role) {
          case 'cf': tx=Math.max(12,bx-22);ty=32;break; case 'lm': tx=Math.max(18,bx-12);ty=20;break
          case 'cm': tx=Math.max(22,bx-8); ty=32;break; case 'rm': tx=Math.max(18,bx-12);ty=44;break
          case 'lb': tx=Math.max(30,bx-5); ty=18;break; case 'rb': tx=Math.max(30,bx-5); ty=46;break
          default: return
        }
        const awayXA=players.filter(q=>q.team==='away').map(q=>q.wx).sort((a,b)=>a-b)
        tx=Math.max(tx,(awayXA[1]??5)+0.5)
      }
      const dx=tx-p.wx,dy=ty-p.wy,d=Math.hypot(dx,dy)||1
      if (d>2) { p.vx=dx/d*spd; p.vy=dy/d*spd } else { p.vx*=0.7; p.vy*=0.7 }
    }
    // Bug 2: world units — players must stay within this of their base position unless pressing
    const MAX_MARK_FOLLOW = 14  // ~100px: max distance from base to chase mark
    const MAX_SHAPE_DIST  = 8   // ~56px: non-pressers return to shape beyond this
    function homePlayerAI(p: GamePlayer) {
      if (p.role==='gk'||deadBall!==null) { p.vx*=0.75; p.vy*=0.75; if(Math.abs(p.vx)<0.002)p.vx=0; if(Math.abs(p.vy)<0.002)p.vy=0; return }
      if (p.hasBall) { homeAIWithBall(p); return }
      const SPD=0.075, SPD_PRESS=0.155
      const awayCarrier=players.find(q=>q.team==='away'&&q.hasBall)
      const homeCarrier=players.find(q=>q.team==='home'&&q.hasBall)
      if (awayCarrier) {
        // Bug 2: only 2 closest uncontrolled home players press
        const homeOut=players.filter(q=>q.team==='home'&&q.role!=='gk'&&q.id!==controlledId)
        if (!homeOut.length) return
        const sorted=[...homeOut].sort((a,b)=>dist2(a.wx,a.wy,ball.wx,ball.wy)-dist2(b.wx,b.wy,ball.wx,ball.wy))
        const presser=sorted[0], presser2=sorted[1]
        const isPresser=(p.id===presser?.id||p.id===presser2?.id)
        if (isPresser) {
          const dx=ball.wx-p.wx,dy=ball.wy-p.wy,d=Math.hypot(dx,dy)||1
          p.vx=dx/d*SPD_PRESS; p.vy=dy/d*SPD_PRESS
          if (d<1.8&&Math.random()<0.03) { awayCarrier.hasBall=false; ball.isLoose=true; ball.vx=(Math.random()-0.5)*0.6; ball.vy=(Math.random()-0.5)*0.6 }
        } else {
          // Bug 2: mark opponent but clamp to MAX_MARK_FOLLOW of base position
          const mark=getManMark(p)
          const distFromBase=dist2(p.wx,p.wy,p.baseWx,p.baseWy)
          if (mark && distFromBase < MAX_MARK_FOLLOW) {
            const homeGoalX = awayAttacksRight ? 96 : 3
            const gso = Math.min(4, Math.max(2, Math.abs(mark.wx - homeGoalX) * 0.08))
            const rawTx = homeGoalX < 50 ? mark.wx - gso : mark.wx + gso
            const rawTy = mark.wy
            // clamp mark target to MAX_MARK_FOLLOW radius around base
            const mdx=rawTx-p.baseWx, mdy=rawTy-p.baseWy, md=Math.hypot(mdx,mdy)||1
            const clamp=Math.min(1, MAX_MARK_FOLLOW/md)
            const tx=p.baseWx+mdx*clamp, ty=p.baseWy+mdy*clamp
            const dx=tx-p.wx,dy=ty-p.wy,d=Math.hypot(dx,dy)||1
            const mspd=d>4?SPD_PRESS:SPD
            if (d>1.0) { p.vx=dx/d*mspd; p.vy=dy/d*mspd } else { p.vx*=0.5; p.vy*=0.5 }
          } else {
            // Bug 2: return to shape — must stay within MAX_SHAPE_DIST of base
            const dx=p.baseWx-p.wx,dy=p.baseWy-p.wy,d=Math.hypot(dx,dy)||1
            if (d>MAX_SHAPE_DIST*0.5){p.vx=dx/d*SPD;p.vy=dy/d*SPD}else{p.vx*=0.7;p.vy*=0.7}
          }
        }
      } else if (homeCarrier) { homeSupportRun(p, SPD) }
      else if (ball.isLoose) {
        const homeOut=players.filter(q=>q.team==='home'&&q.role!=='gk')
        if (!homeOut.length) return
        const nearest=homeOut.reduce((a,b)=>dist2(a.wx,a.wy,ball.wx,ball.wy)<=dist2(b.wx,b.wy,ball.wx,ball.wy)?a:b)
        if (p.id===nearest.id) { const dx=ball.wx-p.wx,dy=ball.wy-p.wy,d=Math.hypot(dx,dy)||1; p.vx=dx/d*SPD_PRESS; p.vy=dy/d*SPD_PRESS }
        else { const dx=p.baseWx-p.wx,dy=p.baseWy-p.wy,d=Math.hypot(dx,dy)||1; if(d>2){p.vx=dx/d*SPD;p.vy=dy/d*SPD}else{p.vx*=0.7;p.vy*=0.7} }
      } else {
        // Bug 2: enforce shape — glide back to base if too far
        const dx=p.baseWx-p.wx,dy=p.baseWy-p.wy,d=Math.hypot(dx,dy)||1
        if (d>MAX_SHAPE_DIST){p.vx=dx/d*SPD;p.vy=dy/d*SPD}
        else if (d>2){p.vx=dx/d*SPD*0.6;p.vy=dy/d*SPD*0.6}else{p.vx*=0.8;p.vy*=0.8}
      }
    }

    // ─── Away AI ──────────────────────────────────────────────────────────────
    function bestPassTarget(p: GamePlayer): GamePlayer|null {
      const candidates=players.filter(q=>q.team==='away'&&q.id!==p.id&&q.role!=='gk')
      if (!candidates.length) return null
      let best: GamePlayer|null=null, bestScore=-Infinity
      const pa=p as any
      for (const c of candidates) {
        const forward=awayAttacksRight?(c.wx-p.wx):(p.wx-c.wx)
        const marked=players.some(h=>h.team==='home'&&dist2(h.wx,h.wy,c.wx,c.wy)<3.5)
        const proximity=dist2(p.wx,p.wy,c.wx,c.wy)
        const returnPenalty=(pa._lastPasser===c.id&&(pa._lastPasserTimer??0)>0)?-20:0
        const s=forward*0.6+(marked?-8:4)-proximity*0.08+returnPenalty
        if (s>bestScore){bestScore=s;best=c}
      }
      return best
    }
    function aiDecideWithBall(p: GamePlayer, dp: typeof DIFF_PARAMS[string], spd: number) {
      const awayGoalX=awayAttacksRight?97:3
      const inShootRange=awayAttacksRight?(p.wx>52):(p.wx<48)
      const distToGoal=Math.hypot(p.wx-awayGoalX,p.wy-32)
      const shootScore=inShootRange?dp.shootAcc*(1-distToGoal/65)*2.2:0
      const passTgt=bestPassTarget(p)
      const passForward=awayAttacksRight?(passTgt?.wx??0)>p.wx:(passTgt?.wx??100)<p.wx
      const passScore=passTgt?dp.passAcc*(passForward?1.3:0.7):0
      const dribbleScore=dp.dribble*0.35
      if (shootScore>=passScore&&shootScore>=dribbleScore&&inShootRange) {
        statsShots[1]++
        const noise=(1-dp.shootAcc)*6
        kickBallToward(p,awayGoalX,32+(Math.random()-0.5)*noise,1.5+Math.random()*0.5)
        p.hasBall=false;ball.isLoose=true;p.animState='kick';p.animTimer=380
      } else if (passTgt&&passScore>=dribbleScore) {
        const noise=(1-dp.passAcc)*2.5
        kickBallToward(p,passTgt.wx+(Math.random()-0.5)*noise,passTgt.wy+(Math.random()-0.5)*noise,1.25)
        ;(passTgt as any)._lastPasser=p.id;(passTgt as any)._lastPasserTimer=2000
        p.hasBall=false;ball.isLoose=true;p.animState='kick';p.animTimer=320
      } else {
        p.vx=awayAttacksRight?spd*0.75:-spd*0.75; p.vy=(32-p.wy)*0.025
      }
    }
    function aiCover(p: GamePlayer, spd: number) {
      const tx=Math.min(p.baseWx,ball.wx+14), ty=p.baseWy+(ball.wy-32)*0.25
      const dx=tx-p.wx,dy=ty-p.wy,d=Math.hypot(dx,dy)||1
      if (d>1.5){p.vx=dx/d*spd;p.vy=dy/d*spd}else{p.vx=0;p.vy=0}
    }
    function moveToSupportPosition(p: GamePlayer, spd: number) {
      const bx=ball.wx; let tx=0, ty=0
      if (awayAttacksRight) {
        switch(p.role) {
          case 'cf': tx=Math.max(70,bx+20);ty=32;break; case 'lm': tx=Math.max(58,bx+12);ty=19;break
          case 'rm': tx=Math.max(58,bx+12);ty=45;break; case 'cm': tx=Math.max(50,bx+5); ty=32;break
          case 'lb': tx=Math.max(38,bx-6); ty=22;break; case 'rb': tx=Math.max(38,bx-6); ty=42;break
          default: return
        }
      } else {
        switch(p.role) {
          case 'cf': tx=Math.min(30,bx-20);ty=32;break; case 'lm': tx=Math.min(42,bx-12);ty=19;break
          case 'rm': tx=Math.min(42,bx-12);ty=45;break; case 'cm': tx=Math.min(50,bx-5); ty=32;break
          case 'lb': tx=Math.min(62,bx+6); ty=22;break; case 'rb': tx=Math.min(62,bx+6); ty=42;break
          default: return
        }
      }
      tx=Math.max(5,Math.min(95,tx)); ty=Math.max(4,Math.min(61,ty))
      const dx=tx-p.wx,dy=ty-p.wy,d=Math.hypot(dx,dy)||1
      if (d>1.5){p.vx=dx/d*spd;p.vy=dy/d*spd}else{p.vx*=0.7;p.vy*=0.7}
    }
    function moveToGkBuildUp(p: GamePlayer, spd: number) {
      let tx=0, ty=0
      switch(p.role) {
        case 'rb': tx=82;ty=14;break; case 'lb': tx=82;ty=50;break; case 'rm': tx=72;ty=18;break
        case 'lm': tx=72;ty=46;break; case 'cm': tx=70;ty=32;break; case 'cf': tx=60;ty=32;break
        default: return
      }
      if (awayAttacksRight) tx=100-tx
      const dx=tx-p.wx,dy=ty-p.wy,d=Math.hypot(dx,dy)||1
      if (d>1.5){p.vx=dx/d*spd;p.vy=dy/d*spd}else{p.vx=0;p.vy=0}
    }
    function moveToTactical(p: GamePlayer, _attacking: boolean, spd: number) {
      const bx=ball.wx; let tx=0, ty=0
      switch(p.role) {
        case 'lb': tx=Math.min(86,bx+26);ty=46;break; case 'rb': tx=Math.min(86,bx+26);ty=18;break
        case 'lm': tx=Math.min(75,bx+17);ty=42;break; case 'cm': tx=Math.min(72,bx+13);ty=32;break
        case 'rm': tx=Math.min(75,bx+17);ty=22;break; case 'cf': tx=Math.min(65,bx+7); ty=32;break
        default: return
      }
      if (awayAttacksRight) { tx=100-tx; tx=Math.min(62,tx) } else { tx=Math.max(38,tx) }
      ty=Math.max(4,Math.min(61,ty))
      const dx=tx-p.wx,dy=ty-p.wy,d=Math.hypot(dx,dy)||1
      if (d>1.5){p.vx=dx/d*spd;p.vy=dy/d*spd}else{p.vx=0;p.vy=0}
    }
    const GK_MAX_HOLD_MS = 1500  // Bug 1: GK can hold ball at most 1.5s before forced pass
    function gkPassOut(p: GamePlayer) {
      const candidates=players.filter(q=>q.team==='away'&&q.role!=='gk')
      let target: GamePlayer|null=null, bestScore=-Infinity
      for (const c of candidates) {
        const marked=players.some(h=>h.team==='home'&&dist2(h.wx,h.wy,c.wx,c.wy)<5)
        const prox=dist2(p.wx,p.wy,c.wx,c.wy)
        const safe=awayAttacksRight?(c.wx<75):(c.wx>25)
        const s=(marked?-25:10)-prox*0.4+(safe?8:0)
        if (s>bestScore){bestScore=s;target=c}
      }
      if (target) {
        kickBallToward(p, target.wx, target.wy, 1.3)
      } else {
        const midX = awayAttacksRight ? 70 : 30
        kickBallToward(p, midX, 32 + (Math.random()-0.5)*10, 1.8)
      }
      p.hasBall=false; ball.isLoose=true; p.animState='kick'; p.animTimer=400
      p.gkHoldFrames=0; p._gkHolding=false; (p as any)._gkState='distributing'
    }
    function aiGoalkeeper(p: GamePlayer, dp: typeof DIFF_PARAMS[string], dt: number) {
      const gkX=awayAttacksRight?4:96, gkXMin=awayAttacksRight?3:95, gkXMax=awayAttacksRight?5:97
      const pa=p as any
      // Bug 1: stay still after pass until kick anim finishes; prevents re-entry into save state
      if (pa._gkState==='distributing') {
        p.vx=0; p.vy=0; p.wx=Math.max(gkXMin,Math.min(gkXMax,p.wx))
        if (p.animTimer<=0) pa._gkState=undefined
        return
      }
      if (p.hasBall) {
        p.vx=0; p.vy=0; p.wx=Math.max(gkXMin,Math.min(gkXMax,p.wx))
        p._gkHolding=true
        // Bug 1: track hold time in ms, force pass after GK_MAX_HOLD_MS
        p.gkHoldFrames=(p.gkHoldFrames||0)+dt
        if ((p.gkHoldFrames||0) >= GK_MAX_HOLD_MS) { gkPassOut(p); return }
        // Play save anim for first 600ms, then idle
        p.animState=(p.gkHoldFrames||0)<600 ? 'save' : 'idle'
        return
      }
      // Bug 1: reset hold counters only — don't touch animState here to avoid oscillation
      if (p.gkHoldFrames) { p.gkHoldFrames=0; p._gkHolding=false }
      p.wx=Math.max(gkXMin,Math.min(gkXMax,p.wx))
      const shotIncoming=awayAttacksRight?(ball.vx<-0.3&&ball.wx<35):(ball.vx>0.3&&ball.wx>65)
      if (shotIncoming) {
        if (p._reflexDelay===undefined) p._reflexDelay=dp.gkReflex
        if ((p._reflexDelay||0)>0) { p._reflexDelay=(p._reflexDelay||0)-dt; const tgtY=Math.max(GOAL_Y_MIN,Math.min(GOAL_Y_MAX,ball.wy)); p.vy=(tgtY-p.wy)*0.02; return }
        const timeToGoal=awayAttacksRight?(ball.wx-gkX)/(-ball.vx||0.01):(gkX-ball.wx)/(ball.vx||0.01)
        const predY=ball.wy+ball.vy*timeToGoal
        const targetY=Math.max(GOAL_Y_MIN-1,Math.min(GOAL_Y_MAX+1,predY))
        const dy=targetY-p.wy
        if (Math.abs(dy)>2&&p.animTimer<=0) { p.animState='save'; p.animTimer=900 }
        p.vy=Math.sign(dy)*Math.min(0.22,Math.abs(dy)*0.15)
        // Bug 1: transfer ball ownership to GK on save
        if (dist2(p.wx,p.wy,ball.wx,ball.wy)<2.8&&ball.isLoose) {
          ball.isLoose=false; p.hasBall=true; ball.lastTouched=p.id
          for (const q of players) if (q.id!==p.id) q.hasBall=false
          p.gkHoldFrames=0
        }
      } else {
        p._reflexDelay=undefined
        const tgtY=Math.max(GOAL_Y_MIN,Math.min(GOAL_Y_MAX,ball.wy))
        p.vy=(tgtY-p.wy)*0.06; p.vx=0
        if (ball.isLoose&&dist2(p.wx,p.wy,ball.wx,ball.wy)<2.0) {
          ball.isLoose=false; p.hasBall=true; ball.lastTouched=p.id
          for (const q of players) if (q.id!==p.id) q.hasBall=false
          p.gkHoldFrames=0
        }
      }
    }
    function updateAI(dt: number) {
      const dp=DIFF_PARAMS[difficulty]
      const SPD_RUN=0.12, SPD_WALK=0.065
      const SPD_PRESS=difficulty==='diff_amateur'?0.175:difficulty==='diff_world_class'?0.195:0.22
      const awayHasBall=players.some(p=>p.team==='away'&&p.hasBall)
      const gk=getPlayer('away_gk'); if (gk) aiGoalkeeper(gk,dp,dt)
      const outfield=players.filter(p=>p.team==='away'&&p.role!=='gk')
      const byDist=[...outfield].sort((a,b)=>dist2(a.wx,a.wy,ball.wx,ball.wy)-dist2(b.wx,b.wy,ball.wx,ball.wy))
      const presserId=byDist[0]?.id, presser2Id=byDist[1]?.id, coverId=byDist[2]?.id
      // AI kickoff
      if (deadBall==='kickoff'&&kickOffTeam==='away') {
        for (const p of outfield) {
          if (p.hasBall) { p.aiTimer=0; aiDecideWithBall(p,dp,SPD_RUN); continue }
          if (p.role!=='cf') { moveToTactical(p,false,SPD_WALK); continue }
          p.aiTimer-=dt; if (p.aiTimer>0) continue
          const d=dist2(p.wx,p.wy,ball.wx,ball.wy)
          if (p.hasBall||d<3.0) {
            const candidates=outfield.filter(q=>q.role!=='cf')
            // backward = toward away's own goal (opposite of attack direction)
            const backward=candidates.filter(c=>awayAttacksRight?c.wx<p.wx:c.wx>p.wx)
            const pool=backward.length?backward:candidates
            const tgt=pool.reduce((best,c)=>dist2(p.wx,p.wy,c.wx,c.wy)<dist2(p.wx,p.wy,best.wx,best.wy)?c:best,pool[0])
            if (tgt) {
              kickBallToward(p,tgt.wx,tgt.wy,1.1)
              ;(tgt as any)._lastPasser=p.id;(tgt as any)._lastPasserTimer=2500
            }
            ;(p as any)._kickoffFacingLeft=undefined
            p.hasBall=false; ball.isLoose=true; p.animState='kick'; p.animTimer=380
            deadBall=null; timerRunning=true
          } else {
            const dx=ball.wx-p.wx,dy=ball.wy-p.wy,dl=Math.hypot(dx,dy)||1
            p.vx=dx/dl*SPD_RUN; p.vy=dy/dl*SPD_RUN
          }
        }
        return
      }
      const gkHolding=gk?._gkHolding===true
      for (const p of outfield) {
        if ((p as any)._lastPasserTimer>0) (p as any)._lastPasserTimer-=dt
        if (deadBall!==null&&deadBall!=='throw_in') {
          if (gkHolding) moveToGkBuildUp(p,SPD_WALK); else moveToTactical(p,false,SPD_WALK)
          p.vx*=0.82; p.vy*=0.82; if(Math.abs(p.vx)<0.002)p.vx=0; if(Math.abs(p.vy)<0.002)p.vy=0; continue
        }
        if (deadBall==='throw_in') {
          p.aiTimer-=dt
          if (p.aiTimer<=0) {
            p.aiTimer=dp.reaction+Math.random()*80
            if (deadBallTimer<=0&&dist2(p.wx,p.wy,ball.wx,ball.wy)<4) {
              const tgt=bestPassTarget(p)
              if(tgt){kickBallToward(p,tgt.wx,tgt.wy,1.1);p.animState='kick';p.animTimer=320;deadBall=null;timerRunning=true}
            }
          }
          continue
        }
        const isPresser=(p.id===presserId||p.id===presser2Id)&&!awayHasBall
        if (isPresser) {
          const carrier=players.find(q=>q.team==='home'&&(q.hasBall||(ball.isLoose&&dist2(q.wx,q.wy,ball.wx,ball.wy)<5)))
          const tx=carrier?carrier.wx:ball.wx, ty=carrier?carrier.wy:ball.wy
          const dx=tx-p.wx,dy=ty-p.wy,dl=Math.hypot(dx,dy)||1
          const chaseSpd=ball.isLoose?SPD_RUN:p.id===presserId?SPD_PRESS:SPD_PRESS*0.88
          p.vx=dx/dl*chaseSpd; p.vy=dy/dl*chaseSpd; p.animState='run'
        }
        p.aiTimer-=dt; if(p.aiTimer>0&&!p.hasBall) continue
        p.aiTimer=dp.reaction+Math.random()*80
        if (p.hasBall) { aiDecideWithBall(p,dp,SPD_RUN); continue }
        if (awayHasBall) { moveToSupportPosition(p,SPD_WALK) }
        else if (ball.isLoose) { if(p.id!==presserId&&p.id!==presser2Id) moveToTactical(p,false,SPD_WALK) }
        else {
          if (p.id===coverId) aiCover(p,SPD_WALK)
          else if (p.id!==presserId&&p.id!==presser2Id) moveToTactical(p,false,SPD_WALK)
        }
      }
    }
    function aiTackleCheck() {
      if (deadBall!==null) return
      const carrier=players.find(q=>q.hasBall&&q.team==='home'); if(!carrier) return
      const stealRadius=difficulty==='diff_amateur'?4.8:difficulty==='diff_world_class'?5.2:5.8
      const perFrameChance=difficulty==='diff_amateur'?0.055:difficulty==='diff_world_class'?0.08:0.11
      for (const p of players.filter(q=>q.team==='away'&&q.role!=='gk')) {
        const d=dist2(p.wx,p.wy,carrier.wx,carrier.wy)
        if (d<stealRadius) {
          let dirMod=1.0
          const carrierSpd=Math.hypot(carrier.vx,carrier.vy)
          if (carrierSpd>0.02) {
            const toCX=carrier.wx-p.wx, toCY=carrier.wy-p.wy
            const toDist=Math.hypot(toCX,toCY)||1
            const dot=(carrier.vx*toCX+carrier.vy*toCY)/(carrierSpd*toDist)
            dirMod=dot>0?1.4:0.5
          }
          if (Math.random()<perFrameChance*dirMod) {
            p.animState='slide'; p.animTimer=480; carrier.hasBall=false; ball.isLoose=true
            const tackleDir=awayAttacksRight?1:-1
            ball.vx=(0.4+Math.random()*0.5)*tackleDir; ball.vy=(Math.random()-0.5)*0.8; return
          }
        }
      }
    }

    // ─── Player update ────────────────────────────────────────────────────────
    function updatePlayers(dt: number) {
      const spd_walk=0.06, spd_run=0.12
      for (const p of players) {
        if (p.team==='home') {
          const isCtrl=p.id===controlledId
          if (isCtrl&&deadBall!==null&&deadBall!=='throw_in') {
            p.vx*=0.75; p.vy*=0.75
            if(Math.abs(p.vx)<0.002)p.vx=0; if(Math.abs(p.vy)<0.002)p.vy=0
            p.animState=(Math.abs(p.vx)+Math.abs(p.vy)>0.01)?'walk':'idle'
          } else if (isCtrl&&deadBall===null) {
            let jx=0, jy=0
            const SCALE=getScale(), dead=8*SCALE
            if (joy.active&&(Math.abs(joy.dx)>dead||Math.abs(joy.dy)>dead)) {
              const maxR=40*SCALE; jx=joy.dx/maxR; jy=joy.dy/maxR
            } else {
              if(keys['ArrowLeft'])jx-=1; if(keys['ArrowRight'])jx+=1
              if(keys['ArrowUp'])jy-=1; if(keys['ArrowDown'])jy+=1
              const kl=Math.hypot(jx,jy)||1; if(jx||jy){jx/=kl;jy/=kl}
            }
            const mag=Math.hypot(jx,jy)
            if (mag>0.1) {
              const spd=mag>0.7?spd_run:spd_walk, dl=Math.hypot(jx,jy)||1
              p.vx=jx/dl*spd*mag; p.vy=jy/dl*spd*mag
              p.animState=(p.hasBall||mag>0.7)?'run':'walk'
            } else { p.vx*=0.7; p.vy*=0.7; if(Math.abs(p.vx)<0.001)p.vx=0; if(Math.abs(p.vy)<0.001)p.vy=0; p.animState='idle' }
            if (keys['KeyX']||(btnB.down&&!p.hasBall)) {
              if (p.sprintTimer>0) { const dx=ball.wx-p.wx,dy=ball.wy-p.wy,d=Math.hypot(dx,dy)||1; p.vx=dx/d*spd_run; p.vy=dy/d*spd_run }
            }
            if (p.sprintTimer>0) p.sprintTimer--
          } else if (!isCtrl) { homePlayerAI(p) }
        }
        p.wx+=p.vx; p.wy+=p.vy
        p.wx=Math.max(0,Math.min(100,p.wx)); p.wy=Math.max(0,Math.min(65,p.wy))
        if (Math.abs(p.vx)>0.005) p._facingLeft=p.vx<0
        const ACTION_ANIMS=new Set(['kick','slide','save','throwin','celebrate','taunt'])
        if (p.animTimer>0) {
          p.animTimer-=dt
          if (p.animTimer<=0) {
            p.animTimer=0
            const spd=Math.hypot(p.vx,p.vy)
            p.animState=spd>0.09?'run':spd>0.02?'walk':'idle'
          }
        } else if (!ACTION_ANIMS.has(p.animState)||p.animTimer<=0) {
          const isHC=(p.team==='home'&&p.id===controlledId)
          if (!isHC) { const spd=Math.hypot(p.vx,p.vy); p.animState=spd>0.09?'run':spd>0.02?'walk':'idle' }
        }
        if (!p.hasBall&&ball.isLoose) {
          const d=dist2(p.wx,p.wy,ball.wx,ball.wy)
          if (d<1.5) { ball.isLoose=false; p.hasBall=true; ball.lastTouched=p.id; for(const q of players) if(q.id!==p.id) q.hasBall=false }
        }
        if (p.hasBall) {
          const spd=Math.hypot(p.vx,p.vy)
          if (spd>0.015) { p._facingDx=p.vx; p._facingDy=p.vy }
          const fdx=p._facingDx??(p._facingLeft?-1:1), fdy=p._facingDy??0
          const fl=Math.hypot(fdx,fdy)||1
          ball.wx=p.wx+(fdx/fl)*1.0; ball.wy=p.wy+(fdy/fl)*0.6
          ball.vx=0; ball.vy=0
          if (p.team==='home') possession[0]++; else possession[1]++
          // Bug 1+2: auto-switch to whoever on home team picks up ball (includes GK)
          if (p.team==='home') controlledId=p.id
        }
      }
      if (deadBall===null) {
        const ctrl=getPlayer(controlledId)
        // Bug 2: include GK in candidate pool when GK has ball so control can switch to them
        const homePlayers=players.filter(p=>p.team==='home'&&(p.role!=='gk'||p.hasBall))
        if (homePlayers.length) {
          const nearest=homePlayers.reduce((a,b)=>dist2(a.wx,a.wy,ball.wx,ball.wy)<dist2(b.wx,b.wy,ball.wx,ball.wy)?a:b)
          const awayHasBall=players.some(p=>p.team==='away'&&p.hasBall)
          const switchThreshold=awayHasBall?10:15
          if (!ctrl||dist2(ctrl.wx,ctrl.wy,ball.wx,ball.wy)>switchThreshold) {
            if (!ctrl?.hasBall) controlledId=nearest.id
          }
        }
      }
    }

    // Bug 3: boundary margin + velocity reflection + stuck detection
    const PITCH_MARGIN = 1.5  // world units inset from edge
    const STUCK_DIST   = 0.6  // world units — less than this in 2s = stuck
    const STUCK_MS     = 2000
    function enforceBoundaries(dt: number) {
      for (const p of players) {
        // Hard clamp with margin
        const nx=Math.max(PITCH_MARGIN,Math.min(100-PITCH_MARGIN,p.wx))
        const ny=Math.max(PITCH_MARGIN,Math.min(65-PITCH_MARGIN,p.wy))
        if (nx!==p.wx||ny!==p.wy) {
          // Reflect velocity component pushing out of bounds
          if (p.wx<PITCH_MARGIN&&p.vx<0) p.vx*=-0.5
          if (p.wx>100-PITCH_MARGIN&&p.vx>0) p.vx*=-0.5
          if (p.wy<PITCH_MARGIN&&p.vy<0) p.vy*=-0.5
          if (p.wy>65-PITCH_MARGIN&&p.vy>0) p.vy*=-0.5
          p.wx=nx; p.wy=ny
        }
        // Stuck detection: only for AI (not controlled, not ball carrier)
        if (p.hasBall||p.id===controlledId) { (p as any)._stuckMs=0; (p as any)._stuckWx=p.wx; (p as any)._stuckWy=p.wy; continue }
        const pa = p as any
        // Bug 3: gate first check so undefined _stuckWx never triggers false positive teleport
        if (pa._stuckWx===undefined) { pa._stuckWx=p.wx; pa._stuckWy=p.wy; pa._stuckMs=0 }
        else {
          pa._stuckMs=(pa._stuckMs||0)+dt
          if (pa._stuckMs>=STUCK_MS) {
            const movedX=Math.abs(p.wx-pa._stuckWx), movedY=Math.abs(p.wy-pa._stuckWy)
            if (movedX+movedY < STUCK_DIST) {
              p.wx=Math.max(PITCH_MARGIN,Math.min(100-PITCH_MARGIN,p.baseWx))
              p.wy=Math.max(PITCH_MARGIN,Math.min(65-PITCH_MARGIN,p.baseWy))
              p.vx=0; p.vy=0
            }
            pa._stuckMs=0; pa._stuckWx=p.wx; pa._stuckWy=p.wy
          }
        }
      }
    }

    // Bug 3+4: push overlapping players apart by position only (never touch vx/vy so animState stays stable)
    function separatePlayers() {
      const MIN_SEP = 3.0  // world units (~21px at typical scale)
      for (let i = 0; i < players.length; i++) {
        for (let j = i+1; j < players.length; j++) {
          const a=players[i], b=players[j]
          const dx=b.wx-a.wx, dy=b.wy-a.wy
          const d=Math.hypot(dx,dy)
          if (d>0&&d<MIN_SEP) {
            const overlap=MIN_SEP-d, nx=dx/d, ny=dy/d
            if (a.hasBall) {
              b.wx=Math.max(0,Math.min(100,b.wx+nx*overlap))
              b.wy=Math.max(0,Math.min(65,b.wy+ny*overlap))
            } else if (b.hasBall) {
              a.wx=Math.max(0,Math.min(100,a.wx-nx*overlap))
              a.wy=Math.max(0,Math.min(65,a.wy-ny*overlap))
            } else {
              const half=overlap*0.5
              a.wx=Math.max(0,Math.min(100,a.wx-nx*half)); a.wy=Math.max(0,Math.min(65,a.wy-ny*half))
              b.wx=Math.max(0,Math.min(100,b.wx+nx*half)); b.wy=Math.max(0,Math.min(65,b.wy+ny*half))
            }
          }
        }
      }
    }

    function updateWalkOn(dt: number) {
      if (walkOnDone) return
      walkOnTimer+=dt
      const t=Math.min(1,walkOnTimer/3000)
      for (const p of players) {
        if (p.team==='home') p.wx=-10+(p.baseWx+10)*t
        else p.wx=110-(110-p.baseWx)*t
      }
      if (t>=1) walkOnDone=true
    }
    function updateTimer(dt: number) {
      if (!timerRunning) return
      matchTimer-=dt/1000
      if (matchTimer<=0) {
        matchTimer=0; timerRunning=false
        if (half===1) { deadBall='halftime'; deadBallTimer=4000 }
        else { deadBall='fulltime'; deadBallTimer=2000 }
      }
    }
    function updateDeadBall(dt: number) {
      if (deadBall===null) return
      deadBallTimer-=dt
      if (goalFlash>0) goalFlash-=dt
      if (deadBall==='goal'&&deadBallTimer<=0) {
        resetBall(); deadBall='kickoff'; walkOnDone=true
        for (const p of players) {
          p.wx=p.baseWx; p.wy=p.baseWy; p.hasBall=false; p.vx=0; p.vy=0
          p.animState='idle'; p.animTimer=0
          p.aiTimer=kickOffTeam==='away'?500:0
        }
        const kickingCF=getPlayer(kickOffTeam+'_cf')
        const nonKickTeam=kickOffTeam==='home'?'away':'home'
        const nonKickingCF=getPlayer(nonKickTeam+'_cf')
        const kickingAttacksRight=kickOffTeam==='home'?!awayAttacksRight:awayAttacksRight
        if (kickingCF) { kickingCF.wx=kickingAttacksRight?54:46; kickingCF.wy=32;(kickingCF as any)._kickoffFacingLeft=kickingAttacksRight }
        if (nonKickingCF) {
          const nonKickAttacksRight=kickOffTeam==='home'?awayAttacksRight:!awayAttacksRight
          nonKickingCF.wx=nonKickAttacksRight?40:60; nonKickingCF.wy=32;(nonKickingCF as any)._kickoffFacingLeft=undefined
        }
        ball.isLoose=true
        if (kickOffTeam==='home') { controlledId=kickingCF?.id??'home_cf' }
        else {
          const homeOut=players.filter(p=>p.team==='home'&&p.role!=='gk')
          controlledId=homeOut.reduce((a,b)=>dist2(a.wx,a.wy,ball.wx,ball.wy)<dist2(b.wx,b.wy,ball.wx,ball.wy)?a:b).id
        }
      }
      if (deadBall==='goal_kick'&&deadBallTimer<=0) {
        const awayGk=getPlayer('away_gk')
        const awayKickIsOnRight = awayAttacksRight ? (ball.wx>50) : (ball.wx<=50)
        if (awayKickIsOnRight && awayGk) {
          const def=players.filter(p=>p.team==='away'&&(p.role==='lb'||p.role==='rb'||p.role==='cm'))
            .reduce((a,b)=>dist2(awayGk.wx,awayGk.wy,a.wx,a.wy)<dist2(awayGk.wx,awayGk.wy,b.wx,b.wy)?a:b)
          if (def) kickBallToward(awayGk,def.wx,def.wy,1.5)
          deadBall=null; timerRunning=true
        } else if (!awayKickIsOnRight) {
          deadBall=null; timerRunning=true
        }
      }
      if (deadBall==='halftime'&&deadBallTimer<=0) {
        updateSession({ homeScore:score[0], awayScore:score[1], half:2 })
        onNavigate('halftime')
      }
      if (deadBall==='fulltime'&&deadBallTimer<=0) {
        updateSession({ homeScore:score[0], awayScore:score[1] })
        onNavigate('fulltime')
      }
    }

    // ─── Input state ──────────────────────────────────────────────────────────
    const joy = { active:false, ox:0, oy:0, dx:0, dy:0, tid:-1 }
    const btnA = { down:false, tid:-1 }
    const btnB = { down:false, tid:-1, heldMs:0 }
    const keys: Record<string, boolean> = {}

    function handleBtnA() {
      if (pauseOpen) return
      if (deadBall==='kickoff') {
        if (kickOffTeam!=='home') return
        const ctrl=getPlayer(controlledId); if (!ctrl) return
        // Pass backward into own half — toward own goal
        const homeAttacksRight=!awayAttacksRight
        const outfield=players.filter(p=>p.team==='home'&&p.role!=='cf'&&p.id!==controlledId)
        const backward=outfield.filter(p=>homeAttacksRight ? p.wx<ctrl.wx : p.wx>ctrl.wx)
        const pool=backward.length?backward:outfield
        const t=pool.reduce((a,b)=>dist2(ctrl.wx,ctrl.wy,a.wx,a.wy)<dist2(ctrl.wx,ctrl.wy,b.wx,b.wy)?a:b)
        kickBallToward(ctrl,t.wx,t.wy,1.2)
        ctrl.animState='kick'; ctrl.animTimer=320;
        (ctrl as any)._kickoffFacingLeft=undefined
        controlledId=t.id  // hand control to the receiver
        deadBall=null; timerRunning=true; return
      }
      if (deadBall==='throw_in') {
        const ctrl=getPlayer(controlledId); if (!ctrl) return
        const targets=players.filter(p=>p.team==='home'&&p.id!==controlledId)
        if (targets.length) {
          const t=targets.reduce((a,b)=>dist2(ctrl.wx,ctrl.wy,a.wx,a.wy)<dist2(ctrl.wx,ctrl.wy,b.wx,b.wy)?a:b)
          kickBallToward(ctrl,t.wx,t.wy,1.0)
        }
        ctrl.animState='idle'; ctrl.animTimer=0; deadBall=null; timerRunning=true; return
      }
      const ctrl=getPlayer(controlledId); if (!ctrl||!ctrl.hasBall) return
      const targets=players.filter(p=>p.team==='home'&&p.id!==controlledId)
      if (!targets.length) return
      const fwd=targets.filter(p=>p.wx>ctrl.wx)
      const pool=fwd.length?fwd:targets
      const best=pool.reduce((a,b)=>dist2(ctrl.wx,ctrl.wy,a.wx,a.wy)<dist2(ctrl.wx,ctrl.wy,b.wx,b.wy)?a:b)
      kickBallToward(ctrl,best.wx,best.wy,1.3)
      ctrl.hasBall=false; ball.isLoose=true; ctrl.animState='kick'; ctrl.animTimer=320
      // Bug 1: immediately hand control to pass receiver so ring is never lost
      controlledId=best.id
    }
    function handleBtnBRelease() {
      if (pauseOpen) return
      const ctrl=getPlayer(controlledId); if (!ctrl) return
      if (ctrl.hasBall) {
        const power=Math.min(1.0,btnB.heldMs/300)
        const homeAttacksRight=!awayAttacksRight
        const oppGoalX=homeAttacksRight?97:3
        const inRange=homeAttacksRight?(ctrl.wx>65):(ctrl.wx<35)
        if (ctrl.role==='gk') {
          const outfield=players.filter(p=>p.team==='home'&&p.role!=='gk')
          const fwd=outfield.reduce((a,b)=>(homeAttacksRight?b.wx>a.wx:b.wx<a.wx)?b:a)
          kickBallToward(ctrl,fwd?fwd.wx:55,fwd?fwd.wy:32,2.0+power*0.5)
          // Bug 1+2: hand control to the player the GK kicked to
          if (fwd) controlledId=fwd.id
        } else if (inRange) {
          statsShots[0]++
          kickBallToward(ctrl,oppGoalX,32,1.8+power*0.7)
        } else {
          // Bug 1: pass long — switch to nearest home player to landing zone
          const landX=ctrl.wx+(homeAttacksRight?25:-25)
          const landTargets=players.filter(p=>p.team==='home'&&p.role!=='gk'&&p.id!==ctrl.id)
          if (landTargets.length) {
            const recv=landTargets.reduce((a,b)=>dist2(a.wx,a.wy,landX,ctrl.wy)<dist2(b.wx,b.wy,landX,ctrl.wy)?a:b)
            controlledId=recv.id
          }
          kickBallToward(ctrl,landX,ctrl.wy,1.5)
        }
        ctrl.hasBall=false; ball.isLoose=true; ctrl.animState='kick'; ctrl.animTimer=380
      } else { handleTackle(ctrl) }
    }
    function handleTackle(ctrl: GamePlayer) {
      if (!ctrl) return
      const dx=ball.wx-ctrl.wx, dy=ball.wy-ctrl.wy, d=Math.hypot(dx,dy)||1
      ctrl.animState='slide'; ctrl.animTimer=500; ctrl.vx=dx/d*0.18; ctrl.vy=dy/d*0.18; ctrl.sprintTimer=40
      if (d<3.5) {
        const carrier=players.find(q=>q.hasBall&&q.team==='away')
        if (carrier) {
          const sc=difficulty==='diff_amateur'?0.72:difficulty==='diff_world_class'?0.55:0.38
          if (Math.random()<sc) { carrier.hasBall=false; ball.isLoose=true; ball.vx=(Math.random()-0.5)*1.0; ball.vy=(Math.random()-0.5)*1.0 }
        }
      }
    }

    // ─── Touch zones ──────────────────────────────────────────────────────────
    function joyZone() { const SCALE=getScale(),cw=canvas.width,ch=canvas.height; return { cx:75*SCALE, cy:ch-75*SCALE, r:55*SCALE } }
    function btnAZone() { const SCALE=getScale(),cw=canvas.width,ch=canvas.height; return { cx:cw-100*SCALE, cy:ch-55*SCALE, r:28*SCALE } }
    function btnBZone() { const SCALE=getScale(),cw=canvas.width,ch=canvas.height; return { cx:cw-48*SCALE, cy:ch-90*SCALE, r:28*SCALE } }

    // Pause menu buttons (recomputed each render)
    type PauseBtn = { y:number; label:string; action:()=>void }
    let pauseButtons: PauseBtn[] = []

    function handlePauseTouch(x:number, y:number) {
      const SCALE=getScale(), bw=180*SCALE, bh=44*SCALE, bx=canvas.width/2-bw/2
      const ch=canvas.height
      const btns = [
        {y:ch/2-70*SCALE, label:'RESUME',  action:()=>{ pauseOpen=false }},
        {y:ch/2-15*SCALE, label:'RESTART', action:()=>{ pauseOpen=false; updateSession({homeScore:0,awayScore:0,half:1}); onNavigate('match_overview') }},
        {y:ch/2+40*SCALE, label:'QUIT',    action:()=>{ pauseOpen=false; onNavigate('start') }},
      ]
      for (const b of btns) { if (x>=bx&&x<=bx+bw&&y>=b.y&&y<=b.y+bh) { b.action(); return } }
    }

    function handleScreenTap(x:number, y:number) {
      if (pauseOpen) { handlePauseTouch(x,y); return }
    }

    function onTouchStart(e: TouchEvent) {
      e.preventDefault()
      for (const t of e.changedTouches) {
        const x=t.clientX*(canvas.width/window.innerWidth), y=t.clientY*(canvas.height/window.innerHeight)
        if (pauseOpen) { handlePauseTouch(x,y); continue }
        const pb = pauseBtnZone()
        if (x>=pb.x&&x<=pb.x+pb.w&&y>=pb.y&&y<=pb.y+pb.h) { pauseOpen=true; continue }
        const jz=joyZone()
        if (dist2(x,y,jz.cx,jz.cy)<80*getScale()&&!joy.active) {
          joy.active=true; joy.ox=x; joy.oy=y; joy.dx=0; joy.dy=0; joy.tid=t.identifier; continue
        }
        const az=btnAZone(), bz=btnBZone()
        if (dist2(x,y,az.cx,az.cy)<az.r+12) { btnA.down=true; btnA.tid=t.identifier; handleBtnA(); continue }
        if (dist2(x,y,bz.cx,bz.cy)<bz.r+12) { btnB.down=true; btnB.tid=t.identifier; btnB.heldMs=0; continue }
        handleScreenTap(x,y)
      }
    }
    function onTouchMove(e: TouchEvent) {
      e.preventDefault()
      for (const t of e.changedTouches) {
        if (joy.active&&t.identifier===joy.tid) {
          const x=t.clientX*(canvas.width/window.innerWidth), y=t.clientY*(canvas.height/window.innerHeight)
          joy.dx=x-joy.ox; joy.dy=y-joy.oy
          const maxR=40*getScale(), d=Math.hypot(joy.dx,joy.dy)
          if (d>maxR) { joy.dx*=maxR/d; joy.dy*=maxR/d }
        }
      }
    }
    function onTouchEnd(e: TouchEvent) {
      e.preventDefault()
      for (const t of e.changedTouches) {
        if (joy.active&&t.identifier===joy.tid) { joy.active=false; joy.dx=0; joy.dy=0 }
        if (btnA.down&&t.identifier===btnA.tid) btnA.down=false
        if (btnB.down&&t.identifier===btnB.tid) { if(btnB.heldMs>=80) handleBtnBRelease(); btnB.down=false; btnB.heldMs=0 }
      }
    }
    let mouseDown=false
    function onMouseDown(e: MouseEvent) {
      mouseDown=true
      const x=e.offsetX*(canvas.width/canvas.clientWidth), y=e.offsetY*(canvas.height/canvas.clientHeight)
      if (pauseOpen) { handlePauseTouch(x,y); return }
      const pb=pauseBtnZone()
      if (x>=pb.x&&x<=pb.x+pb.w&&y>=pb.y&&y<=pb.y+pb.h) { pauseOpen=true; return }
      const SCALE=getScale()
      const jz=joyZone()
      if (dist2(x,y,jz.cx,jz.cy)<80*SCALE) { joy.active=true; joy.ox=x; joy.oy=y; joy.dx=0; joy.dy=0; joy.tid=-99; return }
      const az=btnAZone(), bz=btnBZone()
      if (dist2(x,y,az.cx,az.cy)<az.r+12) { btnA.down=true; btnA.tid=-99; handleBtnA(); return }
      if (dist2(x,y,bz.cx,bz.cy)<bz.r+12) { btnB.down=true; btnB.tid=-99; btnB.heldMs=0; return }
      handleScreenTap(x,y)
    }
    function onMouseMove(e: MouseEvent) {
      if (!mouseDown) return
      const x=e.offsetX*(canvas.width/canvas.clientWidth), y=e.offsetY*(canvas.height/canvas.clientHeight)
      if (joy.active&&joy.tid===-99) {
        joy.dx=x-joy.ox; joy.dy=y-joy.oy
        const maxR=40*getScale(), d=Math.hypot(joy.dx,joy.dy)
        if (d>maxR){joy.dx*=maxR/d;joy.dy*=maxR/d}
      }
    }
    function onMouseUp(_e: MouseEvent) {
      mouseDown=false
      if (joy.active&&joy.tid===-99) { joy.active=false; joy.dx=0; joy.dy=0 }
      if (btnA.down&&btnA.tid===-99) btnA.down=false
      if (btnB.down&&btnB.tid===-99) { if(btnB.heldMs>=80) handleBtnBRelease(); btnB.down=false; btnB.heldMs=0 }
    }
    function onKeyDown(e: KeyboardEvent) {
      keys[e.code]=true
      if (e.code==='KeyZ'||e.code==='Space') { e.preventDefault(); handleBtnA() }
      if (e.code==='KeyX') { if(!btnB.down){btnB.down=true;btnB.heldMs=0}; const ctrl=getPlayer(controlledId); if(ctrl&&!ctrl.hasBall) handleTackle(ctrl) }
      if (e.code==='Escape') { pauseOpen=!pauseOpen }
    }
    function onKeyUp(e: KeyboardEvent) {
      keys[e.code]=false
      if (e.code==='KeyX') { handleBtnBRelease(); btnB.down=false; btnB.heldMs=0 }
    }

    function pauseBtnZone() { const SCALE=getScale(),cw=canvas.width; return {x:cw-84*SCALE,y:4*SCALE,w:44*SCALE,h:24*SCALE} }

    canvas.addEventListener('touchstart', onTouchStart, {passive:false})
    canvas.addEventListener('touchmove',  onTouchMove,  {passive:false})
    canvas.addEventListener('touchend',   onTouchEnd,   {passive:false})
    canvas.addEventListener('touchcancel',onTouchEnd,   {passive:false})
    canvas.addEventListener('mousedown',  onMouseDown)
    canvas.addEventListener('mousemove',  onMouseMove)
    canvas.addEventListener('mouseup',    onMouseUp)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup',   onKeyUp)

    // ─── Rendering ────────────────────────────────────────────────────────────
    const sbCanvas = document.createElement('canvas')

    function drawPitch() {
      if (!_pc) recomputePitchCorners()
      const pc = _pc!
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(pitchEl, 0, 0, pc.PW, pc.PH)
    }
    function drawPlayers() {
      const sorted = [...players].sort((a,b) => a.wy - b.wy)
      const nearW = _pc ? (_pc.BR[0]-_pc.BL[0]) : canvas.width
      const dW = Math.max(24, Math.min(SS_VIS_W, Math.round(nearW/13)))
      const dH = Math.round(dW * SS_VIS_H / SS_VIS_W)
      for (const p of sorted) {
        const sc = worldToScreen(p.wx, p.wy)
        const teamCode = p.team==='home' ? session.homeTeamCode : session.awayTeamCode
        const row = ROLE_ROW[p.role] ?? 1
        const col = ANIM_COL[p.animState] ?? 0
        const srcX = col*SS_CELL_W, srcY = row*SS_CELL_H
        const drawX = sc.x-dW/2, drawY = sc.y-dH
        ctx.fillStyle='rgba(0,0,0,0.22)'; ctx.beginPath()
        ctx.ellipse(sc.x,sc.y,dW*0.42,dH*0.07,0,0,Math.PI*2); ctx.fill()
        const img = getSprite(teamCode)
        ctx.imageSmoothingEnabled = false
        const kfl = (p as any)._kickoffFacingLeft
        const isFacingLeft = (deadBall==='kickoff'&&kfl!==undefined) ? kfl : p._facingLeft
        if (isFacingLeft) {
          ctx.save(); ctx.translate(sc.x+dW/2, drawY); ctx.scale(-1,1)
          ctx.drawImage(img, srcX, srcY, SS_VIS_W, SS_VIS_H, 0, 0, dW, dH)
          ctx.restore()
        } else {
          ctx.drawImage(img, srcX, srcY, SS_VIS_W, SS_VIS_H, drawX, drawY, dW, dH)
        }
        if (p.id===controlledId&&p.team==='home') {
          const pulse=0.82+0.18*Math.sin(animTick*0.12)
          ctx.strokeStyle='#fff'; ctx.lineWidth=1.5; ctx.beginPath()
          ctx.ellipse(sc.x,sc.y,dW*0.44*pulse,dH*0.09*pulse,0,0,Math.PI*2); ctx.stroke()
        }
      }
    }
    function drawBall() {
      const sc = worldToScreen(ball.wx, ball.wy)
      const heightOffset = ball.h * 3 * getScale()
      const nearW = _pc ? (_pc.BR[0]-_pc.BL[0]) : canvas.width
      const bpx = Math.max(8, Math.round(nearW/30))
      ctx.fillStyle=`rgba(0,0,0,${Math.max(0.1,0.35-ball.h*0.025)})`;ctx.beginPath()
      ctx.ellipse(sc.x,sc.y,bpx*0.55,bpx*0.18,0,0,Math.PI*2); ctx.fill()
      ctx.imageSmoothingEnabled=true; ctx.imageSmoothingQuality='high'
      const bx2=sc.x, by2=sc.y-heightOffset-bpx/2
      ctx.save(); ctx.translate(bx2,by2); ctx.rotate(ball.angle)
      ctx.drawImage(ballCanvas,-bpx/2,-bpx/2,bpx,bpx); ctx.restore()
      ctx.imageSmoothingEnabled=false
    }
    function drawHUD() {
      const cw=canvas.width
      const mins=Math.floor(matchTimer/60).toString().padStart(2,'0')
      const secs=Math.floor(matchTimer%60).toString().padStart(2,'0')
      const timerStr=`${mins}:${secs}`
      const home=nationOf(session.homeTeamCode), away=nationOf(session.awayTeamCode)
      renderScoreboard(sbCanvas, home, away, score[0], score[1], timerStr)
      // Overlay: render at natural aspect ratio, centred, capped at 420px wide
      const sbDisplayW = Math.min(420, Math.round(cw * 0.38))
      const sbDisplayH = Math.round(SB_H * sbDisplayW / SB_W)
      const sbX = Math.round((cw - sbDisplayW) / 2)
      const sbY = 6
      // Subtle dark bg behind scoreboard
      ctx.fillStyle = 'rgba(0,0,0,0.35)'
      ctx.beginPath(); ctx.roundRect(sbX - 6, sbY - 4, sbDisplayW + 12, sbDisplayH + 8, 4); ctx.fill()
      ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(sbCanvas, sbX, sbY, sbDisplayW, sbDisplayH)
      const pb = pauseBtnZone()
      ctx.fillStyle = 'rgba(0,0,0,0.55)'
      ctx.fillRect(pb.x, pb.y, pb.w, pb.h)
      ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.5
      ctx.strokeRect(pb.x, pb.y, pb.w, pb.h)
      ctx.fillStyle = '#fff'; ctx.font = `bold ${Math.round(pb.h * 0.55)}px monospace`
      ctx.textAlign = 'center'
      ctx.fillText('II', pb.x + pb.w / 2, pb.y + pb.h * 0.72)
    }
    function drawControls() {
      const SCALE=getScale(), cw=canvas.width, ch=canvas.height
      const jz=joyZone(), az=btnAZone(), bz=btnBZone()
      ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.lineWidth=2
      ctx.beginPath(); ctx.arc(jz.cx,jz.cy,jz.r,0,Math.PI*2); ctx.stroke()
      ctx.fillStyle='rgba(255,255,255,0.08)'; ctx.beginPath(); ctx.arc(jz.cx,jz.cy,jz.r,0,Math.PI*2); ctx.fill()
      if (joy.active) {
        ctx.fillStyle='rgba(255,255,255,0.4)'; ctx.beginPath(); ctx.arc(jz.cx+joy.dx,jz.cy+joy.dy,14*SCALE,0,Math.PI*2); ctx.fill()
      } else {
        ctx.fillStyle='rgba(255,255,255,0.2)'; ctx.beginPath(); ctx.arc(jz.cx,jz.cy,14*SCALE,0,Math.PI*2); ctx.fill()
      }
      const ctrl=getPlayer(controlledId), hasBall=ctrl&&ctrl.hasBall
      ctx.fillStyle=hasBall?'rgba(100,200,100,0.5)':'rgba(255,255,255,0.15)'
      ctx.beginPath(); ctx.arc(az.cx,az.cy,az.r,0,Math.PI*2); ctx.fill()
      ctx.strokeStyle='rgba(255,255,255,0.5)'; ctx.lineWidth=2
      ctx.beginPath(); ctx.arc(az.cx,az.cy,az.r,0,Math.PI*2); ctx.stroke()
      ctx.fillStyle='#fff'; ctx.font=`bold ${12*SCALE}px monospace`; ctx.textAlign='center'
      ctx.fillText('A',az.cx,az.cy+4*SCALE)
      const inRange=ctrl&&(!awayAttacksRight?(ctrl.wx<35):(ctrl.wx>65))
      ctx.fillStyle=hasBall&&inRange?'rgba(255,100,100,0.5)':'rgba(255,255,255,0.15)'
      ctx.beginPath(); ctx.arc(bz.cx,bz.cy,bz.r,0,Math.PI*2); ctx.fill()
      ctx.strokeStyle='rgba(255,255,255,0.5)'; ctx.lineWidth=2
      ctx.beginPath(); ctx.arc(bz.cx,bz.cy,bz.r,0,Math.PI*2); ctx.stroke()
      ctx.fillStyle='#fff'; ctx.fillText('B',bz.cx,bz.cy+4*SCALE)
      ctx.fillStyle='rgba(255,255,255,0.5)'; ctx.font=`${6*SCALE}px monospace`; ctx.textAlign='center'
      if (hasBall) {
        ctx.fillText(inRange?'SHOOT':'PASS', az.cx, az.cy+az.r+10*SCALE)
        ctx.fillText(inRange?'POWER':'THRU', bz.cx, bz.cy+bz.r+10*SCALE)
      } else {
        ctx.fillText(deadBall==='kickoff'&&kickOffTeam==='home'?'KICKOFF':'', az.cx, az.cy+az.r+10*SCALE)
        ctx.fillText('TACKLE', bz.cx, bz.cy+bz.r+10*SCALE)
      }
    }
    function drawGoalFlash() {
      if (goalFlash<=0) return
      const SCALE=getScale(), alpha=Math.min(1,goalFlash/500)*0.8
      ctx.fillStyle=`rgba(255,200,0,${alpha*0.3})`; ctx.fillRect(0,0,canvas.width,canvas.height)
      ctx.fillStyle=`rgba(255,255,255,${alpha})`; ctx.font=`bold ${32*SCALE}px monospace`; ctx.textAlign='center'
      const team=goalFlashTeam===0?session.homeTeamCode:session.awayTeamCode
      ctx.fillText('GOAL!',canvas.width/2,canvas.height/2-20*SCALE)
      ctx.font=`${14*SCALE}px monospace`; ctx.fillText(team,canvas.width/2,canvas.height/2+10*SCALE)
    }
    function drawRetroHeader(label: string, cy: number, SCALE: number, cw: number) {
      const lineColor='#CC3300', textColor='#FFFFFF'
      ctx.font=`bold ${11*SCALE}px 'Press Start 2P', monospace`
      ctx.textAlign='center'
      const tw=ctx.measureText(label).width
      const lineY=cy+4*SCALE, gap=16*SCALE
      ctx.strokeStyle=lineColor; ctx.lineWidth=2*SCALE
      ctx.beginPath(); ctx.moveTo(cw/2-tw/2-gap,lineY); ctx.lineTo(cw*0.1,lineY); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(cw/2+tw/2+gap,lineY); ctx.lineTo(cw*0.9,lineY); ctx.stroke()
      ctx.fillStyle=textColor; ctx.fillText(label,cw/2,cy)
    }
    function drawRetroButton(label: string, bx: number, by: number, bw: number, bh: number, SCALE: number) {
      ctx.fillStyle='#000000'; ctx.fillRect(bx,by,bw,bh)
      ctx.strokeStyle='#CC3300'; ctx.lineWidth=3*SCALE; ctx.strokeRect(bx,by,bw,bh)
      ctx.fillStyle='#FFFFFF'
      ctx.font=`${8*SCALE}px 'Press Start 2P', monospace`
      ctx.textAlign='center'; ctx.letterSpacing=`${0.08*8*SCALE}px`
      ctx.fillText(label,bx+bw/2,by+bh*0.64)
      ctx.letterSpacing='0px'
    }
    function drawPauseMenu() {
      const SCALE=getScale(), cw=canvas.width, ch=canvas.height
      ctx.fillStyle='rgba(0,0,0,0.88)'; ctx.fillRect(0,0,cw,ch)
      drawRetroHeader('PAUSED',ch/2-90*SCALE,SCALE,cw)
      const bw=200*SCALE, bh=44*SCALE, bx=cw/2-bw/2
      const btns=[
        {y:ch/2-60*SCALE,label:'RESUME'},
        {y:ch/2-5*SCALE, label:'RESTART'},
        {y:ch/2+50*SCALE,label:'QUIT'},
      ]
      for (const b of btns) drawRetroButton(b.label,bx,b.y,bw,bh,SCALE)
    }
    function drawDeadBallOverlay() {
      const SCALE=getScale(), cw=canvas.width, ch=canvas.height
      if (deadBall==='kickoff'&&walkOnDone&&kickOffTeam==='home') {
        ctx.fillStyle='rgba(255,255,255,0.8)'; ctx.font=`bold ${10*SCALE}px monospace`; ctx.textAlign='center'
        ctx.fillText('TAP A TO KICK OFF',cw/2,ch-130*SCALE)
      }
      if (deadBall==='halftime') {
        ctx.fillStyle='#000000'; ctx.fillRect(0,0,cw,ch)
        drawRetroHeader('HALF TIME',ch/2-60*SCALE,SCALE,cw)
        // Score — white, large
        ctx.fillStyle='#FFFFFF'; ctx.font=`bold ${30*SCALE}px 'Press Start 2P', monospace`
        ctx.textAlign='center'; ctx.fillText(`${score[0]}  –  ${score[1]}`,cw/2,ch/2)
        // Half label — teal accent
        ctx.fillStyle='#00BBAA'; ctx.font=`${8*SCALE}px 'Press Start 2P', monospace`
        ctx.fillText('SECOND HALF',cw/2,ch/2+28*SCALE)
        // Sides switch note
        ctx.fillStyle='#FFFFFF'; ctx.font=`${7*SCALE}px 'Press Start 2P', monospace`
        ctx.fillText('SIDES SWITCH',cw/2,ch/2+48*SCALE)
      }
      if (deadBall==='throw_in') {
        ctx.fillStyle='rgba(255,255,255,0.7)'; ctx.font=`bold ${9*SCALE}px monospace`; ctx.textAlign='center'
        ctx.fillText('THROW IN — TAP A',cw/2,ch-130*SCALE)
      }
      if (deadBall==='goal_kick') {
        ctx.fillStyle='rgba(255,255,255,0.7)'; ctx.font=`bold ${9*SCALE}px monospace`; ctx.textAlign='center'
        ctx.fillText('GOAL KICK',cw/2,ch-130*SCALE)
      }
    }

    // ─── Game loop ────────────────────────────────────────────────────────────
    let lastTimestamp = 0
    let rafId = 0
    let navigated = false

    function update(dt: number) {
      if (navigated || pauseOpen) return
      animTick++
      if (btnB.down) btnB.heldMs += dt
      if (deadBall==='kickoff') { updateWalkOn(dt); if (!walkOnDone) return }
      updateTimer(dt)
      updateDeadBall(dt)
      if (deadBall!=='halftime'&&deadBall!=='fulltime') {
        updateBall(dt)
        updatePlayers(dt)
        enforceBoundaries(dt)
        separatePlayers()
        if (deadBall===null||(deadBall==='kickoff'&&kickOffTeam==='away')) updateAI(dt)
        aiTackleCheck()
      }
    }
    function render() {
      recomputePitchCorners()
      ctx.clearRect(0,0,canvas.width,canvas.height)
      ctx.fillStyle='#1a3a1a'; ctx.fillRect(0,0,canvas.width,canvas.height)
      drawPitch()
      drawPlayers()
      drawBall()
      drawHUD()
      drawGoalFlash()
      drawDeadBallOverlay()
      if (pauseOpen) drawPauseMenu()
    }
    function gameLoop(timestamp: number) {
      if (navigated) return
      const dt = Math.min(50, timestamp - (lastTimestamp || timestamp))
      lastTimestamp = timestamp
      update(dt)
      render()
      rafId = requestAnimationFrame(gameLoop)
    }

    // Override onNavigate to set navigated flag first
    const origOnNavigate = onNavigate
    function safeNavigate(screen: ScreenId) {
      navigated = true
      origOnNavigate(screen)
    }
    // Patch updateDeadBall to use safeNavigate — override the onNavigate closure captures
    // by patching the flag directly before calling parent

    rafId = requestAnimationFrame(gameLoop)

    return () => {
      navigated = true
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', resize)
      canvas.removeEventListener('touchstart', onTouchStart)
      canvas.removeEventListener('touchmove', onTouchMove)
      canvas.removeEventListener('touchend', onTouchEnd)
      canvas.removeEventListener('touchcancel', onTouchEnd)
      canvas.removeEventListener('mousedown', onMouseDown)
      canvas.removeEventListener('mousemove', onMouseMove)
      canvas.removeEventListener('mouseup', onMouseUp)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: '100%', flex: 1, display: 'block', touchAction: 'none' }}
    />
  )
}
