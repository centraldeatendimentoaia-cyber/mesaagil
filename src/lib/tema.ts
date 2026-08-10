import type { Barraca } from '../types/database'

type Preset = {
  nome: string
  cor: string
}

export const PRESETS: Preset[] = [
  { nome: 'Vermelho', cor: '#C4372A' },
  { nome: 'Laranja', cor: '#E8590C' },
  { nome: 'Verde', cor: '#2B8A3E' },
  { nome: 'Azul', cor: '#1971C2' },
  { nome: 'Roxo', cor: '#6741D9' },
  { nome: 'Preto', cor: '#212529' },
]

function hexParaRgb(hex: string): [number, number, number] {
  const limpo = hex.replace('#', '')
  const r = parseInt(limpo.substring(0, 2), 16)
  const g = parseInt(limpo.substring(2, 4), 16)
  const b = parseInt(limpo.substring(4, 6), 16)
  return [r, g, b]
}

function rgbParaHex(r: number, g: number, b: number): string {
  const canal = (c: number) =>
    Math.round(Math.min(255, Math.max(0, c)))
      .toString(16)
      .padStart(2, '0')
  return `#${canal(r)}${canal(g)}${canal(b)}`
}

function rgbParaHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const l = (max + min) / 2

  if (max === min) {
    return [0, 0, l]
  }

  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

  let h: number
  switch (max) {
    case rn:
      h = (gn - bn) / d + (gn < bn ? 6 : 0)
      break
    case gn:
      h = (bn - rn) / d + 2
      break
    default:
      h = (rn - gn) / d + 4
  }
  h /= 6

  return [h, s, l]
}

function hslParaRgb(h: number, s: number, l: number): [number, number, number] {
  if (s === 0) {
    const cinza = l * 255
    return [cinza, cinza, cinza]
  }

  const hue2rgb = (p: number, q: number, t: number) => {
    let tt = t
    if (tt < 0) tt += 1
    if (tt > 1) tt -= 1
    if (tt < 1 / 6) return p + (q - p) * 6 * tt
    if (tt < 1 / 2) return q
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6
    return p
  }

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q

  return [
    hue2rgb(p, q, h + 1 / 3) * 255,
    hue2rgb(p, q, h) * 255,
    hue2rgb(p, q, h - 1 / 3) * 255,
  ]
}

/** Luminância relativa (WCAG) — usada para decidir a cor do texto sobre a marca. */
function luminanciaRelativa(hex: string): number {
  const [r, g, b] = hexParaRgb(hex).map((c) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function corTextoContraste(hex: string): string {
  return luminanciaRelativa(hex) > 0.5 ? '#111111' : '#FFFFFF'
}

export function escurecerCor(hex: string, quantidade = 0.2): string {
  const [r, g, b] = hexParaRgb(hex)
  const [h, s, l] = rgbParaHsl(r, g, b)
  const novoL = Math.max(0, l * (1 - quantidade))
  return rgbParaHex(...hslParaRgb(h, s, novoL))
}

export function aplicarTema(barraca: Barraca): void {
  const root = document.documentElement

  root.style.setProperty('--color-marca', barraca.cor_primaria)
  root.style.setProperty('--color-marca-escura', escurecerCor(barraca.cor_primaria))
  root.style.setProperty('--color-marca-texto', corTextoContraste(barraca.cor_primaria))

  root.classList.toggle('dark', barraca.modo === 'escuro')
}
