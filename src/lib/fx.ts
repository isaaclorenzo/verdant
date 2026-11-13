// Verdant · capa de interacción ("acción y reacción").
// Un único juego de escuchas en el documento: ondas al pulsar, foco de luz sobre el cristal,
// e inclinación 3D de las tarjetas. Las variables que escribe son no heredables (@property en base.css).
// Solo escribe variables CSS y añade nodos efímeros; no toca el editor ni sus medidas.

const RIPPLE = [
  '.btn', '.icon-btn', '.lib-navitem', '.lib-folder-main', '.lib-startcard', '.lib-seg button', '.lib-pick button',
  '.menu-item', '.tb-menu', '.tb-select', '.seg button', '.login-tabs button', '.lib-user', '.outline-item',
].join(',')
const SPOT = '.glass, .glass-float'
const TILT = '.lib-card, .lib-startcard'

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)')

function ripple(e: PointerEvent) {
  if (reduce.matches || e.button !== 0) return
  const host = (e.target as Element | null)?.closest<HTMLElement>(RIPPLE)
  if (!host || host.matches(':disabled, [aria-disabled="true"]')) return
  if (!host.classList.contains('fx-host')) {
    host.classList.add('fx-host')
    // Solo se posiciona si no lo estaba: así los botones absolutos (menús de tarjeta, ojo de la contraseña) siguen en su sitio.
    if (getComputedStyle(host).position === 'static') host.classList.add('fx-rel')
  }
  const r = host.getBoundingClientRect()
  const d = Math.hypot(r.width, r.height) * 2
  const wave = document.createElement('span')
  wave.className = 'fx-ripple'
  wave.setAttribute('aria-hidden', 'true')
  wave.style.setProperty('--x', `${e.clientX - r.left}px`)
  wave.style.setProperty('--y', `${e.clientY - r.top}px`)
  wave.style.setProperty('--d', `${d}px`)
  host.appendChild(wave)
  const done = () => wave.remove()
  wave.addEventListener('animationend', done, { once: true })
  window.setTimeout(done, 900)
}

let frame = 0
let last: PointerEvent | null = null
let tilted: HTMLElement | null = null
let lit: HTMLElement | null = null

function resetTilt() {
  if (!tilted) return
  tilted.style.removeProperty('--rx')
  tilted.style.removeProperty('--ry')
  tilted = null
}

function onFrame() {
  frame = 0
  const e = last
  if (!e) return
  const target = e.target as Element | null

  const glass = target?.closest<HTMLElement>(SPOT) ?? null
  if (glass) {
    const r = glass.getBoundingClientRect()
    glass.style.setProperty('--mx', `${e.clientX - r.left}px`)
    glass.style.setProperty('--my', `${e.clientY - r.top}px`)
  }
  if (lit && lit !== glass) lit.classList.remove('fx-lit')
  if (glass) glass.classList.add('fx-lit')
  lit = glass

  const card = reduce.matches ? null : target?.closest<HTMLElement>(TILT) ?? null
  if (card !== tilted) resetTilt()
  if (card) {
    const r = card.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width - 0.5
    const py = (e.clientY - r.top) / r.height - 0.5
    card.style.setProperty('--rx', `${(-py * 7).toFixed(2)}deg`)
    card.style.setProperty('--ry', `${(px * 9).toFixed(2)}deg`)
    tilted = card
  }
}

function onMove(e: PointerEvent) {
  if (e.pointerType !== 'mouse' || !finePointer.matches) return
  last = e
  frame ||= requestAnimationFrame(onFrame)
}

function onLeave() {
  resetTilt()
  lit?.classList.remove('fx-lit')
  lit = null
}

let started = false
export function initFx(): void {
  if (started) return
  started = true
  document.addEventListener('pointerdown', ripple, { passive: true })
  document.addEventListener('pointermove', onMove, { passive: true })
  document.documentElement.addEventListener('pointerleave', onLeave)
  window.addEventListener('blur', onLeave)
}
