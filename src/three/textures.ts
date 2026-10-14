import * as THREE from 'three'
import { rng } from '../lib/math'

function canvas(w: number, h: number) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return [c, c.getContext('2d')!] as const
}

function toTexture(c: HTMLCanvasElement, srgb = true) {
  const t = new THREE.CanvasTexture(c)
  if (srgb) t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  return t
}

/** Curtain-wall glazing: tinted panes, slim mullions, a few lit interiors */
export function facadeTexture(cols: number, rows: number, seed: number) {
  const W = 1024
  const H = 1024
  const [c, g] = canvas(W, H)
  const r = rng(seed)
  const pw = W / cols
  const ph = H / rows
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const t = 0.55 + r() * 0.3
      const grad = g.createLinearGradient(0, y * ph, 0, (y + 1) * ph)
      grad.addColorStop(0, `rgb(${70 * t + 40},${110 * t + 40},${130 * t + 45})`)
      grad.addColorStop(1, `rgb(${40 * t + 20},${70 * t + 26},${92 * t + 34})`)
      g.fillStyle = grad
      g.fillRect(x * pw, y * ph, pw, ph)
      if (r() < 0.12) {
        g.fillStyle = r() < 0.5 ? 'rgba(234,244,250,0.35)' : 'rgba(255,240,215,0.28)'
        g.fillRect(x * pw + 4, y * ph + ph * 0.35, pw - 8, ph * 0.6)
      }
    }
  }
  // slab bands + mullions
  g.fillStyle = '#e9eef1'
  for (let y = 0; y <= rows; y++) g.fillRect(0, y * ph - 5, W, 10)
  g.fillStyle = 'rgba(225,232,236,0.95)'
  for (let x = 0; x <= cols; x++) g.fillRect(x * pw - 2, 0, 4, H)
  return toTexture(c)
}

/** Building signage, redrawn once the brand face has loaded */
export function signTexture() {
  const [c, g] = canvas(2048, 384)
  const tex = toTexture(c)
  const draw = () => {
    g.clearRect(0, 0, c.width, c.height)
    g.fillStyle = '#0b1626'
    g.font = '500 210px Geist, "Helvetica Neue", Arial, sans-serif'
    g.textBaseline = 'middle'
    g.textAlign = 'center'
    g.letterSpacing = '40px'
    g.fillText('VITALIS', 1024, 150)
    g.font = '400 64px Geist, "Helvetica Neue", Arial, sans-serif'
    g.letterSpacing = '18px'
    g.fillText('MEDICAL INSTITUTE', 1024, 310)
    tex.needsUpdate = true
  }
  draw()
  document.fonts?.load('500 210px Geist').then(draw).catch(() => {})
  return tex
}

export function helipadTexture() {
  const [c, g] = canvas(512, 512)
  g.fillStyle = '#3a4650'
  g.fillRect(0, 0, 512, 512)
  g.strokeStyle = '#eef3f5'
  g.lineWidth = 18
  g.beginPath()
  g.arc(256, 256, 200, 0, Math.PI * 2)
  g.stroke()
  g.fillStyle = '#eef3f5'
  g.fillRect(170, 150, 40, 212)
  g.fillRect(302, 150, 40, 212)
  g.fillRect(170, 236, 172, 40)
  return toTexture(c)
}

/** Vertical garden: dense layered leaves in mint-to-forest greens */
export function livingWallTexture() {
  const [c, g] = canvas(1024, 512)
  const r = rng(11)
  g.fillStyle = '#2f4a3c'
  g.fillRect(0, 0, 1024, 512)
  const greens = ['#4f7a5f', '#6b9a78', '#86e3c8', '#3e6650', '#9cc7a6', '#577f63']
  for (let i = 0; i < 5200; i++) {
    g.fillStyle = greens[Math.floor(r() * greens.length)]
    g.globalAlpha = 0.5 + r() * 0.5
    g.beginPath()
    g.ellipse(r() * 1024, r() * 512, 4 + r() * 9, 2 + r() * 5, r() * Math.PI, 0, Math.PI * 2)
    g.fill()
  }
  g.globalAlpha = 1
  return toTexture(c)
}
