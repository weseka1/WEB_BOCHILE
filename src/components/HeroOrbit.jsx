import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Link } from 'react-router-dom'
import { EXCLUSIVES, fmtPrice, heroTitle } from '../data/properties'

const SLOTS = [
  { x: 66, y: 38, depth: 2.2, rot: -2, scale: 1.06 },
  { x: 46, y: 24, depth: 1.6, rot: 3, scale: 0.86 },
  { x: 81, y: 64, depth: 1.0, rot: -4, scale: 0.7 },
]

export default function HeroOrbit({ active }) {
  const root = useRef(null)
  const cards = useRef([])
  cards.current = []
  const add = (el) => el && !cards.current.includes(el) && cards.current.push(el)

  useEffect(() => {
    if (!active) return
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    const mobile = matchMedia('(max-width:760px)').matches
    const order = [...cards.current].reverse()

    const ctx = gsap.context(() => {
      gsap.fromTo(order,
        { autoAlpha: 0, yPercent: 34, scale: 0.8, filter: 'blur(14px)' },
        { autoAlpha: 1, yPercent: 0, scale: 1, filter: 'blur(0px)', duration: 1.3, ease: 'power3.out', stagger: 0.15, onComplete: () => { if (!reduce) idle() } })
      if (reduce) return

      const idleTweens = []
      function idle() {
        cards.current.forEach((card, i) => {
          const fl = card.querySelector('.orbit-float')
          const amp = 10 + i * 6, dur = 7 + i * 2
          idleTweens.push(
            gsap.to(fl, { y: `+=${amp}`, duration: dur, ease: 'sine.inOut', yoyo: true, repeat: -1 }),
            gsap.to(fl, { x: `+=${amp * 0.45}`, duration: dur * 1.37, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 0.4 }),
            gsap.to(fl, { rotation: `+=${1.5 + i}`, duration: dur * 1.6, ease: 'sine.inOut', yoyo: true, repeat: -1 }))
        })
      }
      if (!mobile) {
        const set = cards.current.map((c) => ({
          mx: gsap.quickTo(c.querySelector('.orbit-depth'), '--mx', { duration: 0.9, ease: 'power3.out' }),
          my: gsap.quickTo(c.querySelector('.orbit-depth'), '--my', { duration: 0.9, ease: 'power3.out' }),
          d: +c.dataset.depth,
        }))
        const onMove = (e) => {
          const nx = e.clientX / innerWidth - 0.5, ny = e.clientY / innerHeight - 0.5
          set.forEach((s) => { s.mx(`${nx * 22 * s.d}px`); s.my(`${ny * 22 * s.d}px`) })
        }
        window.addEventListener('pointermove', onMove, { passive: true })
        ctx.add(() => window.removeEventListener('pointermove', onMove))
      }
      gsap.to(root.current, { yPercent: -16, ease: 'none', scrollTrigger: { trigger: '.enter', start: 'top top', end: 'bottom top', scrub: true } })
      ScrollTrigger.create({ trigger: '.enter', start: 'top top', end: 'bottom top', onLeave: () => idleTweens.forEach((t) => t.pause()), onEnterBack: () => idleTweens.forEach((t) => t.resume()) })
    }, root)
    return () => ctx.revert()
  }, [active])

  const onEnter = (i) => {
    gsap.to(cards.current[i].querySelector('.orbit-float'), { y: 0, x: 0, rotation: 0, scale: 1.08, duration: 0.5, ease: 'power3.out', overwrite: 'auto' })
    gsap.to(cards.current[i], { '--lift': 1, duration: 0.4 })
    gsap.to(cards.current.filter((_, k) => k !== i), { autoAlpha: 0.45, filter: 'blur(3px)', scale: 0.96, duration: 0.5, ease: 'power2.out' })
  }
  const onLeave = () => {
    gsap.to(cards.current, { autoAlpha: 1, filter: 'blur(0px)', scale: 1, duration: 0.6, ease: 'power2.out' })
    gsap.to(cards.current, { '--lift': 0, duration: 0.4 })
  }

  return (
    <div className="hero-orbit" ref={root}>
      {EXCLUSIVES.map((p, i) => (
        <Link key={p.id} ref={add} to={`/propiedad/${p.slug}`} data-cursor
          className={`orbit-card${i === 0 ? ' is-lead' : ''}`} data-depth={SLOTS[i].depth}
          style={{ left: `${SLOTS[i].x}%`, top: `${SLOTS[i].y}%`, '--rot': `${SLOTS[i].rot}deg`, '--scl': SLOTS[i].scale, zIndex: 10 + (2 - i) }}
          onMouseEnter={() => onEnter(i)} onMouseLeave={onLeave}>
          <div className="orbit-depth"><div className="orbit-float">
            <span className="orbit-badge">Exclusiva{i === 0 && <i>*</i>}</span>
            {i === 0 && <span className="orbit-select">Bochile Select · Difusión prioritaria</span>}
            <img src={p.img} alt={heroTitle(p)} loading="eager" referrerPolicy="no-referrer" />
            <div className="orbit-meta">
              <b>{fmtPrice(p)}</b>
              <span>{heroTitle(p)}</span>
              <i>◦ {p.location}</i>
            </div>
            <span className="orbit-cta">Ver propiedad →</span>
          </div></div>
        </Link>
      ))}
    </div>
  )
}
