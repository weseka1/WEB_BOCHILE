import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useLang } from '../i18n'

const QA = typeof location !== 'undefined' && location.search.includes('qa')

// Intro: el dron agresivo de fondo + la "carga" 1970 → 2026 (medio siglo).
// El contador corre por TIEMPO (no depende del video) → la intro nunca se cuelga.
export default function HeroEnter({ lenisRef }) {
  const { t } = useLang()
  const root = useRef(null)
  const video = useRef(null)
  const count = useRef(null)
  const shown = useRef(false)

  useEffect(() => {
    const r = root.current, v = video.current
    if (!r || !v) return
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches

    const reveal = () => {
      if (shown.current) return
      shown.current = true
      gsap.timeline({ defaults: { ease: 'expo.out' } })
        .to('.enter-scrim', { opacity: 1, duration: 1.1, ease: 'power2.out' }, 0)
        .to('.hero-eyebrow', { opacity: 1, y: 0, duration: 0.7 }, 0.1)
        .to('.enter-logo', { opacity: 1, y: 0, duration: 0.8 }, 0.2)
        .to('.enter-name', { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.1 }, 0.3)
        .to('.enter-rule', { opacity: 1, scaleX: 1, duration: 0.8 }, 0.55)
        .to('.enter-headline', { opacity: 1, y: 0, duration: 0.9 }, 0.6)
        .to('.enter-sub', { opacity: 1, y: 0, duration: 0.8 }, 0.78)
        .to('.enter-cta', { opacity: 1, y: 0, duration: 0.8 }, 0.92)
        .to('.enter-cue', { opacity: 1, duration: 0.7 }, 1.1)
    }

    let guard
    const ctx = gsap.context(() => {
      gsap.set(['.enter-scrim', '.enter-logo', '.enter-name', '.enter-rule', '.enter-headline', '.enter-sub', '.enter-cta', '.enter-cue', '.hero-eyebrow'], { opacity: 0 })
      gsap.set(['.enter-logo', '.enter-name'], { y: 26 })
      gsap.set(['.enter-headline', '.enter-sub', '.enter-cta'], { y: 18 })
      gsap.set('.enter-name', { filter: 'blur(14px)' })
      gsap.set('.enter-rule', { scaleX: 0 })
      gsap.set('.hero-eyebrow', { y: 12 })

      const release = () => {
        document.body.classList.remove('loading')
        lenisRef?.current?.start()
        ScrollTrigger.refresh()
      }

      if (QA || reduce) {
        if (count.current) count.current.style.display = 'none'
        reveal()
        return
      }

      // Lock breve del scroll durante la intro (se suelta SIEMPRE al terminar el contador).
      document.body.classList.add('loading')
      const stopLenis = () => { if (lenisRef?.current) lenisRef.current.stop(); else requestAnimationFrame(stopLenis) }
      stopLenis()

      // DRON AGRESIVO: golpe de zoom al entrar. Una sola pasada, congela al final (sin loop).
      gsap.fromTo(v, { scale: 1.18 }, { scale: 1.0, duration: 2.6, ease: 'power3.out' })
      gsap.to(v, { yPercent: 10, ease: 'none', scrollTrigger: { trigger: r, start: 'top top', end: 'bottom top', scrub: true } })
      const tryPlay = () => { const p = v.play(); if (p && p.catch) p.catch(() => {}) }
      tryPlay()
      v.addEventListener('canplay', tryPlay, { once: true })
      v.addEventListener('ended', () => { try { v.pause() } catch {} }, { once: true })

      // LA CARGA: contador 1970 → 2026. Corre por tiempo, así que la intro nunca depende del video.
      const c = { v: 1970 }
      gsap.timeline({ onComplete: () => { release(); reveal() } })
        .to(c, { v: 2026, duration: 3.0, ease: 'power2.inOut',
          onUpdate: () => { if (count.current) count.current.textContent = Math.round(c.v) } }, 0)
        .to('.enter-hud', { opacity: 0, y: -16, duration: 0.6, ease: 'power2.in' }, 2.7)

      // FAILSAFE absoluto: pase lo que pase, a los 4.2s todo liberado y visible.
      guard = setTimeout(() => { release(); reveal() }, 4200)
    }, root)

    return () => { clearTimeout(guard); ctx.revert() }
  }, [])

  return (
    <header className="enter" id="top" ref={root}>
      <video className="enter-video" ref={video} muted playsInline autoPlay preload="auto"
        poster="/assets/hero/intro-definitivo-poster.jpg">
        <source src="/assets/hero/intro-definitivo-web.mp4" type="video/mp4" />
      </video>
      <div className="enter-scrim" />
      <div className="enter-hud mono" ref={count}>1970</div>
      <div className="enter-inner">
        <div className="hero-eyebrow"><span className="dot" />{t.hero.eyebrow}</div>
        <div className="enter-logo">
          <svg viewBox="0 0 22 28" aria-hidden="true"><rect x="0" y="9" width="4.5" height="19" /><rect x="8.75" y="0" width="4.5" height="28" /><rect x="17.5" y="5" width="4.5" height="23" /></svg>
        </div>
        <h1 className="enter-name">BOCHILE</h1>
        <span className="enter-rule" aria-hidden="true" />
        <p className="enter-headline">{t.hero.headline}</p>
        <p className="enter-sub">{t.hero.sub}</p>
        <div className="enter-cta">
          <Link className="hbtn hbtn-primary" to="/propiedades?op=sale" data-cursor>{t.hero.ctaProps}<span aria-hidden="true">→</span></Link>
          <Link className="hbtn hbtn-ghost" to="/#tasacion" data-cursor>{t.hero.ctaTasa}</Link>
        </div>
      </div>
      <div className="enter-cue"><span className="ln" /></div>
    </header>
  )
}
