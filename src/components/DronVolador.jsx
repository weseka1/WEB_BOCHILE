import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// El dron real de la propiedad (recortado del video) vuela por la web siguiendo el scroll.
export default function DronVolador() {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (matchMedia('(max-width:860px)').matches) return        // en mobile lo ocultamos (performance + espacio)
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches

    const ctx = gsap.context(() => {
      gsap.set(el, { x: innerWidth * 0.74, y: innerHeight * 0.22, opacity: 0 })
      gsap.to(el, { opacity: 1, duration: 1.2, delay: 1.6, ease: 'power2.out' })   // entra después de la intro

      // hover: balanceo + cabeceo, como un dron real flotando
      if (!reduce) {
        gsap.to('.dron-craft', { y: 16, duration: 2.6, ease: 'sine.inOut', yoyo: true, repeat: -1 })
        gsap.to('.dron-craft', { rotation: 3, duration: 3.4, ease: 'sine.inOut', yoyo: true, repeat: -1 })
      }

      // vuela por la pantalla a medida que scrolleás: zigzag por los costados (no tapa el centro)
      const wp = (fx, fy, rot) => ({ x: () => innerWidth * fx, y: () => innerHeight * fy, rotation: rot, ease: 'power1.inOut' })
      gsap.timeline({ scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 1.3 } })
        .to(el, wp(0.16, 0.50, -8))
        .to(el, wp(0.76, 0.32, 9))
        .to(el, wp(0.20, 0.56, -6))
        .to(el, wp(0.70, 0.38, 6))
        .to(el, wp(0.30, 0.26, -4))
    }, ref)

    return () => ctx.revert()
  }, [])

  return (
    <div className="dron" ref={ref} aria-hidden="true">
      <div className="dron-craft"><img src="/assets/dron.png" alt="" /></div>
    </div>
  )
}
